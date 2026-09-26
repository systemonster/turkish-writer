// Söz dizimi kuralları: İngilizceden geçen dört yapıyı deterministik olarak bulur.
//
//   liste-ve          "maliyeti, süreyi, iş sırasını yazılı hâle getirir": son iki öge bağlaçsız
//   ozne-virgul       "Keşif, işin kapsamını yazar.": kısa cümlede özneden sonra virgül
//   eksiltili-yuklem  "Ödeme teslimata bağlı, kaynak kod sizin": yüklemsiz başlık dili gövdede
//   tamlama-eki       "kaynak kod", "yönetim panel": belirtisiz tamlamada iyelik eki yok
//
// Bunlar yazım hatasıdır, yapay zekâ izi değil: skoru etkilemez (ağırlık 0), ama site kapısı
// her bulguyu sayar. Etiket kipinde (başlık, düğme, etiket) ilk üçü denetlenmez; eksiltili
// yapı orada Türkçede de olağandır. Kaynak: references/tdk-yazim.md §8.2-8.3.

import { existsSync, readFileSync } from 'node:fs'

const TAMLAMA_YOLU = new URL('./data/tamlama-eki.json', import.meta.url)
const TAMLAMA = existsSync(TAMLAMA_YOLU) ? JSON.parse(readFileSync(TAMLAMA_YOLU, 'utf8')).kaliplar : []

