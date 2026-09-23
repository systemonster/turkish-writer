#!/usr/bin/env node
// Kör test: turkish-writer becerisi insan yazısından ayırt edilemeyen Türkçe üretiyor mu?
// Kullanım: node tests/kalibrasyon/kalibre-beceri.mjs <adim> [--env <.env yolu>] [--model <ad>]
//   topla   OSCAR'dan aday insan metinleri (önceki derlemlerin bölgeleri hariç)
//   insan   secim.json'daki sıralarla insan/ ve meta.json yaz, konu çıkar (gpt-4o-mini)
//   olc     tr-scan denetle() ile tüm grupları ölç
//   hakem   tekil kör hakem (--model, varsayılan gpt-4o)
//   esli    eşli kör karşılaştırma (insan vs becerili / becerisiz)
//   anlam   GPT özgün vs düzeltilmiş anlam koruma
// Anahtar yalnız OPENAI_API_KEY ortam değişkeninden ya da --env dosyasından okunur; hiçbir yere yazılmaz.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const KOK = path.dirname(fileURLToPath(import.meta.url))
const D = path.join(KOK, 'derlem-beceri')
const META = path.join(D, 'meta.json')
const OSCAR = 'https://huggingface.co/datasets/turkish-nlp-suite/temiz-OSCAR/resolve/main/data/train/oscar2019.jsonl'
// Önceki bölgeler: derlem 0-60 MB; derlem-site 0.3e9+k*0.8e9 (+20 MB); eş dizim 0.1e9+k*0.8e9 (+120 MB).
// Bu test: 0.55e9+k*0.8e9 (+20 MB) -> hiçbirine değmez.
const DILIMLER = Array.from({ length: 10 }, (_, k) => 0.55e9 + k * 0.8e9)
const DILIM = 20e6

const bekle = (ms) => new Promise((r) => setTimeout(r, ms))
async function getir(url, secenek = {}) {
  for (let i = 0; i < 15; i++) {
    try {
      const r = await fetch(url, { ...secenek, signal: AbortSignal.timeout(180000) })
      if (r.status === 429) { // dakikalık jeton sınırı: sunucunun söylediği kadar bekle
        const s = parseFloat(r.headers.get('retry-after') || '') || parseFloat(r.headers.get('x-ratelimit-reset-tokens') || '') || 10
        await bekle(Math.min(60, s + 1) * 1000 + Math.random() * 2000)
        continue
      }
      if (r.status >= 500) throw new Error('HTTP ' + r.status)
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
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}
const kelimeSay = (t) => (t.match(/\p{L}+/gu) || []).length
const cumleSay = (t) => (t.match(/[.!?…](\s|$)/g) || []).length
const say = (t, re) => (t.match(re) || []).length
const okuJ = (p, v) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : v)
const yazJ = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 1))
const okuT = (p) => fs.readFileSync(p, 'utf8').trim()

const SITE_IS = /(hizmetlerimiz|hakkımızda|firmamız|şirketimiz|müşterilerimiz|ürünlerimiz|kurumsal|iletişime geçin|teklif al|uzman kadromuz|ekibimiz|referanslarımız|kaliteli hizmet|müşteri memnuniyeti)/giu
const BLOG_IS = /(nasıl|nedir|ipucu|ipuçları|öneri|dikkat edilmesi|dikkat etmeniz|yapmanız gereken|adım adım|faydaları|yöntem|tavsiye|deneyim)/giu
const HITAP = /(?<!\p{L})(siz|sizin|sizler|size|sizi)(?!\p{L})|\p{L}+(abilirsiniz|ebilirsiniz|malısınız|melisiniz|ıyorsanız|iyorsanız|uyorsanız|üyorsanız)(?!\p{L})/giu
const BIRINCI = /(?<!\p{L})(ben|bence|benim|bana|beni)(?!\p{L})|\p{L}{2,}(ıyorum|iyorum|uyorum|üyorum)(?!\p{L})/giu
const HABER = /(dedi\.|açıkladı|muhabir|\bAA\b|İHA|DHA|gözaltına|ifade etti|kaydetti\.|belirtti\.|haberi|Valiliği|Emniyet Müdürlüğü)/gu
const FORUM = /(Alıntı|Cevapla|Yanıtla|mesaj(ı|lar)|konuyu|Üye|forum|yorum yap|Reply)/giu
const YASAK = /(?<!\p{L})(casino|bahis|iddaa|kumar|porno|seks|seksi|sex|sexy|escort|eskort|viagra|jigolo|hack|apk|film izle|dizi izle|büyü|büyücü|büyüsü|medyum)(?!\p{L})|\+18/iu
const TR_HARF = /[çğıöşüÇĞİÖŞÜ]/u

