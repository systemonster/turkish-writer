#!/usr/bin/env node
// Nitelikli insan derlemi: beceri çıktısı editörden geçmiş profesyonel Türkçeden ayrışıyor mu?
// Kullanım: node tests/kalibrasyon/kalibre-nitelikli.mjs <adim> [--env <.env yolu>] [--n <tür başına>]
//   olgu   (tur 3) seçilen insan metinlerinden olgu listesini yeniden çıkar (OpenAI, ~30 kelimeye bir
//          madde), derlem-nitelikli/olgu-t3.json; brif --surum t3 ile bunu kullanır
//   brif   meta.json'dan tür başına n metin seç (varsayılan 12), aynı konu + olgu + uzunlukla brif yaz
//   uret   brifleri openai-taslak.mjs ile yazdır (Yaz kipinin taslak adımı, varsayılan model)
//   olc    tr-scan olc()/denetle() ile insan, beceri ve OSCAR insan derlemlerini ölç; AUC + söz dizimi bulgu oranı
//   kapi   tr-scan skorunu kapı olarak sına: ayar/sınama yarısı, beceri-once/ ve beceri/, eski derlemler (kapi.md)
// Derlem (git dışı): tests/kalibrasyon/derlem-nitelikli/{insan,brif,beceri}/, meta.json, olcum.json, olcum.md
// --surum <ad> (ör. t3): brif-<ad>/ ve beceri-<ad>/ dizinleri; olgu listesi olgu-<ad>.json'dan,
// uzunluk hedef aralığı (%90-105) olarak yazılır. Sürümsüz çağrı tur 1-2 dosyalarını kullanır.
// Anahtar yalnız OPENAI_API_KEY ortam değişkeninden ya da --env dosyasından okunur; hiçbir yere yazılmaz.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { denetle } from '../../skills/turkish-writer/scripts/tr-scan.mjs'
import { SOZ_DIZIMI_TURLERI } from '../../skills/turkish-writer/scripts/soz-dizimi.mjs'

