#!/usr/bin/env node
// Hakem döngüsü: taslağı openai-taslak.mjs yazar, güçlü bir dil modeli hakemi metni tek başına
// okur ("insan mı, yapay zekâ mı?"), eşik aşılırsa yalnız işaretlediği cümleler yeniden yazdırılır.
// En fazla 3 yeniden yazma turu; sonra tr-scan ve söz dizimi kapısı. Olguyu bozan tur atılır.
//
// Kullanım (lovefengis gibi .env'i olan dizinden):
//   node scripts/hakem-dongusu.mjs brif.md --tur blog --out metin.md
//   node scripts/hakem-dongusu.mjs brif.md --tur blog --out metin.md --tur-sayisi 2 --esik 0.5
//   ... --kayit islem.json   (varsayılan: <out>.kayit.json; --out yoksa kayıt stderr'e)
//   ... --sakli              (ölçüm için saklı hakemi ilk ve son metinde ayrıca çalıştırır)
//   ... --katı               (son metinde özel ad bozuk ya da brifte yoksa çıkış kodu 4; kapı hatası 1 önce gelir)
// openai-taslak.mjs'in bayrakları geçerlidir: --tur, --cipa, --cipa-yok, --model.
//
// Aşırı uyuma karşı: döngüdeki hakem (gpt-6-sol, yedek gpt-5.5) ile ölçümdeki saklı hakem
// (gpt-6-astra, başka istem) ayrıdır. Saklı hakemin kararı döngüye hiç girmez.
// Eşik: nitelikli insan derleminde insan metinlerinin en fazla %10'u eşiği aşacak şekilde
// seçildi (tests/kalibrasyon/SONUC-HAKEM.md).

import { createHash } from 'node:crypto';
import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AD_HATA_KODU, SISTEM, adDenetle, adUyarilari, anahtar, bayraklariAyristir, cipaSec, kelimeler, sistemIstemi, taslakUret } from './openai-taslak.mjs';
import { denetle } from './tr-scan.mjs';
import { SOZ_DIZIMI_TURLERI } from './soz-dizimi.mjs';

export const HAKEM_MODEL = 'gpt-6-sol';
export const HAKEM_YEDEK = ['gpt-5.5'];
export const SAKLI_MODEL = 'gpt-6-astra';
export const ESIK = 0.3; // SONUC-HAKEM.md: nitelikli insanda tam metin ve kısa parçada ayrı ayrı yanlış "yapay" ≤ %10
export const TUR_SAYISI = 3;
export const EN_FAZLA_ISARET = 5;

export const hakemIstemi = (metin) => `Aşağıdaki Türkçe metni okuyacaksın. Metin bir insan tarafından mı yazıldı, yoksa bir yapay zekâ tarafından mı? Metin daha uzun bir yazının bölümü olabilir.
Yalnız şu JSON nesnesini döndür:
{"p_yz": 0 ile 1 arası sayı (metnin yapay zekâ yazımı olma olasılığı), "genel": "tek cümle gerekçe", "cumleler": [{"cumle": "metinden birebir kopyalanmış tam cümle", "gerekce": "bu cümle neden yapay zekâ yazımına benziyor", "yon": "biçimde ne değişirse insan yazımına benzer (içerik değil: cümle boyu, bağlama, sıra, tekrar, kalıp, fazla düzgünlük)"}]}
"cumleler" en çok ${EN_FAZLA_ISARET} öge; yapay zekâ izi en belirgin cümleler. İz yoksa boş dizi.

METİN:
"""
${metin}
"""`;

// Saklı hakem: başka model, başka çerçeve (editör), gerekçesiz puan. Döngüye girmez.
export const sakliIstemi = (metin) => `Bir yayın editörüsün. Önündeki Türkçe metin ya editörden geçmiş, yayımlanmış bir yazıdan alındı ya da bir dil modeli tarafından üretildi. Metnin yayımlanmış bir insan yazısı olma olasılığını 0-100 arası puanla: 100 kesinlikle yayımlanmış insan yazısı, 0 kesinlikle dil modeli üretimi. Yalnız şu JSON nesnesini döndür: {"insan_puani": tam sayı}

"""
${metin}
"""`;