function kalite(metin, n) {
  const kel = metin.match(/\p{L}+/gu) || []
  if (kel.filter((w) => TR_HARF.test(w)).length / n < 0.25) return 'ascii'
  const c = cumleSay(metin)
  if (c < 5 || n / c > 40) return 'az-cumle/noktalamasiz'
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
  for (const k of ['derlem/insan', 'derlem-site/insan']) {
    const dz = path.join(KOK, k)
    if (fs.existsSync(dz)) for (const f of fs.readdirSync(dz)) s.add(okuT(path.join(dz, f)).slice(0, 80))
  }
  const aday = okuJ(path.join(KOK, 'derlem-site', 'aday.json'), null)
  if (aday) for (const t of ['site', 'blog']) for (const d of aday.secim[t]) s.add(d.metin.slice(0, 80))
  return s
}

async function topla() {
  fs.mkdirSync(D, { recursive: true })
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
      if (n < 100 || n > 400) continue
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
  const secim = { site: karistir(havuz.site, 21).slice(0, 60), blog: karistir(havuz.blog, 23).slice(0, 60) }
  yazJ(path.join(D, 'aday.json'), { dilimler: DILIMLER, dilim: DILIM, havuz: { site: havuz.site.length, blog: havuz.blog.length }, elenen, secim })
  console.log('elenen', JSON.stringify(elenen))
}

