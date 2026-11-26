#!/usr/bin/env node
// Explicit literal guard, not semantic verification.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function korumaDenetle(metin, korunanlar) {
  if (typeof metin !== 'string' || !Array.isArray(korunanlar) ||
      korunanlar.some(s => typeof s !== 'string' || !s.trim())) {
    throw new TypeError('Metin ve boş olmayan dizilerden oluşan korunanlar listesi gerekli.');
  }
  const eksik = [...new Set(korunanlar)].filter(s => !metin.includes(s));
  return { ok: !eksik.length, eksik, kapsam: 'birebir dizi; anlam denetimi değildir' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [dosya, liste] = process.argv.slice(2);
    if (!dosya || !liste || process.argv.length !== 4) throw new Error('Kullanım: node scripts/metin-kapisi.mjs metin.txt korunanlar.json');
    const r = korumaDenetle(readFileSync(dosya, 'utf8'), JSON.parse(readFileSync(liste, 'utf8')));
    console.log(JSON.stringify(r, null, 2));
    process.exitCode = r.ok ? 0 : 1;
  } catch (e) { console.error(e.message); process.exitCode = 2; }
}
