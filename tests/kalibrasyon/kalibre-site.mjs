#!/usr/bin/env node
// tr-scan bağımsız sınaması: site içeriği ve blog yazısı.
// Önceki kalibrasyon (kalibre.mjs, haber + forum) ile ağırlıklar seçildi;
// bu betik başka bir derlemle, örneklem dışı ölçer.
//
//   node tests/kalibrasyon/kalibre-site.mjs topla   # aday havuzu (derlem-site/aday.json)
//   node tests/kalibrasyon/kalibre-site.mjs yaz     # elle ret (ret.json) sonrası insan/ yaz
//   OPENAI_ENV=/yol/.env node tests/kalibrasyon/kalibre-site.mjs uret
//   node tests/kalibrasyon/kalibre-site.mjs analiz   # derlem-site/sonuc-ham.md
//   node tests/kalibrasyon/kalibre-site.mjs simule   # öneri varyantları, iki derlemde
//
// Anahtar: OPENAI_API_KEY ortam değişkeni ya da OPENAI_ENV / --env ile gösterilen
// .env dosyası. Anahtar hiçbir yere yazılmaz, loglanmaz.
// Derlem: tests/kalibrasyon/derlem-site/{insan,llm,llm-dogal}/ (yayına girmez).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { denetle } from '../../skills/turkish-writer/scripts/tr-scan.mjs'

const KOK = path.dirname(fileURLToPath(import.meta.url))
const DERLEM = path.join(KOK, 'derlem-site')
const INSAN = path.join(DERLEM, 'insan')
const LLM = path.join(DERLEM, 'llm')
const DOGAL = path.join(DERLEM, 'llm-dogal')
const META = path.join(DERLEM, 'meta.json')
const ESKI_INSAN = path.join(KOK, 'derlem', 'insan')
const TUR_SAYI = 40
const DOGAL_SAYI = 10 // her türden "doğal yaz" istemli LLM metni
const MODELLER = ['gpt-4o', 'gpt-4.1-mini']
const OSCAR = 'https://huggingface.co/datasets/turkish-nlp-suite/temiz-OSCAR/resolve/main/data/train/oscar2019.jsonl'
// Önceki derlem dosyanın ilk 60 MB'ını kullandı; burada dosyanın içine yayılmış
// 20 MB'lık dilimler okunur (dosya ~8,2 GB).
const DILIMLER = [0.3e9, 1.1e9, 1.9e9, 2.7e9, 3.5e9, 4.3e9, 5.1e9, 5.9e9, 6.7e9, 7.5e9]
const DILIM = 20e6

const bekle = (ms) => new Promise((r) => setTimeout(r, ms))
async function getir(url, secenek = {}) {
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(url, { ...secenek, signal: AbortSignal.timeout(180000) })
      if (r.status === 429 || r.status >= 500) throw new Error('HTTP ' + r.status)
      return r
    } catch (e) {
      console.error(`  yeniden deneme ${i + 1}: ${e.cause?.code || e.message}`)
      await bekle(3000 * (i + 1))
    }
  }
  throw new Error('istek başarısız: ' + url.split('?')[0])
}

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
const say = (t, re) => (t.match(re) || []).length

// ---------------------------------------------------------------------------
// 1. İnsan derlemi
// ---------------------------------------------------------------------------

