#!/usr/bin/env node
// Tek metin hakeminin kalibrasyonu (hakem-dongusu.mjs). Döngü hakemi (gpt-6-sol) ve saklı hakem
// (gpt-6-astra, editör istemi) nitelikli insan derleminde ve beceri çıktılarında çalışır.
// Eşik: insan metinlerinin en fazla %10'u "yapay" (p > eşik) çıkacak en küçük değer.
// Ham sonuç git dışı: derlem-nitelikli/hakem.json (önbellek; yeniden çalıştırma yalnız eksikleri sorar).
// Kullanım (lovefengis klasöründen, anahtar .env'de):
//   node <turkish-writer>/tests/kalibrasyon/kalibre-hakem.mjs          # ölç + tablo
//   node <turkish-writer>/tests/kalibrasyon/kalibre-hakem.mjs tablo    # yalnız tablo
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { anahtar } from '../../skills/turkish-writer/scripts/openai-taslak.mjs';
import { HAKEM_MODEL, SAKLI_MODEL, hakemSor, sakliSor, tokenSayaci } from '../../skills/turkish-writer/scripts/hakem-dongusu.mjs';

const K = dirname(fileURLToPath(import.meta.url));
const DN = join(K, 'derlem-nitelikli');
const CIKTI = join(DN, 'hakem.json');
const temiz = (s) => s.replace(/\r\n/g, '\n').split('\n').filter((l) => !l.startsWith('## ')).join('\n').replace(/\n{3,}/g, '\n\n').trim();

function ornekler() {
  const meta = Object.fromEntries(JSON.parse(readFileSync(join(DN, 'meta.json'), 'utf8')).map((m) => [m.id, m]));
  const dosyalar = (d) => readdirSync(join(DN, d)).filter((f) => f.endsWith('.txt'));
  const o = [
    ...dosyalar('insan').map((f) => ({ id: `insan/${f}`, sinif: 'insan', grup: 'derlem-tam', tur: meta[f.slice(0, -4)]?.tur, metin: temiz(readFileSync(join(DN, 'insan', f), 'utf8')) })),
  ];
  // beceri-once: eski istemle üretilmiş çıktılar; beceri: yeni istem (diğer ajan üretiyorsa, o an ne varsa)
  for (const [d, grup] of [['beceri-once', 'derlem-tam'], ['beceri', 'derlem-yeni']]) {
    if (!existsSync(join(DN, d))) continue;
    for (const f of dosyalar(d)) o.push({ id: `${d}/${f}`, sinif: 'beceri', grup, tur: meta[f.slice(0, -4)]?.tur, metin: temiz(readFileSync(join(DN, d, f), 'utf8')) });
  }
  const set = join(K, 'kor-test', 'set-1.json'), cevap = join(K, 'kor-test', 'cevap-anahtari-1.json');
  if (existsSync(set) && existsSync(cevap)) {
    const insanOf = Object.fromEntries(JSON.parse(readFileSync(cevap, 'utf8')).anahtar.map((x) => [x.id, x.insan]));
    for (const x of JSON.parse(readFileSync(set, 'utf8')).ogeler) {
      const i = insanOf[x.id];
      o.push({ id: `set1/${x.id}/insan`, sinif: 'insan', grup: 'set1-parca', tur: x.tur, metin: x[i] });
      o.push({ id: `set1/${x.id}/beceri`, sinif: 'beceri', grup: 'set1-parca', tur: x.tur, metin: x[i === 'a' ? 'b' : 'a'] });
    }
  }
  return o;
}

async function havuz(isler, n, f) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < isler.length) { const x = isler[i++]; await f(x); } }));
}

// AUC = P(p_beceri > p_insan), eşitlik yarım
const auc = (ins, bec) => { let t = 0; for (const b of bec) for (const h of ins) t += b > h ? 1 : b === h ? 0.5 : 0; return t / (ins.length * bec.length); };

export function esikSec(insanP, oran = 0.10) {
  const aday = [...new Set([0, ...insanP])].sort((a, b) => a - b);
  return aday.find((t) => insanP.filter((p) => p > t).length <= Math.floor(oran * insanP.length));
}

