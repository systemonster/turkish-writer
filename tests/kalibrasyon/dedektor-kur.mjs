#!/usr/bin/env node
// Dedektör girdisi (kimlik -> dosya yolu). İnsan örneklemi sabit tohumla seçilir: yeni insan havuzundan
// (derlem-yeni-insan/insan, y-* ve y2-*) tür başına oranlı N metin. Beceri: verilen klasörlerin tamamı.
// Kullanım: node dedektor-kur.mjs <çıktı.json> <N-insan> <önek=klasör>...   ör. tekli-v11a=derlem-tekli/beceri-v11a
import { readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
const [, , cikti, n, ...gruplar] = process.argv;
const K = import.meta.dirname;
const yeni = join(K, 'derlem-yeni-insan', 'insan');
let t = 11;
const rnd = () => ((t = (t * 1103515245 + 12345) % 2147483648) / 2147483648);
const tum = readdirSync(yeni).filter((f) => f.endsWith('.txt') && !/^y-k/.test(f)).sort();
const tur = (f) => (/^y2?-?b|^y2-(0\d|1[0-6]|3[6-9]|4\d)/.test(f) ? 'blog' : 'duyuru');
const sec = [];
for (const g of ['blog', 'duyuru']) {
  const h = tum.filter((f) => tur(f) === g).map((f) => [rnd(), f]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  sec.push(...h.slice(0, Math.round((Number(n) * h.length) / tum.length)));
}
const m = {};
for (const f of sec) m[`insan-yeni/${f.slice(0, -4)}`] = resolve(yeni, f);
for (const g of gruplar) { const [on, d] = g.split('='); for (const f of readdirSync(join(K, d)).filter((x) => x.endsWith('.txt')).sort()) m[`${on}/${f.slice(0, -4)}`] = resolve(K, d, f); }
writeFileSync(cikti, JSON.stringify(m, null, 1));
console.log(Object.keys(m).length, 'metin;', sec.length, 'insan');
