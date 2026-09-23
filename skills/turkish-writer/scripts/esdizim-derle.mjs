#!/usr/bin/env node
// Eş dizim verisini derler: LLM öncesi Türkçe web metninde (isim, fiil) çift
// sıklıkları → scripts/data/esdizim.json. Denetim esdizim.mjs'dedir.
//
// Veri kaynağı: turkish-nlp-suite/temiz-OSCAR, oscar2019.jsonl (Hugging Face).
//   OSCAR 2019, Common Crawl'ın Kasım 2018 taramasından ayıklanmış Türkçe
//   metindir; ChatGPT öncesi olduğu için LLM üslubu içermez. temiz-OSCAR,
//   Turkish NLP Suite'in temizlediği sürümüdür. OSCAR derlemi CC0 ile
//   yayımlanır ama içindeki metinler taranan sitelerin sahiplerine aittir ve
//   telifli olabilir (OSCAR da bunu belirtir).
//
// Neden dağıtılmıyor: Çıktı metin değil, sayımdır (kelime ve çift sıklıkları);
//   bunun dağıtılması büyük olasılıkla sorun değildir ama ayrı bir hukuki
//   konudur. Temkinli olmak için tdk-dizin-derle.mjs ile aynı ilke izlenir:
//   depo veriyi taşımaz, betik kullanıcının makinesinde indirip sayar ve
//   sonucu yalnız burada yazar (dosya .gitignore'da).
//
// Dosyanın ~1,2 GB'lık bölümü okunur (~140 milyon kelime). Kalibrasyon
// derleminin (tests/kalibrasyon) insan metinlerini aldığı bölgeler okunmaz;
// yoksa yanlış pozitif sınaması kendi derlemiyle ölçülmüş olurdu.
//
// İndirilen 20 MB'lık parçalar data/esdizim-onbellek/ altına yazılır; betik
// yarıda kalırsa yeniden çalıştırınca inmiş parçalar atlanır. İş bitince
// önbelleği silebilirsiniz (--onbellek-sil bunu kendisi yapar).
//
//   node esdizim-derle.mjs                  # indir, say, yaz
//   node esdizim-derle.mjs --onbellek-sil   # bitince indirilenleri sil
//   node esdizim-derle.mjs --parca 2        # hızlı deneme: yalnız ilk 2 bölge

import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, rmSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { realpathSync } from 'node:fs'

// Doğrudan mı çalıştırıldı? İki yol da gerçek yola çevrilir: beceri bir bağlantı
// (junction/symlink) üzerinden çağrıldığında argv[1] bağlantı yolunu, import.meta.url
// gerçek yolu gösterir. node -e ve REPL'de argv[1] yoktur.
const anaModulMu = () => {
  if (!process.argv[1]) return false
  try {
    return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return false
  }
}
import { FIILLER, FIIL_BICIM, kelimeDizileri, isimKoku } from './esdizim.mjs'

const OSCAR = 'https://huggingface.co/datasets/turkish-nlp-suite/temiz-OSCAR/resolve/main/data/train/oscar2019.jsonl'
const BOYUT = 8229089101
// 10 bölge × 120 MB, dosyaya yayılmış.
const BOLGE = 120e6
const BOLGELER = Array.from({ length: 10 }, (_, k) => 0.1e9 + k * 0.8e9)
const ALT = 20e6
// Kalibrasyonun kullandığı bölgeler: kalibre.mjs ilk 60 MB, kalibre-site.mjs
// 0.3e9 + k*0.8e9 başlangıçlı 20 MB'lık dilimler.
const HARIC = [[0, 60e6], ...Array.from({ length: 10 }, (_, k) => [0.3e9 + k * 0.8e9, 0.3e9 + k * 0.8e9 + 20e6])]

const VERI = new URL('./data/', import.meta.url)
const HEDEF = new URL('./data/esdizim.json', import.meta.url)
const ONBELLEK = new URL('./data/esdizim-onbellek/', import.meta.url)

const MIN_BICIM = 20 // ikinci geçişte isim adayı olacak biçimin en az sıklığı
const KELIME_SAKLA = 200000 // çıktıya yazılan en sık kelime biçimi sayısı
const KELIME_MIN = 20
const ISIM_MIN = 200 // çıktıya yazılan ismin derlem sıklığı
const ISIM_TOPLAM_MIN = 20 // ...ve listedeki fiillerin önünde görülme sayısı

const bekle = (ms) => new Promise((r) => setTimeout(r, ms))
const dosya = (bas) => new URL(`oscar2019-${bas}.jsonl`, ONBELLEK)
const fmt = (n) => n.toLocaleString('tr-TR')

