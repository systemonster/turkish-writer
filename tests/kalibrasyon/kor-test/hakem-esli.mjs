#!/usr/bin/env node
// Kör test (insan mı, beceri mi): LLM hakem ölçümü.
// Her çift iki sırayla (a-b, b-a) sorulur; soru kalibre-beceri.mjs'deki eşli istemle aynıdır.
// "sakli" = saklı hakem: gpt-6-astra, editör çerçeveli başka bir istem (hakem-dongusu.mjs döngüsüne girmez).
// Sonuç cevap anahtarına (git dışı) yazılır, özet stdout'a.
// Kullanım (anahtar: OPENAI_API_KEY ya da çalışılan dizindeki .env.local/.env):
//   node tests/kalibrasyon/kor-test/hakem-esli.mjs gpt-4.1 gpt-6-sol sakli            # set-1
//   node tests/kalibrasyon/kor-test/hakem-esli.mjs --set 2 gpt-4.1 gpt-6-sol sakli    # set-2, döngü sonrası
//   node tests/kalibrasyon/kor-test/hakem-esli.mjs --set 2 --once gpt-6-sol sakli     # set-2, döngü öncesi taslak
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { anahtar } from '../../../skills/turkish-writer/scripts/openai-taslak.mjs';
import { SAKLI_MODEL } from '../../../skills/turkish-writer/scripts/hakem-dongusu.mjs';

const KT = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const setNo = argv.includes('--set') ? argv[argv.indexOf('--set') + 1] : '1';
const once = argv.includes('--once');
const SET = join(KT, `set-${setNo}.json`);
const CEVAP = join(KT, `cevap-anahtari-${setNo}.json`);

// Saklı hakemin eşli istemi: editör çerçevesi, "insan/yapay zekâ" sözcükleri yok.
const SAKLI_ISTEM = (a, b) => `Bir yayın editörüsün. Aşağıdaki iki Türkçe metin aynı bilgileri anlatıyor. Biri yayımlanmış, editörden geçmiş bir yazıdan alındı; öteki aynı bilgilerle bir dil modeline yazdırıldı. Hangisi yayımlanmış yazıdan alındı? Yalnız şu JSON nesnesini döndür:
{"yayimlanmis": "A" ya da "B", "emin": 0-100 arası tam sayı}

METİN A:
"""
${a}
"""

METİN B:
"""
${b}
"""`;

const ISTEM = (a, b) => `Aşağıda aynı konuda yazılmış iki Türkçe metin var. Biri bir insan tarafından, öteki bir yapay zekâ tarafından yazıldı. Hangisini bir insan yazdı? Yalnız şu JSON nesnesini döndür:
{"insan": "A" ya da "B", "emin": 0-100 arası tam sayı (kararından ne kadar eminsin), "gerekce": "tek cümle"}

METİN A:
"""
${a}
"""

METİN B:
"""
${b}
"""`;

async function sor(key, model, istem) {
  // Akıl yürüten modeller temperature 0 kabul etmiyor; yalnız gpt-4 ailesine veriliyor.
  const govde = { model, messages: [{ role: 'user', content: istem }], response_format: { type: 'json_object' } };
  if (/^gpt-4/.test(model)) govde.temperature = 0;
  for (let d = 1; d <= 3; d++) {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(govde), signal: AbortSignal.timeout(180000),
    });
    if (r.ok) return JSON.parse((await r.json()).choices[0].message.content);
    if (d === 3 || r.status < 500 && r.status !== 429) throw new Error(`${model} ${r.status}: ${(await r.text()).slice(0, 200)}`);
    await new Promise((ok) => setTimeout(ok, 2000 * d));
  }
}

// Wilson %95 güven aralığı ve iki yönlü kesin binom p (H0: 0,5)
const wilson = (k, n) => { const z = 1.96, p = k / n, m = (p + z * z / (2 * n)) / (1 + z * z / n), h = (z / (1 + z * z / n)) * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [m - h, m + h]; };
const binomP = (k, n) => { const c = (n, r) => { let x = 1; for (let i = 1; i <= r; i++) x = x * (n - r + i) / i; return x; }; const pk = (i) => c(n, i) / 2 ** n; const o = pk(k); let t = 0; for (let i = 0; i <= n; i++) if (pk(i) <= o + 1e-12) t += pk(i); return Math.min(1, t); };
const yuzde = (x) => `%${(x * 100).toFixed(1).replace('.', ',')}`;

