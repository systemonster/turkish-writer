#!/usr/bin/env node
// Kör test 2 (insan mı, beceri mi): seti kurar. İnsan tarafı set-1'de kullanılmamış, lisansı
// sayfada gösterilmeye uygun (kamu kurumu metni, CC BY, CC BY-SA) nitelikli metinlerden;
// beceri tarafı hakem-dongusu.mjs ile (taslak + hakem döngüsü) üretilir.
// Seçim ve brif olguları git dışındaki bir seçim dosyasından gelir (insan metninin olgularını taşır).
//
// Kullanım (lovefengis klasöründen, anahtar .env'de):
//   node <tw>/tests/kalibrasyon/kor-test/kur-set-2.mjs --secim a.json --secim b.json --journo <klasör> --is <çalışma klasörü>
//   ... --yeniden     (önbellekteki beceri metinlerini atıp yeniden üretir; istem değişince)
// Çıktı (git dışı): set-2.json, cevap-anahtari-2.json. Çalışma klasöründe brif ve döngü kayıtları.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { SISTEM } from '../../../skills/turkish-writer/scripts/openai-taslak.mjs';

const KT = dirname(fileURLToPath(import.meta.url));
const TW = join(KT, '..', '..', '..');
const DONGU = join(TW, 'skills', 'turkish-writer', 'scripts', 'hakem-dongusu.mjs');
const DN = join(KT, '..', 'derlem-nitelikli');
const TOHUM = 20260927;

const arg = (ad) => process.argv.flatMap((a, i) => (a === ad ? [process.argv[i + 1]] : []));
const secimler = arg('--secim').flatMap((f) => JSON.parse(readFileSync(f, 'utf8')));
const [journo] = arg('--journo');
const [is] = arg('--is');
const yeniden = process.argv.includes('--yeniden');
if (!secimler.length || !is) { console.error('Kullanım: kur-set-2.mjs --secim a.json [--secim b.json] --journo <klasör> --is <klasör> [--yeniden]'); process.exit(2); }
mkdirSync(join(is, 'brif'), { recursive: true });
mkdirSync(join(is, 'uretim'), { recursive: true });

// Eşitleme (set-1 ile aynı): kıvrık tırnak ve kesme düz, fazla boşluk silinir.
const esitle = (s) => s.replace(/[“”«»]/g, '"').replace(/[‘’]/g, "'").replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim();
const say = (s) => s.split(/\s+/).filter(Boolean).length;

const derlemMeta = Object.fromEntries(JSON.parse(readFileSync(join(DN, 'meta.json'), 'utf8')).map((m) => [m.id, m]));
const journoMeta = journo ? Object.fromEntries(JSON.parse(readFileSync(join(journo, 'meta.json'), 'utf8')).map((m) => [m.id, m])) : {};

function kaynak(s) {
  const jn = s.derlem.startsWith('jn');
  const m = jn ? journoMeta[s.derlem] : derlemMeta[s.derlem];
  const dosya = jn ? join(journo, `${s.derlem}.txt`) : join(DN, 'insan', `${s.derlem}.txt`);
  const bloklar = readFileSync(dosya, 'utf8').replace(/\r/g, '').split(/\n\s*\n/);
  const insan = esitle(s.par.map((i) => bloklar[i]).join('\n\n'));
  const lisans = jn ? 'CC BY-SA (journo.com.tr altbilgi beyanı)' : /CC BY-SA/.test(m.lisans_dayanak) ? m.lisans_dayanak.split(';')[0] : `kamu kurumu metni: ${m.lisans_dayanak.split(';')[0]}`;
  const kategori = /CC BY-SA/.test(lisans) ? 'CC BY-SA' : 'kamu kurumu';
  const kisa = jn ? `${m.yazar}, "${m.baslik}", Journo, ${m.yayin_tarihi.slice(0, 10)}, CC BY-SA` : `${m.kaynak.replace(/ \(.*\)$/, '')}, "${m.baslik}", ${String(m.yayin_tarihi).replace('?', '')}`;
  return { insan, meta: { kaynak: jn ? 'Journo (journo.com.tr)' : m.kaynak, url: m.url || m.arsiv_url, baslik: m.baslik, yazar: m.yazar || null, yayin_tarihi: m.yayin_tarihi, lisans, lisans_kategori: kategori, atif: kisa } };
}

function brifYaz(s, n) {
  const lo = Math.round(n * 0.92), hi = Math.round(n * 1.08);
  return `# Brif
Metin türü: ${s.metin_turu}.
Konu: ${s.konu}.
Okur: ${s.okur}.
Kişi ve ses: ${s.ses}.
Bu metin daha uzun bir ${s.tur === 'blog' ? 'yazının' : 'sayfanın'} ortasından bir bölümdür: başlık, selam, konu anonsu ve kapanış cümlesi yok; doğrudan konuya gir.
Olgu listesi (metne yalnız bunlar girer; ad, sayı ve tarihleri aynen kullan):
${s.olgular.map((o) => `- ${o}`).join('\n')}
Uzunluk: ${n} kelime (en az ${lo}, en çok ${hi}). ${s.paragraf} paragraf.
Biçim: düz paragraflar; başlık, madde işareti ve kalın yazı yok.
`;
}