const kucult = (s) => s.toLocaleLowerCase('tr')
const kelimeler = (s) => s.match(/[\p{L}\d'’-]+/gu) || []
const sonKelime = (s) => kucult(kelimeler(s).at(-1) || '')

// Öge içinde bağlaç varsa sıralama değildir. "ne" soru zamiri olabilir ("ne yapılacağını"), sayılmaz.
const ORTA_BAGLAC_RE = /(^|\s)(ve|ile|veya|yahut|ya da|ama|fakat|ancak|çünkü|ki|yani|yoksa)(\s|$)/
// Son ögeden önce beklenen bağlaç.
const BAGLAC_RE = /(^|\s)(ve|ile|veya|ya da|yahut|ya|hem|ister)(\s|$)/

// Cümle başında virgül alabilen bağlaç, zarf, kabul sözü, hitap ve zamirler (TDK 8.2/4, 9, 11, 14).
const VIRGUL_SERBEST = new Set([
  'ancak', 'ama', 'fakat', 'lakin', 'ayrıca', 'üstelik', 'dahası', 'oysa', 'halbuki', 'çünkü', 'zira', 'yani',
  'örneğin', 'mesela', 'kısacası', 'özetle', 'böylece', 'sonuçta', 'nihayet', 'belki', 'maalesef', 'neyse',
  'evet', 'hayır', 'peki', 'tamam', 'olur', 'elbette', 'tabii', 'haydi', 'hayhay', 'merhaba', 'selam',
  'sayın', 'sevgili', 'değerli', 'bu', 'şu', 'o', 'bunlar', 'şunlar', 'onlar', 'bugün', 'yarın', 'şimdi',
  'artık', 'sonra', 'önce', 'bazen', 'genelde', 'aslında', 'açıkçası', 'kısaca', 'yine', 'hâlâ', 'gerçekten',
  'doğrusu', 'öte', 'bununla', 'dolayısıyla', 'bundan', 'ilk', 'son', 'hem', 'ya', 'ne', 'ister', 'gerek',
])
const EDAT = new Set(['sonra', 'önce', 'için', 'göre', 'kadar', 'rağmen', 'beri', 'ile', 'gibi', 'dolayı', 'karşın', 'itibaren', 'boyunca', 'gereği', 'üzere', 'sayesinde', 'hâlinde', 'halinde'])

// Hâl, ulaç ve şart ekiyle biten kelime özne değildir: "İzmir'de,", "Bitirince,", "İsterseniz,".
const OZNE_DEGIL_EK = /([dt][ae]n?|[ae]|y[ae]|n[ae]|[ıiuü]?n[ıiuü]n|ken|s[ae](n[ıi]z)?|[ıiuü]?nc[ae]|[ıiuü]p|[ae]r[ae]k|m[ae]d[ae]n|d[ıiuü]kç[ae])$/
// Açık çekimli fiil sonu: bu ögeler bir sıralama değil, sıralı cümledir (TDK 8.2/2).
// Ekler kelime sonuna bağlıdır: "maliyeti" (-malı değil), "müşteri" (-müş değil) yakalanmasın.
const FIIL_SONU = /(yor(um|uz|sun|sunuz|lar)?|s[ıiuü]n[ıiuü]z|[dt][ıiuü](m|n|k|n[ıiuü]z)|m[ıiuü]ş([ıiuü]m|[ıiuü]z|t[ıiuü]r)?|[ae]r[ıi]z|[ıiuü]r[ıiuü]z|m[ae]l[ıi](y[ıi]z|d[ıi]r|s[ıi]n[ıi]z)|y?[ae]l[ıi]m|(?<!l)[ae]r|[ıiuü]r)$/u
// İki ve daha çok kelimelik ögede geniş zaman ve geçmiş zaman da yüklemdir ("rapor hazırlar",
// "-dır"); "-dı/-di" sayılmaz, "adı", "hizmeti" gibi iyelikli adlarla karışır. Tek kelimede "-lar/-ler" çoğul ad olabilir, orada sayılmaz.
const FIIL_SONU_OBEK = /([ae]r|[ıiuü]r|m[ae]z|[aeıioöuü]y[ıiuü]z|m[ae]y[ıi]z|d[ıiuü]r|t[ıiuü]r|değil|var|yok)$/
const fiilMi = (oge) => {
  const w = sonKelime(oge)
  return FIIL_SONU.test(w) || /m[ae]y[ıi]z$|[aeıioöuü]y[ıiuü]z$/.test(w) || (kelimeler(oge).length >= 2 && FIIL_SONU_OBEK.test(w))
}
// Cümle bir yüklemle mi bitiyor? Yüklemsiz etiket dizileri ("Bildirim e-postası, otomatik yanıt")
// özne + yüklem değildir.
const YUKLEM_SONU = /(r|z|yor\p{L}*|[dt][ıiuü]\p{L}{0,4}|m[ıiuü]ş\p{L}*|değil\p{L}*|var|yok|[ıiuü]m|s[ıiuü]n\p{L}*|n[ıiuü]z|l[ıi]m|[ıiuü]n|m[ae]l[ıi]|[ae]c[ae]k\p{L}*|b[ıi]l[ıi]r)$/u
// İngilizce alanlar (services-copy'deki EN çeviriler) Türkçe söz dizimiyle denetlenmez.
const EN_RE = /(^|[^\p{L}])(the|and|or|of|to|in|with|for|if|after|before|we|you|your|our|is|are|it|that|this|then|an|by|at|from|each|when|which|how|half)(?![\p{L}])/iu
const ingilizceMi = (s) => EN_RE.test(s) && !/[çğıöşüâîûÇĞİÖŞÜ]/.test(s)

// Ulaç ve şart: art arda zarf-fiiller virgülle ayrılır (TDK 8.2/13).
const ULAC_SART = /([ıiuü]p|[ae]r[ae]k|[ıiuü]?nc[ae]|m[ae]d[ae]n|ken|s[ae](n[ıi]z)?|d[ıiuü][kğ][ıiuü]nd[ae])$/

// Yüklemsiz yan cümlenin bittiği ad ve sıfatlar: "bağlı", "sizin", "hazır"...
const EKSILTI_SON = new Set([
  'bağlı', 'hazır', 'sizin', 'bizim', 'sizde', 'bizde', 'açık', 'kapalı', 'sabit', 'belli', 'net', 'dâhil',
  'dahil', 'ücretsiz', 'ait', 'garantili', 'şeffaf', 'güvende', 'elinizde', 'sizinle', 'bizden', 'sizden',
])

// Markdown satırını birimlere ayırır: başlık ve tablo satırı etikettir, madde işareti atılır.
function satirlar(temiz) {
  const cikti = []
  let konum = 0
  for (const satir of temiz.split('\n')) {
    const bas = konum
    konum += satir.length + 1
    const t = satir.trim()
    if (!t) continue
    const etiket = /^#{1,6}\s/.test(t) || /^\|/.test(t)
    const govde = t.replace(/^([-*+>]|\d+[.)])\s+/, '')
    cikti.push({ metin: govde, idx: bas + satir.indexOf(govde), etiket })
  }
  return cikti
}

// Cümlelere böl; kısaltma ve sayı noktası korunur.
function cumleBol(metin) {
  const korunan = metin
    .replace(/\b(vb|vs|bkz|Dr|Prof|Doç|Av|Sn|örn|yy|s|no|No|Tel|Mah|Cad|Sok|Blv|Apt)\./g, '$1\u0000')
    .replace(/(\d)\.(\d)/g, '$1\u0000$2')
  const parcalar = []
  let bas = 0
  for (const m of korunan.matchAll(/[.!?…]+(\s+|$)/g)) {
    parcalar.push({ metin: korunan.slice(bas, m.index + m[0].length).replace(/\u0000/g, '.'), bas })
    bas = m.index + m[0].length
  }
  if (bas < korunan.length) parcalar.push({ metin: korunan.slice(bas).replace(/\u0000/g, '.'), bas })
  return parcalar.filter((p) => p.metin.trim())
}

// Yer tutucu ({y0}) rakam sayılmasın: yerine düz bir kelime koy.
// Ayraç içi sayım ("(ne, kime, fiyat, süre)") açıklamadır, cümlenin sıralaması değildir: atılır.
const yerTutucu = (s) => s.replace(/\{[\w-]+\}/g, 'Tutar').replace(/\s*\([^()]*\)/g, '')

function listeVe(birim) {
  const s = yerTutucu(birim)
  if (/\d/.test(s) || /_/.test(s) || ingilizceMi(s)) return null // sayı, adres, teknik ad, İngilizce
  let seg = s.split(',').map((x) => x.trim())
  if (seg.length >= 2 && kelimeler(seg[0]).length === 1 && VIRGUL_SERBEST.has(kucult(seg[0]))) seg = seg.slice(1)
  if (seg.length < 3) return null
  const son = seg.at(-1).replace(/[.!?…]+$/, '')
  const sonKel = kelimeler(son)
  if (sonKel.length < 2) return null // "Umduk, bekledik, düşündük." sıralı cümle
  if (!YUKLEM_SONU.test(sonKelime(son))) return null // yüklemsiz etiket dizisi ("Boşanma, velayet, mal paylaşımı")
  const orta = seg.slice(1, -1)
  for (const o of orta) {
    const k = kelimeler(o)
    if (k.length < 1 || k.length > 4) return null
    if (ORTA_BAGLAC_RE.test(kucult(o))) return null
    if (fiilMi(o) || ULAC_SART.test(sonKelime(o))) return null
  }
  const ilkSon = sonKelime(seg[0])
  if (!ilkSon || ULAC_SART.test(ilkSon) || fiilMi(seg[0])) return null
  // Son ögeden önce bağlaç var mı? Son öge uzun olabilir ("KVKK teknik gözden geçirmesi ve …"): bütün parçaya bak.
  if (BAGLAC_RE.test(' ' + kelimeler(son).map(kucult).join(' ') + ' ')) return null
  const ogeler = [kelimeler(seg[0]).slice(-2).join(' '), ...orta, sonKel.slice(0, 2).join(' ')]
  return {
    parca: ogeler.join(', ').slice(0, 80),
    not: `${ogeler.length} ögeli sıralamada son iki öge bağlaçsız. Türkçede son iki öge "ve / ile / ya da" ile bağlanır (TDK 8.2/1): "… ${orta.at(-1)} ve ${sonKel.slice(0, 2).join(' ')} …". Ögeler ayrı cümleyse (TDK 8.2/2) yok say.`,
  }
}

function ozneVirgul(cumle) {
  const s = yerTutucu(cumle).trim()
  const m = s.match(/^([^,;:]{1,40}),\s+(.*)$/s)
  if (!m) return null
  const on = kelimeler(m[1])
  if (on.length < 1 || on.length > 3) return null
  if (kelimeler(s).length >= 20) return null // uzun cümlede uzak özneye virgül serbest (TDK 8.2/3)
  if (/[\d_/"“”]/.test(m[1]) || ingilizceMi(s)) return null
  if (!YUKLEM_SONU.test(sonKelime(s.replace(/[.!?…"“”)]+$/, '')))) return null // yüklemsiz dizi: etiket
  if (fiilMi(m[1])) return null // "İzmir merkezliyiz, ..." sıralı cümle
  // Hâl ekli ara kelime: öncesi tam bir özne değil, sıfat ya da zarf öbeği ("Taş avlumuzda doğal,",
  // "Elle yürüyen,", "Satışa odaklı,").
  if (on.slice(0, -1).some((w) => /([dt][ae]n?|[ıiuü]n|[ae])$/.test(kucult(w)))) return null
  // Açık belirtme ekli nesne: özne değil ("Hangi pazar yerini, ...").
  if (/([sn][ıiuü]n[ıiuü]|[^aeıioöuü][ıiuü]n[ıiuü]|y[ıiuü])$/.test(kucult(on.at(-1)))) return null
  const ilk = kucult(on[0])
  const son = kucult(on.at(-1))
  if (VIRGUL_SERBEST.has(ilk) || EDAT.has(son)) return null
  if (/[’']/.test(on.at(-1))) return null // "İzmir'de," gibi ekli özel ad
  if (OZNE_DEGIL_EK.test(son) && !/[ıiuü]$/.test(son)) return null
  if (FIIL_SONU.test(son) || ULAC_SART.test(son) || /[ıiuü]n$/.test(son)) return null
  // Sıralamanın ilk ögesi mi? Arkadan virgül ya da bağlaçla devam eden kısa ögeler varsa sıralamadır;
  // yalın, ünsüzle biten özneyi belirtme ekli bir öge izliyorsa özne + sıralamadır ("Keşif, maliyeti, ...").
  const devam = m[2]
  const sonraki = devam.split(/,|\s(?:ve|ile|veya|ya da)\s/)[0]
  const listeDevam = /,|\s(ve|ile|veya|ya da)\s/.test(devam) && kelimeler(sonraki).length <= 3
  if (listeDevam) {
    const belirtme = /[^aeıioöuü](y|n)?[ıiuü]$|[ıiuü]n[ıiuü]$/.test(sonKelime(sonraki))
    const unsuzSon = /[^aeıioöuüâîû]$/.test(son)
    if (!(on.length === 1 && unsuzSon && belirtme)) return null
  }
  return {
    parca: m[1] + ',',
    not: `Kısa cümlede özneden sonra virgül konmaz; virgül yalnız yüklemden uzak düşen özneden sonra gelir (TDK 8.2/3): "${m[1]} ${kelimeler(devam).slice(0, 3).join(' ')} …". Açıklama yapılacaksa iki nokta ya da noktalı virgülle ayrı yapı kur.`,
  }
}

function eksiltiliYuklem(birim) {
  if (ingilizceMi(birim)) return null
  const yan = birim.split(',').map((x) => x.replace(/[.!?…"“”]+$/g, '').trim()).filter(Boolean)
  if (yan.length < 2) return null
  const eksik = yan.filter((y) => kelimeler(y).length >= 2 && EKSILTI_SON.has(sonKelime(y)))
  if (eksik.length < 2) return null
  return {
    parca: eksik.join(', ').slice(0, 80),
    not: `Gövde metninde yüklemsiz başlık dili ("Payment tied to delivery, source code yours" kalıbı): iki yan cümlenin ikisinde de çekimli yüklem ya da ek fiil yok. Ek fiili ekle ("…bağlıdır", "…sabittir", "…sizindir") ya da cümleyi fiille kur ("Ödeme teslimata bağlıdır; iş bitince kaynak kodu size ait olur"). Başlık, düğme, etiket alanıysa --etiket ile tara.`,
  }
}

function tamlamaEki(temiz, yaz) {
  const kucuk = kucult(temiz)
  for (const { kalip, dogru, not } of TAMLAMA) {
    const re = new RegExp(`(?<!\\p{L})${kalip}(?!\\p{L})`, 'gu')
    for (const m of kucuk.matchAll(re)) {
      yaz('tamlama-eki', m.index, `Belirtisiz ad tamlamasında tamlanan iyelik eki alır: "${dogru}"${not ? ' (' + not + ')' : ''}.`, temiz.slice(m.index, m.index + kalip.length))
    }
  }
}

// temiz: markdown'dan arındırılmış metin (satır numaraları korunmuş). satirNo(idx) konumu satıra çevirir.
export function sozDizimiDenetle(temiz, secenek = {}, satirNo = () => 1) {
  const bulgular = []
  const yaz = (tur, idx, not, parca) => bulgular.push({ satir: satirNo(idx), tur, not, parca })
  tamlamaEki(temiz, yaz)
  if (secenek.etiket) return bulgular
  for (const s of satirlar(temiz)) {
    if (s.etiket) continue
    for (const c of cumleBol(s.metin)) {
      const idx = s.idx + c.bas
      const o = ozneVirgul(c.metin)
      if (o) yaz('ozne-virgul', idx, o.not, o.parca)
      for (const birim of c.metin.split(/[;:]/)) {
        const l = listeVe(birim)
        if (l) yaz('liste-ve', idx, l.not, l.parca)
      }
      for (const birim of c.metin.split(';')) {
        const e = eksiltiliYuklem(birim)
        if (e) yaz('eksiltili-yuklem', idx, e.not, e.parca)
      }
    }
  }
  return bulgular
}

export const SOZ_DIZIMI_TURLERI = ['liste-ve', 'ozne-virgul', 'eksiltili-yuklem', 'tamlama-eki']