const SITE_IS = /(hizmetlerimiz|hakkımızda|firmamız|şirketimiz|müşterilerimiz|ürünlerimiz|kurumsal|iletişime geçin|teklif al|uzman kadromuz|ekibimiz|referanslarımız|kaliteli hizmet|müşteri memnuniyeti)/giu
const BLOG_IS = /(nasıl|nedir|ipucu|ipuçları|öneri|dikkat edilmesi|dikkat etmeniz|yapmanız gereken|adım adım|faydaları|yöntem|tavsiye|deneyim)/giu
const HITAP = /(?<!\p{L})(siz|sizin|sizler|size|sizi)(?!\p{L})|\p{L}+(abilirsiniz|ebilirsiniz|malısınız|melisiniz|ıyorsanız|iyorsanız|uyorsanız|üyorsanız)(?!\p{L})/giu
const BIRINCI = /(?<!\p{L})(ben|bence|benim|bana|beni)(?!\p{L})|\p{L}{2,}(ıyorum|iyorum|uyorum|üyorum)(?!\p{L})/giu
const HABER = /(dedi\.|açıkladı|muhabir|\bAA\b|İHA|DHA|gözaltına|ifade etti|kaydetti\.|belirtti\.|haberi|Valiliği|Emniyet Müdürlüğü)/gu
const FORUM = /(Alıntı|Cevapla|Yanıtla|mesaj(ı|lar)|konuyu|Üye|forum|yorum yap|Reply)/giu
// Kelime sınırlı: "büyü" "büyük"ü, "seks" "seksen"i yakalamasın
const YASAK = /(?<!\p{L})(casino|bahis|iddaa|kumar|porno|seks|seksi|sex|sexy|escort|eskort|viagra|jigolo|hack|apk|film izle|dizi izle|büyü|büyücü|büyüsü|medyum)(?!\p{L})|\+18/iu
const TR_HARF = /[çğıöşüÇĞİÖŞÜ]/u

function kalite(metin, n) {
  const kel = metin.match(/\p{L}+/gu) || []
  if (kel.filter((w) => TR_HARF.test(w)).length / n < 0.25) return 'ascii'
  const c = cumleSay(metin)
  if (c < 5) return 'az-cumle/noktalamasiz'
  if (n / c > 40) return 'az-cumle/noktalamasiz'
  // Anahtar kelime doldurma: tekrarlanan üçlüler ya da düşük kelime çeşitliliği
  const kk = kel.map((w) => w.toLocaleLowerCase('tr'))
  const uc = new Map()
  for (let i = 0; i + 2 < kk.length; i++) { const k = kk.slice(i, i + 3).join(' '); uc.set(k, (uc.get(k) || 0) + 1) }
  if (Math.max(...uc.values()) >= 4) return 'anahtar-kelime-spam'
  if (new Set(kk).size / kk.length < 0.45) return 'anahtar-kelime-spam'
  if ((metin.match(/\d/g) || []).length / metin.length > 0.04) return 'rakam/fiyat'
  if (/https?:|www\.|@\w/.test(metin)) return 'url'
  if (/\p{Lu}{4,}\s+\p{Lu}{4,}\s+\p{Lu}{4,}/u.test(metin)) return 'buyuk-harf'
  return null
}

function eskiAnahtarlar() {
  const s = new Set()
  if (fs.existsSync(ESKI_INSAN)) for (const f of fs.readdirSync(ESKI_INSAN)) s.add(fs.readFileSync(path.join(ESKI_INSAN, f), 'utf8').trim().slice(0, 80))
  return s
}

