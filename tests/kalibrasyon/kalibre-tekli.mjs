#!/usr/bin/env node
// V1 ölçütü (a2), tur 3: bağımsız tekli hakem. Beceri metinleri insan derleminden TÜRETİLMEZ:
// derlemde olmayan konularda, bağımsız brifle yazılır; saklı hakem (gpt-6-astra, döngüde hiç
// kullanılmadı) her metne tek başına p(yapay zekâ) verir. İnsan havuzu: nitelikli derlemin 62 tam
// metni (saklı hakem puanları kalibre-hakem.mjs önbelleğinden, derlem-nitelikli/hakem.json).
// AUC = P(p_beceri > p_insan); hedef ≤ 0,70.
//
// Neden eşli değil: eşli testte beceri metni insan metninin olgularından türetildiği için hakem
// "hangisi öbürünün yeniden yazımı?" sorusunu cevaplayabiliyor (SONUC-HAKEM.md §6).
//
// Kullanım (lovefengis klasöründen, anahtar .env'de):
//   node <tw>/tests/kalibrasyon/kalibre-tekli.mjs olgu    # konu başına olgu listesi (gpt-5.5)
//   node <tw>/tests/kalibrasyon/kalibre-tekli.mjs brif
//   node <tw>/tests/kalibrasyon/kalibre-tekli.mjs uret    # openai-taslak.mjs, varsayılan model, çıpasız
//   node <tw>/tests/kalibrasyon/kalibre-tekli.mjs hakem   # saklı hakem + AUC (sonuc.json)
// Tur 4:
//   ... acilim --surum t4c              # kurum/duyuru olgularına açılım alt maddesi (gpt-5.5), acilim-<surum>.json
//   ... brif --surum t4                 # brif-t4/: kurumsal ve duyuruda her olgunun altında açılım
//   ... uret --surum t4a --brif-surum t4   # beceri-t4a/
//   ... hakem --surum t4a               # saklı hakem: tur 3 ve <surum> beceri; eski insan (≤ 2022) ve
//                                       # yeni insan (2025+, derlem-yeni-insan/) havuzlarıyla ayrı AUC
//                                       # (sonuc-<surum>.json)
// Dosyalar git dışı: tests/kalibrasyon/derlem-tekli/, derlem-yeni-insan/.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { adDenetle, anahtar, kelimeler } from '../../skills/turkish-writer/scripts/openai-taslak.mjs';
import { jsonSor, sakliSor } from '../../skills/turkish-writer/scripts/hakem-dongusu.mjs';

const K = dirname(fileURLToPath(import.meta.url));
const D = join(K, 'derlem-tekli');
const DN = join(K, 'derlem-nitelikli');
const DY = join(K, 'derlem-yeni-insan');
const TASLAK = join(K, '..', '..', 'skills', 'turkish-writer', 'scripts', 'openai-taslak.mjs');
const okuJ = (p, v) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : v);
const yazJ = (p, v) => writeFileSync(p, JSON.stringify(v, null, 1));
const argv = process.argv.slice(3);
const bayrak = (ad, v) => { const i = argv.indexOf(ad); return i > -1 ? argv[i + 1] : v; };
const SURUM = bayrak('--surum');
const BRIF_SURUM = bayrak('--brif-surum', SURUM);
const ek = (ad, s = SURUM) => (s ? `${ad}-${s}` : ad);

