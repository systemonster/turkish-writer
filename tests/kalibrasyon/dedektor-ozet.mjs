#!/usr/bin/env node
// dedektor.py çıktısını özetler: grup başına ortanca ve (beceri grubu > insan grubu) AUC.
// Kullanım: node dedektor-ozet.mjs <skorlar.json> <insan-öneki,...> <beceri-öneki,...> [alan=d1,d2,bino]
import { readFileSync } from 'node:fs';
const [, , yol, ins, bec, alan = 'd1,d2,bino'] = process.argv;
const s = JSON.parse(readFileSync(yol, 'utf8'));
const al = (on, a) => Object.entries(s).filter(([k]) => on.split(',').some((o) => k.startsWith(o + '/'))).map(([, v]) => v[a]).filter(Number.isFinite);
const med = (a) => { const x = [...a].sort((p, q) => p - q); return x.length ? (x[(x.length - 1) >> 1] + x[x.length >> 1]) / 2 : NaN; };
const auc = (i, b) => { let t = 0; for (const x of b) for (const y of i) t += x > y ? 1 : x === y ? 0.5 : 0; return t / (i.length * b.length); };
for (const a of alan.split(',')) {
  const i = al(ins, a), b = al(bec, a);
  console.log(`${a}: insan n=${i.length} med=${med(i).toFixed(3)} | beceri n=${b.length} med=${med(b).toFixed(3)} | AUC(beceri>insan)=${auc(i, b).toFixed(3)}`);
}