const KOK = path.dirname(fileURLToPath(import.meta.url))
const D = path.join(KOK, 'derlem-nitelikli')
const OSCAR = path.join(KOK, 'derlem-site', 'insan') // 2018 OSCAR site + blog, önceki kalibrasyonun insan tarafı
const TASLAK = path.join(KOK, '..', '..', 'skills', 'turkish-writer', 'scripts', 'openai-taslak.mjs')
const argv = process.argv.slice(2)
const bayrak = (ad, v) => { const i = argv.indexOf(ad); return i > -1 ? argv[i + 1] : v }
const okuJ = (p, v) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : v)
const yazJ = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 1))
const okuT = (p) => fs.readFileSync(p, 'utf8').trim()
// Başlık satırı ölçülmez: insan metninde "# Başlık" var, beceride yok.
const govde = (t) => t.split('\n').filter((s) => !/^#{1,6}\s/.test(s.trim())).join('\n').trim()
const kelimeSay = (t) => (t.match(/\p{L}+/gu) || []).length
const TURLER = ['kurumsal', 'blog', 'duyuru']
const SURUM = bayrak('--surum')
const ek = (ad) => (SURUM ? `${ad}-${SURUM}` : ad)
// --brif-surum <ad> (tur 4): aynı brif setini yeni istemle yazdırmak için (ör. --surum t4a --brif-surum t3).
const BRIF_SURUM = bayrak('--brif-surum', SURUM)
const brifDizin = () => (BRIF_SURUM ? `brif-${BRIF_SURUM}` : 'brif')

function secilenler(n) {
  const meta = okuJ(path.join(D, 'meta.json'), [])
  const risk = { dusuk: 0, orta: 1, yuksek: 2 }
  const secim = []
  for (const tur of TURLER) {
    const aday = meta
      .filter((m) => m.tur === tur && m.ceviri_mi !== true && (m.olgular || []).length >= 3 && fs.existsSync(path.join(D, m.dosya || `insan/${m.id}.txt`)))
      .sort((a, b) => (risk[a.llm_riski] ?? 3) - (risk[b.llm_riski] ?? 3) || a.id.localeCompare(b.id))
    // Kaynak çeşitliliği: her kaynaktan sırayla birer metin al.
    const kaynaklar = [...new Set(aday.map((m) => m.kaynak))]
    const kuyruk = Object.fromEntries(kaynaklar.map((k) => [k, aday.filter((m) => m.kaynak === k)]))
    const tur_ = []
    while (tur_.length < n && kaynaklar.some((k) => kuyruk[k].length)) for (const k of kaynaklar) if (kuyruk[k].length && tur_.length < n) tur_.push(kuyruk[k].shift())
    secim.push(...tur_)
  }
  return secim
}

const SAYFA = {
  kurumsal: ['kurum sitesindeki tanıtım ya da hizmet sayfası metni', 'kurumu ya da hizmeti araştıran ziyaretçi', "kurumun ağzından ('biz' ya da kurum adıyla); okura 'siz'"],
  blog: ['editörlü bir dergi ya da blog yazısı', 'konuyu merak eden genel okur', 'yazarın ağzından; görüş ve yorum serbest'],
  duyuru: ['kurumun basın duyurusu ya da kurum haberi', 'kamuoyu, basın ve ilgililer', "kurumun resmî ağzından; üçüncü kişi ya da 'kurumumuz'"],
}
function brif() {
  const n = Number(bayrak('--n', 12))
  const secim = secilenler(n)
  const yeniOlgu = SURUM ? okuJ(path.join(D, `olgu-${SURUM}.json`), {}) : {}
  fs.mkdirSync(path.join(D, ek('brif')), { recursive: true })
  for (const m of secim) {
    const [sayfa, okur, kisi] = SAYFA[m.tur]
    const hedef = Math.round(kelimeSay(govde(okuT(path.join(D, m.dosya || `insan/${m.id}.txt`)))) / 10) * 10
    const metin = [
      `Sayfa türü: ${sayfa}.`,
      `Konu: ${m.konu}`,
      `Okur: ${okur}.`,
      `Kişi ve hitap: ${kisi}.`,
      'Olgu listesi (metne yalnız bunlar girer):',
      ...(yeniOlgu[m.id] || m.olgular).map((o) => `- ${o}`),
      SURUM ? `Uzunluk: ${Math.round(hedef * 0.9 / 10) * 10}-${Math.round(hedef * 1.05 / 10) * 10} kelime.` : `Uzunluk: yaklaşık ${hedef} kelime.`,
      'Biçim: düz paragraflar; başlık, madde işareti ve kalın yazı yok.',
    ].join('\n')
    fs.writeFileSync(path.join(D, ek('brif'), `${m.id}.md`), metin + '\n')
  }
  if (!SURUM) yazJ(path.join(D, 'secim.json'), secim.map((m) => ({ id: m.id, tur: m.tur, kaynak: m.kaynak })))
  console.log(`brif: ${secim.length} (${TURLER.map((t) => `${t} ${secim.filter((m) => m.tur === t).length}`).join(', ')})`)
}

function anahtar() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY
  const yol = bayrak('--env')
  if (!yol) throw new Error('OPENAI_API_KEY ya da --env <yol> gerekli')
  const m = fs.readFileSync(yol, 'utf8').match(/^\s*OPENAI_API_KEY\s*=\s*["']?([^"'\r\n]+)/m)
  if (!m) throw new Error('.env içinde OPENAI_API_KEY yok')
  return m[1].trim()
}
function uret() {
  const env = { ...process.env, OPENAI_API_KEY: anahtar() }
  fs.mkdirSync(path.join(D, ek('beceri')), { recursive: true })
  for (const { id } of okuJ(path.join(D, 'secim.json'), [])) {
    const out = path.join(D, ek('beceri'), `${id}.txt`)
    if (fs.existsSync(out)) continue
    for (let i = 0; i < 3; i++) {
      try {
        execFileSync(process.execPath, [TASLAK, path.join(D, brifDizin(), `${id}.md`), '--out', out], { env, stdio: ['ignore', 'ignore', 'inherit'] })
        break
      } catch (e) { console.error(`  ${id} deneme ${i + 1} başarısız`) }
    }
  }
}

// Olgu listesini insan metninden yeniden çıkarır (tur 3). Tur 1-2 brifinde 3-7 olgu 170-770 kelimelik
// hedefle eşleşiyordu (~100 kelimeye bir olgu); istem dolguyu yasaklayınca metin kısa kaldı.
// Olgu çıkarıcı model taslak modelinden ayrıdır (gpt-5.5); maddeler metnin cümlelerini kopyalamaz.
async function olgu() {
  const { jsonSor } = await import('../../skills/turkish-writer/scripts/hakem-dongusu.mjs')
  const key = anahtar()
  const meta = Object.fromEntries(okuJ(path.join(D, 'meta.json'), []).map((m) => [m.id, m]))
  const hedef = path.join(D, `olgu-${SURUM || 't3'}.json`)
  const kayit = okuJ(hedef, {})
  for (const { id } of okuJ(path.join(D, 'secim.json'), [])) {
    if (kayit[id]) continue
    const m = meta[id]
    const metin = govde(okuT(path.join(D, m.dosya || `insan/${id}.txt`)))
    const n = Math.max(5, Math.round(kelimeSay(metin) / 30))
    const istem = `Aşağıdaki Türkçe metnin bilgi içeriğini madde madde çıkar. Bu maddeler başka bir yazara brif olarak verilecek; yazar metni görmeyecek.
Kurallar:
- Metindeki her bilgiyi, her görüşü ve her örneği metindeki sırasıyla ayrı madde yap; yaklaşık ${n} madde (metin kelime sayısının 30'da biri kadar). Bilgi atlama.
- Her madde tek, kısa, düz cümle. Metnin cümlelerini kopyalama; kendi sözünle yaz. Sayı, ad, tarih, yer aynen kalır.
- Yazarın görüşü ya da yorumu olan maddeyi "Yazara göre" ya da "Görüş:" diye başlat.
- Metinde olmayan hiçbir şey ekleme.
Yalnız JSON: {"olgular": ["...", "..."]}

METİN:
"""
${metin}
"""`
    const { json } = await jsonSor({ key, model: bayrak('--model', 'gpt-5.5'), istem })
    if (Array.isArray(json.olgular) && json.olgular.length) kayit[id] = json.olgular.map(String)
    yazJ(hedef, kayit)
    console.error(`${id}: ${kayit[id]?.length ?? 0} olgu (${kelimeSay(metin)} kelime)`)
  }
}

// --- istatistik ---
const medyan = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const ceyrek = (a, q) => { const s = [...a].sort((x, y) => x - y); const p = (s.length - 1) * q; const l = Math.floor(p); return s[l] + (s[Math.ceil(p)] - s[l]) * (p - l) }
function auc(poz, neg) { let s = 0; for (const p of poz) for (const n of neg) s += p > n ? 1 : p === n ? 0.5 : 0; return s / (poz.length * neg.length) }
function aucGA(poz, neg, b = 1000) {
  let t = 7
  const rnd = () => ((t = (t * 1103515245 + 12345) % 2147483648) / 2147483648)
  const ornek = (a) => a.map(() => a[Math.floor(rnd() * a.length)])
  const v = Array.from({ length: b }, () => auc(ornek(poz), ornek(neg))).sort((x, y) => x - y)
  return [v[Math.floor(b * 0.025)], v[Math.floor(b * 0.975)]]
}

const OLCUMLER = ['cumleCV', 'cumleSapma', 'cumleOrt', 'uzunCumleOran', 've100', 'veIz100', 'bir100', 'hafifFiil200', 'heceOrt', 'gecis100', 'ulacCumle', 'dirOran', 'skor', 'kelime']
function olcKume(dizin, idler) {
  if (!fs.existsSync(dizin)) return []
  const dosyalar = idler ? idler.map((id) => `${id}.txt`).filter((f) => fs.existsSync(path.join(dizin, f))) : fs.readdirSync(dizin).filter((f) => f.endsWith('.txt'))
  return dosyalar.map((f) => {
    const metin = govde(okuT(path.join(dizin, f)))
    const r = denetle(metin)
    const o = r.olcum
    const soz = r.bulgular.filter((b) => SOZ_DIZIMI_TURLERI.includes(b.tur))
    return {
      id: f.slice(0, -4), ...Object.fromEntries(OLCUMLER.filter((k) => k in o).map((k) => [k, o[k]])),
      uzunCumleOran: o.cumle ? o.uzunCumle / o.cumle : 0, skor: r.skor, cumle: o.cumle,
      soz: soz.map((b) => ({ tur: b.tur, parca: b.parca })),
    }
  })
}
const f2 = (x) => (x == null || Number.isNaN(x) ? '–' : x.toFixed(2).replace('.', ','))

function olc() {
  const meta = okuJ(path.join(D, 'meta.json'), [])
  const turu = Object.fromEntries(meta.map((m) => [m.id, m.tur]))
  const insan = olcKume(path.join(D, 'insan'))
  const beceri = olcKume(path.join(D, ek('beceri')))
  const oscar = olcKume(OSCAR)
  const eslesen = new Set(beceri.map((b) => b.id))
  const insanE = insan.filter((m) => eslesen.has(m.id)) // aynı konulu insan karşılıkları
  const satirlar = OLCUMLER.map((k) => {
    const i = insan.map((m) => m[k]), b = beceri.map((m) => m[k]), o = oscar.map((m) => m[k])
    if (!b.length) return { olcum: k, insan: medyan(i), oscar: medyan(o) }
    const a = auc(b, i)
    return { olcum: k, insan: medyan(i), insanIQR: [ceyrek(i, 0.25), ceyrek(i, 0.75)], oscar: medyan(o), beceri: medyan(b), beceriIQR: [ceyrek(b, 0.25), ceyrek(b, 0.75)], auc: a, ga: aucGA(b, i), aucEsli: auc(b, insanE.map((m) => m[k])), aucOscarNitelikli: auc(i, o) }
  })
  const sozOran = (kume) => Object.fromEntries(SOZ_DIZIMI_TURLERI.map((t) => {
    const metin = kume.filter((m) => m.soz.some((b) => b.tur === t)).length
    const bulgu = kume.reduce((s, m) => s + m.soz.filter((b) => b.tur === t).length, 0)
    const kelime = kume.reduce((s, m) => s + m.kelime, 0)
    const cumle = kume.reduce((s, m) => s + (m.cumle || 0), 0)
    return [t, { metin, n: kume.length, metinOran: kume.length ? metin / kume.length : 0, bulgu, bin: kelime ? (1000 * bulgu) / kelime : 0, cumleOran: cumle ? bulgu / cumle : 0 }]
  }))
  const turKir = Object.fromEntries(TURLER.map((t) => [t, sozOran(insan.filter((m) => turu[m.id] === t))]))
  const sonuc = { tarih: new Date().toISOString().slice(0, 10), n: { insan: insan.length, beceri: beceri.length, oscar: oscar.length }, satirlar, soz: { insan: sozOran(insan), beceri: sozOran(beceri), oscar: sozOran(oscar), insanTur: turKir }, bulgular: insan.filter((m) => m.soz.length).map((m) => ({ id: m.id, tur: turu[m.id], soz: m.soz })) }
  yazJ(path.join(D, ek('olcum') + '.json'), { ...sonuc, metinler: { insan, beceri, oscar } })

  const durum = (a) => (a == null ? '–' : a >= 0.4 && a <= 0.6 ? 'geçer' : 'ayrışıyor')
  const md = [
    `# Nitelikli derlem ölçümü (${sonuc.tarih})`, '',
    `n: nitelikli insan ${insan.length}, beceri ${beceri.length}, OSCAR insan ${oscar.length}. AUC = P(beceri > nitelikli insan); hedef [0,40; 0,60]. Eşli AUC: yalnız aynı konulu insan metinleriyle.`, '',
    '| ölçüm | nitelikli insan medyan (IQR) | OSCAR insan medyan | beceri medyan (IQR) | AUC [%95 GA] | eşli AUC | durum |',
    '|---|---|---|---|---|---|---|',
    ...satirlar.map((s) => `| ${s.olcum} | ${f2(s.insan)}${s.insanIQR ? ` (${f2(s.insanIQR[0])}–${f2(s.insanIQR[1])})` : ''} | ${f2(s.oscar)} | ${f2(s.beceri)}${s.beceriIQR ? ` (${f2(s.beceriIQR[0])}–${f2(s.beceriIQR[1])})` : ''} | ${s.auc == null ? '–' : `${f2(s.auc)} [${f2(s.ga[0])}–${f2(s.ga[1])}]`} | ${f2(s.aucEsli)} | ${s.olcum === 'kelime' ? 'kontrol' : durum(s.auc)} |`),
    '', '## Söz dizimi kuralları: bulgu çıkan metin oranı (nitelikli insanda = yanlış pozitif üst sınırı)', '',
    '| kural | nitelikli insan | kurumsal | blog | duyuru | 1000 kelimede (insan) | OSCAR insan | beceri |',
    '|---|---|---|---|---|---|---|---|',
    ...SOZ_DIZIMI_TURLERI.map((t) => {
      const x = sonuc.soz.insan[t], p = (v) => `%${Math.round(100 * v.metinOran)} (${v.metin}/${v.n})`
      return `| ${t} | ${p(x)} | ${TURLER.map((tr) => p(turKir[tr][t])).join(' | ')} | ${f2(x.bin)} | ${p(sonuc.soz.oscar[t])} | ${p(sonuc.soz.beceri[t])} |`
    }),
  ].join('\n')
  fs.writeFileSync(path.join(D, 'olcum.md'), md + '\n')
  console.log(md)
}

// tr-scan skorunun kapı olarak sınaması. Derlem tür içinde id sırasıyla dönüşümlü ikiye bölünür:
// "ayar" yarısı eşik seçiminde kullanıldı (2026-09-26), "sınama" yarısı yalnız burada ölçülür.
// Beceri metni karşılığı olan insan metniyle aynı yarıda durur (konu sızmasın).
function yari(meta) {
  const y = {}
  for (const t of TURLER) meta.filter((m) => m.tur === t).map((m) => m.id).sort().forEach((id, i) => { y[id] = i % 2 ? 'sinama' : 'ayar' })
  return y
}
function kapi() {
  const y = yari(okuJ(path.join(D, 'meta.json'), []))
  const skorlar = (dizin, suz = () => true) => (fs.existsSync(dizin) ? fs.readdirSync(dizin).filter((f) => f.endsWith('.txt') && suz(f.slice(0, -4))) : []).map((f) => denetle(govde(okuT(path.join(dizin, f)))).skor)
  const satir = (ad, ins, bec) => {
    if (!ins.length || !bec.length) return `| ${ad} | – | – | – | – |`
    const alt = (a) => a.filter((s) => s <= 80).length
    return `| ${ad} | ${f2(auc(ins, bec))} | ${medyan(ins)} (${alt(ins)}/${ins.length} ≤80) | ${medyan(bec)} (${alt(bec)}/${bec.length} ≤80) |`
  }
  const md = ['| karşılaştırma | AUC (insan > karşı taraf) | insan skor medyanı | karşı taraf skor medyanı |', '|---|---|---|---|']
  for (const yr of ['ayar', 'sinama']) for (const b of ['beceri-once', 'beceri']) {
    const s = (id) => y[id] === yr
    md.push(satir(`nitelikli ${yr} / ${b}`, skorlar(path.join(D, 'insan'), s), skorlar(path.join(D, b), s)))
  }
  for (const [ad, i, l] of [['2018 OSCAR (derlem) / gpt-4o', 'derlem/insan', 'derlem/llm'], ['2018 OSCAR site / gpt-4o', 'derlem-site/insan', 'derlem-site/llm'], ['OSCAR (derlem-beceri) / Claude becerili', 'derlem-beceri/insan', 'derlem-beceri/claude-becerili'], ['derlem-fark insan / gpt-4o', 'derlem-fark/insan', 'derlem-fark/gpt4o']])
    md.push(satir(ad, skorlar(path.join(KOK, i)), skorlar(path.join(KOK, l))))
  fs.writeFileSync(path.join(D, 'kapi.md'), md.join('\n') + '\n')
  console.log(md.join('\n'))
}

const adim = argv[0]
if (adim === 'olgu') await olgu()
else if (adim === 'brif') brif()
else if (adim === 'uret') uret()
else if (adim === 'olc') olc()
else if (adim === 'kapi') kapi()
else { console.error('adım: olgu | brif | uret | olc | kapi'); process.exit(2) }