// Derlemdeki konularla örtüşmeyen 36 konu; türler ve uzunluklar derlemin dağılımına yakın
// (blog ~600, duyuru 220-480, kurumsal 190-500). "lovefengis tarzı" kurumsal sayfaların olguları
// karar defterindeki gerçek fiyat ve koşullardır; kurgusal kurum adı "kurgusal" diye işaretli.
export const KONULAR = [
  ['bl01', 'blog', 600, "Rize'de çay tarımının başlangıcı ve Çaykur'un kuruluşu"],
  ['bl02', 'blog', 600, "Mimar Sinan'ın çıraklık, kalfalık ve ustalık eserleri"],
  ['bl03', 'blog', 580, "Türk kahvesinin pişirilişi, sunumu ve UNESCO somut olmayan kültürel miras listesine girişi"],
  ['bl04', 'blog', 560, 'Van kedisinin özellikleri ve koruma çalışmaları'],
  ['bl05', 'blog', 620, 'Göbeklitepe kazılarının tarihi ve buluntuları'],
  ['bl06', 'blog', 600, "Kapadokya'da peri bacalarının jeolojik oluşumu"],
  ['bl07', 'blog', 580, 'Karagöz ve Hacivat gölge oyununun yapısı ve karakterleri'],
  ['bl08', 'blog', 620, "İstanbul'un tarihî su yapıları: Bozdoğan Kemeri, Yerebatan Sarnıcı ve bentler"],
  ['bl09', 'blog', 600, "Ege'de zeytin hasadı ve zeytinyağı sınıfları (natürel sızma, riviera)"],
  ['bl10', 'blog', 560, "Küçük işletme sitelerinde hız ölçümü: Core Web Vitals (LCP, INP, CLS) eşikleri ve ölçüm araçları"],
  ['bl11', 'blog', 580, "KVKK'da aydınlatma yükümlülüğü (6698 sayılı Kanun m.10) ve açık rızadan farkı"],
  ['bl12', 'blog', 600, "Telgrafın Osmanlı'ya gelişi ve ilk hatlar"],
  ['ku01', 'kurumsal', 320, "İzmir'de tek kişilik yazılım ajansının ücretli keşif hizmeti: keşif ücreti 45.000-90.000 TL, peşin; keşif teslimini izleyen 90 gün içinde imzalanan projeden %100 düşülür; başladıktan sonra iade yok; keşif belgesi müşterinindir; teklif 15 gün geçerli"],
  ['ku02', 'kurumsal', 300, "İzmir'de tek kişilik bir yazılım ajansının talep önceliklendirme hizmeti: kurulum 34.900 TL + aylık 5.900 TL; gelen formları ve mesajları öncelik sırasına dizer; kurulumsuz seçenek aylık 9.900 TL, 12 ay"],
  ['ku03', 'kurumsal', 280, "İzmir'de tek kişilik bir yazılım ajansının kurumsal web sitesi hizmeti: 24.900 TL\\'den başlar (KDV dâhil); proje ödemesi %50 başta, %50 teslimde; teslimden sonra aylık Bakım+ 4.900 TL; barındırma hizmeti verilmez"],
  ['ku04', 'kurumsal', 340, "İzmir'de tek kişilik bir yazılım ajansının güvenlik ve KVKK denetimi: sabit kapsamlı denetim, 95.000 TL\\'den; keşif şartı yok; çıktı yazılı bulgu raporu ve öncelik sırası"],
  ['ku05', 'kurumsal', 360, "İzmir'de tek kişilik bir yazılım ajansının özel yazılım hizmeti: 250.000-900.000 TL bandı; önce ücretli keşif; kaynak kodu teslimde müşterinin; ödeme teslimata bağlı; her proje bir aylık bakım kalemiyle kapanır"],
  ['ku06', 'kurumsal', 260, "İzmir'de tek kişilik bir yazılım ajansının site düzeltme paketleri: 2.900, 8.900 ve 12.900 TL; hız, mobil görünüm ve form hataları"],
  ['ku07', 'kurumsal', 300, "Kurgusal 'Karşıyaka Kent Kütüphanesi'nin tanıtım sayfası: çalışma saatleri, üyelik, çocuk bölümü, çalışma salonu"],
  ['ku08', 'kurumsal', 420, "Kurgusal 'Ege Meslek Yüksekokulu'nun tanıtım sayfası: programlar, staj, kampüs, kuruluş yılı"],
  ['ku09', 'kurumsal', 240, "Kurgusal 'Tire Süt Üreticileri Kooperatifi'nin hakkımızda sayfası: ortak sayısı, toplama merkezleri, ürünler"],
  ['ku10', 'kurumsal', 380, "Kurgusal 'Bornova Teknopark'ın tanıtım sayfası: kuluçka programı, ofis olanakları, vergi muafiyeti koşulları"],
  ['ku11', 'kurumsal', 200, "Kurgusal 'Aliağa Devlet Hastanesi Fizik Tedavi Birimi'nin tanıtım sayfası: hizmetler, randevu, çalışma saatleri"],
  ['ku12', 'kurumsal', 460, "Kurgusal 'Kemeraltı Kent Müzesi'nin tanıtım sayfası: koleksiyon, bina tarihi, ziyaret bilgileri, eğitim programları"],
  ['du01', 'duyuru', 260, 'Kurgusal bir büyükşehir belediyesinin yeni bisiklet yolu hattını açtığını duyuran haber'],
  ['du02', 'duyuru', 420, 'Kurgusal bir üniversitenin bilim şenliğini duyuran kurum haberi'],
  ['du03', 'duyuru', 300, 'Kurgusal bir ticaret odasının dış ticaret eğitim programına başvuruları duyurması'],
  ['du04', 'duyuru', 240, 'Kurgusal bir tarım kooperatifinin hasat sonrası ortaklarına ödeme takvimini duyurması'],
  ['du05', 'duyuru', 380, 'Kurgusal bir kalkınma ajansının KOBİ dijitalleşme destek çağrısı'],
  ['du06', 'duyuru', 280, 'Kurgusal bir devlet hastanesinin yeni MR cihazını hizmete aldığını duyuran haber'],
  ['du07', 'duyuru', 330, 'Kurgusal bir kent kütüphanesinin yaz okuma programını duyurması'],
  ['du08', 'duyuru', 460, 'Kurgusal bir teknoparkın girişimci kampı sonuçlarını duyuran haber'],
  ['du09', 'duyuru', 300, 'Kurgusal bir müzenin yeni geçici sergisini duyurması'],
  ['du10', 'duyuru', 250, 'Kurgusal bir deniz ulaşım şirketinin yeni feribot seferini duyurması'],
  ['du11', 'duyuru', 440, 'Kurgusal bir enerji kurumunun güneş enerjisi santrali protokolünü duyuran haber'],
  ['du12', 'duyuru', 360, 'Kurgusal bir meslek odasının iş sağlığı ve güvenliği semineri dizisini duyurması'],
].map(([id, tur, hedef, konu]) => ({ id, tur, hedef, konu }));

