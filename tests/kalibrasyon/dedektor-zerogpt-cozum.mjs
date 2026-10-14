#!/usr/bin/env node
// ZeroGPT'nin vurguladığı ("yapay") cümleleri, dedektor-cumle.py cümle listesiyle eşleştirir ve işaretli/işaretsiz cümlelerin
// özelliklerini karşılaştırır. Kullanım: node dedektor-zerogpt-cozum.mjs <sZ.json> <cumle.jsonl> [çıktı.json]
import { readFileSync, writeFileSync } from 'node:fs';
const [, , zYol, cYol, cikti] = process.argv;
const Z = JSON.parse(readFileSync(zYol, 'utf8'));
const C = readFileSync(cYol, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const norm = (t) => t.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const YON = /(malısınız|melisiniz|malısın|gerekir|gerekmektedir|yapmalı|\bedin\b|ediniz|unutmayın|dikkat edin|bulundurun|planlamalı|kontrol etmeli|yaptırmalı|seçmeli|belirlemeli)/i;
const kok = (c) => { const k = c.toLocaleLowerCase('tr').match(/\p{L}{5,}/gu) || []; return k.length ? 1 - new Set(k.map((x) => x.slice(0, 5))).size / k.length : 0; };
const OZ = {
  kelime: (c) => c.split(/\s+/).length,
  virgul: (c) => (c.match(/,/g) || []).length,
  ve: (c) => (c.match(/\bve\b/gi) || []).length,
  rakam: (c) => (/\d/.test(c) ? 1 : 0),
  ozelAd: (c) => (c.slice(1).match(/(?<=\s)\p{Lu}\p{L}+/gu) || []).length,
  yonerge: (c) => (YON.test(c) ? 1 : 0),
  siz: (c) => (/\b(siz|size|sizin|sizi)\b|(sınız|siniz|sunuz|sünüz)\b/i.test(c) ? 1 : 0),
  kokTekrar: kok,
  ilkCumle: (c, s) => (s.i === 0 ? 1 : 0),
};
const ort = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
const gruplar = {};
for (const [id, v] of Object.entries(Z)) {
  if (!v.isaretli) continue;
  const g = id.split('/')[0] === 'insan' ? 'insan' : 'beceri';
  const hl = v.isaretli.map(norm).filter((x) => x.length > 10);
  const sent = C.filter((s) => s.id === id);
  for (const s of sent) {
    const n = norm(s.metin);
    const isaret = hl.some((h) => h.includes(n.slice(0, 40)) || n.includes(h.slice(0, 40)));
    (gruplar[g] ||= []).push({ ...s, isaret, f: Object.fromEntries(Object.entries(OZ).map(([k, f]) => [k, f(s.metin, s)])) });
  }
}
const sonuc = { metin: Object.fromEntries(Object.entries(gruplar).map(([g, a]) => [g, { cumle: a.length, isaretli: a.filter((x) => x.isaret).length, oran: +(a.filter((x) => x.isaret).length / a.length).toFixed(2) }])), ozellik: {} };
for (const g of Object.keys(gruplar)) {
  const a = gruplar[g], t = a.filter((x) => x.isaret), d = a.filter((x) => !x.isaret);
  sonuc.ozellik[g] = Object.fromEntries(Object.keys(OZ).map((k) => [k, { isaretli: +ort(t.map((x) => x.f[k])).toFixed(2), digeri: +ort(d.map((x) => x.f[k])).toFixed(2) }]));
  // boya göre işaret oranı
  sonuc.ozellik[g].boyaGoreIsaretOrani = Object.fromEntries([['5-11', 5, 11], ['12-18', 12, 18], ['19-26', 19, 26], ['27+', 27, 999]].map(([ad, lo, hi]) => { const x = a.filter((s) => s.f.kelime >= lo && s.f.kelime <= hi); return [ad, x.length ? { n: x.length, oran: +(x.filter((s) => s.isaret).length / x.length).toFixed(2) } : null]; }));
}
if (cikti) writeFileSync(cikti, JSON.stringify(sonuc, null, 1));
console.log(JSON.stringify(sonuc, null, 1));
