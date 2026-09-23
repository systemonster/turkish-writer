#!/usr/bin/env node
// tr-scan eşik kalibrasyonu: LLM öncesi insan metni ile LLM metnini karşılaştırır.
//
//   node tests/kalibrasyon/kalibre.mjs topla            # insan derlemini indir
//   OPENAI_ENV=/yol/.env node tests/kalibrasyon/kalibre.mjs uret   # LLM derlemi
//   node tests/kalibrasyon/kalibre.mjs analiz           # SONUC.md yaz
//
// Anahtar: OPENAI_API_KEY ortam değişkeni ya da OPENAI_ENV (veya --env yol)
// ile gösterilen .env dosyası. Anahtar hiçbir yere yazılmaz.
// Derlem: tests/kalibrasyon/derlem/{insan,llm}/ (yayına girmez, telif).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { olc, denetle } from '../../skills/turkish-writer/scripts/tr-scan.mjs'

const KOK = path.dirname(fileURLToPath(import.meta.url))
const DERLEM = path.join(KOK, 'derlem')
const INSAN = path.join(DERLEM, 'insan')
const LLM = path.join(DERLEM, 'llm')
const META = path.join(DERLEM, 'meta.json')
const TUR_SAYI = 50 // her türden (haber, serbest) insan metni
const MODELLER = ['gpt-4o', 'gpt-4o-mini']

const bekle = (ms) => new Promise((r) => setTimeout(r, ms))
async function getir(url, secenek = {}) {
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(url, { ...secenek, signal: AbortSignal.timeout(120000) })
      if (r.status === 429 || r.status >= 500) throw new Error('HTTP ' + r.status)
      return r
    } catch (e) {
      console.error(`  yeniden deneme ${i + 1}: ${e.cause?.code || e.message}`)
      await bekle(3000 * (i + 1))
    }
  }
  throw new Error('istek başarısız: ' + url.split('?')[0])
}