// Satır: [ad, insan grubu, beceri grubu]; insan tarafı yeni istem satırında da derlemin tam metinleridir.
const SATIRLAR = [['hepsi (eski istem)', ['derlem-tam', 'set1-parca'], ['derlem-tam', 'set1-parca']], ['derlem tam metin', ['derlem-tam'], ['derlem-tam']], ['set-1 parçaları', ['set1-parca'], ['set1-parca']], ['derlem, yeni istem', ['derlem-tam'], ['derlem-yeni']]];
function tablo(kayit, anahtarAd) {
  const r = Object.values(kayit).filter((x) => Number.isFinite(x[anahtarAd]));
  const sat = [];
  for (const [grup, gi, gb] of SATIRLAR) {
    const ins = r.filter((x) => x.sinif === 'insan' && gi.includes(x.grup)).map((x) => x[anahtarAd]);
    const bec = r.filter((x) => x.sinif === 'beceri' && gb.includes(x.grup)).map((x) => x[anahtarAd]);
    if (!ins.length || !bec.length) continue;
    sat.push({ grup, n_insan: ins.length, n_beceri: bec.length, auc: +auc(ins, bec).toFixed(3), med_insan: med(ins), med_beceri: med(bec) });
  }
  return sat;
}
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? +((s[(s.length - 1) >> 1] + s[s.length >> 1]) / 2).toFixed(3) : NaN; };

function roc(kayit, anahtarAd, esikler) {
  const r = Object.values(kayit).filter((x) => Number.isFinite(x[anahtarAd]));
  return esikler.map((t) => {
    const s = (sinif, grup) => { const g = r.filter((x) => x.sinif === sinif && (!grup || x.grup === grup)); return [g.filter((x) => x[anahtarAd] > t).length, g.length]; };
    return { esik: t, insan_yapay: s('insan'), beceri_yapay: s('beceri'), insan_tam: s('insan', 'derlem-tam'), beceri_tam: s('beceri', 'derlem-tam'), insan_parca: s('insan', 'set1-parca'), beceri_parca: s('beceri', 'set1-parca'), beceri_yeni: s('beceri', 'derlem-yeni') };
  });
}

async function ana() {
  const kayit = existsSync(CIKTI) ? JSON.parse(readFileSync(CIKTI, 'utf8')) : {};
  if (process.argv[2] !== 'tablo') {
    const key = anahtar();
    if (!key) { console.error('OPENAI_API_KEY yok'); process.exit(3); }
    const sayac = tokenSayaci();
    const o = ornekler();
    let bitti = 0;
    await havuz(o, 6, async (x) => {
      const k = (kayit[x.id] ||= { sinif: x.sinif, grup: x.grup, tur: x.tur, kelime: x.metin.split(/\s+/).length });
      try {
        if (!Number.isFinite(k.p_dongu)) { const h = await hakemSor({ key, metin: x.metin }); Object.assign(k, { p_dongu: h.p, model_dongu: h.model, genel: h.genel, isaret: h.cumleler.length }); }
        if (!Number.isFinite(k.p_sakli)) k.p_sakli = (await sakliSor({ key, metin: x.metin })).p;
      } catch (e) { console.error(x.id, e.message); }
      if (++bitti % 10 === 0) { console.error(`${bitti}/${o.length}`); writeFileSync(CIKTI, JSON.stringify(kayit, null, 1)); }
    });
    kayit._token = sayac;
    writeFileSync(CIKTI, JSON.stringify(kayit, null, 1));
  }
  const kay = Object.fromEntries(Object.entries(kayit).filter(([k]) => !k.startsWith('_')));
  const insanP = (a, grup) => Object.values(kay).filter((x) => x.sinif === 'insan' && (!grup || x.grup === grup) && Number.isFinite(x[a])).map((x) => x[a]);
  const sonuc = {};
  for (const [a, model] of [['p_dongu', HAKEM_MODEL], ['p_sakli', SAKLI_MODEL]]) {
    // Havuz eşiği ve grup başına eşik; kullanılan eşik gruplardan büyüğü (kısa parçada da yanlış "yapay" ≤ %10).
    const esik_havuz = esikSec(insanP(a)), esik_tam = esikSec(insanP(a, 'derlem-tam')), esik_parca = esikSec(insanP(a, 'set1-parca'));
    const esik = Math.max(esik_tam, esik_parca);
    sonuc[a] = { model, esik, esik_havuz, esik_tam, esik_parca, ozet: tablo(kay, a), roc: roc(kay, a, [...new Set([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, esik])].sort()) };
  }
  sonuc._token = kayit._token;
  console.log(JSON.stringify(sonuc, null, 1));
}

if (process.argv[1]?.endsWith('kalibre-hakem.mjs')) await ana();
