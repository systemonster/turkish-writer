#!/usr/bin/env node
// TDK Yazım Kılavuzu dizininden tarayıcı için iki sözlük derler:
//
//   ayri:  bitişik yazılmış ama TDK'ya göre ayrı yazılan kelimeler
//          ("işbirliği" → "iş birliği", "anasayfa" → "ana sayfa")
//   sapka: düzeltme işareti düşmüş kelimeler
//          ("hikaye" → "hikâye", "dükkan" → "dükkân")
//
// Dizin TDK'nın verisidir; bu depoda dağıtılmaz. Betik dizini TDK'nın
// sitesinden indirir ve sonucu yalnız bu makinede, scripts/data/tdk-dizin.json
// olarak yazar (dosya .gitignore'da). Tarayıcı dosyayı bulursa kullanır.
//
//   node tdk-dizin-derle.mjs                 # TDK'dan indir
//   node tdk-dizin-derle.mjs yerel/dizin.json  # elde varsa dosyadan

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
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

const URL_DIZIN = 'https://yazim.tdk.gov.tr/assets/dizin.json'
const HEDEF = new URL('./data/tdk-dizin.json', import.meta.url)

const kucult = (s) => s.toLocaleLowerCase('tr')
const sapkasiz = (s) => s.replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')

async function dizinAl(yol) {
  if (yol) return JSON.parse(readFileSync(yol, 'utf8'))
  const yanit = await fetch(URL_DIZIN)
  if (!yanit.ok) throw new Error(`TDK dizini indirilemedi: HTTP ${yanit.status}`)
  if (!/json/.test(yanit.headers.get('content-type') || '')) throw new Error('TDK dizini JSON dönmedi; adres değişmiş olabilir: ' + URL_DIZIN)
  return yanit.json()
}

function derle(dizin) {
  if (!Array.isArray(dizin) || !dizin.every((k) => typeof k?.m === 'string')) {
    throw new Error('Beklenmeyen dizin biçimi: her kayıtta "m" alanı olmalı')
  }

  // Özel adları (büyük harfle başlayan) ele: "Abdal" bir oymak adı, "abdal"
  // başka bir kelime. Tarayıcı küçük harfle çalışır, karışmasın.
  const maddeler = dizin.map((k) => k.m).filter((m) => m && m[0] === kucult(m[0]))
  const var_ = new Set(maddeler.map(kucult))

  const ayri = {}
  for (const m of maddeler) {
    if (!m.includes(' ')) continue
    const parca = m.split(' ')
    // Yalnız iki kelimelik, iki parçası da en az iki harfli birleşikler.
    // Üç kelimelik deyimlerin bitişik yazılması seyrek, yanlış pozitif riski yüksek.
    if (parca.length !== 2 || parca.some((p) => p.length < 2)) continue
    const bitisik = kucult(parca.join(''))
    // Bitişik biçim de sözlükte bir madde ise (ör. anlamı farklı başka bir
    // kelime) işaretleme.
    if (var_.has(bitisik)) continue
    ayri[bitisik] = m
  }

  const sapka = {}
  for (const m of maddeler) {
    if (!/[âîû]/.test(m) || m.includes(' ')) continue
    // Sondaki nispet î'si: "resmî kurum" ile "Atatürk'ün resmi", "askerî okul"
    // ile "Türk askeri" ikisi de doğrudur; hangisi olduğunu bağlam belirler.
    // Sözlük bunu ayıramaz, işaretleme.
    if (m.endsWith('î')) continue
    const duz = kucult(sapkasiz(m))
    // Şapkasız biçim de bir madde ise (kar/kâr, hala/hâlâ, aciz/âciz) ikisi de
    // doğrudur, anlam belirler. İşaretleme.
    if (var_.has(duz)) continue
    sapka[duz] = m
  }

  // Tek kelimelik maddeler: tarayıcı, bir kelimenin başka doğru bir kelime +
  // ek olup olmadığını bunlarla sınar ("kanunu" = kanun + u, "kan unu" değil;
  // "birbirine" = birbiri + ne, "bir bir" değil).
  const tekil = [...var_].filter((m) => !m.includes(' ') && !m.includes('-'))

  // Bitişik biçimi doğru bir kelimenin başı olan ya da doğru bir kelime + 1-2
  // harf olan anahtarlar önek eşleşmesinde yanlış pozitif üretir:
  //   "birbir" (bir bir)  → "birbiri"nin başı   → "birbirlerine" işaretlenirdi
  //   "birik"  (bir iki)  → "biri" + k           → "birikiyorum" işaretlenirdi
  //   "aramal" (ara mal)  → "arama" + l          → "aramalar" işaretlenirdi
  // Bunları ele. Kaybedilen: "birbir" gibi gerçekten bitişik yazılmış seyrek hatalar.
  const onekler = new Set()
  for (const t of tekil) for (let n = 4; n < t.length; n++) onekler.add(t.slice(0, n))
  const elenen = []
  for (const k of Object.keys(ayri)) {
    if (onekler.has(k) || tekil.includes(k.slice(0, -1)) || tekil.includes(k.slice(0, -2))) {
      elenen.push(k)
      delete ayri[k]
    }
  }

  return { ayri, sapka, tekil, elenen }
}

async function main() {
  const dizin = await dizinAl(process.argv[2])
  const { ayri, sapka, tekil, elenen } = derle(dizin)
  console.log(`${elenen.length} birleşik, doğru bir kelimenin başı olduğu için elendi (ör. ${elenen.slice(0, 5).join(', ')})`)
  mkdirSync(new URL('./data/', import.meta.url), { recursive: true })
  writeFileSync(
    HEDEF,
    JSON.stringify({
      kaynak: 'TDK Yazım Kılavuzu dizini, ' + URL_DIZIN,
      derlendi: new Date().toISOString().slice(0, 10),
      madde: dizin.length,
      ayri,
      sapka,
      tekil,
    }),
  )
  console.log(`${dizin.length} madde okundu → ${Object.keys(ayri).length} ayrı yazılan birleşik, ${Object.keys(sapka).length} düzeltme işaretli kelime`)
  console.log(`yazıldı: ${HEDEF.pathname}`)
}

export { derle }

if (anaModulMu()) {
  main().catch((e) => {
    console.error(e.message)
    process.exit(1)
  })
}