// Tohumlu karıştırma: aynı derlem tekrar üretilebilsin
function karistir(dizi, tohum = 42) {
  const a = [...dizi]
  let s = tohum
  const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const kelimeSay = (t) => (t.match(/\p{L}+/gu) || []).length
const cumleSay = (t) => (t.match(/[.!?…](\s|$)/g) || []).length

// ---------------------------------------------------------------------------
// 1. İnsan derlemi
// ---------------------------------------------------------------------------

async function haberTopla() {
  // batubayk/TR-News, test bölümü: AA, NTV, Cumhuriyet, Habertürk haberleri (2009-2020)
  const ds = 'https://datasets-server.huggingface.co/rows?dataset=batubayk/TR-News&config=default&split=test'
  const havuz = []
  for (let off = 0; off < 15000; off += 1500) {
    const j = await (await getir(`${ds}&offset=${off}&length=100`)).json()
    for (const { row } of j.rows) {
      const yil = Number((row.date || '').match(/(19|20)\d\d/)?.[0])
      const metin = (row.content || '').replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').trim()
      const n = kelimeSay(metin)
      if (!yil || yil >= 2022 || n < 120 || n > 500 || cumleSay(metin) < 5) continue
      havuz.push({ tur: 'haber', metin, konu: row.title?.trim(), yil, kaynak: row.source || 'bilinmiyor', url: row.url, veriSeti: 'batubayk/TR-News (test)' })
    }
    console.log(`  TR-News offset ${off}: havuz ${havuz.length}`)
  }
  return karistir(havuz).slice(0, TUR_SAYI)
}

// Serbest metin: OSCAR 2019 (Common Crawl, Kasım 2018 taraması) içinden birinci
// tekil şahısla yazılmış, noktalamalı, listesiz düzyazı (blog/yorum/kişisel yazı).
const ZAMIR = /(?<!\p{L})(ben|bence|benim|bana|beni|bende|benden|kendimce|kendime)(?!\p{L})/giu
const BIRINCI_EK = /\p{L}{2,}(ıyorum|iyorum|uyorum|üyorum|yorum|dım|dim|dum|düm|tım|tum|tüm|mıştım|miştim|acağım|eceğim)(?!\p{L})/giu
const EK_DEGIL = /^(eğitim|yardım|bütün|tüm|kadim|tadım|adım|zulüm|ölüm|bölüm|düzüm|üzüm|yorum|devrim|verim|seçim|biçim|birim|görüm|kurum|durum|konum|tutum|sonum|umum|mutum)$/iu
async function serbestTopla() {
  const url = 'https://huggingface.co/datasets/turkish-nlp-suite/temiz-OSCAR/resolve/main/data/train/oscar2019.jsonl'
  const havuz = []
  const gorulen = new Set()
  for (let bas = 0; bas < 60e6 && havuz.length < TUR_SAYI * 4; bas += 20e6) {
    const t = await (await getir(url, { headers: { Range: `bytes=${bas}-${bas + 20e6}` } })).text()
    for (const satir of t.split('\n').slice(1, -1)) {
      let metin
      try { metin = JSON.parse(satir).text.trim() } catch { continue }
      const n = kelimeSay(metin)
      if (n < 120 || n > 500 || cumleSay(metin) < 6) continue
      const zamir = (metin.match(ZAMIR) || []).length
      const ek = (metin.match(BIRINCI_EK) || []).filter((w) => !EK_DEGIL.test(w)).length
      if (zamir < 2 || zamir + ek < 6) continue // kişisel ses yoksa büyük olasılıkla SEO/haber/tanıtım
      if (/\p{Lu}{4,}\s+\p{Lu}{4,}/u.test(metin)) continue // büyük harfli bağırma/başlık
      if (/(https?:|www\.|©|₺|TL\b|\bfiyat|indirim|sipariş|kargo|casino|bahis|\|)/i.test(metin)) continue
      if ((metin.match(/\d/g) || []).length / metin.length > 0.03) continue
      const anahtar = metin.slice(0, 80)
      if (gorulen.has(anahtar)) continue
      gorulen.add(anahtar)
      const ilk = (metin.split(/(?<=[.!?…])\s+/)[0] || '').split(/\s+/).slice(0, 25).join(' ')
      havuz.push({ tur: 'serbest', metin, konu: ilk, yil: 2018, kaynak: 'Common Crawl (OSCAR 2019)', url: null, veriSeti: 'turkish-nlp-suite/temiz-OSCAR (oscar-2019)' })
    }
    console.log(`  OSCAR bayt ${bas}: havuz ${havuz.length}`)
  }
  return karistir(havuz, 7).slice(0, TUR_SAYI)
}

async function topla() {
  fs.mkdirSync(INSAN, { recursive: true })
  const haber = await haberTopla()
  const serbest = await serbestTopla()
  const meta = []
  for (const [on, liste] of [['h', haber], ['s', serbest]]) {
    liste.forEach((d, i) => {
      const id = `${on}${String(i + 1).padStart(3, '0')}`
      fs.writeFileSync(path.join(INSAN, id + '.txt'), d.metin + '\n')
      const { metin, ...geri } = d
      meta.push({ id, kelime: kelimeSay(metin), ...geri })
    })
  }
  fs.writeFileSync(META, JSON.stringify(meta, null, 2))
  console.log(`insan: ${haber.length} haber + ${serbest.length} serbest`)
}

// ---------------------------------------------------------------------------
// 2. LLM derlemi
// ---------------------------------------------------------------------------

function anahtarOku() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY
  const i = process.argv.indexOf('--env')
  const yol = i > 0 ? process.argv[i + 1] : process.env.OPENAI_ENV
  if (!yol) throw new Error('OPENAI_API_KEY ya da OPENAI_ENV / --env <yol> gerekli')
  const m = fs.readFileSync(yol, 'utf8').match(/^\s*OPENAI_API_KEY\s*=\s*["']?([^"'\r\n]+)/m)
  if (!m) throw new Error('.env içinde OPENAI_API_KEY yok')
  return m[1].trim()
}

async function uret() {
  const anahtar = anahtarOku()
  const meta = JSON.parse(fs.readFileSync(META, 'utf8'))
  fs.mkdirSync(LLM, { recursive: true })
  // Her türün içinde modeller sırayla değişir: yarı gpt-4o, yarı gpt-4o-mini
  const isler = meta.map((m) => {
    const sira = Number(m.id.slice(1))
    const model = MODELLER[sira % 2]
    const tur = m.tur === 'haber' ? 'haber' : 'yazı'
    const n = Math.round(m.kelime / 10) * 10
    return { m, model, istem: `Bu konuda yaklaşık ${n} kelimelik Türkçe bir ${tur} yaz: ${m.konu}` }
  })
  let i = 0
  async function isci() {
    while (i < isler.length) {
      const { m, model, istem } = isler[i++]
      const dosya = path.join(LLM, `${m.id}.txt`)
      if (fs.existsSync(dosya)) continue
      const r = await getir('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${anahtar}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: istem }] }),
      })
      const j = await r.json()
      if (!r.ok) { console.error(`  ${m.id}: ${(j.error?.message || "").replace(/sk-\S+/g, "sk-***")}`); continue }
      fs.writeFileSync(dosya, j.choices[0].message.content.trim() + '\n')
      m.llm = { model: j.model, istem }
      console.log(`  ${m.id} ${model} tamam`)
    }
  }
  await Promise.all(Array.from({ length: 5 }, isci))
  // Modeli meta'ya işle (yeniden çalıştırmada eski kayıtlar korunur)
  const eski = Object.fromEntries(meta.map((m) => [m.id, m]))
  for (const is of isler) eski[is.m.id].llm ??= { model: is.model, istem: is.istem }
  fs.writeFileSync(META, JSON.stringify(Object.values(eski), null, 2))
}

// ---------------------------------------------------------------------------
// 3. Analiz
// ---------------------------------------------------------------------------

const OLCUMLER = ['bir100', 've100', 'ulac', 'ulacCumle', 'maktadir', 'maktadir100', 'dirOran', 'hafifFiil200',
  'edilgen', 'edilgen100', 'gecis100', 'heceOrt', 'cumleOrt', 'cumleSapma', 'cumleCV', 'uzunCumle', 'uzunCumleOran', 'kelime', 'skor']

function ozellik(metin) {
  const d = denetle(metin)
  const o = d.olcum
  const n = o.kelime || 1
  return {
    ...o,
    maktadir100: (o.maktadir / n) * 100,
    edilgen100: (o.edilgen / n) * 100,
    uzunCumleOran: o.cumle ? o.uzunCumle / o.cumle : 0,
    skor: d.skor,
    bulgu: d.bulgular.filter((b) => !b.tur.startsWith('tdk-')).map((b) => b.tur),
  }
}

function yuzdelik(dizi, p) {
  const a = [...dizi].sort((x, y) => x - y)
  const k = (a.length - 1) * p
  const f = Math.floor(k)
  return a[f] + (a[Math.min(f + 1, a.length - 1)] - a[f]) * (k - f)
}

// AUC = P(LLM > insan) + 0,5·P(eşit); Mann-Whitney U / (n1·n2)
function auc(insan, llm) {
  let u = 0
  for (const l of llm) for (const h of insan) u += l > h ? 1 : l === h ? 0.5 : 0
  return u / (insan.length * llm.length)
}

// Youden J = duyarlılık + özgüllük − 1; yon=+1: LLM ≥ eşik, yon=−1: LLM ≤ eşik
function youden(insan, llm, yon) {
  const adaylar = [...new Set([...insan, ...llm])].sort((a, b) => a - b)
  let en = { j: -1, esik: null, duy: 0, ozg: 0 }
  for (const t of adaylar) {
    const duy = llm.filter((x) => (yon > 0 ? x >= t : x <= t)).length / llm.length
    const ozg = insan.filter((x) => (yon > 0 ? x < t : x > t)).length / insan.length
    if (duy + ozg - 1 > en.j) en = { j: duy + ozg - 1, esik: t, duy, ozg }
  }
  return en
}

const oku = (dizin) => Object.fromEntries(fs.readdirSync(dizin).filter((f) => f.endsWith('.txt')).map((f) => [f.slice(0, -4), fs.readFileSync(path.join(dizin, f), 'utf8')]))
const f2 = (x) => (Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(2)).replace('.', ',')

function analiz() {
  const meta = Object.fromEntries(JSON.parse(fs.readFileSync(META, 'utf8')).map((m) => [m.id, m]))
  const insanM = oku(INSAN)
  const llmM = oku(LLM)
  const ortak = Object.keys(insanM).filter((id) => llmM[id])
  const I = ortak.map((id) => ({ id, tur: meta[id].tur, ...ozellik(insanM[id]) }))
  const L = ortak.map((id) => ({ id, tur: meta[id].tur, model: meta[id].llm?.model || '?', ...ozellik(llmM[id]) }))

  const satirlar = []
  const detay = {}
  for (const k of OLCUMLER) {
    const a = I.map((x) => x[k])
    const b = L.map((x) => x[k])
    const A = auc(a, b)
    const guc = Math.max(A, 1 - A)
    const yon = A >= 0.5 ? 1 : -1
    const y = youden(a, b, yon)
    const alt = (tur) => auc(I.filter((x) => x.tur === tur).map((x) => x[k]), L.filter((x) => x.tur === tur).map((x) => x[k]))
    const model = (m) => auc(a, L.filter((x) => x.model.startsWith(m) && (m !== 'gpt-4o' || !x.model.includes('mini'))).map((x) => x[k]))
    detay[k] = { A, guc, haber: alt('haber'), serbest: alt('serbest'), g4o: model('gpt-4o'), mini: model('gpt-4o-mini') }
    const karar = k === 'kelime' ? 'kontrol' : guc > 0.65 ? 'tut' : guc < 0.6 ? 'çıkar (ayırt etmiyor)' : 'yalnız bilgi'
    satirlar.push({ k, a, b, A, guc, yon, y, karar })
  }

  const md = []
  md.push('# tr-scan kalibrasyonu: insan (LLM öncesi) ve LLM Türkçesi', '')
  md.push(`Tarih: ${new Date().toISOString().slice(0, 10)}. Betik: \`tests/kalibrasyon/kalibre.mjs\`. Tarayıcı dosyası değiştirilmedi.`, '')
  md.push(`Örneklem: ${I.length} insan metni (${I.filter((x) => x.tur === 'haber').length} haber, ${I.filter((x) => x.tur === 'serbest').length} serbest), ${L.length} LLM metni (${L.filter((x) => !x.model.includes('mini')).length} gpt-4o, ${L.filter((x) => x.model.includes('mini')).length} gpt-4o-mini). Her LLM metni bir insan metniyle eşli (aynı konu, yaklaşık aynı uzunluk).`, '')
  md.push('AUC = P(LLM değeri > insan değeri). 0,5 ayırt etmiyor; 1 ya da 0 tam ayırıyor. "Güç" = max(AUC, 1−AUC). Eşik Youden J\'yi (duyarlılık + özgüllük − 1) en büyük yapan değerdir; yalnız güç > 0,65 olanlar için önerilir.', '')
  md.push('| ölçüm | insan medyan (IQR) | LLM medyan (IQR) | AUC | güç | önerilen eşik | yön | J (duy./özg.) | karar |')
  md.push('|---|---|---|---|---|---|---|---|---|')
  for (const s of satirlar) {
    const iq = (x) => `${f2(yuzdelik(x, 0.5))} (${f2(yuzdelik(x, 0.25))}–${f2(yuzdelik(x, 0.75))})`
    const oner = s.guc > 0.65 && s.k !== 'kelime'
    const yon = s.yon > 0 ? 'LLM daha yüksek' : 'LLM daha düşük'
    md.push(`| ${s.k} | ${iq(s.a)} | ${iq(s.b)} | ${f2(s.A)} | ${f2(s.guc)} | ${oner ? (s.yon > 0 ? '≥ ' : '≤ ') + f2(s.y.esik) : '–'} | ${yon} | ${oner ? `${f2(s.y.j)} (${f2(s.y.duy)}/${f2(s.y.ozg)})` : '–'} | ${s.karar} |`)
  }
  md.push('', '## Tür ve model kırılımı (AUC)', '')
  md.push('Aynı ölçümün yalnız haber çiftlerinde, yalnız serbest çiftlerde ve model başına (tüm insan metinlerine karşı) AUC\'si. Tür arasında yön değişiyorsa ölçüm türe bağlıdır.', '')
  md.push('| ölçüm | tümü | haber | serbest | gpt-4o | gpt-4o-mini |', '|---|---|---|---|---|---|')
  for (const k of OLCUMLER) { const d = detay[k]; md.push(`| ${k} | ${f2(d.A)} | ${f2(d.haber)} | ${f2(d.serbest)} | ${f2(d.g4o)} | ${f2(d.mini)} |`) }

  // Mevcut eşiklerle bulgu tetiklenme oranı
  const turler = [...new Set([...I, ...L].flatMap((x) => x.bulgu))].sort()
  md.push('', '## Mevcut tarayıcı bulgularının tetiklenme oranı', '', 'Metinlerin yüzde kaçında o bulgu en az bir kez çıktı (mevcut eşiklerle).', '')
  md.push('| bulgu | insan % | LLM % |', '|---|---|---|')
  const oran = (G, t) => Math.round((100 * G.filter((x) => x.bulgu.includes(t)).length) / G.length)
  for (const t of turler) md.push(`| ${t} | ${oran(I, t)} | ${oran(L, t)} |`)

  fs.writeFileSync(path.join(DERLEM, 'sonuc-ham.md'), md.join('\n') + '\n')
  fs.writeFileSync(path.join(DERLEM, 'olcumler.json'), JSON.stringify({ insan: I, llm: L }, null, 1))
  console.log(md.join('\n'))
}

const komut = process.argv[2]
if (komut === 'topla') await topla()
else if (komut === 'uret') await uret()
else if (komut === 'analiz') analiz()
else console.log('kullanım: node kalibre.mjs topla | uret [--env yol] | analiz')