function calistir(brif, out, tur) {
  return new Promise((ok, red) => {
    const p = spawn(process.execPath, [DONGU, brif, '--tur', tur, '--out', out, '--sakli'], { cwd: process.cwd(), stdio: ['ignore', 'ignore', 'pipe'] });
    let hata = '';
    p.stderr.on('data', (d) => { hata += d; });
    p.on('close', (kod) => (existsSync(`${out}.kayit.json`) ? ok(hata.trim().split('\n').at(-1)) : red(new Error(`${out}: ${kod} ${hata.slice(-300)}`))));
  });
}

async function uret(s, i, insanN) {
  const bayrak = s.tur === 'blog' ? 'blog' : 'site';
  const brifYolu = join(is, 'brif', `${s.derlem}.md`);
  const out = join(is, 'uretim', `${s.derlem}.md`);
  let brif = brifYaz(s, insanN);
  writeFileSync(brifYolu, brif);
  let deneme = 0, oran;
  if (yeniden || !existsSync(`${out}.kayit.json`)) {
    for (deneme = 1; deneme <= 2; deneme++) {
      const satir = await calistir(brifYolu, out, bayrak);
      oran = say(readFileSync(out, 'utf8')) / insanN;
      console.error(`${s.derlem} deneme ${deneme}: oran ${oran.toFixed(2)} · ${satir}`);
      if (oran >= 0.85 && oran <= 1.15) break;
      if (deneme === 1) { brif = brifYaz(s, insanN) + `Not: önceki taslak çok ${oran < 0.85 ? 'kısaydı' : 'uzundu'}; uzunluk aralığına uy${oran < 0.85 ? ', ama dolgu ekleme: olguları daha ayrıntılı ve bağlı cümlelerle anlat' : ''}.\n`; writeFileSync(brifYolu, brif); }
    }
  }
  const kayit = JSON.parse(readFileSync(`${out}.kayit.json`, 'utf8'));
  return { brif, beceri: esitle(readFileSync(out, 'utf8')), taslak: esitle(kayit.taslak), kayit, deneme: deneme || null, bayrak };
}

// Tohumlu rastgele (mulberry32)
function rastgele(t) { return () => { t |= 0; t = (t + 0x6D2B79F5) | 0; let r = Math.imul(t ^ (t >>> 15), 1 | t); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }

const r = rastgele(TOHUM);
const sira = secimler.map((s) => ({ s, k: r() })).sort((a, b) => a.k - b.k).map((x) => x.s);
const insanYer = sira.map((_, i) => (i < sira.length / 2 ? 'a' : 'b')).map((y) => ({ y, k: r() })).sort((a, b) => a.k - b.k).map((x) => x.y);

const hazir = sira.map((s) => ({ s, ...kaynak(s) }));
const sonuclar = [];
let sonraki = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (sonraki < hazir.length) { const i = sonraki++; sonuclar[i] = await uret(hazir[i].s, i, say(hazir[i].insan)); }
}));

const ogeler = [], anahtar = [];
hazir.forEach(({ s, insan, meta }, i) => {
  const id = `k2-${String(i + 1).padStart(2, '0')}`;
  const u = sonuclar[i];
  const yer = insanYer[i];
  const [a, b] = yer === 'a' ? [insan, u.beceri] : [u.beceri, insan];
  ogeler.push({ id, tur: s.tur, konu: s.konu, a, b });
  anahtar.push({
    id, insan: yer, derlem_id: s.derlem, tur: s.tur, ...meta, insan_paragraflar: s.par,
    kelime: { insan: say(insan), beceri: say(u.beceri), taslak: say(u.taslak), oran: +(say(u.beceri) / say(insan)).toFixed(2) },
    beceri_uretim: {
      betik: 'skills/turkish-writer/scripts/hakem-dongusu.mjs', model: u.kayit.model, tur_bayragi: u.bayrak, cipa: u.kayit.cipa, sistem_hash: u.kayit.sistem_hash,
      deneme: u.deneme, esik: u.kayit.esik, sonuc: u.kayit.sonuc, kapi: u.kayit.kapi, sakli: u.kayit.sakli, token: u.kayit.token,
      turlar: u.kayit.turlar.map((t) => ({ tur: t.tur, p: t.p, islem: t.islem, degisen: t.degisen, olgu: t.olgu })),
    },
    brif: u.brif, taslak: u.taslak,
  });
});

const hash = createHash('sha256').update(SISTEM).digest('hex').slice(0, 16);
writeFileSync(join(KT, 'set-2.json'), JSON.stringify({ aciklama: 'Kör test 2: her çiftte biri nitelikli insan metni, öteki turkish-writer (openai-taslak + hakem döngüsü). Hangisinin insan olduğu cevap-anahtari-2.json içinde.', tarih: new Date().toISOString().slice(0, 10), ogeler }, null, 1) + '\n');
const cevapYolu = join(KT, 'cevap-anahtari-2.json');
const eski = existsSync(cevapYolu) ? JSON.parse(readFileSync(cevapYolu, 'utf8')) : {};
writeFileSync(cevapYolu, JSON.stringify({ aciklama: 'Kör test 2 cevap anahtarı. taslak = döngü öncesi metin (hakem-esli.mjs --once ile ölçülür).', tohum: TOHUM, sistem_hash: hash, anahtar, hakem: yeniden ? {} : (eski.hakem || {}) }, null, 1) + '\n');
console.error(`set-2: ${ogeler.length} çift, sistem istemi ${hash}`);
