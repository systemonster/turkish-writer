#!/usr/bin/env node
// Bir klasördeki brifleri openai-taslak.mjs ile paralel yazar (varsayılan 6 süreç, eksikleri tamamlar).
// Kullanım (lovefengis klasöründen, anahtar .env'de):
//   node <tw>/tests/kalibrasyon/uret-paralel.mjs <brif-dizini> <çıktı-dizini> [--n 6] [-- <openai-taslak bayrakları>]
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { anahtar } from '../../skills/turkish-writer/scripts/openai-taslak.mjs';

const TASLAK = process.env.TW_TASLAK || join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'skills', 'turkish-writer', 'scripts', 'openai-taslak.mjs');
const a = process.argv.slice(2);
const ek = a.includes('--') ? a.splice(a.indexOf('--')).slice(1) : [];
const n = a.includes('--n') ? Number(a.splice(a.indexOf('--n'), 2)[1]) : 6;
const [brifD, cikD] = a;
if (!brifD || !cikD) { console.error('kullanım: uret-paralel.mjs <brif-dizini> <çıktı-dizini> [--n 6] [-- bayraklar]'); process.exit(2); }
const key = anahtar();
if (!key) { console.error('OPENAI_API_KEY yok'); process.exit(3); }
mkdirSync(cikD, { recursive: true });
const isler = readdirSync(brifD).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)).filter((id) => !existsSync(join(cikD, `${id}.txt`)));
let i = 0, bitti = 0;
const calis = () => new Promise((coz) => {
  const sonraki = () => {
    if (i >= isler.length) return coz();
    const id = isler[i++];
    execFile(process.execPath, [TASLAK, join(brifD, `${id}.md`), '--out', join(cikD, `${id}.txt`), ...ek], { env: { ...process.env, OPENAI_API_KEY: key } }, (e, _o, err) => {
      if (e) console.error(`${id} başarısız: ${String(err).slice(0, 200)}`);
      else if (/UYARI/.test(err)) console.error(`${id}: ${err.split('\n').filter((l) => /UYARI/.test(l)).join(' | ')}`);
      console.error(`${++bitti}/${isler.length}`);
      sonraki();
    });
  };
  sonraki();
});
await Promise.all(Array.from({ length: n }, calis));