// ---------- OpenAI ----------
function anahtarOku() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY
  const i = process.argv.indexOf('--env')
  const yol = i > 0 ? process.argv[i + 1] : process.env.OPENAI_ENV
  if (!yol) throw new Error('OPENAI_API_KEY ya da --env <yol> gerekli')
  const m = fs.readFileSync(yol, 'utf8').match(/^\s*OPENAI_API_KEY\s*=\s*["']?([^"'\r\n]+)/m)
  if (!m) throw new Error('.env içinde OPENAI_API_KEY yok')
  return m[1].trim()
}
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
async function jsonSor(anahtar, model, istem) {
  const ekstra = /^o\d/.test(model) ? { response_format: { type: 'json_object' } } : { temperature: 0, response_format: { type: 'json_object' } }
  for (let i = 0; i < 3; i++) {
    const { metin, model: m } = await sohbet(anahtar, model, [{ role: 'user', content: istem }], ekstra)
    try { return { ...JSON.parse(metin), _model: m } } catch { console.error('  JSON bozuk, yeniden') }
  }
  throw new Error('JSON alınamadı')
}
async function havuzla(isler, n, fn) {
  const kuyruk = [...isler]
  await Promise.all(Array.from({ length: n }, async () => { while (kuyruk.length) await fn(kuyruk.shift()) }))
}

// ---------- insan metinleri + konu ----------
async function insan() {
  const a = okuJ(path.join(D, 'aday.json'))
  const secim = okuJ(path.join(D, 'secim.json')) // { site: [sira...], blog: [sira...] }: elle kalite denetimi sonrası
  const anahtar = anahtarOku()
  fs.mkdirSync(path.join(D, 'insan'), { recursive: true })
  const meta = []
  for (const [on, tur] of [['s', 'site'], ['b', 'blog']]) {
    for (const [i, sira] of secim[tur].entries()) {
      const d = a.secim[tur][sira]
      const id = `${on}${String(i + 1).padStart(2, '0')}`
      fs.writeFileSync(path.join(D, 'insan', id + '.txt'), d.metin + '\n')
      const istem = tur === 'site'
        ? `Aşağıdaki Türkçe web sayfası metni bir firmaya ait. Yalnız JSON döndür: {"sektor": "firmanın sektörü, 2-5 kelime, küçük harf", "sayfa": "sayfa türü, şunlardan biri: ana sayfa | hakkımızda | hizmetlerimiz | ürün tanıtımı | hizmet tanıtımı | sıkça sorulan sorular"}\n\n${d.metin}`
        : `Aşağıdaki Türkçe blog yazısının konusunu bir blog başlığı olarak ver (en çok 12 kelime). Yalnız JSON döndür: {"konu": "..."}\n\n${d.metin}`
      const k = await jsonSor(anahtar, 'gpt-4o-mini', istem)
      delete k._model
      meta.push({ id, tur, kelime: kelimeSay(d.metin), kaynak: 'Common Crawl (OSCAR 2019)', veriSeti: 'turkish-nlp-suite/temiz-OSCAR (oscar-2019)', bayt: d.bayt, adaySira: sira, konu: k })
      console.log(id, JSON.stringify(k))
    }
  }
  yazJ(META, { ...okuJ(META, {}), insan: meta })
}

// ---------- ölçüm ----------
const GRUP_DIZIN = {
  insan: (id) => path.join(D, 'insan', id + '.txt'),
  'claude-becerisiz': (id) => path.join(D, 'claude-becerisiz', id + '.txt'),
  'claude-becerili': (id) => path.join(D, 'claude-becerili', id + '.txt'),
  'gpt-ozgun': (id) => path.join(KOK, 'derlem-site', 'llm', id + '.txt'),
  'gpt-duzeltilmis': (id) => path.join(D, 'gpt-duzeltilmis', id + '.txt'),
}
function ogeler() {
  const m = okuJ(META)
  const liste = []
  for (const g of ['insan', 'claude-becerisiz', 'claude-becerili']) for (const x of m.insan) liste.push({ grup: g, id: x.id, tur: x.tur })
  for (const g of ['gpt-ozgun', 'gpt-duzeltilmis']) for (const x of m.gpt) liste.push({ grup: g, id: x.id, tur: x.tur })
  return liste.map((o) => ({ ...o, metin: okuT(GRUP_DIZIN[o.grup](o.id)) }))
}
// Hakeme giden biçim: OSCAR insan metinleri tek satır, biçimsiz. Biçim ipucu vermesin diye
// bütün gruplar aynı biçime indirilir (markdown işaretleri silinir, satırlar boşlukla birleşir).
const duz = (t) => t.replace(/```[a-z]*\n?/g, '').replace(/\*\*|__|^#+\s*/gm, '').replace(/^\s*[-*]\s+/gm, '').replace(/\s*\n+\s*/g, ' ').replace(/\s{2,}/g, ' ').trim()

async function olc() {
  const { denetle, bant } = await import('../../skills/turkish-writer/scripts/tr-scan.mjs')
  const sonuc = ogeler().map((o) => {
    const d = denetle(o.metin.replace(/\r\n/g, '\n'))
    return { grup: o.grup, id: o.id, tur: o.tur, skor: d.skor, bant: bant(d.skor, d.olcum.kelime), kelime: d.olcum.kelime, tdk: d.bulgular.filter((b) => b.tur.startsWith('tdk-')).map((b) => `${b.tur}: ${b.parca}`), izler: d.bulgular.filter((b) => !b.tur.startsWith('tdk-')).map((b) => b.tur), cumleCV: d.olcum.cumleCV, ve100: d.olcum.ve100, uzunCumle: d.olcum.uzunCumle }
  })
  yazJ(path.join(D, 'olcum-trscan.json'), sonuc)
  console.log('tr-scan:', sonuc.length, 'metin')
}

const HAKEM_ISTEM = (metin) => `Aşağıda bir Türkçe metin var. Kaynağı hakkında sana bilgi verilmiyor. Metni dikkatle oku ve yalnız şu alanları içeren bir JSON nesnesi döndür:
- "insan_olasiligi": 0-100 arası tam sayı; bu metni bir insanın yazmış olma olasılığı (0: kesinlikle yapay zekâ, 100: kesinlikle insan)
- "ceviri_gibi": 1-5 arası tam sayı; metnin İngilizceden çevrilmiş gibi durma derecesi (1: hiç, 5: tamamen)
- "dogallik": 1-5 arası tam sayı; metin kulağa ne kadar doğal Türkçe geliyor (1: hiç, 5: tamamen)
- "hatalar": varsa yazım, dil bilgisi ya da anlam hatalarının kısa listesi (dizi; yoksa boş dizi)
- "gerekce": kararının gerekçesi, tek cümle

METİN:
"""
${metin}
"""`

const ESLI_ISTEM = (a, b) => `Aşağıda aynı konuda yazılmış iki Türkçe metin var. Biri bir insan tarafından, öteki bir yapay zekâ tarafından yazıldı. Hangisini bir insan yazdı? Yalnız şu JSON nesnesini döndür:
{"insan": "A" ya da "B", "emin": 0-100 arası tam sayı (kararından ne kadar eminsin), "gerekce": "tek cümle"}

METİN A:
"""
${a}
"""

METİN B:
"""
${b}
"""`

const ANLAM_ISTEM = (o, d) => `Aşağıda bir Türkçe metnin özgün hâli ile düzeltilmiş (üslubu değiştirilmiş) hâli var. Düzeltmenin anlamı koruyup korumadığını denetle. Yalnız şu JSON nesnesini döndür:
{"dusen_olgular": [özgünde olup düzeltilmişte kaybolan olgu, iddia, sayı, ad ya da koşulların listesi; yoksa boş dizi],
 "eklenen_olgular": [düzeltilmişte olup özgünde dayanağı olmayan yeni olgu, iddia, sayı, ad ya da koşulların listesi; yoksa boş dizi],
 "kesinlik_degisti": [iddianın kesinlik derecesinin değiştiği yerler, ör. "olabilir" -> "olur"; yoksa boş dizi],
 "anlam_degisti": true ya da false (metnin genel anlamı ya da verdiği bilgi değişti mi),
 "aciklama": "tek cümle"}
Yalnız üslup, sözcük seçimi, cümle sırası, biçim (başlık, liste, kalın yazı) ya da "Elbette! İşte..." gibi metne ait olmayan sohbet artıklarının silinmesi olgu kaybı sayılmaz.

ÖZGÜN:
"""
${o}
"""

DÜZELTİLMİŞ:
"""
${d}
"""`

const modelAdi = () => { const i = process.argv.indexOf('--model'); return i > 0 ? process.argv[i + 1] : 'gpt-4o' }
const dosyaAdi = (on, model) => path.join(D, `${on}-${model.replace(/[^\w.-]/g, '_')}.json`)

async function hakem() {
  const model = modelAdi()
  const anahtar = anahtarOku()
  const yol = dosyaAdi('hakem', model)
  const sonuc = okuJ(yol, {})
  const isler = karistir(ogeler(), 101).filter((o) => !sonuc[`${o.grup}/${o.id}`])
  let n = 0
  await havuzla(isler, 2, async (o) => {
    const c = await jsonSor(anahtar, model, HAKEM_ISTEM(duz(o.metin)))
    sonuc[`${o.grup}/${o.id}`] = { grup: o.grup, id: o.id, tur: o.tur, ...c }
    if (++n % 10 === 0) { yazJ(yol, sonuc); console.log(`  ${model}: ${n}/${isler.length}`) }
  })
  yazJ(yol, sonuc)
  console.log(`hakem ${model}: ${Object.keys(sonuc).length} metin`)
}

async function esli() {
  const model = modelAdi()
  const anahtar = anahtarOku()
  const yol = dosyaAdi('esli', model)
  const sonuc = okuJ(yol, {})
  const m = okuJ(META)
  const isler = []
  for (const karsi of ['claude-becerili', 'claude-becerisiz']) for (const x of m.insan) for (const sira of ['insan-once', 'insan-sonra']) isler.push({ karsi, id: x.id, tur: x.tur, sira })
  const bekleyen = karistir(isler, 202).filter((s) => !sonuc[`${s.karsi}/${s.id}/${s.sira}`])
  let n = 0
  await havuzla(bekleyen, 2, async (s) => {
    const h = duz(okuT(GRUP_DIZIN.insan(s.id)))
    const k = duz(okuT(GRUP_DIZIN[s.karsi](s.id)))
    const [a, b] = s.sira === 'insan-once' ? [h, k] : [k, h]
    const c = await jsonSor(anahtar, model, ESLI_ISTEM(a, b))
    const dogru = (s.sira === 'insan-once' ? 'A' : 'B') === String(c.insan).trim().toUpperCase()
    sonuc[`${s.karsi}/${s.id}/${s.sira}`] = { ...s, ...c, dogru }
    if (++n % 10 === 0) { yazJ(yol, sonuc); console.log(`  ${model}: ${n}/${bekleyen.length}`) }
  })
  yazJ(yol, sonuc)
  console.log(`esli ${model}: ${Object.keys(sonuc).length} deneme`)
}

async function anlam() {
  const model = modelAdi()
  const anahtar = anahtarOku()
  const yol = dosyaAdi('anlam', model)
  const sonuc = okuJ(yol, {})
  const m = okuJ(META)
  await havuzla(m.gpt.filter((x) => !sonuc[x.id]), 4, async (x) => {
    const c = await jsonSor(anahtar, model, ANLAM_ISTEM(okuT(GRUP_DIZIN['gpt-ozgun'](x.id)), okuT(GRUP_DIZIN['gpt-duzeltilmis'](x.id))))
    sonuc[x.id] = { id: x.id, tur: x.tur, ...c }
  })
  yazJ(yol, sonuc)
  console.log(`anlam ${model}: ${Object.keys(sonuc).length} çift`)
}

// ---------- istatistik ----------
const ort = (a) => a.reduce((s, x) => s + x, 0) / a.length
const ss = (a) => { const o = ort(a); return Math.sqrt(a.reduce((s, x) => s + (x - o) ** 2, 0) / (a.length - 1)) }
const ceyrek = (a, q) => { const s = [...a].sort((x, y) => x - y); const p = (s.length - 1) * q; const i = Math.floor(p); return s[i] + (s[Math.min(i + 1, s.length - 1)] - s[i]) * (p - i) }
function wilson(k, n, z = 1.96) {
  const p = k / n, d = 1 + z * z / n
  const m = (p + z * z / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d
  return [m - h, m + h]
}
function binomP(k, n) { // iki yönlü kesin binom testi, p0 = 0,5
  const lnC = (n, k) => { let s = 0; for (let i = 1; i <= k; i++) s += Math.log((n - k + i) / i); return s }
  const pk = (i) => Math.exp(lnC(n, i) - n * Math.LN2)
  const p0 = pk(k)
  let t = 0
  for (let i = 0; i <= n; i++) if (pk(i) <= p0 * (1 + 1e-9)) t += pk(i)
  return Math.min(1, t)
}
function sirala(a) { const s = a.map((x, i) => [x, i]).sort((p, q) => p[0] - q[0]); const r = Array(a.length); for (let i = 0; i < s.length;) { let j = i; while (j + 1 < s.length && s[j + 1][0] === s[i][0]) j++; for (let k = i; k <= j; k++) r[s[k][1]] = (i + j) / 2 + 1; i = j + 1 } return r }
function pearson(x, y) { const mx = ort(x), my = ort(y); let a = 0, b = 0, c = 0; for (let i = 0; i < x.length; i++) { a += (x[i] - mx) * (y[i] - my); b += (x[i] - mx) ** 2; c += (y[i] - my) ** 2 } return a / Math.sqrt(b * c) }
const spearman = (x, y) => pearson(sirala(x), sirala(y))
function auc(poz, neg) { let s = 0; for (const p of poz) for (const n of neg) s += p > n ? 1 : p === n ? 0.5 : 0; return s / (poz.length * neg.length) }

function ozet() {
  const tr = okuJ(path.join(D, 'olcum-trscan.json'))
  const modeller = fs.readdirSync(D).filter((f) => f.startsWith('hakem-')).map((f) => f.slice(6, -5))
  const G = ['insan', 'claude-becerisiz', 'claude-becerili', 'gpt-ozgun', 'gpt-duzeltilmis']
  const cikti = { trscan: {}, hakem: {}, esli: {}, anlam: {}, uyum: {} }
  for (const g of G) {
    const r = tr.filter((x) => x.grup === g)
    const sk = r.map((x) => x.skor)
    const bantlar = {}
    for (const x of r) bantlar[x.bant] = (bantlar[x.bant] || 0) + 1
    const tdkS = r.map((x) => x.tdk.length)
    cikti.trscan[g] = { n: r.length, medyan: ceyrek(sk, 0.5), q1: ceyrek(sk, 0.25), q3: ceyrek(sk, 0.75), bantlar, tdkToplam: tdkS.reduce((a, b) => a + b, 0), tdkMetin: tdkS.filter((x) => x > 0).length, tdkOrnek: r.flatMap((x) => x.tdk.map((t) => `${x.id}: ${t}`)) }
  }
  for (const model of modeller) {
    const h = Object.values(okuJ(dosyaAdi('hakem', model)))
    cikti.hakem[model] = {}
    for (const g of G) {
      const r = h.filter((x) => x.grup === g)
      const al = (k) => r.map((x) => Number(x[k]))
      cikti.hakem[model][g] = { n: r.length, insan: [ort(al('insan_olasiligi')), ss(al('insan_olasiligi'))], ceviri: [ort(al('ceviri_gibi')), ss(al('ceviri_gibi'))], dogallik: [ort(al('dogallik')), ss(al('dogallik'))], hataMetin: r.filter((x) => (x.hatalar || []).length).length, insanDedi: r.filter((x) => Number(x.insan_olasiligi) >= 50).length }
    }
    const esle = tr.map((t) => ({ t, k: h.find((x) => x.grup === t.grup && x.id === t.id) })).filter((x) => x.k)
    cikti.uyum[model] = {
      spearman: spearman(esle.map((x) => x.t.skor), esle.map((x) => Number(x.k.insan_olasiligi))),
      aucTrscan: auc(tr.filter((x) => x.grup === 'insan').map((x) => x.skor), tr.filter((x) => x.grup !== 'insan').map((x) => x.skor)),
      aucHakem: auc(h.filter((x) => x.grup === 'insan').map((x) => Number(x.insan_olasiligi)), h.filter((x) => x.grup !== 'insan').map((x) => Number(x.insan_olasiligi))),
      kararUyum: ort(esle.map((x) => ((x.t.skor > 80) === (Number(x.k.insan_olasiligi) >= 50) ? 1 : 0))),
    }
    const ey = dosyaAdi('esli', model)
    if (fs.existsSync(ey)) {
      const e = Object.values(okuJ(ey))
      cikti.esli[model] = {}
      for (const karsi of ['claude-becerisiz', 'claude-becerili']) {
        const r = e.filter((x) => x.karsi === karsi)
        const k = r.filter((x) => x.dogru).length
        const ciftler = [...new Set(r.map((x) => x.id))].map((id) => r.filter((x) => x.id === id))
        const ikisi = ciftler.filter((c) => c.length === 2 && c.every((x) => x.dogru)).length
        const hicbiri = ciftler.filter((c) => c.length === 2 && c.every((x) => !x.dogru)).length
        cikti.esli[model][karsi] = { n: r.length, dogru: k, oran: k / r.length, ci: wilson(k, r.length), p: binomP(k, r.length), ciftN: ciftler.length, ikisiDogru: ikisi, ikisiYanlis: hicbiri, tutarsiz: ciftler.length - ikisi - hicbiri, aSecimi: r.filter((x) => String(x.insan).toUpperCase() === 'A').length, eminOrt: ort(r.map((x) => Number(x.emin))), site: r.filter((x) => x.tur === 'site' && x.dogru).length + '/' + r.filter((x) => x.tur === 'site').length, blog: r.filter((x) => x.tur === 'blog' && x.dogru).length + '/' + r.filter((x) => x.tur === 'blog').length }
      }
    }
    const ay = dosyaAdi('anlam', model)
    if (fs.existsSync(ay)) {
      const a = Object.values(okuJ(ay))
      cikti.anlam[model] = { n: a.length, dusen: a.reduce((s, x) => s + (x.dusen_olgular || []).length, 0), eklenen: a.reduce((s, x) => s + (x.eklenen_olgular || []).length, 0), kesinlik: a.reduce((s, x) => s + (x.kesinlik_degisti || []).length, 0), anlamDegisti: a.filter((x) => x.anlam_degisti === true).length, dusenMetin: a.filter((x) => (x.dusen_olgular || []).length).length, eklenenMetin: a.filter((x) => (x.eklenen_olgular || []).length).length }
    }
  }
  if (modeller.length >= 2) {
    const [m1, m2] = modeller
    const h1 = okuJ(dosyaAdi('hakem', m1)), h2 = okuJ(dosyaAdi('hakem', m2))
    const ortak = Object.keys(h1).filter((k) => h2[k])
    cikti.uyum.hakemler = { modeller: [m1, m2], n: ortak.length, insanSpearman: spearman(ortak.map((k) => Number(h1[k].insan_olasiligi)), ortak.map((k) => Number(h2[k].insan_olasiligi))), dogallikSpearman: spearman(ortak.map((k) => Number(h1[k].dogallik)), ortak.map((k) => Number(h2[k].dogallik))), kararUyum: ort(ortak.map((k) => ((Number(h1[k].insan_olasiligi) >= 50) === (Number(h2[k].insan_olasiligi) >= 50) ? 1 : 0))) }
    const e1p = dosyaAdi('esli', m1), e2p = dosyaAdi('esli', m2)
    if (fs.existsSync(e1p) && fs.existsSync(e2p)) {
      const e1 = okuJ(e1p), e2 = okuJ(e2p)
      const ok = Object.keys(e1).filter((k) => e2[k])
      const a = ok.filter((k) => e1[k].dogru === e2[k].dogru).length
      const p1 = ok.filter((k) => e1[k].dogru).length / ok.length, p2 = ok.filter((k) => e2[k].dogru).length / ok.length
      const pe = p1 * p2 + (1 - p1) * (1 - p2)
      cikti.uyum.esli = { n: ok.length, ayniKarar: a / ok.length, kappa: (a / ok.length - pe) / (1 - pe) }
    }
  }
  yazJ(path.join(D, 'ozet.json'), cikti)
  console.log(JSON.stringify(cikti, (k, v) => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : k === 'tdkOrnek' ? v.slice(0, 40) : v), 1))
}

const adim = process.argv[2]
const ADIMLAR = { topla, insan, olc, hakem, esli, anlam, ozet }
if (!ADIMLAR[adim]) { console.error('adım: ' + Object.keys(ADIMLAR).join(' | ')); process.exit(1) }
await ADIMLAR[adim]()