// kalibre-nitelikli.mjs brif şablonuyla aynı sayfa, okur ve kişi tanımları.
const SAYFA = {
  kurumsal: ['kurum sitesindeki tanıtım ya da hizmet sayfası metni', 'kurumu ya da hizmeti araştıran ziyaretçi', "kurumun ağzından ('biz' ya da kurum adıyla); okura 'siz'"],
  blog: ['editörlü bir dergi ya da blog yazısı', 'konuyu merak eden genel okur', 'yazarın ağzından; görüş ve yorum serbest'],
  duyuru: ['kurumun basın duyurusu ya da kurum haberi', 'kamuoyu, basın ve ilgililer', "kurumun resmî ağzından; üçüncü kişi ya da 'kurumumuz'"],
};

async function olgu(key) {
  mkdirSync(D, { recursive: true });
  const yol = join(D, 'olgu.json');
  const kayit = okuJ(yol, {});
  for (const k of KONULAR) {
    if (kayit[k.id]) continue;
    const n = Math.round(k.hedef / 28);
    const istem = `Bir yazara brif hazırlıyorsun. Konu: ${k.konu}. Metin türü: ${SAYFA[k.tur][0]}. Yazara ${n} maddelik olgu listesi ver.
Kurallar:
- Gerçek konularda yalnız doğruluğundan emin olduğun, genel kaynaklarda bulunan bilgiyi yaz; emin olmadığın sayı ve tarihi yazma. Kurgusal kurumda olgular tutarlı ve olağan olsun; konu satırındaki sayı ve koşullar aynen kullanılır.
- Her madde tek, kısa, düz cümle; bir bilgi. Düzyazı cümlesi kurma, yorum ve süs ekleme.
- Blog türünde 2-3 madde yazarın görüşü olabilir ("Görüş:" diye başlat).
- Metnin nasıl yazılacağına dair talimat, sayfa ya da metin hakkında madde yazma; yalnız konunun bilgisi.
Yalnız JSON: {"olgular": ["...", "..."]}`;
    const { json } = await jsonSor({ key, model: 'gpt-5.5', istem });
    if (Array.isArray(json.olgular) && json.olgular.length) kayit[k.id] = json.olgular.map(String);
    yazJ(yol, kayit);
    console.error(`${k.id}: ${kayit[k.id]?.length ?? 0} olgu`);
  }
}