const bosluk = (s) => String(s).replace(/[“”«»]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();

// Hakem cevabını doğrular: p 0-1'e sıkışır, metinde birebir bulunmayan cümle atılır.
export function hakemAyristir(json, metin) {
  let p = Number(json?.p_yz);
  if (!Number.isFinite(p)) p = NaN;
  else p = Math.min(1, Math.max(0, p > 1 ? p / 100 : p));
  const duz = bosluk(metin);
  const cumleler = (Array.isArray(json?.cumleler) ? json.cumleler : [])
    .map((c) => ({ cumle: bosluk(c?.cumle || ''), gerekce: String(c?.gerekce || ''), yon: String(c?.yon || '') }))
    .filter((c) => c.cumle.length > 3 && duz.includes(c.cumle))
    .slice(0, EN_FAZLA_ISARET);
  return { p, genel: String(json?.genel || ''), cumleler };
}

// ---- Olgu sadakati: sayı (fiyat dâhil) ve özel ad ----
const SAYI_SOZ = { iki: '2', üç: '3', dört: '4', beş: '5', altı: '6', yedi: '7', sekiz: '8', dokuz: '9', on: '10' };

export function olgular(metin) {
  const m = bosluk(metin);
  const sayilar = new Set();
  for (const x of m.matchAll(/\d+(?:[.,]\d+)*/g)) sayilar.add(x[0].replace(/\.(?=\d{3}(?!\d))/g, ''));
  for (const k of kelimeler(m)) if (SAYI_SOZ[k]) sayilar.add(SAYI_SOZ[k]);
  const adlar = new Set();
  // Cümle başı ve tırnak/başlık başı dışında büyük harfle başlayan kelime özel ad sayılır; ek kesmeden önce kesilir.
  for (const x of m.matchAll(/[\p{Lu}][\p{L}\p{N}]*(?:['][\p{L}]+)?/gu)) {
    const once = m.slice(0, x.index).trimEnd();
    if (!once || /[.!?…:"(\n#>*-]$/.test(once)) continue;
    adlar.add(x[0].split("'")[0]);
  }
  return { sayilar, adlar };
}

// yeni metin: brifte ya da önceki metinde olmayan sayı/ad eklemez, önceki metnin sayı/adını düşürmez.
export function olguDenetle(brif, onceki, yeni) {
  const b = olgular(brif), o = olgular(onceki), y = olgular(yeni);
  const kucukBrif = kelimeler(`${brif} ${onceki}`);
  const kucukYeni = kelimeler(yeni);
  const adVar = (ad, havuz) => { const k = ad.toLocaleLowerCase('tr'); return havuz.some((w) => w.startsWith(k)); };
  const fazla = [
    ...[...y.sayilar].filter((s) => !b.sayilar.has(s) && !o.sayilar.has(s)),
    ...[...y.adlar].filter((a) => !adVar(a, kucukBrif)),
  ];
  const eksik = [
    ...[...o.sayilar].filter((s) => !y.sayilar.has(s)),
    ...[...o.adlar].filter((a) => !adVar(a, kucukYeni)),
  ];
  return { ok: !fazla.length && !eksik.length, fazla, eksik };
}

// ---- Yeniden yazma: yalnız işaretli cümleler ----
export const yenidenYazIstemi = ({ metin, isaretli, brif }) => `Aşağıda bir metin ve o metinden işaretlenmiş cümleler var. Bir okur bu cümleleri yapay zekâ yazmış gibi buldu; gerekçesi ve önerdiği biçim yönü yanında. Yalnız işaretli cümleleri yeniden yaz.
Kurallar:
- Olgu ve anlam aynı kalır. Sayı, ad, tarih ve fiyat aynen kalır; brifte olmayan bilgi, örnek ya da yorum eklenmez.
- Dolgu ekleme. Cümle uzayacaksa yeni bilgiyle değil, komşu düşünceyi bağlayarak ya da yan cümle kurarak uzasın.
- İşaretli cümle aynı olguyu metnin başka yerinde zaten söylüyorsa silebilirsin ("yeni": "").
- Gerekçe ve yön yalnız biçim ipucudur (cümle boyu, bağlama, sıra, tekrar, fazla düzgünlük); içerik değiştirme gerekçesi değildir.
- Yeni cümle önceki ve sonraki cümleye dikişsiz oturmalı.
Yalnız JSON döndür: {"degisiklikler": [{"no": 1, "yeni": "..."}]}

BRİF:
"""
${brif}
"""

METİN:
"""
${metin}
"""

İŞARETLİ CÜMLELER:
${isaretli.map((c, i) => `${i + 1}. "${c.cumle}"\n   gerekçe: ${c.gerekce}\n   yön: ${c.yon}`).join('\n')}`;

// Değişiklikleri yalnız işaretli cümlelere uygular; geri kalan metinde yalnız tırnak ve boşluk eşitlenir.
export function degisiklikUygula(metin, isaretli, cevap) {
  let m = metin.replace(/[“”«»]/g, '"').replace(/[‘’]/g, "'").replace(/[ \t]+/g, ' ');
  const degisen = [];
  for (const d of Array.isArray(cevap?.degisiklikler) ? cevap.degisiklikler : []) {
    const c = isaretli[Number(d?.no) - 1];
    if (!c || typeof d?.yeni !== 'string') continue;
    const yeni = bosluk(d.yeni);
    if (yeni === c.cumle || !m.includes(c.cumle)) continue;
    m = m.replace(c.cumle, yeni);
    degisen.push({ eski: c.cumle, yeni });
  }
  m = m.replace(/ {2,}/g, ' ').replace(/ +\n/g, '\n').replace(/\n +/g, '\n').trim();
  return { metin: m, degisen };
}

// tr-scan + söz dizimi kapısı: kapı, söz dizimi bulgusu yoksa geçer.
export function kapi(metin) {
  const d = denetle(metin);
  const soz = d.bulgular.filter((b) => SOZ_DIZIMI_TURLERI.includes(b.tur));
  return { trscan_skor: d.skor, bulgu: d.bulgular.length, soz_dizimi: soz.map((b) => ({ tur: b.tur, parca: b.parca })), gecti: soz.length === 0 };
}

// Döngü. api: { taslak(brif) → metin, hakem(metin) → {p, genel, cumleler}, yenidenYaz({metin, isaretli, brif}) → cevap JSON }
export async function dongu({ brif, api, esik = ESIK, turSayisi = TUR_SAYISI, ilkMetin }) {
  let metin = ilkMetin ?? await api.taslak(brif);
  const taslak = metin;
  const turlar = [];
  let h = await api.hakem(metin);
  let yeniden = 0;
  let durdurma;
  for (;;) {
    const k = { tur: turlar.length, p: h.p, genel: h.genel, isaretli: h.cumleler, islem: '', degisen: [] };
    turlar.push(k);
    if (!(h.p > esik)) { k.islem = 'esik-alti'; durdurma = 'esik'; break; }
    if (yeniden >= turSayisi) { k.islem = 'tur-siniri'; durdurma = 'tur-siniri'; break; }
    if (!h.cumleler.length) { k.islem = 'isaret-yok'; durdurma = 'isaret-yok'; break; }
    yeniden++;
    const u = degisiklikUygula(metin, h.cumleler, await api.yenidenYaz({ metin, isaretli: h.cumleler, brif }));
    if (!u.degisen.length) { k.islem = 'degisiklik-yok'; continue; }
    const o = olguDenetle(brif, metin, u.metin);
    if (!o.ok) { k.islem = 'olgu-reddi'; k.olgu = { fazla: o.fazla, eksik: o.eksik }; k.reddedilen = u.degisen; continue; }
    k.islem = 'yeniden-yazildi';
    k.degisen = u.degisen;
    metin = u.metin;
    h = await api.hakem(metin);
  }
  return {
    metin, taslak,
    kayit: {
      surum: 1, esik, tur_sayisi: turSayisi, turlar,
      sonuc: { p_ilk: turlar[0].p, p_son: turlar.at(-1).p, yeniden_yazma: yeniden, kabul_edilen: turlar.filter((t) => t.islem === 'yeniden-yazildi').length, durdurma },
      kapi: kapi(metin),
    },
  };
}

// ---- OpenAI ----
export async function jsonSor({ key, model, istem, sistem, yedek = [] }) {
  for (const m of [model, ...yedek]) {
    const messages = sistem ? [{ role: 'system', content: sistem }, { role: 'user', content: istem }] : [{ role: 'user', content: istem }];
    const govde = { model: m, messages, response_format: { type: 'json_object' } };
    if (/^gpt-4/.test(m)) govde.temperature = 0;
    for (let d = 1; d <= 3; d++) {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(govde), signal: AbortSignal.timeout(240000),
      });
      if (r.ok) {
        const icerik = (await r.json()).choices?.[0]?.message?.content || '{}';
        try { return { json: JSON.parse(icerik), model: m }; } catch { if (d === 3) throw new Error(`${m}: JSON okunamadı`); continue; }
      }
      const govdeMetin = (await r.text()).slice(0, 200);
      if (r.status === 404 || /model_not_found|does not exist/.test(govdeMetin)) break; // yedeğe geç
      if (d === 3 || (r.status < 500 && r.status !== 429)) throw new Error(`${m} ${r.status}: ${govdeMetin}`);
      await new Promise((ok) => setTimeout(ok, 3000 * d));
    }
  }
  throw new Error(`hakem modellerinin hiçbirine erişilemedi: ${[model, ...yedek].join(', ')}`);
}

export async function hakemSor({ key, metin, model = HAKEM_MODEL, yedek = HAKEM_YEDEK }) {
  const { json, model: kullanilan } = await jsonSor({ key, model, yedek, istem: hakemIstemi(metin) });
  return { ...hakemAyristir(json, metin), model: kullanilan };
}

export async function sakliSor({ key, metin, model = SAKLI_MODEL }) {
  const { json } = await jsonSor({ key, model, istem: sakliIstemi(metin) });
  const n = Number(json?.insan_puani);
  return { p: Number.isFinite(n) ? +(1 - Math.min(100, Math.max(0, n)) / 100).toFixed(3) : NaN, model };
}

// Her OpenAI cevabındaki usage alanını modele göre toplar (taslakUret dâhil).
export function tokenSayaci() {
  const sayac = {};
  const asil = globalThis.fetch;
  globalThis.fetch = async (url, secenek) => {
    const r = await asil(url, secenek);
    if (String(url).includes('api.openai.com') && r.ok) {
      try {
        const j = await r.clone().json();
        const m = j.model || JSON.parse(secenek.body).model;
        const s = (sayac[m] ||= { cagri: 0, girdi: 0, cikti: 0 });
        s.cagri++; s.girdi += j.usage?.prompt_tokens || 0; s.cikti += j.usage?.completion_tokens || 0;
      } catch { /* sayım başarısız olursa cevap yine döner */ }
    }
    return r;
  };
  return sayac;
}

export function openaiApi({ key, taslakModel, hakemModel = HAKEM_MODEL, cipalar = [] }) {
  return {
    taslak: (brif) => taslakUret({ brif, model: taslakModel, cipalar, key }),
    hakem: (metin) => hakemSor({ key, metin, model: hakemModel }),
    yenidenYaz: async (a) => (await jsonSor({ key, model: taslakModel, sistem: sistemIstemi(cipalar), istem: yenidenYazIstemi(a) })).json,
  };
}

const OZEL = { '--tur-sayisi': 'turSayisi', '--esik': 'esik', '--kayit': 'kayit', '--hakem': 'hakem', '--taslak-dosyasi': 'taslakDosyasi' };

export function argumanlar(argv) {
  const ozel = { sakli: false };
  const kalan = [];
  for (let i = 0; i < argv.length; i++) {
    if (OZEL[argv[i]]) {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) return { hata: `${argv[i - 1]} bir değer ister` };
      ozel[OZEL[argv[i - 1]]] = v;
    } else if (argv[i] === '--sakli') ozel.sakli = true;
    else kalan.push(argv[i]);
  }
  const s = bayraklariAyristir(kalan);
  if (s.hata) return { hata: s.hata };
  const turSayisi = ozel.turSayisi === undefined ? TUR_SAYISI : Number(ozel.turSayisi);
  const esik = ozel.esik === undefined ? ESIK : Number(ozel.esik);
  if (!Number.isInteger(turSayisi) || turSayisi < 0 || turSayisi > 10) return { hata: '--tur-sayisi 0-10 arası tam sayı olmalı' };
  if (!(esik >= 0 && esik <= 1)) return { hata: '--esik 0-1 arası olmalı' };
  return { ...s, ...ozel, turSayisi, esik };
}

async function ana() {
  const s = argumanlar(process.argv.slice(2));
  if (s.hata) {
    console.error(`${s.hata}\nKullanım: node scripts/hakem-dongusu.mjs brif.md [--tur blog] [--out metin.md] [--tur-sayisi 3] [--esik ${ESIK}] [--kayit islem.json] [--sakli] [--cipa yol] [--cipa-yok] [--model ad] [--hakem ad] [--katı]`);
    process.exit(2);
  }
  const key = anahtar();
  if (!key) { console.error('OPENAI_API_KEY bulunamadı. Metin üretilemedi; metni Claude kendisi yazmamalı.'); process.exit(3); }
  const sayac = tokenSayaci();
  const taslakModel = s.model || process.env.TW_OPENAI_MODEL || process.env.OPENAI_MODEL || 'gpt-5.6-sol';
  const cipalar = s.cipaYok ? [] : cipaSec({ tur: s.tur, yollar: s.cipa });
  const brif = readFileSync(s.brifYolu, 'utf8');
  const api = openaiApi({ key, taslakModel, hakemModel: s.hakem || HAKEM_MODEL, cipalar });
  let sonuc;
  try {
    sonuc = await dongu({ brif, api, esik: s.esik, turSayisi: s.turSayisi, ilkMetin: s.taslakDosyasi ? readFileSync(s.taslakDosyasi, 'utf8').trim() : undefined });
  } catch (e) { console.error(e.message); process.exit(1); }
  const kayit = {
    tarih: new Date().toISOString(), brif: s.brifYolu, tur: s.tur || null, cipa: cipalar.map((c) => c.ad),
    model: { taslak: taslakModel, hakem: s.hakem || HAKEM_MODEL },
    sistem_hash: createHash('sha256').update(SISTEM).digest('hex').slice(0, 16),
    ...sonuc.kayit, taslak: sonuc.taslak,
  };
  if (s.sakli) {
    const [ilk, son] = await Promise.all([sakliSor({ key, metin: sonuc.taslak }), sakliSor({ key, metin: sonuc.metin })]);
    kayit.sakli = { model: SAKLI_MODEL, p_ilk: ilk.p, p_son: son.p };
  }
  kayit.ad = adDenetle(brif, sonuc.metin);
  for (const u of adUyarilari(kayit.ad)) console.error(u);
  kayit.token = sayac;
  const r = kayit.sonuc;
  console.error(`hakem p: ${turlarOzet(kayit.turlar)} · ${r.kabul_edilen}/${r.yeniden_yazma} tur kabul · durdurma ${r.durdurma} · tr-scan ${kayit.kapi.trscan_skor} · söz dizimi ${kayit.kapi.soz_dizimi.length}${kayit.sakli ? ` · saklı ${kayit.sakli.p_ilk} → ${kayit.sakli.p_son}` : ''}`);
  if (s.out) {
    writeFileSync(s.out, sonuc.metin + '\n');
    writeFileSync(s.kayit || `${s.out}.kayit.json`, JSON.stringify(kayit, null, 1) + '\n');
  } else {
    process.stdout.write(sonuc.metin + '\n');
    if (s.kayit) writeFileSync(s.kayit, JSON.stringify(kayit, null, 1) + '\n');
    else console.error(JSON.stringify(kayit));
  }
  if (!kayit.kapi.gecti) process.exitCode = 1;
  else if (s.kati && !kayit.ad.ok) process.exitCode = AD_HATA_KODU;
}

const turlarOzet = (t) => t.map((x) => `${x.p}${x.islem === 'olgu-reddi' ? '(red)' : ''}`).join(' → ');

const gercek = (p) => { try { return realpathSync(p); } catch { return resolve(p); } };
if (process.argv[1] && gercek(fileURLToPath(import.meta.url)) === gercek(process.argv[1])) await ana();
