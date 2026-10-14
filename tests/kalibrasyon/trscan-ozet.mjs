#!/usr/bin/env node
// tr-scan skorunu klasör gruplarında özetler: ortanca, ≤80 oranı, AUC(beceri puanı düşük > insan).
// Kullanım: node trscan-ozet.mjs <insan-klasör,...> <beceri-klasör> [...]   (klasörler bu dosyaya göre)
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { denetle } from '../../skills/turkish-writer/scripts/tr-scan.mjs';
const K = import.meta.dirname;
const skorlar = (d) => readdirSync(join(K, d)).filter((f) => f.endsWith('.txt')).map((f) => denetle(readFileSync(join(K, d, f), 'utf8')).skor);
const med = (a) => { const s = [...a].sort((x, y) => x - y); return (s[(s.length - 1) >> 1] + s[s.length >> 1]) / 2; };
const auc = (ins, bec) => { let t = 0; for (const b of bec) for (const h of ins) t += b < h ? 1 : b === h ? 0.5 : 0; return t / (ins.length * bec.length); };
const [insD, ...becD] = process.argv.slice(2);
const ins = insD.split(',').flatMap(skorlar);
console.log(`insan n=${ins.length} med=${med(ins)} ≤80: ${ins.filter((x) => x <= 80).length}`);
for (const d of becD) { const b = skorlar(d); console.log(`${d} n=${b.length} med=${med(b)} ≤80: ${b.filter((x) => x <= 80).length} AUC(insan>beceri)=${auc(ins, b).toFixed(3)}`); }