// Tur 4: bağımsız sette kurum ve duyuru taslağı olguyu açmıyordu (15/36 bantta). Brifi kuran taraf
// her olgunun altına "okur için anlamı / nasıl işler / ne yapması gerekir" yazar; taslak modeli yeni
// olgu uydurmaz. Olgu listesinde olmayan rakam ya da özel ad taşıyan açılım atılır (acilimSuz).
// t4 (ilk deneme) açılımların üçte biri olguyu başka sözle tekrar ediyordu ve taslak bunu dolguya
// çevirdi. t4c ve sonrası: istemde "tekrar yazma" kuralı + tekrar süzgeci (açılımın 4+ harfli
// kelimelerinin %60'ı olguda geçiyorsa atılır). Dosya: acilim-<surum>.json.
const kok5 = (t) => (t.toLocaleLowerCase('tr').match(/[\p{L}\p{N}]+/gu) || []).filter((w) => w.length >= 4).map((w) => w.slice(0, 5));
export const tekrarPayi = (olgu, alt) => { const o = new Set(kok5(olgu)); const w = kok5(alt); return w.length ? w.filter((x) => o.has(x)).length / w.length : 1; };
const TEKRAR_SUZ = SURUM && SURUM !== 't4';
const ACILIM_ETIKET = { okur: 'Okur için anlamı', isleyis: 'Nasıl işler', yapmasi: 'Ne yapması gerekir' };
const rakamlar = (t) => new Set((t.match(/\d+(?:[.,]\d+)*/g) || []).map((x) => x.replace(/\.(?=\d{3}(?!\d))/g, '')));
export function acilimSuz(olguMetni, alt) {
  const r = rakamlar(olguMetni);
  return [...rakamlar(alt)].every((x) => r.has(x)) && adDenetle(olguMetni, alt).ok;
}

async function acilim(key) {
  const yol = join(D, `acilim-${SURUM || 't4'}.json`);
  const kayit = okuJ(yol, {});
  const olgular = okuJ(join(D, 'olgu.json'), {});
  const atilan = [], tekrar = [];
  for (const k of KONULAR) {
    if (k.tur === 'blog' || kayit[k.id] || !olgular[k.id]) continue;
    const [sayfa, okur] = SAYFA[k.tur];
    const liste = olgular[k.id];
    const istem = `Bir yazara brif hazırlıyorsun. Metin türü: ${sayfa}. Okur: ${okur}. Aşağıda numaralı olgu listesi var. Her olgu için okurun o olguyu okuyunca soracağı sorulara cevap veren en çok üç alt madde yaz:
- "okur": olgu okurun durumunda neyi değiştirir (okur için anlamı).
- "isleyis": olgunun anlattığı işleyiş, sıra ya da koşul (nasıl işler).
- "yapmasi": okurun bu olgu yüzünden yapacağı ya da yapmayacağı şey (ne yapması gerekir).
Kurallar:
- Alt madde yalnız o olgudan ve listedeki diğer olgulardan mantıksal olarak çıkar. Listede olmayan sayı, tarih, süre, ücret, yer, kişi, kurum, belge, işlem adımı, sonuç ya da iddia ekleme.
- Çıkarılamıyorsa o alt maddeyi yazma; bir olgunun hiç alt maddesi olmayabilir.
- Her alt madde tek, kısa, düz cümle; olguyu aynen tekrar etme; yorum ve övgü yok.${TEKRAR_SUZ ? `
- Olguyu başka sözle yeniden söyleyen alt madde yazma ("Ücret peşin alınır" → "Tahsilat peşin yapılır" tekrardır). Alt madde okura olgunun kendisinde yazmayan bir şey söylemeli: sonucu, sırası, koşulu ya da okurun adımı. Böyle bir şey yoksa o alanı boş bırak; çoğu olgunun bir ya da hiç alt maddesi olur.` : ''}
Yalnız JSON: {"acilim": [{"no": 1, "okur": "...", "isleyis": "...", "yapmasi": "..."}]} (boş alanları yazma)

OLGULAR:
${liste.map((o, i) => `${i + 1}. ${o}`).join('\n')}`;
    const { json } = await jsonSor({ key, model: 'gpt-5.5', istem });
    const olguMetni = liste.join('\n');
    kayit[k.id] = liste.map((_, i) => {
      const a = (Array.isArray(json.acilim) ? json.acilim : []).find((x) => Number(x?.no) === i + 1) || {};
      return Object.keys(ACILIM_ETIKET)
        .filter((e) => typeof a[e] === 'string' && a[e].trim())
        .map((e) => [e, a[e].trim()])
        .filter(([, v]) => acilimSuz(olguMetni, v) || (atilan.push(`${k.id}/${i + 1}: ${v}`), false))
        .filter(([, v]) => !TEKRAR_SUZ || tekrarPayi(liste[i], v) < 0.6 || (tekrar.push(`${k.id}/${i + 1}: ${v}`), false));
    });
    yazJ(yol, kayit);
    console.error(`${k.id}: ${kayit[k.id].length ? kayit[k.id].reduce((t, x) => t + x.length, 0) : 0} açılım`);
  }
  console.error(`olgu dışı rakam/ad taşıdığı için atılan açılım: ${atilan.length}\n${atilan.join('\n')}\ntekrar süzgeciyle atılan: ${tekrar.length}`);
}