const modeller = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--set');
if (!modeller.length) { console.error('Kullanım: node hakem-esli.mjs [--set 2] [--once] <model|sakli> [...]'); process.exit(2); }
const key = anahtar();
if (!key) { console.error('OPENAI_API_KEY bulunamadı.'); process.exit(3); }
const set = JSON.parse(readFileSync(SET, 'utf8'));
const cevap = JSON.parse(readFileSync(CEVAP, 'utf8'));
const insanOf = Object.fromEntries(cevap.anahtar.map((x) => [x.id, x.insan]));
cevap.hakem ||= {};
// --once: beceri tarafına döngü öncesi taslak konur (insan tarafı ve a/b yeri aynı kalır).
if (once) {
  const taslakOf = Object.fromEntries(cevap.anahtar.map((x) => [x.id, x.taslak]));
  set.ogeler = set.ogeler.map((o) => (insanOf[o.id] === 'a' ? { ...o, b: taslakOf[o.id] } : { ...o, a: taslakOf[o.id] }));
}

for (const ad of modeller) {
  const sakli = ad === 'sakli';
  const model = sakli ? SAKLI_MODEL : ad;
  const isler = set.ogeler.flatMap((o) => [{ o, sira: 'a-b' }, { o, sira: 'b-a' }]);
  const kayit = await Promise.all(isler.map(async ({ o, sira }) => {
    const [A, B] = sira === 'a-b' ? [o.a, o.b] : [o.b, o.a];
    const c = await sor(key, model, (sakli ? SAKLI_ISTEM : ISTEM)(A, B));
    const secim = String(sakli ? c.yayimlanmis : c.insan).trim().toUpperCase();
    const secilen = secim === 'A' ? sira[0] : sira[2]; // hangi set harfi ("a"/"b") insan seçildi
    return { id: o.id, tur: o.tur, sira, secim, secilen, dogru: secilen === insanOf[o.id], emin: c.emin, gerekce: c.gerekce };
  }));
  const k = kayit.filter((x) => x.dogru).length, n = kayit.length;
  const [lo, hi] = wilson(k, n);
  const ciftler = set.ogeler.map((o) => kayit.filter((x) => x.id === o.id).filter((x) => x.dogru).length);
  const turSay = (t) => { const r = kayit.filter((x) => x.tur === t); return `${r.filter((x) => x.dogru).length}/${r.length}`; };
  const ozet = {
    dogru: k, n, oran: +(k / n).toFixed(3), wilson95: [+lo.toFixed(3), +hi.toFixed(3)], binom_p: +binomP(k, n).toFixed(4),
    cift_ikisi_dogru: ciftler.filter((x) => x === 2).length, cift_ikisi_yanlis: ciftler.filter((x) => x === 0).length, cift_tutarsiz: ciftler.filter((x) => x === 1).length,
    A_secimi: kayit.filter((x) => x.secim === 'A').length,
    tur: Object.fromEntries([...new Set(set.ogeler.map((o) => o.tur))].map((t) => [t, turSay(t)])),
    emin_ort: +(kayit.reduce((t, x) => t + (+x.emin || 0), 0) / n).toFixed(1),
  };
  const anahtarAd = `${sakli ? `sakli:${model}` : model}${once ? '@once' : ''}`;
  cevap.hakem[anahtarAd] = { tarih: new Date().toISOString().slice(0, 10), model, istem: sakli ? 'sakli-editor' : 'esli', ozet, kayit };
  console.log(`${anahtarAd}: ${k}/${n} = ${yuzde(k / n)} [${yuzde(lo)}-${yuzde(hi)}], p=${ozet.binom_p}; çift ikisi doğru/ikisi yanlış/tutarsız ${ozet.cift_ikisi_dogru}/${ozet.cift_ikisi_yanlis}/${ozet.cift_tutarsiz}; A seçimi ${ozet.A_secimi}/${n}; tür ${JSON.stringify(ozet.tur)}; emin ort ${ozet.emin_ort}`);
}
writeFileSync(CEVAP, JSON.stringify(cevap, null, 1) + '\n');