async function topla() {
  fs.mkdirSync(DERLEM, { recursive: true })
  const eski = eskiAnahtarlar()
  const gorulen = new Set()
  const havuz = { site: [], blog: [] }
  const elenen = { site: {}, blog: {} }
  const say1 = (tur, neden) => (elenen[tur][neden] = (elenen[tur][neden] || 0) + 1)
  for (const bas of DILIMLER) {
    const t = await (await getir(OSCAR, { headers: { Range: `bytes=${bas}-${bas + DILIM}` } })).text()
    for (const satir of t.split('\n').slice(1, -1)) {
      let metin
      try { metin = JSON.parse(satir).text.trim() } catch { continue }
      const n = kelimeSay(metin)
      if (n < 100 || n > 500) continue
      const site = say(metin, SITE_IS)
      const blog = say(metin, BLOG_IS)
      const kisi = say(metin, HITAP) + say(metin, BIRINCI)
      let tur = null
      if (site >= 2) tur = 'site'
      else if (site === 0 && blog >= 2 && kisi >= 3) tur = 'blog'
      if (!tur) continue
      const anahtar = metin.slice(0, 80)
      let neden = null
      if (eski.has(anahtar)) neden = 'onceki-derlem'
      else if (gorulen.has(anahtar)) neden = 'kopya'
      else if (YASAK.test(metin)) neden = 'bahis/yetiskin/korsan/medyum'
      else if (say(metin, HABER) >= 2) neden = 'haber'
      else if (say(metin, FORUM) >= 2) neden = 'forum'
      else if (tur === 'blog' && /(₺|\bTL\b|sipariş|kargo|sepete)/i.test(metin)) neden = 'e-ticaret'
      else neden = kalite(metin, n)
      if (neden) { say1(tur, neden); continue }
      gorulen.add(anahtar)
      havuz[tur].push({ tur, metin, bayt: bas })
    }
    console.log(`  OSCAR bayt ${bas / 1e9} GB: site ${havuz.site.length}, blog ${havuz.blog.length}`)
  }
  const secim = { site: karistir(havuz.site, 11).slice(0, 120), blog: karistir(havuz.blog, 13).slice(0, 120) }
  fs.writeFileSync(path.join(DERLEM, 'aday.json'), JSON.stringify({ havuz: { site: havuz.site.length, blog: havuz.blog.length }, elenen, secim }, null, 1))
  console.log('elenen', JSON.stringify(elenen))
}