const brifYolu = (id, s = BRIF_SURUM) => join(D, ek('brif', s), `${id}.md`);
function brif() {
  const olgular = okuJ(join(D, 'olgu.json'), {});
  const acilimlar = SURUM ? okuJ(join(D, `acilim-${SURUM}.json`), {}) : {};
  mkdirSync(join(D, ek('brif')), { recursive: true });
  for (const k of KONULAR) {
    if (!olgular[k.id]) continue;
    const [sayfa, okur, kisi] = SAYFA[k.tur];
    const ac = acilimlar[k.id];
    const metin = [
      `Sayfa türü: ${sayfa}.`, `Konu: ${k.konu.split(':')[0]}.`, `Okur: ${okur}.`, `Kişi ve hitap: ${kisi}.`,
      ac ? 'Olgu listesi (metne yalnız bunlar girer; girintili alt maddeler olgunun açılımıdır):' : 'Olgu listesi (metne yalnız bunlar girer):',
      ...olgular[k.id].flatMap((o, i) => [`- ${o}`, ...(ac?.[i] || []).map(([e, v]) => `  - ${ACILIM_ETIKET[e]}: ${v}`)]),
      `Uzunluk: ${Math.round((k.hedef * 0.9) / 10) * 10}-${Math.round((k.hedef * 1.05) / 10) * 10} kelime.`,
      'Biçim: düz paragraflar; başlık, madde işareti ve kalın yazı yok.',
    ].join('\n');
    writeFileSync(join(D, ek('brif'), `${k.id}.md`), metin + '\n');
  }
}

function uret(key) {
  mkdirSync(join(D, ek('beceri')), { recursive: true });
  const env = { ...process.env, OPENAI_API_KEY: key };
  const isler = KONULAR.filter((k) => !existsSync(join(D, ek('beceri'), `${k.id}.txt`)) && existsSync(brifYolu(k.id)));
  // 4 paralel süreç (execFileSync sıralı; burada async spawn).
  return new Promise((bitti) => {
    let i = 0, aktif = 0;
    const sonraki = () => {
      if (i >= isler.length && !aktif) return bitti();
      while (aktif < 4 && i < isler.length) {
        const k = isler[i++]; aktif++;
        import('node:child_process').then(({ execFile }) => execFile(process.execPath, [TASLAK, brifYolu(k.id), '--out', join(D, ek('beceri'), `${k.id}.txt`)], { env }, (e, _o, err) => {
          if (e) console.error(`${k.id} başarısız: ${String(err).slice(0, 200)}`);
          else if (err.trim()) console.error(`${k.id}: ${err.trim().split('\n').filter((l) => /UYARI/.test(l)).join(' | ')}`);
          aktif--; sonraki();
        }));
      }
    };
    sonraki();
  });
}

