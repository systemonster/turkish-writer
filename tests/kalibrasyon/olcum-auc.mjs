#!/usr/bin/env node
// tr-scan ölçümlerinde (V1 'b' ölçütünün 8 ana ölçümü + paragrafCV) beceri klasörü ile nitelikli insan (62) arasındaki AUC.
// AUC = P(beceri > insan); hedef [0,40; 0,60]. Kullanım: node olcum-auc.mjs <beceri-klasör> [...]  (klasörler bu dosyaya göre)
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { denetle } from '../../skills/turkish-writer/scripts/tr-scan.mjs';
const K = import.meta.dirname;
const OLC = { cumleCV: (o) => o.cumleCV, cumleSapma: (o) => o.cumleSapma, cumleOrt: (o) => o.cumleOrt, uzunCumleOran: (o) => (o.cumle ? o.uzunCumle / o.cumle : 0), ve100: (o) => o.ve100, bir100: (o) => o.bir100, hafifFiil200: (o) => o.hafifFiil200, heceOrt: (o) => o.heceOrt, paragrafCV: (o) => o.paragrafCV };
const al = (d) => readdirSync(join(K, d)).filter((f) => f.endsWith('.txt')).map((f) => denetle(readFileSync(join(K, d, f), 'utf8')).olcum).filter((o) => o.kelime >= 60);
const auc = (i, b) => { let t = 0; for (const x of b) for (const y of i) t += x > y ? 1 : x === y ? 0.5 : 0; return t / (i.length * b.length); };
const med = (a) => { const s = [...a].sort((x, y) => x - y); return (s[(s.length - 1) >> 1] + s[s.length >> 1]) / 2; };
const ins = al('derlem-nitelikli/insan');
for (const d of process.argv.slice(2)) {
  const b = al(d); let bant = 0; const sat = [];
  for (const [ad, f] of Object.entries(OLC)) { const a = auc(ins.map(f), b.map(f)); if (ad !== 'paragrafCV' && a >= 0.4 && a <= 0.6) bant++; sat.push(`${ad} ${a.toFixed(2)} (${med(b.map(f)).toFixed(2)})`); }
  console.log(`${d} n=${b.length} bant ${bant}/8: ${sat.join(', ')}`);
}
console.log(`insan medyanları: ${Object.entries(OLC).map(([ad, f]) => `${ad} ${med(ins.map(f)).toFixed(2)}`).join(', ')}`);
