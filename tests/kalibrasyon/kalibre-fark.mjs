#!/usr/bin/env node
// İnsan ↔ GPT fark derlemi: aynı içeriği iyi bir insan yazarı ve GPT nasıl yazıyor?
//
//   node tests/kalibrasyon/kalibre-fark.mjs topla              # OSCAR 2019 adayları
//   node tests/kalibrasyon/kalibre-fark.mjs wayback            # wayback-url.json -> 2021 öncesi anlık görüntüler
//   node tests/kalibrasyon/kalibre-fark.mjs puan   --env .env  # GPT-4o kalite puanı (1-5 x 5 ölçüt)
//   node tests/kalibrasyon/kalibre-fark.mjs sec                # secim.json (elle) -> insan/, meta.json
//   node tests/kalibrasyon/kalibre-fark.mjs olgu   --env .env  # olgu listesi, ana hat, sicil
//   node tests/kalibrasyon/kalibre-fark.mjs uret   --env .env  # gpt4o, gpt4o-dogal, gpt41
//   node tests/kalibrasyon/kalibre-fark.mjs esle   --env .env  # olgu başına insan cümlesi ↔ GPT cümlesi
//   node tests/kalibrasyon/kalibre-fark.mjs olc                # olcum.json + olcum.md
//
// Anahtar: OPENAI_API_KEY ortam değişkeni ya da --env <.env yolu>. Anahtar hiçbir yere
// yazılmaz, loglanmaz; hata iletilerinde maskelenir. Her adım kaldığı yerden devam eder.
// Derlem: tests/kalibrasyon/derlem-fark/ (insan metinleri telifli, yayına girmez).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { denetle } from '../../skills/turkish-writer/scripts/tr-scan.mjs'

const KOK = path.dirname(fileURLToPath(import.meta.url))
const D = path.join(KOK, 'derlem-fark')
const yol = (...p) => path.join(D, ...p)
const GRUPLAR = { gpt4o: 'gpt-4o', 'gpt4o-dogal': 'gpt-4o', gpt41: 'gpt-4.1' }
const OSCAR = 'https://huggingface.co/datasets/turkish-nlp-suite/temiz-OSCAR/resolve/main/data/train/oscar2019.jsonl'
// Başka görevlerin bölgeleri: 0-60 MB; 0.1e9+k*0.8e9 (+120 MB); 0.3e9+k*0.8e9 (+20 MB);
// 0.55e9+k*0.8e9 (+20 MB). 0.7e9+k*0.8e9 (+30 MB) hiçbirine değmez.
const BOLGELER = Array.from({ length: 10 }, (_, k) => 0.7e9 + k * 0.8e9)
const DILIM = 30e6

const bekle = (ms) => new Promise((r) => setTimeout(r, ms))
const okuJ = (f, v) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : v)
const yazJ = (f, v) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(v, null, 1)) }
const kelimeSay = (t) => (t.match(/\p{L}+/gu) || []).length
const say = (t, re) => (t.match(re) || []).length

