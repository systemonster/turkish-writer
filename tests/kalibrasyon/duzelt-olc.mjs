#!/usr/bin/env node
// Düzelt kipinin ölçülebilir hâli: taslak metni, SKILL.md'nin verilen sürümünü talimat alan bir OpenAI modeline
// düzelttirir (lovefengis blog hattının Düzelt çağrısıyla aynı kurgu: talimat = SKILL.md, kesin sınırlar sarmalayıcıda).
// Kullanıcı mesajı: brif (olgu sınırı) + metin + tr-scan raporu (Claude'un Düzelt'te yaptığı gibi tarama sonucu).
// Kullanım (lovefengis klasöründen, anahtar .env'de):
//   node <tw>/tests/kalibrasyon/duzelt-olc.mjs <metin-dizini> <brif-dizini> <talimat.md> <çıktı-dizini> [--model gpt-6.1-sol] [--n 6]
// Çıktıda: <id>.txt (düzeltilmiş metin), <id>.degisen.json (modelin "ne değişti" notu), uyg.json (token sayımı).
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { anahtar, adDenetle } from '../../skills/turkish-writer/scripts/openai-taslak.mjs';
import { denetle } from '../../skills/turkish-writer/scripts/tr-scan.mjs';
import { codexAc, codexAcik, codexSor, jsonAyikla } from '../../skills/turkish-writer/scripts/codex-arka.mjs';

const a = process.argv.slice(2);
const al = (ad, v) => { const i = a.indexOf(ad); return i > -1 ? a.splice(i, 2)[1] : v; };
const model = al('--model', 'gpt-6.1-sol'), n = Number(al('--n', 6));
if (a.includes('--codex')) { a.splice(a.indexOf('--codex'), 1); codexAc(); } // abonelik (codex exec), API yok
const [metinD, brifD, talimatYol, cikD] = a;
if (!cikD) { console.error('kullanım: duzelt-olc.mjs <metin-dizini> <brif-dizini> <talimat.md> <çıktı-dizini>'); process.exit(2); }
const key = anahtar();
if (!key) { console.error('OPENAI_API_KEY yok (codex için --codex)'); process.exit(3); }

const SARMALAYICI = `Türkçe bir metnin son okumasını yapan editörsün. turkish-writer becerisinin Düzelt kipindesin: metin verildi, doğallaştırılacak. Aşağıdaki talimatın geçişlerini (0-6) ve değişmez kurallarını uygula; betik komutlarını çalıştıramazsın, tarama sonucu kullanıcı mesajında verilir.

Bu işte kesin sınırlar (talimatla çelişirse bunlar geçerli):
- Yeni olgu, sayı, ad, tarih, alıntı, örnek, deneyim ya da paragraf ekleme. Brifteki olguyu silme (yalnız yineleme ve dolgu cümlesi silinir). Rakamlara, adlara ve tarihlere dokunma.
- Markdown başlık yapısını ("## " ara başlıklar) koru; paragraf birleştirme, bölme ve kısaltma serbesttir (olgu değişmeden); hitap ve kişiyi değiştirme.
- Uzunluk hedefi yok: silince kısalıyorsa kısalır; paragraf uzatma.

Çıktı yalnız düzeltilmiş metin değil, JSON nesnesidir, öncesinde ya da sonrasında metin yok:
{"metin": "düzeltilmiş tam metin", "degisenler": ["en fazla 5 kısa madde; yapısal müdahaleyi ve nedenini yaz"]}

--- turkish-writer Düzelt talimatı (SKILL.md) ---
${readFileSync(talimatYol, 'utf8')}`;

const rapor = (metin) => {
  const r = denetle(metin, { yineleme: true });
  const sat = [...r.bulgular, ...(r.bilgi || [])].map((b) => `- ${b.tur}${b.bilgi ? ' (bilgi)' : ''}: ${b.not}${b.parca ? ` ["${b.parca}"]` : ''}`);
  return `skor ${r.skor}\n${sat.join('\n') || '(bulgu yok)'}`;
};

mkdirSync(cikD, { recursive: true });
const sayac = existsSync(join(cikD, 'uyg.json')) ? JSON.parse(readFileSync(join(cikD, 'uyg.json'), 'utf8')) : { cagri: 0, giris: 0, cikis: 0 };
const isler = readdirSync(metinD).filter((f) => f.endsWith('.txt')).map((f) => f.slice(0, -4)).filter((id) => !existsSync(join(cikD, `${id}.txt`)) && existsSync(join(brifD, `${id}.md`)));
let i = 0;
async function calis() {
  while (i < isler.length) {
    const id = isler[i++];
    const metin = readFileSync(join(metinD, `${id}.txt`), 'utf8').trim();
    const brif = readFileSync(join(brifD, `${id}.md`), 'utf8');
    const kullanici = `Brif (olgular dışında bilgi yok):\n${brif}\n\nTarama sonucu (tr-scan):\n${rapor(metin)}\n\nDüzeltilecek metin:\n${metin}`;
    for (let deneme = 0; deneme < 3; deneme++) {
      try {
        if (codexAcik()) {
          const c = jsonAyikla(await codexSor({ sistem: SARMALAYICI, kullanici, model }));
          if (typeof c.metin !== 'string' || !c.metin.trim()) throw new Error('boş metin');
          sayac.cagri++;
          const ad = adDenetle(brif, c.metin);
          writeFileSync(join(cikD, `${id}.txt`), c.metin.trim() + '\n');
          writeFileSync(join(cikD, `${id}.degisen.json`), JSON.stringify({ degisenler: c.degisenler || [], ad: { bozuk: ad.bozuk, yeni: ad.yeni } }));
          break;
        }
        const res = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: SARMALAYICI }, { role: 'user', content: kullanici }] }), signal: AbortSignal.timeout(240000) });
        if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 120)}`);
        const j = await res.json();
        const c = JSON.parse(j.choices[0].message.content);
        if (typeof c.metin !== 'string' || !c.metin.trim()) throw new Error('boş metin');
        sayac.cagri++; sayac.giris += j.usage.prompt_tokens; sayac.cikis += j.usage.completion_tokens;
        const ad = adDenetle(brif, c.metin);
        writeFileSync(join(cikD, `${id}.txt`), c.metin.trim() + '\n');
        writeFileSync(join(cikD, `${id}.degisen.json`), JSON.stringify({ degisenler: c.degisenler || [], ad: { bozuk: ad.bozuk, yeni: ad.yeni } }));
        break;
      } catch (e) { console.error(id, 'deneme', deneme + 1, e.message.slice(0, 120)); }
    }
    console.error(`${id} ${i}/${isler.length}`);
  }
}
await Promise.all(Array.from({ length: n }, calis));
writeFileSync(join(cikD, 'uyg.json'), JSON.stringify(sayac));
console.error('token', JSON.stringify(sayac));