// Elle gözden geçirilmiş aday listesinden (aday.json; ret.json = {site:{sıra:neden}, blog:{...}})
// ilk 40'ları insan/ dizinine yazar.
function yaz() {
  const a = JSON.parse(fs.readFileSync(path.join(DERLEM, 'aday.json'), 'utf8'))
  const retYol = path.join(DERLEM, 'ret.json')
  const ret = fs.existsSync(retYol) ? JSON.parse(fs.readFileSync(retYol, 'utf8')) : { site: {}, blog: {} }
  fs.mkdirSync(INSAN, { recursive: true })
  const meta = []
  for (const [on, tur] of [['s', 'site'], ['b', 'blog']]) {
    const liste = a.secim[tur].map((d, i) => ({ ...d, sira: i })).filter((d) => !ret[tur][d.sira]).slice(0, TUR_SAYI)
    if (liste.length < TUR_SAYI) throw new Error(`${tur}: yalnız ${liste.length} metin`)
    liste.forEach((d, i) => {
      const id = `${on}${String(i + 1).padStart(3, '0')}`
      fs.writeFileSync(path.join(INSAN, id + '.txt'), d.metin + '\n')
      meta.push({ id, tur, kelime: kelimeSay(d.metin), yil: 2018, kaynak: 'Common Crawl (OSCAR 2019)', veriSeti: 'turkish-nlp-suite/temiz-OSCAR (oscar-2019)', bayt: d.bayt, adaySira: d.sira })
    })
  }
  fs.writeFileSync(META, JSON.stringify(meta, null, 2))
  console.log('insan yazıldı:', meta.length)
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

const DOGAL_SISTEM = "Türkçe yaz; yapay zekâ gibi değil, Türkçe düşünen bir insan gibi. Klişe, abartı, 'sonuç olarak' kapanışı kullanma. Cümle uzunluklarını çeşitlendir."

async function sohbet(anahtar, model, messages, ekstra = {}) {
  const r = await getir('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${anahtar}` },
    body: JSON.stringify({ model, messages, ...ekstra }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error((j.error?.message || 'HTTP ' + r.status).replace(/sk-[\w-]+/g, 'sk-***'))
  return { metin: j.choices[0].message.content.trim(), model: j.model }
}

// İnsan metninden konu çıkarımı (gpt-4o-mini, sıcaklık 0). İnsan metni istemlere
// kopyalanmaz; yalnız sektör + sayfa türü ya da blog başlığı alınır.
async function konuCikar(anahtar, m, metin) {
  const istem = m.tur === 'site'
    ? `Aşağıdaki Türkçe web sayfası metni bir firmaya ait. Yalnız JSON döndür: {"sektor": "firmanın sektörü, 2-5 kelime, küçük harf", "sayfa": "sayfa türü, şunlardan biri: hakkımızda | hizmetlerimiz | ürün tanıtımı | hizmet tanıtımı"}\n\n${metin.slice(0, 2500)}`
    : `Aşağıdaki Türkçe blog yazısının konusunu bir blog başlığı olarak ver (en çok 12 kelime). Yalnız JSON döndür: {"konu": "..."}\n\n${metin.slice(0, 2500)}`
  const { metin: c } = await sohbet(anahtar, 'gpt-4o-mini', [{ role: 'user', content: istem }], { temperature: 0, response_format: { type: 'json_object' } })
  return JSON.parse(c)
}

async function uret() {
  const anahtar = anahtarOku()
  const meta = JSON.parse(fs.readFileSync(META, 'utf8'))
  fs.mkdirSync(LLM, { recursive: true })
  fs.mkdirSync(DOGAL, { recursive: true })
  for (const m of meta) {
    if (m.konu) continue
    m.konu = await konuCikar(anahtar, m, fs.readFileSync(path.join(INSAN, m.id + '.txt'), 'utf8'))
    console.log(`  konu ${m.id}: ${JSON.stringify(m.konu)}`)
  }
  fs.writeFileSync(META, JSON.stringify(meta, null, 2))
  // Her türde sıra 1..40; son 10'u "doğal yaz" istemi. Modeller sırayla dönüşümlü.
  const isler = meta.map((m) => {
    const sira = Number(m.id.slice(1))
    const dogal = sira > TUR_SAYI - DOGAL_SAYI
    const model = MODELLER[sira % 2]
    const n = Math.round(m.kelime / 10) * 10
    const istem = m.tur === 'site'
      ? `${m.konu.sektor} alanında çalışan bir Türk firması için yaklaşık ${n} kelimelik '${m.konu.sayfa}' sayfası metni yaz.`
      : `Şu konuda yaklaşık ${n} kelimelik Türkçe bir blog yazısı yaz: ${m.konu.konu}`
    return { m, model, dogal, istem }
  })
  let i = 0
  async function isci() {
    while (i < isler.length) {
      const { m, model, dogal, istem } = isler[i++]
      const dosya = path.join(dogal ? DOGAL : LLM, `${m.id}.txt`)
      if (fs.existsSync(dosya)) continue
      const messages = dogal ? [{ role: 'system', content: DOGAL_SISTEM }, { role: 'user', content: istem }] : [{ role: 'user', content: istem }]
      try {
        const r = await sohbet(anahtar, model, messages)
        fs.writeFileSync(dosya, r.metin + '\n')
        m.llm = { model: r.model, istem, dogal, sistem: dogal ? DOGAL_SISTEM : null }
        console.log(`  ${m.id} ${r.model}${dogal ? ' (doğal)' : ''}`)
      } catch (e) { console.error(`  ${m.id}: ${e.message}`) }
    }
  }
  await Promise.all(Array.from({ length: 5 }, isci))
  fs.writeFileSync(META, JSON.stringify(meta, null, 2))
}

// ---------------------------------------------------------------------------
// 3. Analiz
// ---------------------------------------------------------------------------

const OLCUMLER = ['cumleCV', 'cumleSapma', 'cumleOrt', 'uzunCumle', 'bir100', 've100', 'heceOrt', 'hafifFiil200', 'gecis100', 'ulacCumle', 'maktadir', 'dirOran', 'edilgen', 'kelime', 'skor']
const KURALLAR = ['kesik-yigin', 'hype', 'bos-vurgu', 'giris-klisesi', 'kapanis-klisesi', 'olumsuz-kosutluk', 'yalanci-aralik', 'kosac-kacisi', 'retorik-soru', 'anons', 'anons-ikinokta', 'burokratik', 'bir-enflasyonu', 've-yogunlugu', 'duz-ritim', 'uzun-cumle-yok']

function ozellik(metin) {
  const d = denetle(metin)
  return { ...d.olcum, skor: d.skor, bulgu: d.bulgular.filter((b) => !b.tur.startsWith('tdk-')).map((b) => b.tur) }
}
function yuzdelik(dizi, p) {
  const a = [...dizi].sort((x, y) => x - y)
  const k = (a.length - 1) * p
  const f = Math.floor(k)
  return a[f] + (a[Math.min(f + 1, a.length - 1)] - a[f]) * (k - f)
}
function auc(insan, llm) {
  if (!insan.length || !llm.length) return NaN
  let u = 0
  for (const l of llm) for (const h of insan) u += l > h ? 1 : l === h ? 0.5 : 0
  return u / (insan.length * llm.length)
}
function bootGA(insan, llm, B = 1000) {
  let s = 7
  const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648)
  const ornek = (a) => a.map(() => a[Math.floor(rnd() * a.length)])
  const d = Array.from({ length: B }, () => auc(ornek(insan), ornek(llm))).sort((a, b) => a - b)
  return [d[Math.floor(B * 0.025)], d[Math.floor(B * 0.975)]]
}
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
const esikte = (insan, llm, t) => ({ duy: llm.filter((x) => x <= t).length / llm.length, ozg: insan.filter((x) => x > t).length / insan.length })

const oku = (dizin) => (fs.existsSync(dizin) ? Object.fromEntries(fs.readdirSync(dizin).filter((f) => f.endsWith('.txt')).map((f) => [f.slice(0, -4), fs.readFileSync(path.join(dizin, f), 'utf8')])) : {})
const f2 = (x) => (Number.isNaN(x) ? '–' : (Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(2)).replace('.', ','))
const yz = (x) => Math.round(100 * x)

function analiz() {
  const meta = Object.fromEntries(JSON.parse(fs.readFileSync(META, 'utf8')).map((m) => [m.id, m]))
  const I = Object.entries(oku(INSAN)).map(([id, t]) => ({ id, tur: meta[id].tur, ...ozellik(t) }))
  const L = Object.entries(oku(LLM)).map(([id, t]) => ({ id, tur: meta[id].tur, model: meta[id].llm?.model || '?', ...ozellik(t) }))
  const D = Object.entries(oku(DOGAL)).map(([id, t]) => ({ id, tur: meta[id].tur, model: meta[id].llm?.model || '?', ...ozellik(t) }))
  const tur = (G, t) => (t ? G.filter((x) => x.tur === t) : G)
  const v = (G, k) => G.map((x) => x[k])
  const md = []
  const p = (...s) => md.push(...s)

  p('# Ham sonuç: site + blog bağımsız sınaması', '', `insan ${I.length} (site ${tur(I, 'site').length}, blog ${tur(I, 'blog').length}); LLM varsayılan ${L.length}; LLM doğal ${D.length}`, '')
  p('## Skor', '', '| grup | n insan | n LLM | insan medyan | LLM medyan | AUC [%95 GA] | ≤72 duy. | ≤72 özg. | Youden eşik | duy./özg. |', '|---|---|---|---|---|---|---|---|---|---|')
  const gruplar = [
    ['site, varsayılan', tur(I, 'site'), tur(L, 'site')], ['blog, varsayılan', tur(I, 'blog'), tur(L, 'blog')], ['tümü, varsayılan', I, L],
    ['site, doğal', tur(I, 'site'), tur(D, 'site')], ['blog, doğal', tur(I, 'blog'), tur(D, 'blog')], ['tümü, doğal', I, D],
    ['tümü, varsayılan + doğal', I, [...L, ...D]],
    ['gpt-4o (varsayılan)', I, L.filter((x) => x.model.startsWith('gpt-4o'))], ['gpt-4.1-mini (varsayılan)', I, L.filter((x) => x.model.startsWith('gpt-4.1'))],
  ]
  for (const [ad, a0, b0] of gruplar) {
    const a = v(a0, 'skor'), b = v(b0, 'skor')
    if (!b.length) continue
    const A = auc(a, b), ga = bootGA(a, b), e = esikte(a, b, 72), y = youden(a, b, -1)
    p(`| ${ad} | ${a.length} | ${b.length} | ${f2(yuzdelik(a, 0.5))} | ${f2(yuzdelik(b, 0.5))} | ${f2(A)} [${f2(ga[0])}–${f2(ga[1])}] | ${f2(e.duy)} | ${f2(e.ozg)} | ≤ ${y.esik} | ${f2(y.duy)}/${f2(y.ozg)} |`)
  }
  p('', '### Skor dağılımı (skoru eşiğin altında kalan metinlerin %)', '', '| skor ≤ | insan site | insan blog | LLM site | LLM blog | doğal site | doğal blog |', '|---|---|---|---|---|---|---|')
  const alti = (G, t) => (G.length ? yz(G.filter((x) => x.skor <= t).length / G.length) : '–')
  for (const t of [50, 60, 65, 72, 75, 80, 85, 90]) p(`| ${t} | ${alti(tur(I, 'site'), t)} | ${alti(tur(I, 'blog'), t)} | ${alti(tur(L, 'site'), t)} | ${alti(tur(L, 'blog'), t)} | ${alti(tur(D, 'site'), t)} | ${alti(tur(D, 'blog'), t)} |`)

  p('', '## Ölçümler (AUC = P(LLM > insan))', '', '| ölçüm | insan site medyan | LLM site medyan | insan blog medyan | LLM blog medyan | AUC site | AUC blog | AUC doğal (tümü) | Youden eşik (varsayılan, tümü) | duy./özg. |', '|---|---|---|---|---|---|---|---|---|---|')
  for (const k of OLCUMLER) {
    const A = auc(v(I, k), v(L, k))
    const y = youden(v(I, k), v(L, k), A >= 0.5 ? 1 : -1)
    const med = (G) => f2(yuzdelik(v(G, k), 0.5))
    p(`| ${k} | ${med(tur(I, 'site'))} | ${med(tur(L, 'site'))} | ${med(tur(I, 'blog'))} | ${med(tur(L, 'blog'))} | ${f2(auc(v(tur(I, 'site'), k), v(tur(L, 'site'), k)))} | ${f2(auc(v(tur(I, 'blog'), k), v(tur(L, 'blog'), k)))} | ${f2(auc(v(I, k), v(D, k)))} | ${A >= 0.5 ? '≥' : '≤'} ${f2(y.esik)} | ${f2(y.duy)}/${f2(y.ozg)} |`)
  }
  const cv = (G) => (G.length ? yz(G.filter((x) => x.bulgu.includes('duz-ritim')).length / G.length) : '–')
  p('', `duz-ritim (cumleCV < 0,37): insan site ${cv(tur(I, 'site'))}%, insan blog ${cv(tur(I, 'blog'))}%, LLM site ${cv(tur(L, 'site'))}%, LLM blog ${cv(tur(L, 'blog'))}%, doğal site ${cv(tur(D, 'site'))}%, doğal blog ${cv(tur(D, 'blog'))}%`)
  for (const t of ['site', 'blog']) {
    const y = youden(v(tur(I, t), 'cumleCV'), v(tur(L, t), 'cumleCV'), -1)
    p(`cumleCV Youden (${t}, varsayılan): ≤ ${f2(y.esik)}, duy./özg. ${f2(y.duy)}/${f2(y.ozg)}`)
  }

  const oran = (G, t) => (G.length ? yz(G.filter((x) => x.bulgu.includes(t)).length / G.length) : '–')
  const tumTur = [...new Set([...KURALLAR, ...[...I, ...L, ...D].flatMap((x) => x.bulgu)])]
  p('', '## Bulgu tetiklenme oranı (metinlerin %)', '', '| bulgu | insan site | LLM site | doğal site | insan blog | LLM blog | doğal blog |', '|---|---|---|---|---|---|---|')
  for (const t of tumTur) p(`| ${t} | ${oran(tur(I, 'site'), t)} | ${oran(tur(L, 'site'), t)} | ${oran(tur(D, 'site'), t)} | ${oran(tur(I, 'blog'), t)} | ${oran(tur(L, 'blog'), t)} | ${oran(tur(D, 'blog'), t)} |`)

  // İnsan metninde skoru kim düşürüyor: bulgu türü başına toplam bulgu adedi
  const adet = (G, t) => G.reduce((s, x) => s + x.bulgu.filter((b) => b === t).length, 0)
  p('', '## Bulgu adedi (toplam, insan site / LLM site / insan blog / LLM blog)', '', '| bulgu | insan site | LLM site | insan blog | LLM blog |', '|---|---|---|---|---|')
  for (const t of tumTur) p(`| ${t} | ${adet(tur(I, 'site'), t)} | ${adet(tur(L, 'site'), t)} | ${adet(tur(I, 'blog'), t)} | ${adet(tur(L, 'blog'), t)} |`)

  fs.writeFileSync(path.join(DERLEM, 'sonuc-ham.md'), md.join('\n') + '\n')
  fs.writeFileSync(path.join(DERLEM, 'olcumler.json'), JSON.stringify({ insan: I, llm: L, dogal: D }, null, 1))
  console.log(md.join('\n'))
}

// ---------------------------------------------------------------------------
// 4. Öneri simülasyonu: tarayıcıyı değiştirmeden, bulgu listesi ve ölçümler
// üzerinden skoru farklı ağırlık/eşiklerle yeniden hesaplar. İki derlemde
// birden (eski: haber + serbest; yeni: site + blog + doğal) ölçer ki öneri tek
// derleme uydurulmuş olmasın.
// ---------------------------------------------------------------------------

function agirliklariOku() {
  const src = fs.readFileSync(path.join(KOK, '../../skills/turkish-writer/scripts/tr-scan.mjs'), 'utf8')
  const govde = src.match(/const AGIRLIK = (\{[\s\S]*?\n\})/)[1].replace(/\/\/.*$/gm, '')
  return new Function(`return ${govde}`)()
}
const OLCUM_KURAL = new Set(['duz-ritim', 've-yogunlugu', 'bir-enflasyonu', 'hafif-fiil', 'uzun-cumle-yok'])

function varyantSkor(x, W, V) {
  if (!x.kelime) return 100
  let d = 0
  for (const t of x.bulgu) if (!OLCUM_KURAL.has(t)) d += V.w?.[t] ?? W[t] ?? 1
  if (x.kelime >= 60) {
    const w = (t) => V.w?.[t] ?? W[t]
    if (x.cumle >= 6) d += V.ritim ? V.ritim(x.cumleCV) : x.cumleCV < 0.37 ? w('duz-ritim') : 0
    if (x.cumle >= 8 && x.uzunCumle === 0) d += w('uzun-cumle-yok')
    if (x.ve100 > (V.ve ?? 2.7)) d += w('ve-yogunlugu')
    if (x.bir100 > 2.75) d += w('bir-enflasyonu')
    if (x.hafifFiil200 > 1) d += w('hafif-fiil')
  }
  return Math.max(0, Math.round(100 - d))
}

const VARYANTLAR = [
  ['V0 mevcut', {}],
  ['V1 bir-enflasyonu, giris-klisesi, hafif-fiil → 0', { w: { 'bir-enflasyonu': 0, 'giris-klisesi': 0, 'hafif-fiil': 0 } }],
  ['V2 V1 + duz-ritim kademeli (CV<0,30: 20; 0,30–0,37: 8)', { w: { 'bir-enflasyonu': 0, 'giris-klisesi': 0, 'hafif-fiil': 0 }, ritim: (cv) => (cv < 0.3 ? 20 : cv < 0.37 ? 8 : 0) }],
  ['V3 V2 + ve-yogunlugu 6 → 3', { w: { 'bir-enflasyonu': 0, 'giris-klisesi': 0, 'hafif-fiil': 0, 've-yogunlugu': 3 }, ritim: (cv) => (cv < 0.3 ? 20 : cv < 0.37 ? 8 : 0) }],
  ['V4 V3 + yalanci-aralik 1 → 3, uzun-cumle-yok 6 → 8', { w: { 'bir-enflasyonu': 0, 'giris-klisesi': 0, 'hafif-fiil': 0, 've-yogunlugu': 3, 'yalanci-aralik': 3, 'uzun-cumle-yok': 8 }, ritim: (cv) => (cv < 0.3 ? 20 : cv < 0.37 ? 8 : 0) }],
]

function simule() {
  const W = agirliklariOku()
  const yukle = (kok, metaYol, dizinler) => {
    const meta = Object.fromEntries(JSON.parse(fs.readFileSync(metaYol, 'utf8')).map((m) => [m.id, m]))
    return dizinler.map((d) => Object.entries(oku(path.join(kok, d))).map(([id, t]) => ({ id, tur: meta[id].tur, ...ozellik(t) })))
  }
  const [eI, eL] = yukle(path.join(KOK, 'derlem'), path.join(KOK, 'derlem', 'meta.json'), ['insan', 'llm'])
  const [yI, yL, yD] = yukle(DERLEM, META, ['insan', 'llm', 'llm-dogal'])
  // Sağlama: V0 tarayıcının kendi skorunu vermeli
  const hata = [...eI, ...eL, ...yI, ...yL, ...yD].filter((x) => varyantSkor(x, W, {}) !== x.skor).length
  const tur = (G, t) => G.filter((x) => x.tur === t)
  const kume = [
    ['eski: haber', tur(eI, 'haber'), tur(eL, 'haber')], ['eski: serbest', tur(eI, 'serbest'), tur(eL, 'serbest')], ['eski: tümü', eI, eL],
    ['yeni: site', tur(yI, 'site'), tur(yL, 'site')], ['yeni: blog', tur(yI, 'blog'), tur(yL, 'blog')], ['yeni: doğal', yI, yD], ['yeni: tümü (varsayılan + doğal)', yI, [...yL, ...yD]],
  ]
  const md = ['# Öneri simülasyonu', '', `Sağlama: V0 ile tarayıcı skoru arasında uyuşmayan metin sayısı: ${hata}.`, '']
  for (const [ad, V] of VARYANTLAR) {
    md.push(`## ${ad}`, '', '| küme | AUC | ≤72 duy./özg. | ≤76 | ≤80 | Youden eşik | duy./özg. |', '|---|---|---|---|---|---|---|')
    for (const [k, a0, b0] of kume) {
      const a = a0.map((x) => varyantSkor(x, W, V)), b = b0.map((x) => varyantSkor(x, W, V))
      const e = esikte(a, b, 72), y = youden(a, b, -1)
      md.push(`| ${k} | ${f2(auc(a, b))} | ${f2(e.duy)}/${f2(e.ozg)} | ${[76, 80].map((t) => esikte(a, b, t)).map((q) => f2(q.duy) + "/" + f2(q.ozg)).join(" | ")} | ≤ ${y.esik} | ${f2(y.duy)}/${f2(y.ozg)} |`)
    }
    md.push('')
  }
  fs.writeFileSync(path.join(DERLEM, 'simulasyon.md'), md.join('\n') + '\n')
  console.log(md.join('\n'))
}

const komut = process.argv[2]
if (komut === 'simule') simule()
else if (komut === 'topla') await topla()
else if (komut === 'yaz') yaz()
else if (komut === 'uret') await uret()
else if (komut === 'analiz') analiz()
else console.log('kullanım: node kalibre-site.mjs topla | yaz | uret [--env yol] | analiz | simule')
