#!/usr/bin/env node
// dedektor-cumle.py çıktısını (JSONL) çözümler: hangi cümle özellikleri dedektör puanını ve tahmin edilebilirliği
// (düşük nll / düşük Binoculars oranı) yükseltiyor? Grup = kimlik önekinin ilk parçası (insan | A-taban | ...).
// Kullanım: node dedektor-cozum.mjs <cumle.jsonl> [insan-öneki=insan] [çıktı.json]
import { readFileSync, writeFileSync } from 'node:fs';
const [, , yol, insanOn = 'insan', cikti] = process.argv;
const S = readFileSync(yol, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const grup = (s) => s.id.split('/')[0];
const BAGLAC = /^(ancak|ayrıca|bununla birlikte|öte yandan|dolayısıyla|bu nedenle|bu sayede|böylece|ek olarak|bunun yanı sıra|özellikle|aynı zamanda|ayrıca|yani|ise|ama|fakat)\b/i;
const OZ = {
  kelime: (c) => c.split(/\s+/).length,
  virgul: (c) => (c.match(/,/g) || []).length,
  ve: (c) => (c.match(/\bve\b/gi) || []).length,
  rakam: (c) => (/\d/.test(c) ? 1 : 0),
  baglacAcilis: (c) => (BAGLAC.test(c) ? 1 : 0),
  yuklemDir: (c) => (/(dır|dir|dur|dür|tır|tir|tur|tür)[.!?…]?$/i.test(c.trim()) ? 1 : 0),
  ulac: (c) => ((c.match(/\p{L}{3,}(arak|erek|ıp|ip|up|üp|ınca|ince)\b/giu) || []).length),
  yonerge: (c) => (/(malısınız|melisiniz|malısın|gerekir|gerekmektedir|yapmalı|edin\b|ediniz|unutmayın|dikkat edin|bulundurun)/i.test(c) ? 1 : 0),
  siz: (c) => (/\b(siz|size|sizin|sizi)\b|(sınız|siniz|sunuz|sünüz)\b/i.test(c) ? 1 : 0),
  birinciKisi: (c) => (/\b(ben|biz|bizim|benim)\b|(ım|im|um|üm|ız|iz|uz|üz)\b/i.test(c) && /\b(ben|biz)\b/i.test(c) ? 1 : 0),
  ozelAd: (c) => ((c.slice(1).match(/(?<=\s)\p{Lu}\p{L}+/gu) || []).length),
  uzunKelime: (c) => { const k = c.split(/\s+/); return k.filter((x) => x.length >= 10).length / k.length; },
  ilkCumle: (c, s) => (s.i === 0 ? 1 : 0),
  sonCumle: (c, s) => (s.i === s.n - 1 ? 1 : 0),
  konum: (c, s) => s.i / Math.max(1, s.n - 1),
  tirnak: (c) => (/["“”‘’']/.test(c) ? 1 : 0),
  soru: (c) => (/\?/.test(c) ? 1 : 0),
  tekrarKok: (c) => { const k = c.toLocaleLowerCase('tr').match(/\p{L}{5,}/gu) || []; const u = new Set(k.map((x) => x.slice(0, 5))); return k.length ? 1 - u.size / k.length : 0; },
};
const ort = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
const rank = (a) => { const i = a.map((v, k) => [v, k]).sort((x, y) => x[0] - y[0]); const r = new Array(a.length); for (let j = 0; j < i.length;) { let k = j; while (k + 1 < i.length && i[k + 1][0] === i[j][0]) k++; for (let m = j; m <= k; m++) r[i[m][1]] = (j + k) / 2; j = k + 1; } return r; };
const pearson = (x, y) => { const mx = ort(x), my = ort(y); let n = 0, dx = 0, dy = 0; for (let i = 0; i < x.length; i++) { n += (x[i] - mx) * (y[i] - my); dx += (x[i] - mx) ** 2; dy += (y[i] - my) ** 2; } return n / Math.sqrt(dx * dy || 1); };
const spearman = (x, y) => pearson(rank(x), rank(y));
const feat = (s) => Object.fromEntries(Object.entries(OZ).map(([k, f]) => [k, f(s.metin, s)]));
for (const s of S) s.f = feat(s);
const insan = S.filter((s) => grup(s) === insanOn);
const gruplar = [...new Set(S.map(grup))].filter((g) => g !== insanOn);
const sonuc = { cumleSayisi: Object.fromEntries([insanOn, ...gruplar].map((g) => [g, S.filter((s) => grup(s) === g).length])), ozet: {}, korelasyon: {}, isaretli: {}, token: {} };

// 1) grup ortalamaları
for (const g of [insanOn, ...gruplar]) { const x = S.filter((s) => grup(s) === g); sonuc.ozet[g] = { d1: +ort(x.map((s) => s.d1)).toFixed(3), nll: +ort(x.map((s) => s.nll)).toFixed(3), bino: +ort(x.map((s) => s.bino)).toFixed(3), kelime: +ort(x.map((s) => s.f.kelime)).toFixed(1) }; }

// 2) özellik - puan ilişkisi (havuz: insan + tüm beceri; Spearman). nll/bino düşük = tahmin edilebilir; işareti çevirip "tahmin edilebilirlik" olarak raporla.
for (const [ad, v] of [['d1', (s) => s.d1], ['tahminEdilebilirlik(-nll)', (s) => -s.nll], ['binoYapay(-bino)', (s) => -s.bino]]) {
  sonuc.korelasyon[ad] = Object.fromEntries(Object.keys(OZ).map((k) => [k, +spearman(S.map((s) => s.f[k]), S.map(v)).toFixed(3)]));
}

// 3) "işaretli" = grup içinde d1 en yüksek %25 (insanda da). İşaretli/işaretsiz özellik ortalamaları.
for (const g of [insanOn, ...gruplar]) {
  const x = S.filter((s) => grup(s) === g).sort((a, b) => b.d1 - a.d1); const k = Math.ceil(x.length / 4);
  const t = x.slice(0, k), d = x.slice(k);
  sonuc.isaretli[g] = Object.fromEntries(Object.keys(OZ).map((o) => [o, { isaretli: +ort(t.map((s) => s.f[o])).toFixed(2), digeri: +ort(d.map((s) => s.f[o])).toFixed(2) }]));
}

// 4) token düzeyi: grup başına token ortalama nll; beceri için insana göre en "fazla tahmin edilebilir" token dizgeleri
const tk = (g) => { const m = new Map(); for (const s of S.filter((x) => grup(x) === g)) for (const [t, n] of s.tokenler) { const k = t.toLocaleLowerCase('tr'); if (!k || /^[^\p{L}\p{N}]+$/u.test(k)) continue; const e = m.get(k) || [0, 0]; e[0] += n; e[1]++; m.set(k, e); } return m; };
const hI = tk(insanOn);
const beceriToken = new Map();
for (const g of gruplar) for (const s of S.filter((x) => grup(x) === g)) for (const [t, n] of s.tokenler) { const k = t.toLocaleLowerCase('tr'); if (!k || /^[^\p{L}\p{N}]+$/u.test(k)) continue; const e = beceriToken.get(k) || [0, 0]; e[0] += n; e[1]++; beceriToken.set(k, e); }
const sira = [...beceriToken.entries()].filter(([k, [, c]]) => c >= 25).map(([k, [top, c]]) => ({ token: k, beceriSayi: c, beceriNll: +(top / c).toFixed(2), insanSayi: hI.get(k)?.[1] || 0, insanNll: hI.has(k) ? +(hI.get(k)[0] / hI.get(k)[1]).toFixed(2) : null }));
sonuc.token.enTahminEdilebilirBeceri = sira.sort((a, b) => a.beceriNll - b.beceriNll).slice(0, 25);
sonuc.token.beceriTokenFazlaGecen = [...beceriToken.entries()].filter(([k, [, c]]) => c >= 40).map(([k, [, c]]) => { const nI = [...hI.values()].reduce((x, [, y]) => x + y, 0); const nB = [...beceriToken.values()].reduce((x, [, y]) => x + y, 0); const oI = (hI.get(k)?.[1] || 0) / nI; return { token: k, beceriOran: +((c / nB) * 1000).toFixed(2), insanOran: +(oI * 1000).toFixed(2), katsayi: oI ? +((c / nB) / oI).toFixed(1) : null }; }).filter((x) => x.katsayi === null || x.katsayi >= 2).sort((a, b) => (b.beceriOran - a.beceriOran)).slice(0, 25);
// 5) cümle düzeyinde ayrışma: beceri cümlesi > insan cümlesi AUC (özellik başına) ve dedektör puanlarının cümle boyu sabitken AUC'si
const auc = (i, b) => { const r = rank([...i, ...b]); let t = 0; for (let k = i.length; k < r.length; k++) t += r[k]; return (t - (b.length * (b.length - 1)) / 2 - b.length * i.length - 0) / 1 / (i.length * b.length) + 0.5 - (b.length + 1) / 2 / i.length * 0; };
const aucBasit = (i, b) => { let t = 0; for (const x of b) for (const y of i) t += x > y ? 1 : x === y ? 0.5 : 0; return t / (i.length * b.length); };
const beceri = S.filter((x) => grup(x) !== insanOn);
sonuc.ayrisma = {
  ozellik: Object.fromEntries(Object.keys(OZ).map((k) => [k, { insan: +ort(insan.map((x) => x.f[k])).toFixed(3), beceri: +ort(beceri.map((x) => x.f[k])).toFixed(3), auc: +aucBasit(insan.slice(0, 700).map((x) => x.f[k]), beceri.slice(0, 700).map((x) => x.f[k])).toFixed(2) }])),
  boyaGoreAuc: {},
};
for (const [ad, lo, hi] of [['5-11 kelime', 5, 11], ['12-18', 12, 18], ['19-26', 19, 26], ['27+', 27, 999]]) {
  const i = insan.filter((x) => x.f.kelime >= lo && x.f.kelime <= hi), b = beceri.filter((x) => x.f.kelime >= lo && x.f.kelime <= hi);
  if (i.length < 20 || b.length < 20) continue;
  const f = (v) => +aucBasit(i.slice(0, 600).map(v), b.slice(0, 600).map(v)).toFixed(2);
  sonuc.ayrisma.boyaGoreAuc[ad] = { n: [i.length, b.length], d1: f((x) => x.d1), nll: f((x) => x.nll), bino: f((x) => x.bino) };
}
if (cikti) writeFileSync(cikti, JSON.stringify(sonuc, null, 1));
console.log(JSON.stringify(sonuc, null, 1));
