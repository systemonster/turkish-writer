#!/usr/bin/env node
// Model kör testi 1: aynı 5 lovefengis brifini birkaç OpenAI modeline, yalnız Yaz kipiyle
// (openai-taslak.mjs'in sistem istemi, Düzelt geçişi yok) çıpasız ve genel çıpalı yazdırır.
//
//   node tests/kalibrasyon/kor-test/model-uret.mjs [--model a,b,c] [--tohum 1]
//
// Çıktılar:
//   model-ham-1.json      üretim önbelleği (git dışı); tekrar çalıştırınca yalnız eksikler üretilir
//   model-seti-1.json     kör set: id, brif, metin (model ve koşul yok, sıra karışık)
//   model-anahtar-1.json  anahtar (git dışı): id → model, koşul, çıpalar, tr-scan puanı
// Anahtar: OPENAI_API_KEY ya da çalışılan dizindeki .env.local / .env.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { anahtar, cipaSec, kopyaKontrol, taslakUret } from '../../../skills/turkish-writer/scripts/openai-taslak.mjs';
import { denetle, bant } from '../../../skills/turkish-writer/scripts/tr-scan.mjs';

const BURASI = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const bayrak = (ad, v) => { const i = argv.indexOf(ad); return i > -1 ? argv[i + 1] : v; };
const MODELLER = bayrak('--model', 'gpt-5.6-sol,gpt-6-sol,gpt-6-astra,gpt-5.5').split(',');
const TOHUM = Number(bayrak('--tohum', '1'));
const HAM = join(BURASI, 'model-ham-1.json');

// Brif dosyası → çıpa türü
const TUR = { '1-anasayfa': 'site', '2-hizmet-karti': 'site', '3-blog-giris': 'blog', '4-whatsapp': 'whatsapp', '5-sss': 'site' };
const brifKlasor = join(BURASI, 'model-brif');
const ses = readFileSync(join(brifKlasor, '_ses.md'), 'utf8').trim();
const brifler = readdirSync(brifKlasor).filter((f) => /^\d.*\.md$/.test(f)).sort().map((f) => {
  const id = f.replace(/\.md$/, '');
  const govde = readFileSync(join(brifKlasor, f), 'utf8').trim();
  return { id, tur: TUR[id], govde, tam: `${govde}\n\n${ses}\n` };
});

const ham = existsSync(HAM) ? JSON.parse(readFileSync(HAM, 'utf8')) : {};
const key = anahtar();
const isler = [];
for (const b of brifler) {
  const cipalar = cipaSec({ tur: b.tur });
  for (const model of MODELLER) {
    for (const kosul of ['cipasiz', 'cipali']) {
      if (kosul === 'cipali' && !cipalar.length) continue;
      const k = `${b.id}|${model}|${kosul}`;
      if (ham[k]?.metin) continue;
      isler.push({ k, b, model, kosul, cipalar: kosul === 'cipali' ? cipalar : [] });
    }
  }
}
if (isler.length && !key) { console.error('OPENAI_API_KEY yok'); process.exit(3); }
console.error(`üretilecek: ${isler.length}`);

async function calistir(is) {
  for (let deneme = 1; deneme <= 2; deneme++) {
    try {
      const t0 = Date.now();
      const metin = await taslakUret({ brif: is.b.tam, model: is.model, cipalar: is.cipalar, key });
      ham[is.k] = { metin, cipalar: is.cipalar.map((c) => c.ad), sure_ms: Date.now() - t0, tarih: new Date().toISOString() };
      console.error(`ok ${is.k}`);
      return;
    } catch (e) {
      console.error(`hata ${is.k} (deneme ${deneme}): ${e.message}`);
      ham[is.k] = { hata: e.message };
    }
  }
}
const kuyruk = [...isler];
await Promise.all(Array.from({ length: 4 }, async () => { while (kuyruk.length) await calistir(kuyruk.shift()); }));
writeFileSync(HAM, JSON.stringify(ham, null, 2) + '\n');

// Tohumlu karıştırma (mulberry32)
let s = TOHUM >>> 0;
const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const kayitlar = Object.entries(ham).filter(([, v]) => v.metin).map(([k, v]) => { const [brif, model, kosul] = k.split('|'); return { brif, model, kosul, ...v }; })
  .filter((r) => brifler.some((b) => b.id === r.brif) && MODELLER.includes(r.model))
  .sort((a, b) => `${a.brif}|${a.model}|${a.kosul}`.localeCompare(`${b.brif}|${b.model}|${b.kosul}`));
for (let i = kayitlar.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [kayitlar[i], kayitlar[j]] = [kayitlar[j], kayitlar[i]]; }

const set = [];
const anahtarlar = [];
kayitlar.forEach((r, i) => {
  const id = `m1-${String(i + 1).padStart(2, '0')}`;
  const b = brifler.find((x) => x.id === r.brif);
  set.push({ id, brif_id: r.brif, brif: b.govde, metin: r.metin });
  const d = denetle(r.metin);
  const cipalar = r.cipalar.length ? cipaSec({ tur: b.tur, enFazla: 99 }).filter((c) => r.cipalar.includes(c.ad)) : [];
  anahtarlar.push({
    id, brif_id: r.brif, model: r.model, kosul: r.kosul, cipalar: r.cipalar,
    kelime: d.olcum.kelime,
    trscan: {
      skor: d.skor, bant: bant(d.skor, d.olcum.kelime), bulgu: d.bulgular.length,
      tdk: d.bulgular.filter((x) => /^tdk|tipografi/.test(x.tur)).length,
      turler: [...new Set(d.bulgular.map((x) => x.tur))],
      ve100: Number(d.olcum.ve100.toFixed(2)), uzunCumle: d.olcum.uzunCumle, cumleCV: Number(d.olcum.cumleCV.toFixed(2)),
    },
    kopya: kopyaKontrol(r.metin, cipalar),
  });
});

const ozet = {};
for (const a of anahtarlar) {
  const k = `${a.model} · ${a.kosul}`;
  (ozet[k] ||= { n: 0, skor: 0, bulgu: 0, tdk: 0, kopya: 0 });
  ozet[k].n++; ozet[k].skor += a.trscan.skor; ozet[k].bulgu += a.trscan.bulgu; ozet[k].tdk += a.trscan.tdk; ozet[k].kopya += a.kopya.length;
}
for (const v of Object.values(ozet)) v.skor = Number((v.skor / v.n).toFixed(1));

writeFileSync(join(BURASI, 'model-seti-1.json'), JSON.stringify({
  aciklama: 'Model kör testi 1: lovefengis için 5 brif, her biri birkaç modelle çıpasız ve genel çıpalı yazdırıldı (yalnız Yaz kipi, Düzelt yok). Model ve koşul gizli; sıra karışık. Kulakla değerlendirin; anahtar ayrı dosyada.',
  tarih: new Date().toISOString().slice(0, 10),
  ogeler: set,
}, null, 2) + '\n');
writeFileSync(join(BURASI, 'model-anahtar-1.json'), JSON.stringify({
  not: 'tr-scan puanı yalnız bilgi amaçlıdır; karar kurucunun kulağıyla verilir.',
  modeller: MODELLER, tohum: TOHUM, ozet, ogeler: anahtarlar,
}, null, 2) + '\n');
console.error(`set: ${set.length} öge`);
console.table(ozet);
