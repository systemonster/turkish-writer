#!/usr/bin/env node
// ZeroGPT'nin herkese açık, hesapsız web aracına metin yapıştırır (Playwright, görünmez tarayıcı) ve "% AI" okur.
// Hesap, ödeme, CAPTCHA aşma yok; araç engel koyarsa (kota, doğrulama, sayfa değişikliği) betik durur.
// Metnin ilk ~1800 karakteri (cümle sınırında) gider: yalnız yayımlanmış insan metni ve test metni.
// Kullanım (Playwright'ın kurulu olduğu klasörden, ör. lovefengis):  node <tw>/tests/kalibrasyon/dedektor-zerogpt.mjs girdi.json cikti.json
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
const [, , girdiYol, ciktiYol] = process.argv;
const { chromium } = (await import('node:module')).createRequire(process.cwd() + '/')('playwright');
const girdi = JSON.parse(readFileSync(girdiYol, 'utf8'));
const cikti = existsSync(ciktiYol) ? JSON.parse(readFileSync(ciktiYol, 'utf8')) : {};
const kes = (t) => { t = t.replace(/\r\n/g, '\n').split('\n').filter((l) => !l.startsWith('# ') && !l.startsWith('## ')).join('\n').trim(); if (t.length <= 1800) return t; const s = t.slice(0, 1800); const i = Math.max(s.lastIndexOf('. '), s.lastIndexOf('.\n')); return i > 600 ? s.slice(0, i + 1) : s; };
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ locale: 'tr-TR' })).newPage();
let ardisikHata = 0;
for (const [id, yol] of Object.entries(girdi)) {
  if (Number.isFinite(cikti[id]?.zerogpt)) continue;
  try {
    await p.goto('https://www.zerogpt.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await p.waitForTimeout(2500);
    await p.locator('textarea').first().fill(kes(readFileSync(yol, 'utf8')));
    await p.getByRole('button', { name: /detect text/i }).first().click();
    await p.waitForFunction(() => /\d+(?:[.,]\d+)?\s*%\s*\n?\s*AI GPT/i.test(document.body.innerText), null, { timeout: 40000 });
    const g = (await p.locator('body').innerText());
    const m = g.match(/(\d+(?:[.,]\d+)?)\s*%\s*\n?\s*AI GPT/i);
    cikti[id] = { zerogpt: Number(m[1].replace(',', '.')) / 100 };
    ardisikHata = 0;
    writeFileSync(ciktiYol, JSON.stringify(cikti, null, 1));
    console.error(id, cikti[id].zerogpt);
  } catch (e) {
    console.error(id, 'hata:', e.message.slice(0, 120));
    if (++ardisikHata >= 3) { console.error('üç ardışık hata: araç engelledi ya da sayfa değişti, duruyorum'); break; }
  }
  await p.waitForTimeout(5000 + Math.random() * 3000);
}
writeFileSync(ciktiYol, JSON.stringify(cikti, null, 1));
await b.close();