function parcalar(bolgeSayi) {
  const p = []
  for (const b of BOLGELER.slice(0, bolgeSayi)) {
    if (b + BOLGE > BOYUT) continue
    for (const [h1, h2] of HARIC) if (b < h2 && h1 < b + BOLGE) throw new Error(`bölge ${b} kalibrasyon bölgesiyle çakışıyor`)
    for (let s = 0; s < BOLGE; s += ALT) p.push({ bolge: b, bas: b + s, ilk: s === 0, son: s + ALT >= BOLGE })
  }
  return p
}

async function indir(p) {
  mkdirSync(ONBELLEK, { recursive: true })
  let i = 0
  for (const { bas } of p) {
    i++
    const f = dosya(bas)
    if (existsSync(f) && statSync(f).size === ALT) continue
    for (let d = 0; ; d++) {
      try {
        const r = await fetch(OSCAR, { headers: { Range: `bytes=${bas}-${bas + ALT - 1}` }, signal: AbortSignal.timeout(300000) })
        if (r.status !== 206) throw new Error('HTTP ' + r.status)
        const b = Buffer.from(await r.arrayBuffer())
        if (b.length !== ALT) throw new Error(`eksik parça: ${b.length} bayt`)
        writeFileSync(new URL(`oscar2019-${bas}.tmp`, ONBELLEK), b)
        renameSync(new URL(`oscar2019-${bas}.tmp`, ONBELLEK), f)
        break
      } catch (e) {
        if (d >= 6) throw new Error(`indirilemedi (bayt ${bas}): ${e.message}`)
        console.error(`  yeniden deneme ${d + 1}: ${e.cause?.code || e.message}`)
        await bekle(3000 * (d + 1))
      }
    }
    console.log(`  indirildi ${i}/${p.length} (${((i * ALT) / 1e9).toFixed(2)} GB)`)
  }
}

// Önbellekteki parçalardan belgeleri sırayla verir. Bir bölgenin parçaları
// ardışıktır: parça sınırında bölünen satır birleştirilir; bölgenin ilk ve son
// yarım satırı atılır. Aynı açılışla başlayan belgeler (kopya) atlanır.
function* belgeler(p, etiket) {
  const gorulen = new Set()
  const t0 = Date.now()
  let artik = ''
  let i = 0
  for (const { bas, ilk, son } of p) {
    const satirlar = (artik + readFileSync(dosya(bas), 'utf8')).split('\n')
    if (ilk) satirlar.shift()
    artik = satirlar.pop()
    if (son) artik = ''
    for (const s of satirlar) {
      let t
      try { t = JSON.parse(s).text } catch { continue }
      if (typeof t !== 'string') continue
      const anahtar = t.slice(0, 120)
      if (gorulen.has(anahtar)) continue
      gorulen.add(anahtar)
      yield t
    }
    i++
    if (i % 6 === 0 || i === p.length) console.log(`  ${etiket.ad} ${i}/${p.length} parça, ${((Date.now() - t0) / 1000).toFixed(0)} sn, ${etiket.durum()}`)
  }
}

// Geçiş 1: kelime biçimi sıklıkları. Ayrık biçim sayısı milyonları bulur;
// tablo büyüyünce seyrek biçimler budanır (sık biçimlerin sayısı etkilenmez).
function gecis1(p) {
  const kelime = new Map()
  let esik = 2
  let toplam = 0
  let belge = 0
  const etiket = { ad: 'geçiş 1 (kelime)', durum: () => `${fmt(toplam)} kelime, ${fmt(belge)} belge` }
  for (const t of belgeler(p, etiket)) {
    belge++
    toplam += (t.match(/\S+/g) || []).length
    for (const d of kelimeDizileri(t)) {
      for (const k of d) if (k) kelime.set(k, (kelime.get(k) || 0) + 1)
    }
    if (kelime.size > 4e6) {
      for (const [k, c] of kelime) if (c < esik) kelime.delete(k)
      if (kelime.size > 2.5e6) esik++
    }
  }
  const sik = {}
  for (const [k, c] of kelime) if (c >= MIN_BICIM) sik[k] = c
  return { kelime: sik, toplam, belge }
}

// Geçiş 2: fiilden hemen önceki kelime (yüzey biçimi) × fiil sayımı.
function gecis2(p, kelime) {
  const nf = FIILLER.length
  const cift = new Map()
  const fiilSiklik = new Array(nf).fill(0)
  let n = 0
  const etiket = { ad: 'geçiş 2 (çift)', durum: () => `${fmt(n)} çift, ${fmt(cift.size)} isim biçimi` }
  for (const t of belgeler(p, etiket)) {
    for (const d of kelimeDizileri(t)) {
      for (let i = 0; i < d.length; i++) {
        const f = d[i] && FIIL_BICIM.get(d[i])
        if (f === undefined || f === null) continue
        fiilSiklik[f]++
        const once = d[i - 1]
        if (!once || !kelime[once] || kelime[once] < MIN_BICIM || FIIL_BICIM.has(once)) continue
        let a = cift.get(once)
        if (!a) cift.set(once, (a = new Uint32Array(nf)))
        a[f]++
        n++
      }
    }
  }
  return { cift, fiilSiklik }
}