export const auc = (ins, bec) => { let t = 0; for (const b of bec) for (const h of ins) t += b > h ? 1 : b === h ? 0.5 : 0; return t / (ins.length * bec.length); };
function aucGA(ins, bec, b = 1000) {
  let t = 7;
  const rnd = () => ((t = (t * 1103515245 + 12345) % 2147483648) / 2147483648);
  const ornek = (a) => a.map(() => a[Math.floor(rnd() * a.length)]);
  const v = Array.from({ length: b }, () => auc(ornek(ins), ornek(bec))).sort((x, y) => x - y);
  return [v[Math.floor(b * 0.025)], v[Math.floor(b * 0.975)]];
}
const med = (a) => { const s = [...a].sort((x, y) => x - y); return (s[(s.length - 1) >> 1] + s[s.length >> 1]) / 2; };

// Uzunluk (hedefin %70-110'u) ve olgu sadakati: brifte olmayan rakamlı sayı, özel ad (bozuk / yeni).
function uzunlukOlgu(dizin, brifSurum) {
  const u = KONULAR.filter((k) => existsSync(join(dizin, `${k.id}.txt`)) && existsSync(brifYolu(k.id, brifSurum))).map((k) => {
    const metin = readFileSync(join(dizin, `${k.id}.txt`), 'utf8');
    const b = readFileSync(brifYolu(k.id, brifSurum), 'utf8');
    const br = rakamlar(b);
    return { id: k.id, tur: k.tur, oran: kelimeler(metin).length / k.hedef, rakam: [...rakamlar(metin)].filter((x) => !br.has(x)), ad: adDenetle(b, metin) };
  });
  const bant = (x) => x.oran >= 0.7 && x.oran <= 1.1;
  const turBant = Object.fromEntries(['blog', 'kurumsal', 'duyuru'].map((t) => {
    const g = u.filter((x) => x.tur === t);
    return [t, { bantta: g.filter(bant).length, n: g.length, medyan: g.length ? +med(g.map((x) => x.oran)).toFixed(2) : null }];
  }));
  return {
    uzunluk: { medyan: +med(u.map((x) => x.oran)).toFixed(2), bantta: u.filter(bant).length, n: u.length, tur: turBant },
    olgu: {
      rakamFazlaMetin: u.filter((x) => x.rakam.length).length,
      adBozukMetin: u.filter((x) => x.ad.bozuk.length).length,
      adYeniMetin: u.filter((x) => x.ad.yeni.length).length,
      ornekler: u.filter((x) => x.rakam.length || !x.ad.ok).map((x) => `${x.id}: ${[...x.rakam, ...x.ad.bozuk.map((b) => `${b.ad}≠${b.benzer}`), ...x.ad.yeni.map((a) => `+${a}`)].join(', ')}`),
    },
  };
}

async function hakemCalistir(key, isler, kayit, yol) {
  let i = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (i < isler.length) {
      const x = isler[i++];
      if (Number.isFinite(kayit[x.k]?.p_sakli)) continue;
      try { kayit[x.k] = { p_sakli: (await sakliSor({ key, metin: readFileSync(x.yol, 'utf8').trim() })).p }; } catch (e) { console.error(x.k, e.message); }
    }
  }));
  yazJ(yol, kayit);
}

const txt = (dir, on) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.txt')).map((f) => ({ k: `${on}/${f}`, yol: join(dir, f) })) : []);