async function getir(url, secenek = {}, deneme = 6) {
  for (let i = 0; i < deneme; i++) {
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
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

// ---------------------------------------------------------------------------
// 1a. OSCAR adayları
// ---------------------------------------------------------------------------

const SITE_IS = /(hizmetlerimiz|hakkımızda|firmamız|şirketimiz|müşterilerimiz|ürünlerimiz|kurumsal|iletişime geçin|teklif al|uzman kadromuz|ekibimiz|referanslarımız|müşteri memnuniyeti)/giu
const BIRINCI = /(?<!\p{L})(ben|bence|benim|bana|beni|biz|bizim|bize)(?!\p{L})|\p{L}{2,}(ıyorum|iyorum|uyorum|üyorum|dım|dim|dum|düm|tım|tim|tum|tüm|dık|dik|duk|dük|tık|tik|tuk|tük)(?!\p{L})/giu
const HABER = /(dedi\.|açıkladı|muhabir|\bAA\b|İHA|DHA|gözaltına|ifade etti|kaydetti\.|belirtti\.|Valiliği|Emniyet Müdürlüğü|vurguladı|söyledi\.)/gu
const FORUM = /(Alıntı|Cevapla|Yanıtla|mesaj(ı|lar)|konuyu|Üye|forum|yorum yap|Reply)/giu
const YASAK = /(?<!\p{L})(casino|bahis|iddaa|kumar|porno|seks|seksi|sex|escort|eskort|viagra|jigolo|hack|apk|film izle|dizi izle|büyü|büyücü|medyum|ayet|hadis|namaz)(?!\p{L})|\+18/iu
const TR_HARF = /[çğıöşüÇĞİÖŞÜ]/u

function kaliteRed(metin, n) {
  const kel = metin.match(/\p{L}+/gu) || []
  if (kel.filter((w) => TR_HARF.test(w)).length / n < 0.25) return 'ascii'
  const c = say(metin, /[.!?…](\s|$)/g)
  if (c < 10 || n / c > 35) return 'noktalama'
  const kk = kel.map((w) => w.toLocaleLowerCase('tr'))
  const uc = new Map()
  for (let i = 0; i + 2 < kk.length; i++) { const k = kk.slice(i, i + 3).join(' '); uc.set(k, (uc.get(k) || 0) + 1) }
  if (Math.max(...uc.values()) >= 4) return 'spam'
  if ((metin.match(/\d/g) || []).length / metin.length > 0.03) return 'rakam'
  if (/https?:|www\.|@\w/.test(metin)) return 'url'
  if (/\p{Lu}{4,}\s+\p{Lu}{4,}\s+\p{Lu}{4,}/u.test(metin)) return 'buyuk-harf'
  // küçük harfle başlayan cümle oranı (düzgün noktalama)
  const bas = [...metin.matchAll(/[.!?]\s+(\p{L})/gu)].map((m) => m[1])
  if (bas.length && bas.filter((h) => h === h.toLocaleLowerCase('tr')).length / bas.length > 0.1) return 'kucuk-harf'
  return null
}

async function topla() {
  const havuz = { site: [], blog: [] }
  const elenen = {}
  const gorulen = new Set()
  for (const bas of BOLGELER) {
    const t = await (await getir(OSCAR, { headers: { Range: `bytes=${bas}-${bas + DILIM}` } })).text()
    for (const satir of t.split('\n').slice(1, -1)) {
      let metin
      try { metin = JSON.parse(satir).text.trim() } catch { continue }
      const n = kelimeSay(metin)
      if (n < 300 || n > 1000) continue
      const site = say(metin, SITE_IS)
      const kisi = say(metin, BIRINCI)
      const tur = site >= 2 ? 'site' : kisi >= 6 ? 'blog' : null
      if (!tur) continue
      const k = metin.slice(0, 80)
      let neden = null
      if (gorulen.has(k)) neden = 'kopya'
      else if (YASAK.test(metin)) neden = 'yasak'
      else if (say(metin, HABER) >= 2) neden = 'haber'
      else if (say(metin, FORUM) >= 2) neden = 'forum'
      else neden = kaliteRed(metin, n)
      if (neden) { elenen[neden] = (elenen[neden] || 0) + 1; continue }
      gorulen.add(k)
      havuz[tur].push({ tur, metin, bayt: bas, kelime: n })
    }
    console.log(`  OSCAR ${bas / 1e9} GB: site ${havuz.site.length}, blog ${havuz.blog.length}`)
  }
  const aday = [
    ...karistir(havuz.site, 7).slice(0, 60).map((d, i) => ({ id: `os${String(i + 1).padStart(3, '0')}`, kaynak: 'oscar', ...d })),
    ...karistir(havuz.blog, 9).slice(0, 110).map((d, i) => ({ id: `ob${String(i + 1).padStart(3, '0')}`, kaynak: 'oscar', ...d })),
  ]
  yazJ(yol('aday-oscar.json'), { havuz: { site: havuz.site.length, blog: havuz.blog.length }, elenen, aday })
  console.log('aday', aday.length, 'elenen', JSON.stringify(elenen))
}

// ---------------------------------------------------------------------------
// 1b. Wayback adayları: wayback-url.json = [{url, tur}] ; 2021 öncesi anlık görüntü
// ---------------------------------------------------------------------------

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', ndash: '–', mdash: '—', ccedil: 'ç', Ccedil: 'Ç', ouml: 'ö', Ouml: 'Ö', uuml: 'ü', Uuml: 'Ü', laquo: '«', raquo: '»', acirc: 'â', Acirc: 'Â', icirc: 'î', ucirc: 'û', Ucirc: 'Û' }
const cozEnt = (s) => s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => (e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENT[e] ?? m))

// İçerik kabını bul, etiket derinliğini sayarak kapanışına kadar al, düz metne çevir.
function htmlMetin(html, kapSecici) {
  html = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|noscript|iframe|form|figure|figcaption|aside|nav)\b[\s\S]*?<\/\1>/gi, '')
  const kaplar = [
    ...(kapSecici ? [new RegExp(kapSecici, 'i')] : []),
    /class="[^"]*\bpost-body\b[^"]*"/i, /class="[^"]*\bentry-content\b[^"]*"/i,
    /class="[^"]*\b(post-content|article-content|td-post-content|single-content|post-entry|entry|article-body|content-inner|storycontent|postcontent|post_content|blog-content)\b[^"]*"/i,
    /itemprop="articleBody"/i, /<article\b/i,
  ]
  let govde = null
  for (const re of kaplar) {
    const m = re.exec(html)
    if (!m) continue
    const bas = html.lastIndexOf('<', m.index + (m[0].startsWith('<') ? 0 : 0))
    const etiket = html.slice(bas + 1).match(/^\w+/)[0].toLowerCase()
    const reE = new RegExp(`<(/?)${etiket}\\b[^>]*>`, 'gi')
    reE.lastIndex = bas
    let d = 0, son = html.length
    for (let x; (x = reE.exec(html));) { d += x[1] ? -1 : 1; if (d === 0) { son = x.index; break } }
    govde = html.slice(bas, son)
    break
  }
  if (!govde) {
    // Kap yoksa: sayfadaki uzun <p> öğeleri
    const p = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => m[1]).filter((x) => x.replace(/<[^>]+>/g, '').trim().length > 40)
    if (p.length >= 3) govde = p.map((x) => `<p>${x}</p>`).join('')
    else {
      // Son çare: tablo/div düzenli eski sayfalar; cümle içeren uzun satırlar
      const s = cozEnt(html.replace(/<head[\s\S]*?<\/head>/i, '').replace(/<br\s*\/?>|<\/(div|td|p|li|h\d|tr)>/gi, '\n').replace(/<[^>]+>/g, ' '))
        .split('\n').map((x) => x.replace(/\s+/g, ' ').trim()).filter((x) => x.length >= 80 && /[.!?]/.test(x))
      if (s.length < 2) return null
      return s.join('\n\n')
    }
  }
  const t = cozEnt(govde.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '\n\n').replace(/<h([1-6])[^>]*>/gi, '\n\n## ').replace(/<li[^>]*>/gi, '- ').replace(/<[^>]+>/g, ''))
  return t.split('\n').map((s) => s.replace(/[ \t ]+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').replace(/^## \s*$/gm, '').trim()
}

async function wayback() {
  const liste = okuJ(yol('wayback-url.json'), [])
  const cikti = okuJ(yol('aday-wayback.json'), { aday: [], hata: {} })
  const bitmis = new Set([...cikti.aday.map((a) => a.url), ...Object.keys(cikti.hata)])
  let no = cikti.aday.length
  for (const { url, tur, kap } of liste) {
    if (bitmis.has(url)) continue
    try {
      const cdx = await (await getir(`https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&to=20201231&output=json&filter=statuscode:200&limit=3`, {}, 3)).json()
      if (cdx.length < 2) throw new Error('anlık görüntü yok')
      const ts = cdx[1][1]
      // Eski sayfalar windows-1254 / iso-8859-9 olabilir: meta charset'e göre çöz
      const ham = Buffer.from(await (await getir(`https://web.archive.org/web/${ts}id_/${url}`, {}, 3)).arrayBuffer())
      const cs = (ham.toString('latin1').match(/charset=["']?([\w-]+)/i) || [])[1]?.toLowerCase() || 'utf-8'
      const html = new TextDecoder(/1254|8859-9|latin5/.test(cs) ? 'windows-1254' : cs === 'iso-8859-1' ? 'windows-1252' : 'utf-8').decode(ham)
      const metin = htmlMetin(html, kap)
      if (!metin) throw new Error('içerik kabı yok')
      const n = kelimeSay(metin)
      const baslik = cozEnt((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').trim()
      no++
      cikti.aday.push({ id: `w${tur === 'site' ? 's' : 'b'}${String(no).padStart(3, '0')}`, kaynak: 'wayback', tur, url, anlik: ts, baslik, kelime: n, metin })
      console.log(`  ${ts} ${n} kelime ${url}`)
    } catch (e) {
      cikti.hata[url] = e.message
      console.log(`  HATA ${e.message} ${url}`)
    }
    yazJ(yol('aday-wayback.json'), cikti)
    await bekle(1000)
  }
  console.log('wayback aday', cikti.aday.length, 'hata', Object.keys(cikti.hata).length)
}

// ---------------------------------------------------------------------------
// OpenAI
// ---------------------------------------------------------------------------

function anahtarOku() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY
  const i = process.argv.indexOf('--env')
  const y = i > 0 ? process.argv[i + 1] : process.env.OPENAI_ENV
  if (!y) throw new Error('OPENAI_API_KEY ya da --env <yol> gerekli')
  const m = fs.readFileSync(y, 'utf8').match(/^\s*OPENAI_API_KEY\s*=\s*["']?([^"'\r\n]+)/m)
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
async function jsonSor(anahtar, model, istem, sistem) {
  const messages = sistem ? [{ role: 'system', content: sistem }, { role: 'user', content: istem }] : [{ role: 'user', content: istem }]
  const { metin, model: m } = await sohbet(anahtar, model, messages, { temperature: 0, response_format: { type: 'json_object' } })
  return { ...JSON.parse(metin), _model: m }
}

// Küçük paralel kuyruk
async function havuzla(isler, esz, fn) {
  let i = 0
  await Promise.all(Array.from({ length: esz }, async () => { while (i < isler.length) { const x = isler[i++]; await fn(x) } }))
}

// ---------------------------------------------------------------------------
// 1c. Kalite puanı
// ---------------------------------------------------------------------------

const PUAN_ISTEM = (m) => `Aşağıdaki Türkçe metni bir Türkçe editör gözüyle değerlendir. Her ölçüte 1-5 tam sayı puan ver.
- akicilik: sesli okununca takılmadan akıyor mu
- ozgun_ses: kendine özgü bir yazarı, bir sesi var mı (kalıp broşür dili değil)
- somutluk: somut ayrıntı, sahne, sayı, ad, örnek var mı
- dogal_turkce: Türkçe düşünülerek yazılmış mı, çeviri kokuyor mu (5 = hiç çeviri kokmuyor)
- tdk: yazım ve noktalama TDK'ya ne kadar yakın
Ayrıca şunları belirle:
- tur: "blog" (kişisel ya da kurumsal blog yazısı), "site" (şirket/kurum sayfası: hakkımızda, hizmet, ürün tanıtımı), "haber", "ceviri" (yabancı kaynaktan çevrildiği belli), "seo" (anahtar kelime doldurma), "diger"
- sayfa: metin türünü 2-4 kelimeyle (ör. "gezi yazısı", "hakkımızda sayfası", "yemek tarifi yazısı")
- konu: en çok 10 kelime
Yalnız JSON döndür: {"akicilik":n,"ozgun_ses":n,"somutluk":n,"dogal_turkce":n,"tdk":n,"tur":"...","sayfa":"...","konu":"..."}

METİN:
${m.slice(0, 7000)}`

const tumAdaylar = () => [...okuJ(yol('aday-oscar.json'), { aday: [] }).aday, ...okuJ(yol('aday-wayback.json'), { aday: [] }).aday]

async function puan() {
  const anahtar = anahtarOku()
  const adaylar = tumAdaylar().filter((a) => a.kelime >= 300 && a.kelime <= 1000)
  const p = okuJ(yol('puan.json'), {})
  const kalan = adaylar.filter((a) => !p[a.id])
  console.log('aday', adaylar.length, 'kalan', kalan.length)
  await havuzla(kalan, 3, async (a) => {
    try {
      const j = await jsonSor(anahtar, 'gpt-4o', PUAN_ISTEM(a.metin))
      j.toplam = ['akicilik', 'ozgun_ses', 'somutluk', 'dogal_turkce', 'tdk'].reduce((s, k) => s + (+j[k] || 0), 0)
      p[a.id] = j
      yazJ(yol('puan.json'), p)
    } catch (e) { console.error(a.id, e.message) }
  })
  const sirali = adaylar.filter((a) => p[a.id]).sort((x, y) => p[y.id].toplam - p[x.id].toplam)
  const satir = sirali.map((a) => `${a.id}\t${p[a.id].toplam}\t${p[a.id].tur}\t${a.kelime}\t${p[a.id].sayfa} | ${p[a.id].konu}`)
  fs.writeFileSync(yol('puan-sirali.tsv'), satir.join('\n') + '\n')
  console.log('puanlanan', sirali.length)
}

// ---------------------------------------------------------------------------
// 1d. Seçim: secim.json = [{aday, tur: 'blog'|'site', sayfa, gerekce, metin?}] (metin: elle temizlenmiş sürüm)
// ---------------------------------------------------------------------------

function sec() {
  const adaylar = Object.fromEntries(tumAdaylar().map((a) => [a.id, a]))
  const p = okuJ(yol('puan.json'), {})
  const secim = okuJ(yol('secim.json'), [])
  const meta = []
  let b = 0, s = 0
  fs.mkdirSync(yol('insan'), { recursive: true })
  for (const x of secim) {
    const a = adaylar[x.aday]
    const id = x.tur === 'site' ? `s${String(++s).padStart(2, '0')}` : `b${String(++b).padStart(2, '0')}`
    // Elle temizlik: bas/son (metnin başladığı ve bittiği parça, son dahil), sil (satır silme düzenleri)
    let metin = cozEnt((x.metin || a.metin).trim())
    if (x.bas) { const i = metin.indexOf(x.bas); if (i < 0) throw new Error(`${x.aday}: bas yok`); metin = metin.slice(i) }
    if (x.son) { const i = metin.indexOf(x.son); if (i < 0) throw new Error(`${x.aday}: son yok`); metin = metin.slice(0, i + x.son.length) }
    for (const d of x.sil || []) metin = metin.split('\n').filter((s) => !new RegExp(d, 'u').test(s)).join('\n')
    metin = metin.replace(/\n{3,}/g, '\n\n').trim()
    // kes: en çok N kelime, paragraf sınırında
    if (x.kes && kelimeSay(metin) > x.kes) {
      const p = metin.split('\n\n'); const alinan = []
      for (const q of p) { if (kelimeSay([...alinan, q].join(' ')) > x.kes) break; alinan.push(q) }
      metin = alinan.join('\n\n')
    }
    fs.writeFileSync(yol('insan', id + '.txt'), metin + '\n')
    meta.push({
      id, aday: a.id, tur: x.tur, sayfa: x.sayfa, kelime: kelimeSay(metin),
      kaynak: a.kaynak === 'oscar' ? 'Common Crawl Kasım 2018 (OSCAR 2019, turkish-nlp-suite/temiz-OSCAR)' : 'Wayback Machine',
      url: a.url || null, anlik: a.anlik || null, oscarBayt: a.bayt ?? null,
      gerekce: x.gerekce, kalite: p[a.id] ? Object.fromEntries(Object.entries(p[a.id]).filter(([k]) => !k.startsWith('_'))) : null,
    })
  }
  yazJ(yol('meta.json'), meta)
  console.log('seçildi', meta.length)
}

// ---------------------------------------------------------------------------
// 2. Olgu listesi, ana hat, sicil; yeniden yazım
// ---------------------------------------------------------------------------

const OLGU_ISTEM = (m) => `Aşağıdaki Türkçe metnin içeriğini, başka bir yazarın metni görmeden AYNI içerikle, aynı ayrıntı düzeyinde yeniden yazabileceği biçimde çıkar. Metnin cümlelerini kopyalama; olguları kendi kısa, yalın ifadenle madde madde yaz.
- olgular: metindeki HER bilgi, metin sırasıyla: sayı, ad, yer, tarih, fiyat; her olay ve anekdotun ayrıntıları (kim, ne yaptı, ne dedi, ne oldu, sonra ne oldu: her adım ayrı madde); alıntılanan ya da aktarılan sözlerin içeriği; örnekler, benzetmelerin konusu; yazarın her görüşü, duygusu, yakınması, esprisinin konusu, okura önerisi. Özetleme, genelleme, birleştirme yapma. Bütün özel adları, sayıları, saatleri, tarihleri, fiyatları, ölçüleri AYNEN koru; metindeki bir sıralamayı (program, menü, liste, isimler) tek maddede özetleme, her öğesini yaz. Doğrudan alıntıları tırnak içinde aynen ver. Yaklaşık ${Math.max(12, Math.round(kelimeSay(m) / 18))} madde olmalı.
- ana_hat: paragraf başına bir satır: o paragrafın konusu.
- sicil: kim yazıyor, kime, hangi tonda; "ben" mi "biz" mi; okura "sen" mi "siz" mi hitap ediyor ya da hiç mi; resmî mi samimi mi; mizah var mı. 1-3 cümle.
- tur: "blog yazısı" ya da sayfa türü (ör. "hakkımızda sayfası", "hizmet tanıtım sayfası")
- baslik: metnin başlığı varsa o, yoksa uygun bir başlık
Yalnız JSON döndür: {"baslik":"...","tur":"...","sicil":"...","ana_hat":["..."],"olgular":["..."]}

METİN:
${m}`

async function olgu() {
  const anahtar = anahtarOku()
  const meta = okuJ(yol('meta.json'), [])
  await havuzla(meta.filter((m) => !fs.existsSync(yol('olgular', m.id + '.json'))), 3, async (m) => {
    try {
      const j = await jsonSor(anahtar, 'gpt-4o', OLGU_ISTEM(fs.readFileSync(yol('insan', m.id + '.txt'), 'utf8')))
      yazJ(yol('olgular', m.id + '.json'), j)
      console.log(m.id, j.olgular.length, 'olgu', j.ana_hat.length, 'paragraf')
    } catch (e) { console.error('olgu', m.id, e.message) }
  })
}

const DOGAL_SISTEM = 'Türkçe düşünen bir insan gibi yaz; çeviri gibi, yapay zekâ gibi durmasın; klişe ve abartı kullanma.'
const URET_ISTEM = (o, n) => `Aşağıdaki olgular ve ana hatla yaklaşık ${n} kelimelik Türkçe bir ${/blog/i.test(o.tur) ? 'blog yazısı' : o.tur + ' metni'} yaz. Sicil: ${o.sicil}
Başlık: ${o.baslik}

Ana hat (paragraf başına bir satır):
${o.ana_hat.map((x, i) => `${i + 1}. ${x}`).join('\n')}

Olgular:
${o.olgular.map((x) => `- ${x}`).join('\n')}`

async function uret() {
  const anahtar = anahtarOku()
  const meta = okuJ(yol('meta.json'), [])
  const kayit = okuJ(yol('uretim.json'), {})
  const isler = []
  for (const m of meta) for (const g of Object.keys(GRUPLAR)) if (!fs.existsSync(yol(g, m.id + '.txt'))) isler.push([m, g])
  await havuzla(isler, 3, async ([m, g]) => {
    const o = okuJ(yol('olgular', m.id + '.json'))
    const istem = URET_ISTEM(o, Math.round(m.kelime / 10) * 10)
    const messages = g === 'gpt4o-dogal' ? [{ role: 'system', content: DOGAL_SISTEM }, { role: 'user', content: istem }] : [{ role: 'user', content: istem }]
    try {
      const { metin, model } = await sohbet(anahtar, GRUPLAR[g], messages)
      fs.mkdirSync(yol(g), { recursive: true })
      fs.writeFileSync(yol(g, m.id + '.txt'), metin + '\n')
      kayit[`${g}/${m.id}`] = { model, sistem: g === 'gpt4o-dogal' ? DOGAL_SISTEM : null, istem, kelime: kelimeSay(metin) }
      yazJ(yol('uretim.json'), kayit)
      console.log(g, m.id, kelimeSay(metin))
    } catch (e) { console.error(g, m.id, e.message) }
  })
}

// ---------------------------------------------------------------------------
// 3a. Eşleme: her olgu için insanın ve GPT'nin o olguyu verdiği cümle(ler) (birebir alıntı)
// ---------------------------------------------------------------------------

const ESLE_ISTEM = (olgular, insan, gpt) => `İki Türkçe metin aynı olgu listesinden yazılmış. Her olgu için A metninde ve B metninde o olguyu veren cümleyi (ya da ardışık 2 cümleyi) BİREBİR, harfi harfine kopyala. Olgu metinde yoksa null yaz. Cümleleri değiştirme, düzeltme.
Yalnız JSON döndür: {"esler":[{"olgu":"...","a":"..."|null,"b":"..."|null}]}

OLGULAR:
${olgular.map((x, i) => `${i + 1}. ${x}`).join('\n')}

A METNİ:
${insan}

B METNİ:
${gpt}`

async function esle() {
  const anahtar = anahtarOku()
  const meta = okuJ(yol('meta.json'), [])
  const isler = []
  for (const m of meta) for (const g of Object.keys(GRUPLAR)) if (!fs.existsSync(yol('esle', `${m.id}-${g}.json`)) && fs.existsSync(yol(g, m.id + '.txt'))) isler.push([m, g])
  await havuzla(isler, 3, async ([m, g]) => {
    const o = okuJ(yol('olgular', m.id + '.json'))
    const ins = fs.readFileSync(yol('insan', m.id + '.txt'), 'utf8')
    const gp = fs.readFileSync(yol(g, m.id + '.txt'), 'utf8')
    try {
      const j = await jsonSor(anahtar, 'gpt-4o', ESLE_ISTEM(o.olgular, ins, gp))
      const n = (s) => s.replace(/\s+/g, ' ')
      for (const e of j.esler) { e.aVar = !e.a || n(ins).includes(n(e.a)); e.bVar = !e.b || n(gp).includes(n(e.b)) }
      yazJ(yol('esle', `${m.id}-${g}.json`), j)
      console.log('esle', m.id, g, j.esler.length)
    } catch (e) { console.error('esle', m.id, g, e.message) }
  })
}

// ---------------------------------------------------------------------------
// 3a'. Yargı: metin başına işaretleme (GPT-4o, sıcaklık 0, birebir alıntıyla). Elle okumanın
// sayım yardımcısıdır; alıntılar metinde aranır, bulunmayan alıntı sayılmaz.
// ---------------------------------------------------------------------------

const YARGI_ISTEM = (o, insan, t, insanMi) => `Bir Türkçe metni (T) işaretle. T, aşağıdaki olgu listesinden yazılmış ${insanMi ? '(T özgün insan metnidir)' : 'bir metindir; karşılaştırma için özgün insan metni (İ) de verildi'}. Her alıntıyı T'den BİREBİR kopyala.
Yalnız JSON döndür:
{"acilis":"sahne|olay|iddia|gorus|alinti|hitap|cerceve|tanim|soru","acilis_cumle":"...",
"kapanis":"bilgi|oneri|plan|sahne|saka|ders|dilek|aforizma|cagri|ozet","kapanis_cumle":"...",
"ders":["T'de bir olayın/olgunun anlamını, dersini, önemini ya da genel hayat hükmünü söyleyen cümleler"],
"uydurma":["${insanMi ? '(boş bırak)' : 'T\'de olup ne olgu listesinde ne İ\'de bulunan somut ayrıntılar: ad, sayı, replik, duyu ayrıntısı, olay'}"],
"klise":["kalıplaşmış, ilk akla gelen metafor ve deyimler (ör. büyülü dünya, yelken açmak, kalbimi fethetti, zamanda yolculuk, cennet)"],
"zorlama_saka":["olgudan doğmayan, eklenmiş espri cümleleri"],
"dogrudan_soz":["tırnaklı ya da tırnaksız doğrudan aktarılan konuşma ya da iç ses"],
"okura_hitap":["okura açık hitap ya da çağrı: sevgili okurlar, dostlar, gelin, unutmayın, siz de..."],
"olgu_hatasi":["${insanMi ? '(boş bırak)' : 'olgu listesiyle ya da İ ile çelişen ifadeler'}"],
"genelleme":["${insanMi ? '(boş bırak)' : 'olgu listesindeki/İ\'deki belirli bir ad, sayı, liste ya da sahnenin genel bir ifadeyle geçildiği yerler'}"]}

OLGULAR:
${o.olgular.map((x) => '- ' + x).join('\n')}
${insanMi ? '' : '\nİ (özgün insan metni):\n' + insan + '\n'}
T:
${t}`

async function yargi() {
  const anahtar = anahtarOku()
  const meta = okuJ(yol('meta.json'), [])
  const isler = []
  for (const m of meta) for (const g of ['insan', ...Object.keys(GRUPLAR)]) if (fs.existsSync(yol(g, m.id + '.txt')) && !fs.existsSync(yol('yargi', `${m.id}-${g}.json`))) isler.push([m, g])
  await havuzla(isler, 3, async ([m, g]) => {
    const o = okuJ(yol('olgular', m.id + '.json'))
    const ins = fs.readFileSync(yol('insan', m.id + '.txt'), 'utf8')
    const t = fs.readFileSync(yol(g, m.id + '.txt'), 'utf8')
    try {
      const j = await jsonSor(anahtar, 'gpt-4o', YARGI_ISTEM(o, ins, t, g === 'insan'))
      const n = (s) => s.replace(/[\s"“”'‘’]+/g, ' ').trim()
      const tn = n(t)
      for (const k of ['ders', 'uydurma', 'klise', 'zorlama_saka', 'dogrudan_soz', 'okura_hitap', 'olgu_hatasi', 'genelleme']) j[k] = (j[k] || []).filter((x) => x && !/^\(boş/.test(x) && tn.includes(n(x).slice(0, 40)))
      yazJ(yol('yargi', `${m.id}-${g}.json`), j)
      console.log('yargi', m.id, g)
    } catch (e) { console.error('yargi', m.id, g, e.message) }
  })
}

// ---------------------------------------------------------------------------
// 3b. Ölçüm
// ---------------------------------------------------------------------------

const w = (s) => new RegExp(`(?<!\\p{L})(${s})(?!\\p{L})`, 'giu')
const OLCUTLER = {
  parcacik: w('de|da|bile|ise|zaten|ki|hani|işte|yani|artık|sanki|galiba|belki|aslında|tabii|tabi|hatta|meğer|üstelik|yine|bari|hele|şöyle|böyle'),
  deDa: w('de|da'),
  mekanikBag: /(?<!\p{L})(ayrıca|bunun yanı sıra|bunun yanında|dolayısıyla|bu nedenle|bu sebeple|bu bağlamda|öte yandan|sonuç olarak|son olarak|özetle|bununla birlikte|ek olarak|her şeyden önce|öncelikle)(?!\p{L})/giu,
  gundelikBag: w('ama|çünkü|yoksa|oysa|ancak|fakat|sonra|derken|madem|halbuki'),
  yuksekSicil: /(?<!\p{L})(gerçekleştir|sağla|oluştur|sun(ar|uyor|ul|mak|maktadır|duğu|an)|mevcut|önem taşı|rol oyna|katkı|imkân|imkan|olanak|deneyim|keşfet|yolculu|süreç|unsur|faktör|etkin|verimli|çözüm|kapsamlı|önemli|kritik|değerli)\p{L}*/giu,
  soyutSifat: w('eşsiz|benzersiz|muhteşem|harika|büyüleyici|unutulmaz|mükemmel|kusursuz|etkileyici|keyifli|huzurlu|ideal|inanılmaz|olağanüstü|özel|güzel'),
  soru: /\?/g,
  unlem: /!/g,
  parantez: /\(/g,
  tirnak: /["“”«»]/g,
  ucNokta: /\.\.\.|…/g,
  birinciTekil: /(?<!\p{L})(ben|bence|benim|bana|beni|bende|benden)(?!\p{L})|\p{L}{2,}(ıyorum|iyorum|uyorum|üyorum|dım|dim|dum|düm|tım|tim|tum|tüm|acağım|eceğim)(?!\p{L})/giu,
  birinciCogul: /(?<!\p{L})(biz|bizim|bize|bizi|bizde|bizden)(?!\p{L})|\p{L}{2,}(ıyoruz|iyoruz|uyoruz|üyoruz|dık|dik|duk|dük|tık|tik|tuk|tük|acağız|eceğiz)(?!\p{L})/giu,
  ikinci: /(?<!\p{L})(sen|senin|sana|seni|siz|sizin|size|sizi|sizler)(?!\p{L})|\p{L}{2,}(sınız|siniz|sunuz|sünüz|abilirsiniz|ebilirsiniz)(?!\p{L})/giu,
  rakam: /\d+/g,
  ozelAd: /(?<=[\p{Ll},;] )\p{Lu}\p{Ll}+/gu,
  ulacIp: /\p{L}{2,}(ıp|ip|up|üp)(?!\p{L})/giu,
  ulacInce: /\p{L}{2,}(ınca|ince|unca|ünce)(?!\p{L})/giu,
  ulacArak: /\p{L}{2,}(arak|erek)(?!\p{L})/giu,
  ulacKen: /\p{L}{2,}(ken|dığında|diğinde|duğunda|düğünde|tığında|tiğinde|tuğunda|tüğünde)(?!\p{L})/giu,
  gecmisDi: /\p{L}{2,}(dı|di|du|dü|tı|ti|tu|tü)(m|n|k|nız|niz|nuz|nüz)?(?!\p{L})/giu,
  mis: /\p{L}{2,}(mış|miş|muş|müş)\p{L}{0,4}(?!\p{L})/giu,
  maktadir: /\p{L}+(makta|mekte)\p{L}*/giu,
  ile: w('ile'),
  noktaliVirgul: /;/g,
  ikiNokta: /:/g,
  // yorum / ders cümlesi işaretleri: olayı anlamına çeviren kalıp
  dersIsareti: /(ne kadar (önemli|değerli|kıymetli)|önemini|bir kez daha (anladım|gördüm|fark ettim)|hatırlattı|hatırlatıyor|ders (verdi|oldu|aldım)|öğretti|gösteriyor ki|gösterdi ki|unutmamak gerek|unutmayın|aslında (hayat|mesele|önemli olan)|en güzel yolu|anlamını|değerini (anla|bil))/giu,
  // "her X bir Y" aforizması
  aforizma: /(?<!\p{L})her \p{L}+ (bir|da|de) \p{L}+/giu,
  soyutAd: /\p{L}{3,}(lık|lik|luk|lük|sal|sel)(ı|i|u|ü|ın|in|un|ün|a|e|ı|da|de)?(?!\p{L})/giu,
  sanki: w('sanki|adeta|âdeta|gibi'),
  duyguSozu: /(?<!\p{L})(büyülü|büyüleyici|huzur|keyifli|keyif|heyecan\p{L}*|özlem\p{L}*|nostalji\p{L}*|tutku\p{L}*|unutulmaz|paha biçilmez|eşsiz|muhteşem|harika|mükemmel)(?!\p{L})/giu,
}

// Cümle yüklemle (çekimli fiil ya da ek-fiil) bitiyor mu? Bitmiyorsa devrik ya da eksiltili cümle.
const YUKLEM_SONU = /(yor\p{L}*|[dt][ıiuü](m|n|k|nız|niz|nuz|nüz|lar|ler|r)?|m[ıiuü]ş\p{L}*|[ae]c[ae]k\p{L}*|[aeıiuü]r(ım|im|um|üm|sın|sin|sun|sün|ız|iz|uz|üz|lar|ler)?|[dt][ıiuü]r(lar|ler)?|l[ıi]m|s[ıiuü]n(ız|iz|uz|üz)?|m[ae]z\p{L}*|m[ae]l[ıi]\p{L}*|var|yok|değil\p{L}*|y[ıiuü][mnkz]|[ae]l[ıi]m|s[ae](m|k|nız|niz))$/iu
const yuklemleBiter = (s) => { const k = (s.replace(/[.!?…"”')\]:;]+$/u, '').match(/\p{L}+$/u) || [''])[0]; const x = k.toLocaleLowerCase('tr'); if (/l[ae]r$/.test(x) && !/(yor|[dt][ıiuü]|m[ıiuü]ş|[ae]c[ae]k|[aeıiuü]r|m[ae]z)l[ae]r$/.test(x)) return false; return YUKLEM_SONU.test(x) }

function cumleBol(t) {
  return t.split(/\n+/).flatMap((p) => p.split(/(?<=[.!?…])\s+(?=[\p{Lu}"“'(\d-])/u)).map((s) => s.trim()).filter((s) => kelimeSay(s) > 0)
}

function ozellik(metin) {
  const t = metin.replace(/\r/g, '')
  const satirlar = t.split('\n').map((s) => s.trim()).filter(Boolean)
  const baslikMi = (s) => /^#{1,6}\s/.test(s) || /^\*\*[^*]+\*\*:?$/.test(s) || (kelimeSay(s) <= 10 && !/[.!?:…,;]$/.test(s) && s.length < 80 && !/^[-*•]/.test(s))
  const baslik = satirlar.filter(baslikMi).length
  const liste = satirlar.filter((s) => /^([-*•]|\d+[.)])\s/.test(s)).length
  const govde = satirlar.filter((s) => !baslikMi(s)).join('\n\n').replace(/\*\*/g, '').replace(/^[-*•]\s+/gm, '')
  const paragraflar = t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => kelimeSay(p) >= 15 && !baslikMi(p))
  const cum = cumleBol(govde).filter((s) => kelimeSay(s) >= 2)
  const uz = cum.map(kelimeSay)
  const n = kelimeSay(govde)
  const ort = uz.reduce((a, b) => a + b, 0) / (uz.length || 1)
  const sd = Math.sqrt(uz.reduce((a, b) => a + (b - ort) ** 2, 0) / (uz.length || 1))
  const sirali = [...uz].sort((a, b) => a - b)
  const o = {
    kelime: n, cumle: uz.length, cumleOrt: ort, cumleCV: sd / (ort || 1), cumleMedyan: sirali[Math.floor(sirali.length / 2)] || 0,
    enUzun: Math.max(0, ...uz), enKisa: Math.min(99, ...uz), kisaOran: uz.filter((x) => x <= 7).length / (uz.length || 1), uzunOran: uz.filter((x) => x >= 25).length / (uz.length || 1),
    paragraf: paragraflar.length, paragrafOrt: paragraflar.length ? paragraflar.map(kelimeSay).reduce((a, b) => a + b, 0) / paragraflar.length : 0,
    paragrafCV: (() => { const p = paragraflar.map(kelimeSay); const m = p.reduce((a, b) => a + b, 0) / (p.length || 1); return p.length ? Math.sqrt(p.reduce((a, b) => a + (b - m) ** 2, 0) / p.length) / m : 0 })(),
    baslik, liste,
    ilkCumle: uz[0] || 0, sonCumle: uz[uz.length - 1] || 0,
    kelimeUzOrt: (govde.match(/\p{L}+/gu) || []).reduce((a, k) => a + k.length, 0) / (n || 1),
    tip: new Set((govde.match(/\p{L}+/gu) || []).map((k) => k.toLocaleLowerCase('tr'))).size / (n || 1),
    basBag: cum.filter((s) => /^(Ama|Ancak|Fakat|Çünkü|Ayrıca|Bu nedenle|Dolayısıyla|Öte yandan|Yani|Zaten|Hatta|Üstelik|Oysa|Yine de|Sonra|Bunun|Böylece|Bu da|Bu yüzden|Şimdi|İşte|Ve|Hem|Neyse|Tabii)\b/u.test(s)).length / (uz.length || 1),
    buBas: cum.filter((s) => /^Bu(nun|nu|na|nda|ndan)?\s/u.test(s)).length / (uz.length || 1),
    yuklemsizSon: cum.filter((s) => !yuklemleBiter(s)).length / (uz.length || 1),
    ardisikBenzer: (() => { let k = 0; for (let i = 2; i < uz.length; i++) if (Math.max(uz[i], uz[i - 1], uz[i - 2]) - Math.min(uz[i], uz[i - 1], uz[i - 2]) <= 4) k++; return k / Math.max(1, uz.length - 2) })(),
  }
  for (const [k, re] of Object.entries(OLCUTLER)) o[k + '100'] = (say(govde, re) / (n || 1)) * 100
  const tr = denetle(govde)
  o.skor = tr.skor
  o.ve100 = tr.olcum.ve100
  o.bir100 = tr.olcum.bir100
  o.iz = {}
  for (const b of tr.bulgular) if (!b.tur.startsWith('tdk-')) o.iz[b.tur] = (o.iz[b.tur] || 0) + 1
  return o
}

function olc() {
  const meta = okuJ(yol('meta.json'), [])
  const gruplar = ['insan', ...Object.keys(GRUPLAR)]
  const sonuc = {}
  for (const g of gruplar) for (const m of meta) {
    const f = yol(g, m.id + '.txt')
    if (fs.existsSync(f)) (sonuc[g] ||= {})[m.id] = ozellik(fs.readFileSync(f, 'utf8'))
  }
  yazJ(yol('olcum.json'), sonuc)
  const anahtarlar = Object.keys(Object.values(sonuc.insan)[0]).filter((k) => k !== 'iz')
  const ortalama = (g, k) => { const v = meta.map((m) => sonuc[g]?.[m.id]?.[k]).filter((x) => x != null); return v.reduce((a, b) => a + b, 0) / (v.length || 1) }
  const buyuk = (g, k) => meta.filter((m) => sonuc[g]?.[m.id] && sonuc[g][m.id][k] > sonuc.insan[m.id][k]).length
  const kucuk = (g, k) => meta.filter((m) => sonuc[g]?.[m.id] && sonuc[g][m.id][k] < sonuc.insan[m.id][k]).length
  const f = (x) => (Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(2)).replace('.', ',')
  const G = gruplar.slice(1)
  const satir = [`| ölçüm | ${gruplar.join(' | ')} | ${G.map((g) => g + ' >/< insan').join(' | ')} |`, '|' + '---|'.repeat(gruplar.length + G.length + 1)]
  for (const k of anahtarlar) satir.push(`| ${k} | ${gruplar.map((g) => f(ortalama(g, k))).join(' | ')} | ${G.map((g) => `${buyuk(g, k)}/${kucuk(g, k)}`).join(' | ')} |`)
  const izler = [...new Set(gruplar.flatMap((g) => Object.values(sonuc[g] || {}).flatMap((o) => Object.keys(o.iz))))].sort()
  satir.push('', `| tr-scan izi (metin sayısı) | ${gruplar.join(' | ')} |`, '|' + '---|'.repeat(gruplar.length + 1))
  for (const iz of izler) satir.push(`| ${iz} | ${gruplar.map((g) => Object.values(sonuc[g] || {}).filter((o) => o.iz[iz]).length).join(' | ')} |`)
  fs.writeFileSync(yol('olcum.md'), satir.join('\n') + '\n')
  console.log(satir.join('\n'))
}

// ---------------------------------------------------------------------------
// 3c. Desen sayımı: okurken bulunan desenlerin düzenli ifadeyle sayımı. Her desen için
// kaç metinde geçtiği ve kaç çiftte "GPT'de var, insanda yok" olduğu.
// ---------------------------------------------------------------------------

const DESENLER = {
  'selam/hitap açılışı': /^(\s*[#*].*\n+)?\s*(Merhaba|Selam|Sevgili|Dostlar|Gelin)/iu,
  'sevgili okur/dostlar': /(sevgili (okur|okuyucu|gezgin|dost|balık)|(?<!\p{L})dostlar(?!\p{L})|dostlarımız)/giu,
  'Unutmayın/Unutmayalım': /(?<!\p{L})unutma(yın|yalım|mak lazım|mamak gerek)/giu,
  'özet bağlacı (Sonuç olarak/Kısacası/Özetle/Sonuçta/Toparlamak gerekirse)': /(?<!\p{L})(sonuç olarak|kısacası|özetle|sonuçta|toparlamak gerekirse|velhasıl)(?!\p{L})/giu,
  'yelken açmak': /yelken aç/giu,
  'deneyim (kelime)': /(?<!\p{L})deneyim\p{L}*/giu,
  'büyü/büyülü/büyüleyici': /(?<!\p{L})büyü(lü|leyici|sü|süne|sünü|sü)?(?!\p{L})/giu,
  'cennet/cevher/hazine (mecaz)': /(?<!\p{L})(cennet\p{L}*|cevher\p{L}*|hazine\p{L}*)/giu,
  'adeta/âdeta': /(?<!\p{L})(adeta|âdeta)(?!\p{L})/giu,
  'kalbimi/gönlümü fethetti/kazandı': /(kalb\p{L}*|gönl\p{L}*) (fethet|kazan|çal)/giu,
  'macera': /(?<!\p{L})macera\p{L}*/giu,
  'dilek kapanışı (umarım/dileğiyle/olsun!)': /(umarım|dileğiyle|dilerim|olsun!|afiyet olsun|iyi (seyahatler|yolculuklar|alışverişler))/giu,
  'kendimi ... buldum (found myself)': /kendimi \p{L}+(\s\p{L}+)? (buldum|bulurken|buluyorum)/giu,
  'X değil, (aynı zamanda) Y': /(sadece|yalnızca) [^.!?]{2,60}? (değil|değildi)[^.!?]{0,40}(aynı zamanda|bir de|ayrıca)?/giu,
  'Ancak/Ayrıca/Bununla birlikte cümle başı': /(^|[.!?]\s+)(Ancak|Ayrıca|Bununla birlikte|Bunun yanı sıra|Öte yandan|Dolayısıyla)(?!\p{L})/gmu,
  'markdown başlık/kalın': /^(#{1,6} |\*\*[^*]+\*\*\s*$)/mu,
  'emoji': /\p{Extended_Pictographic}/u,
  'soru-cevap kalıbı (Neden mi? / Peki ...?)': /(neden mi\?|peki,? [^.!?]{3,60}\?|ne dersiniz\?|değil mi\?)/giu,
  'parantez içi ek bilgi': /\([^)]{3,}\)/g,
  'meğer / -mış farkındalık': /(?<!\p{L})meğer(?!\p{L})/giu,
  'ki (bağlaç/sonuç)': /(?<!\p{L})ki(?!\p{L})/giu,
  'zaten': /(?<!\p{L})zaten(?!\p{L})/giu,
  'hani/yani/işte': /(?<!\p{L})(hani|yani|işte)(?!\p{L})/giu,
  'gerçi/hoş/neyse': /(?<!\p{L})(gerçi|hoş|neyse)(?!\p{L})/giu,
}

function desen() {
  const meta = okuJ(yol('meta.json'), [])
  const gruplar = ['insan', ...Object.keys(GRUPLAR)]
  const metin = (g, id) => (fs.existsSync(yol(g, id + '.txt')) ? fs.readFileSync(yol(g, id + '.txt'), 'utf8') : null)
  const sat = [`| desen | ${gruplar.map((g) => g + ' (metin / 100 kelimede)').join(' | ')} | ${gruplar.slice(1).map((g) => g + ': GPT var, insan yok').join(' | ')} |`, '|' + '---|'.repeat(gruplar.length * 2)]
  const sonuc = {}
  for (const [ad, re] of Object.entries(DESENLER)) {
    const r = {}
    for (const g of gruplar) {
      let mt = 0, top = 0, kel = 0
      for (const m of meta) { const t = metin(g, m.id); if (!t) continue; const n = say(t, new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')); if (n) mt++; top += n; kel += kelimeSay(t) }
      r[g] = { metin: mt, yuz: (top / (kel || 1)) * 100 }
    }
    const re1 = new RegExp(re.source, re.flags.replace('g', ''))
    for (const g of gruplar.slice(1)) r[g].tek = meta.filter((m) => { const a = metin(g, m.id), i = metin('insan', m.id); return a && re1.test(a) && !re1.test(i) }).length
    r.insanTek = gruplar.slice(1).map((g) => meta.filter((m) => { const a = metin(g, m.id), i = metin('insan', m.id); return a && !re1.test(a) && re1.test(i) }).length)
    sonuc[ad] = r
    sat.push(`| ${ad} | ${gruplar.map((g) => `${r[g].metin} / ${r[g].yuz.toFixed(2).replace('.', ',')}`).join(' | ')} | ${gruplar.slice(1).map((g) => r[g].tek).join(' | ')} |`)
  }
  yazJ(yol('desen.json'), sonuc)
  fs.writeFileSync(yol('desen.md'), sat.join('\n') + '\n')
  console.log(sat.join('\n'))
}

const ADIMLAR = { desen, topla, wayback, puan, sec, olgu, uret, esle, yargi, olc }
const adim = process.argv[2]
if (!ADIMLAR[adim]) { console.error('adım: ' + Object.keys(ADIMLAR).join(' | ')); process.exit(2) }
await ADIMLAR[adim]()