function derle(g1, g2) {
  const { kelime } = g1
  // Kök seçimi denetimdekiyle aynı tabloyla yapılır (çıktıya yazılan en sık
  // biçimler); yoksa derleme ve denetim aynı kelimeye farklı kök verebilir.
  const kelimeler = Object.fromEntries(
    Object.entries(kelime).filter(([, c]) => c >= KELIME_MIN).sort((a, b) => b[1] - a[1]).slice(0, KELIME_SAKLA),
  )
  const siklik = (k) => kelimeler[k] || 0
  // Yüzey biçimlerini isim köküne topla: hem çiftleri hem sıklığı.
  const isimSiklik = new Map()
  for (const [k, c] of Object.entries(kelime)) {
    if (FIIL_BICIM.has(k)) continue
    const s = isimKoku(k, siklik)
    isimSiklik.set(s, (isimSiklik.get(s) || 0) + c)
  }
  const nf = FIILLER.length
  const kok = new Map()
  for (const [k, a] of g2.cift) {
    const s = isimKoku(k, siklik)
    let b = kok.get(s)
    if (!b) kok.set(s, (b = new Uint32Array(nf)))
    for (let i = 0; i < nf; i++) b[i] += a[i]
  }
  const isimler = {}
  const fiilCift = new Array(nf).fill(0)
  for (const [s, b] of kok) {
    const toplam = b.reduce((x, y) => x + y, 0)
    for (let i = 0; i < nf; i++) fiilCift[i] += b[i]
    const sk = isimSiklik.get(s) || 0
    if (sk < ISIM_MIN || toplam < ISIM_TOPLAM_MIN) continue
    const dizi = []
    for (let i = 0; i < nf; i++) if (b[i]) dizi.push(`${i}:${b[i]}`)
    isimler[s] = [sk, toplam, dizi.join(',')]
  }
  return { isimler, fiilCift, kelimeler }
}

async function main() {
  const arg = process.argv.slice(2)
  const bolgeSayi = arg.includes('--parca') ? +arg[arg.indexOf('--parca') + 1] : BOLGELER.length
  const p = parcalar(bolgeSayi)
  console.log(`OSCAR 2019: ${bolgeSayi} bölge, ${p.length} parça (${((p.length * ALT) / 1e9).toFixed(2)} GB) indiriliyor/önbellekten okunuyor`)
  await indir(p)

  // Geçiş 1'in sonucu önbelleğe yazılır; yeniden çalıştırmada atlanır.
  const g1Yol = new URL(`gecis1-${bolgeSayi}.json`, ONBELLEK)
  let g1
  if (existsSync(g1Yol)) {
    g1 = JSON.parse(readFileSync(g1Yol, 'utf8'))
    console.log(`geçiş 1 önbellekten: ${fmt(g1.toplam)} kelime`)
  } else {
    g1 = gecis1(p)
    writeFileSync(g1Yol, JSON.stringify(g1))
  }
  const g2 = gecis2(p, g1.kelime)
  const { isimler, fiilCift, kelimeler } = derle(g1, g2)

  mkdirSync(VERI, { recursive: true })
  const cikti = {
    kaynak: 'turkish-nlp-suite/temiz-OSCAR, oscar2019.jsonl (Common Crawl, Kasım 2018), ' + OSCAR,
    lisans: 'OSCAR derlemi CC0; içindeki metinler kaynak sitelerin sahiplerine ait. Bu dosya yalnız sayım içerir ve yerelde üretilir, dağıtılmaz.',
    derlendi: new Date().toISOString().slice(0, 10),
    bayt: p.length * ALT,
    belge: g1.belge,
    kelime: g1.toplam,
    fiiller: FIILLER.map((f) => f.m),
    fiilSiklik: g2.fiilSiklik,
    fiilCift,
    isimler,
    kelimeler,
  }
  writeFileSync(HEDEF, JSON.stringify(cikti))
  console.log(`${fmt(g1.toplam)} kelime, ${fmt(g1.belge)} belge → ${fmt(Object.keys(isimler).length)} isim, ${fmt(Object.keys(kelimeler).length)} kelime biçimi`)
  console.log(`yazıldı: ${fileURLToPath(HEDEF)} (${(statSync(HEDEF).size / 1e6).toFixed(1)} MB)`)
  if (arg.includes('--onbellek-sil')) {
    rmSync(ONBELLEK, { recursive: true, force: true })
    console.log('önbellek silindi')
  } else console.log(`önbellek: ${fileURLToPath(ONBELLEK)} (silebilirsiniz ya da --onbellek-sil kullanın)`)
}

export { derle }

if (anaModulMu()) {
  main().catch((e) => {
    console.error(e.message)
    process.exit(1)
  })
}