async function hakem(key) {
  const yol = join(D, 'hakem.json');
  const kayit = okuJ(yol, {});
  const turu = Object.fromEntries(KONULAR.map((k) => [k.id, k.tur]));
  // Bağımsız beceri (derlem-tekli/beceri[-surum]) ve bilgi için türetilmiş beceri (derlem-nitelikli/beceri-t3[, -surum]).
  const kumeler = [['tekli', join(D, 'beceri')], ['turetilmis-t3', join(DN, 'beceri-t3')]];
  if (SURUM) kumeler.push([`tekli-${SURUM}`, join(D, ek('beceri'))], [`turetilmis-${SURUM}`, join(DN, ek('beceri'))]);
  // Yeni insan havuzu (2025+): tanıma kontrolü. Puanlar aynı önbellekte, "yeni-insan/" önekiyle.
  const isler = [...kumeler.flatMap(([ad, dir]) => txt(dir, ad)), ...txt(join(DY, 'insan'), 'yeni-insan')];
  await hakemCalistir(key, isler, kayit, yol);
  const insanKayit = okuJ(join(DN, 'hakem.json'), {});
  const eski = Object.entries(insanKayit).filter(([k, v]) => k.startsWith('insan/') && Number.isFinite(v.p_sakli)).map(([, v]) => v.p_sakli);
  const yeniMeta = okuJ(join(DY, 'meta.json'), {});
  const yeniG = Object.entries(kayit).filter(([k, v]) => k.startsWith('yeni-insan/') && Number.isFinite(v.p_sakli));
  const yeni = yeniG.map(([, v]) => v.p_sakli);
  const grup = (on) => Object.entries(kayit).filter(([k, v]) => k.startsWith(on) && Number.isFinite(v.p_sakli));
  const sonuc = {
    tarih: new Date().toISOString().slice(0, 10), hakem: 'gpt-6-astra (saklı, editör istemi)',
    insan_eski: { n: eski.length, med: med(eski), not: 'nitelikli derlem, yayın ≤ 2022' },
    insan_yeni: yeni.length ? {
      n: yeni.length, med: med(yeni), not: 'derlem-yeni-insan, yayın 2025+',
      p_ust_0_5: yeni.filter((p) => p > 0.5).length,
      tur: Object.fromEntries(['blog', 'kurumsal', 'duyuru'].map((t) => {
        const pt = yeniG.filter(([k]) => yeniMeta[k.split('/')[1].slice(0, -4)]?.tur === t).map(([, v]) => v.p_sakli);
        return [t, pt.length ? { n: pt.length, med: med(pt) } : null];
      })),
      auc_yeni_gt_eski: +auc(eski, yeni).toFixed(3),
    } : null,
  };
  for (const [ad] of kumeler) {
    const g = grup(ad + '/');
    if (!g.length) continue;
    const p = g.map(([, v]) => v.p_sakli);
    const olc = (ins) => ({ auc: +auc(ins, p).toFixed(3), ga: aucGA(ins, p).map((x) => +x.toFixed(3)) });
    sonuc[ad] = { n: p.length, med: med(p), eski: olc(eski), ...(yeni.length ? { yeni: olc(yeni) } : {}) };
    if (ad.startsWith('tekli')) {
      sonuc[ad].tur = Object.fromEntries(['blog', 'kurumsal', 'duyuru'].map((t) => {
        const pt = g.filter(([k]) => turu[k.split('/')[1].slice(0, -4)] === t).map(([, v]) => v.p_sakli);
        return [t, pt.length ? { n: pt.length, eski: +auc(eski, pt).toFixed(3), ...(yeni.length ? { yeni: +auc(yeni, pt).toFixed(3) } : {}) } : null];
      }));
    }
  }
  sonuc.uzunlukOlgu = { tekli: uzunlukOlgu(join(D, 'beceri'), undefined) };
  if (SURUM) sonuc.uzunlukOlgu[`tekli-${SURUM}`] = uzunlukOlgu(join(D, ek('beceri')), BRIF_SURUM);
  yazJ(join(D, ek('sonuc') + '.json'), sonuc);
  console.log(JSON.stringify(sonuc, null, 1));
}

const adim = process.argv[2];
const ADIMLAR = { olgu, acilim, brif, uret, hakem };
if (!ADIMLAR[adim]) { console.error('adım: olgu | acilim | brif | uret | hakem  [--surum ad] [--brif-surum ad]'); process.exit(2); }
const key = adim === 'brif' ? null : anahtar();
if (adim !== 'brif' && !key) { console.error('OPENAI_API_KEY yok'); process.exit(3); }
await ADIMLAR[adim](key);
