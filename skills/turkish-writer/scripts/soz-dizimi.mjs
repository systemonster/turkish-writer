// Söz dizimi kuralları: İngilizceden geçen beş yapıyı deterministik olarak bulur.
//
//   liste-ve          "maliyeti, süreyi, iş sırasını yazılı hâle getirir": son iki öge bağlaçsız
//   liste-iki         "sorunları, çözümleri tartışır": iki ögeli sıralama bağlaçsız
//   ozne-virgul       "Keşif, işin kapsamını yazar.": kısa cümlede özneden sonra virgül
//   eksiltili-yuklem  "Ödeme teslimata bağlı, kaynak kod sizin": yüklemsiz başlık dili gövdede
//   tamlama-eki       "kaynak kod", "yönetim panel": belirtisiz tamlamada iyelik eki yok
//
// Bunlar yazım hatasıdır, yapay zekâ izi değil: skoru etkilemez (ağırlık 0), ama site kapısı
// her bulguyu sayar. Etiket kipinde (başlık, düğme, etiket) ilk dördü denetlenmez; eksiltili
// yapı orada Türkçede de olağandır. Kaynak: references/tdk-yazim.md §8.2-8.3.

import { existsSync, readFileSync } from 'node:fs'

const TAMLAMA_YOLU = new URL('./data/tamlama-eki.json', import.meta.url)
const TAMLAMA = existsSync(TAMLAMA_YOLU) ? JSON.parse(readFileSync(TAMLAMA_YOLU, 'utf8')).kaliplar : []

const kucult = (s) => s.toLocaleLowerCase('tr')
const kelimeler = (s) => s.match(/[\p{L}\d'’-]+/gu) || []
const sonKelime = (s) => kucult(kelimeler(s).at(-1) || '')

// Öge içinde bağlaç varsa sıralama değildir. "ne" soru zamiri olabilir ("ne yapılacağını"), sayılmaz.
const ORTA_BAGLAC_RE = /(^|\s)(ve|ile|veya|yahut|ya da|ama|fakat|ancak|çünkü|ki|yani|yoksa)(\s|$)/
// Son ögeden önce beklenen bağlaç; "hatta", "özellikle" gibi pekiştiren geçişler de son ögeyi ayırır.
const BAGLAC_RE = /(^|\s)(ve|ile|veya|ya da|yahut|ya|hem|ister|hatta|özellikle|bilhassa|hele|ayrıca|keza)(\s|$)/
// Örnek sayımı açık uçludur, son iki öge bağlaç istemez: "Logo, Mikro, Netsis gibi".
const ORNEK_RE = /(^|\s)(gibi|vb|vs|vesaire|falan|filan|derken)(\.|\s|$)/
// Tekrarlı bağlaç ve koşut açılış: "ne geçmişte, ne şimdi, ne gelecekte" (TDK 8.2, virgül konmayan yerler).
const TEKRAR = new Set(['ne', 'hem', 'ya', 'ister', 'gerek', 'kimi', 'bazen', 'kâh', 'bir', 'her', 'biraz'])
const TIRNAK_RE = /["“”«»]|''/
const SAYI_KELIME = new Set(['bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'yüz', 'bin'])

// Cümle başında virgül alabilen bağlaç, zarf, kabul sözü, hitap ve zamirler (TDK 8.2/4, 9, 11, 14).
const VIRGUL_SERBEST = new Set([
  'ancak', 'ama', 'fakat', 'lakin', 'ayrıca', 'üstelik', 'dahası', 'oysa', 'halbuki', 'çünkü', 'zira', 'yani',
  'örneğin', 'mesela', 'kısacası', 'özetle', 'böylece', 'sonuçta', 'nihayet', 'belki', 'maalesef', 'neyse',
  'evet', 'hayır', 'peki', 'tamam', 'olur', 'elbette', 'tabii', 'haydi', 'hayhay', 'merhaba', 'selam',
  'sayın', 'sevgili', 'değerli', 'bu', 'şu', 'o', 'bunlar', 'şunlar', 'onlar', 'bugün', 'yarın', 'şimdi',
  'artık', 'sonra', 'önce', 'bazen', 'genelde', 'aslında', 'açıkçası', 'kısaca', 'yine', 'hâlâ', 'gerçekten',
  'doğrusu', 'öte', 'bununla', 'dolayısıyla', 'bundan', 'ilk', 'son', 'hem', 'ya', 'ne', 'ister', 'gerek',
  // ara söz ve seslenme (TDK 8.2/4, 8.2/11)
  'nitekim', 'misal', 'yalnız', 'hani', 'malum', 'malumunuz', 'birincisi', 'ikincisi', 'üçüncüsü', 'sonuncusu',
  'sanırım', 'bence', 'galiba', 'herhalde', 'işte', 'zaten', 'hatta', 'velhasıl', 'meğer', 'aksine', 'tabi',
  'nasıl', 'efendim', 'hocam', 'arkadaşlar', 'dostlar', 'beyler', 'hanımlar', 'çocuklar', 'kısacası', 'keza',
])
// Ad cümlesinin yüklemi olan kelimeler: "Benim çalışmam lazım, …" yan cümledir.
const YUKLEM_AD = new Set(['lazım', 'gerek', 'gerekli', 'şart', 'mümkün', 'var', 'yok', 'değil', 'belli', 'tamam'])
const EDAT = new Set(['sonra', 'önce', 'için', 'göre', 'kadar', 'rağmen', 'beri', 'ile', 'gibi', 'dolayı', 'karşın', 'itibaren', 'boyunca', 'gereği', 'üzere', 'sayesinde', 'hâlinde', 'halinde'])

// Hâl, ulaç ve şart ekiyle biten kelime özne değildir: "İzmir'de,", "Bitirince,", "İsterseniz,".
const OZNE_DEGIL_EK = /([dt][ae]n?|[ae]|y[ae]|n[ae]|[ıiuü]?n[ıiuü]n|ken|s[ae](n[ıi]z)?|[ıiuü]?nc[ae]|[ıiuü]p|[ae]r[ae]k|m[ae]d[ae]n|d[ıiuü]kç[ae])$/
// Açık çekimli fiil sonu: bu ögeler bir sıralama değil, sıralı cümledir (TDK 8.2/2).
// Ekler kelime sonuna bağlıdır: "maliyeti" (-malı değil), "müşteri" (-müş değil) yakalanmasın.
const FIIL_SONU = /(yor(um|uz|sun|sunuz|lar)?|s[ıiuü]n[ıiuü]z|[dt][ıiuü](m|n|k|n[ıiuü]z)|m[ıiuü]ş([ıiuü]m|[ıiuü]z|t[ıiuü]r)?|[ae]r[ıi]z|[ıiuü]r[ıiuü]z|m[ae]l[ıi](y[ıi]z|d[ıi]r|s[ıi]n[ıi]z)|y?[ae]l[ıi]m|(?<!l)[ae]r|[ıiuü]r)$/u
// İki ve daha çok kelimelik ögede geniş zaman ve geçmiş zaman da yüklemdir ("rapor hazırlar",
// "-dır"); "-dı/-di" sayılmaz, "adı", "hizmeti" gibi iyelikli adlarla karışır. Tek kelimede "-lar/-ler" çoğul ad olabilir, orada sayılmaz.
const FIIL_SONU_OBEK = /([ae]r|[ıiuü]r|m[ae]z|[aeıioöuü]y[ıiuü]z|m[ae]y[ıi]z|d[ıiuü]r|t[ıiuü]r|değil|var|yok)$/
// Görülen geçmiş ve ek fiilin hikâyesi: yalnız ünsüz kümesinden sonra ("alındı", "etti", "vardı",
// "dostluktu"). Ünlüden sonraki "-dı/-ti" ("adı", "maliyeti") iyelikli ad olabilir, sayılmaz.
const GECMIS = /(m[ae]d[ıi]|[ıiuü][ln]d[ıiuü]|tt[ıiuü]|[rlz]d[ıiuü]|[çfhkpsş]t[ıiuü]|(yok|var|değil)[dt][ıiuü])$/
const GECMIS_DEGIL = new Set(['hindi', 'yurdu', 'kurdu', 'ferdi'])
// Sıfat-fiil ve yapım ekli sıfat: özne ya da sıralama ögesi değil, ada bağlanan niteleme
// ("gelen", "seçilen", "arayan", "sevdiğim", "yükseltecek", "panelli", "tuzsuz").
const SIFAT_FIIL = /([aeıioöuü]y[ae]n|[ıiuü][ln][ae]n|[dt][ıiuü]ğ[ıiuü](m|n|m[ıiuü]z|n[ıiuü]z)?|[ae]c[ae]k|[ae]c[ae]ğ[ıiuü](m|n|m[ıiuü]z|n[ıiuü]z)?)$/u
// "gösteren", "yükselten", "genişleten": yalnız iki+ kelimelik öbekte. Ayrılma eki ünlüden sonra "-dan",
// sert ünsüzden sonra "-tan" olur; bu yüzden "-tan" yalnız ünlü ve l/r/n'den sonra, "-dan" yalnız "eden/giden"de sıfat-fiildir.
const SIFAT_FIIL_GENIS = /([^aeıioöuüdt][ae]n|[aeıioöuülrn]t[ae]n|^eden|^giden)$/
const AN_AD = new Set(['zaman', 'insan', 'ekran', 'meydan', 'tören', 'maden', 'neden', 'liman', 'orman', 'vatan', 'kazan',
  'uzman', 'düşman', 'beden', 'bakan', 'başkan', 'divan', 'heyecan', 'iran', 'ilan', 'yılan', 'beyan', 'sultan', 'kaptan',
  'yiyecek', 'içecek', 'giyecek', 'gelecek', 'erken', 'diken', 'değirmen', 'kalkan', 'harman', 'tavan', 'devran', 'roman', 'hayvan', 'kervan', 'duman', 'yorgan', 'organ', 'plan', 'slogan', 'kaftan', 'şeytan', 'kapan', 'vegan'])
const sifatMi = (oge) => {
  const k = kelimeler(oge)
  const w = kucult(k.at(-1) || '')
  if (AN_AD.has(w) || /stan$/.test(w)) return false
  if (SIFAT_FIIL.test(w)) return true
  if (w.length >= 5 && /(l[ıiuü]|s[ıiuü]z|s[ae]l)$/.test(w)) return true
  return k.length >= 2 && SIFAT_FIIL_GENIS.test(w)
}
const fiilMi = (oge) => {
  const w = sonKelime(oge)
  const obek = kelimeler(oge).length >= 2
  return FIIL_SONU.test(w) || (GECMIS.test(w) && !GECMIS_DEGIL.has(w)) || /m[ae]y[ıi]z$|[aeıioöuü]y[ıiuü]z$/.test(w) ||
    (obek && FIIL_SONU_OBEK.test(w)) || (obek && /s[ıiuü]n$/.test(w) && !['mersin', 'yasin'].includes(w)) // istek: "eylesin"
}
// Cümle bir yüklemle mi bitiyor? Yüklemsiz etiket dizileri ("Bildirim e-postası, otomatik yanıt")
// özne + yüklem değildir.
const YUKLEM_SONU = /(r|z|yor\p{L}*|[dt][ıiuü]\p{L}{0,4}|m[ıiuü]ş\p{L}*|değil\p{L}*|var|yok|[ıiuü]m|s[ıiuü]n\p{L}*|n[ıiuü]z|l[ıi]m|[ıiuü]n|m[ae]l[ıi]|[ae]c[ae]k\p{L}*|b[ıi]l[ıi]r)$/u
// İngilizce alanlar (services-copy'deki EN çeviriler) Türkçe söz dizimiyle denetlenmez.
const EN_RE = /(^|[^\p{L}])(the|and|or|of|to|in|with|for|if|after|before|we|you|your|our|is|are|it|that|this|then|an|by|at|from|each|when|which|how|half)(?![\p{L}])/iu
const ingilizceMi = (s) => EN_RE.test(s) && !/[çğıöşüâîûÇĞİÖŞÜ]/.test(s)

// Ulaç ve şart: art arda zarf-fiiller virgülle ayrılır (TDK 8.2/13).
const ULAC_SART = /([ıiuü]p|[ae]r[ae]k|[ıiuü]?nc[ae]|m[ae]d[ae]n|ken|s[ae](n[ıi]z)?|d[ıiuü][kğ][ıiuü]nd[ae])$/

// Hâl eki: kelimenin taşıyabileceği hâller. Ek belirsizse birden çok ("maliyeti": belirtme ya da
// iyelikli yalın; "pasta": yalın ya da yönelme). Sıralamanın ögeleri ortak bir hâlde buluşur.
const EK_AD = new Set(['makine', 'hazine', 'define', 'suyu', 'ayı', 'koyu', 'kuyu'])
function hal(kelime) {
  const kesme = /[’']/.test(kelime)
  const w = kucult(kelime).replace(/[’']/g, '')
  if (EDAT.has(w) || w === 'gibi') return new Set(['edat:' + w])
  let h
  if (EK_AD.has(w)) h = ['yalin']
  else if (/(l[ae]r|n|[ıiuü]m|[ıiuü]z)[dt][ae]n$|[çfhkpşt]t[ae]n$/.test(w) || (/[aeıioöuü]d[ae]n$/.test(w) && !AN_AD.has(w) && !['fidan', 'sedan', 'vicdan'].includes(w))) h = ['ayrilma']
  else if (/[dt][ae]n$/.test(w)) h = ['ayrilma', 'yalin']
  else if (/(l[ae]r|n)[dt][ae]$|[çfhkpşt]t[ae]$/.test(w)) h = ['bulunma']
  else if (/[dt][ae]$/.test(w)) h = ['bulunma', 'yalin']
  else if (/yl[ae]$/.test(w)) h = ['vasita']
  else if (/(n|l[ae]r|m|z)[ıiuü]n$/.test(w)) h = ['ilgi']
  else if (/(l[ae]r|[ıiuü]n)[ae]$|[aeıioöuü]ğ[ae]$/.test(w) && w !== 'ağa') h = ['yonelme']
  else if (/(s[ıiuü]|ğ[ıiuü]|l[ae]r[ıi]|z[ıiuü]|m[ıiuü]|y[ıiuü])n[ıiuü]$|[aeıioöuü]y[ıiuü]$|[mn][ıiuü]z[ıiuü]$/.test(w) && w !== 'kırmızı') h = ['belirtme']
  else if (/[^aeıioöuü][ıiuü]$/.test(w)) h = ['belirtme', 'yalin']
  else if (/[^aeıioöuü]l[ae]$/.test(w)) h = ['vasita', 'yonelme', 'yalin']
  else if (/[ae]$/.test(w)) h = ['yonelme', 'yalin']
  else h = ['yalin']
  if (kesme && h.length > 1) h = h.filter((x) => x !== 'yalin')
  return new Set(h)
}
const kesisim = (kumeler) => kumeler.reduce((a, b) => new Set([...a].filter((x) => b.has(x))))
// Son parçanın ilk öbeği: "iş sırasını yazılı hâle getirir" → "sırasını". İlk iki kelimeden yalın olmayan ilki.
function sonOgeHali(son) {
  for (const w of kelimeler(son).slice(0, 2)) {
    const h = hal(w)
    if (!(h.size === 1 && h.has('yalin'))) return h
  }
  return new Set(['yalin'])
}

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
  if (/\d/.test(s) || /_/.test(s) || ingilizceMi(s) || TIRNAK_RE.test(s)) return null // sayı, adres, teknik ad, İngilizce, alıntı
  let seg = s.split(',').map((x) => x.trim())
  // Baştaki bağlaç, ara söz ya da "…ki," yan cümlesi sıralamaya girmez.
  if (seg.length >= 2 && ((kelimeler(seg[0]).length === 1 && VIRGUL_SERBEST.has(kucult(seg[0]))) || sonKelime(seg[0]) === 'ki')) seg = seg.slice(1)
  if (seg.length < 3) return null
  const son = seg.at(-1).replace(/[.!?…]+$/, '')
  const sonKel = kelimeler(son)
  if (sonKel.length < 2) return null // "Umduk, bekledik, düşündük." sıralı cümle
  if (!YUKLEM_SONU.test(sonKelime(son))) return null // yüklemsiz etiket dizisi ("Boşanma, velayet, mal paylaşımı")
  if (ORNEK_RE.test(' ' + sonKel.slice(0, 6).map(kucult).join(' ') + ' ')) return null // örnek sayımı: "… gibi"
  const orta = seg.slice(1, -1)
  for (const o of orta) {
    const k = kelimeler(o)
    if (k.length < 1 || k.length > 4) return null
    if (ORTA_BAGLAC_RE.test(kucult(o)) || ORNEK_RE.test(kucult(o) + ' ')) return null
    // Ortadaki tek kelime de sıfat-fiil olabilir: "bakan, gören, yansıtan bir yazı".
    if (fiilMi(o) || ULAC_SART.test(sonKelime(o)) || sifatMi(o) || (k.length === 1 && SIFAT_FIIL_GENIS.test(kucult(o)) && !AN_AD.has(kucult(o)))) return null
  }
  const ilkSon = sonKelime(seg[0])
  if (!ilkSon || ULAC_SART.test(ilkSon) || fiilMi(seg[0]) || sifatMi(seg[0])) return null
  // Son ögeden önce bağlaç var mı? Son öge uzun olabilir ("KVKK teknik gözden geçirmesi ve …"): bütün parçaya bak.
  if (BAGLAC_RE.test(' ' + sonKel.map(kucult).join(' ') + ' ')) return null
  // Tekrarlı bağlaç: "ne şimdi, ne gelecekte".
  const ilkKel = (x) => kucult(kelimeler(x)[0] || '')
  if (TEKRAR.has(ilkKel(son)) && ilkKel(son) === ilkKel(orta.at(-1))) return null
  // Hâl uyumu: sıralamanın ögeleri aynı hâldedir. Uymayan ilk parça özne ya da zarf olabilir
  // ("Keşif, ne yapılacağını, maliyeti, …"): onu atıp kalanlara bak.
  let ilk = seg[0]
  let araOgeler = orta
  const haller = (a, o) => [hal(sonKelime(a)), ...o.map((x) => hal(sonKelime(x))), sonOgeHali(son)]
  if (kesisim(haller(ilk, araOgeler)).size === 0) {
    if (orta.length < 2 || kesisim(haller(orta[0], orta.slice(1))).size === 0) return null
    ilk = orta[0]
    araOgeler = orta.slice(1)
  }
  const ogeler = [kelimeler(ilk).slice(-2).join(' '), ...araOgeler, sonKel.slice(0, 2).join(' ')]
  return {
    parca: ogeler.join(', ').slice(0, 80),
    not: `${ogeler.length} ögeli sıralamada son iki öge bağlaçsız. Türkçede son iki öge "ve / ile / ya da" ile bağlanır (TDK 8.2/1): "… ${ogeler.at(-2)} ve ${sonKel.slice(0, 2).join(' ')} …". Ögeler ayrı cümleyse (TDK 8.2/2) yok say.`,
  }
}

// İki ögeli bağlaçsız sıralama: "sorunları, çözümleri tartışır". Ögeler yalın dışında aynı hâlde ya da
// aynı çoğul ek dizisiyle ("-ları / -leri") biter; virgülden önceki parça yüklem ya da ulaçla bitmez
// (yan cümle zinciri değil), virgülden sonraki parça kısadır ve yüklemle biter.
const eksiz = (w) => kucult(w).replace(/[’']/g, '').replace(/[ae]/g, 'A').replace(/[ıiuü]/g, 'I')
const cumleSonuMu = (x) => fiilMi(x) || ULAC_SART.test(sonKelime(x)) || YUKLEM_SONU.test(sonKelime(x))
function listeIki(birim) {
  const s = yerTutucu(birim)
  if (/\d/.test(s) || /_/.test(s) || ingilizceMi(s) || TIRNAK_RE.test(s)) return null
  const seg = s.split(',').map((x) => x.trim().replace(/[.!?…]+$/, '')).filter(Boolean)
  for (let i = 0; i + 1 < seg.length; i++) {
    const a = seg[i]
    const b = seg[i + 1]
    if (i > 0 && !cumleSonuMu(seg[i - 1])) continue // a daha uzun bir sıralamanın parçası: liste-ve'nin işi
    const aKel = kelimeler(a)
    const bKel = kelimeler(b)
    if (bKel.length < 2 || bKel.length > 6 || !YUKLEM_SONU.test(sonKelime(b))) continue
    if (i + 2 < seg.length && !fiilMi(b)) continue // b'den sonra sıralama sürüyor
    if (BAGLAC_RE.test(' ' + kucult(b) + ' ') || ORNEK_RE.test(' ' + kucult(b) + ' ')) continue
    if (aKel.length === 1 && VIRGUL_SERBEST.has(kucult(a))) continue
    const x = aKel.at(-1)
    const y = bKel[0]
    if (!x || fiilMi(a) || ULAC_SART.test(kucult(x)) || sifatMi(a) || fiilMi(y) || sifatMi(y)) continue
    // y'den sonra sıfat-fiil geliyorsa y o yan cümlenin ögesidir ("projelerini yürüttüğümüz müşterilere").
    const z = kucult(bKel[1] || '').replace(/l[ae]r$/, '')
    if (SIFAT_FIIL.test(z) || (SIFAT_FIIL_GENIS.test(z) && !AN_AD.has(z))) continue
    const hx = hal(x)
    const hy = hal(y)
    const ortak = kesisim([hx, hy])
    // Kesin hâl: iki kelimede de ek belirsiz değil ("süreyi, bütçeyi"). İlgi hâli sayılmaz: "kalitenin, geleceğinin
    // teminatı" gibi virgül anlam ayırmak için konur (TDK 8.2/10).
    const kesin = ortak.size > 0 && !hx.has('yalin') && !hy.has('yalin') && !ortak.has('ilgi') && ![...ortak].some((h) => h.startsWith('edat'))
    const kosut = ortak.size > 0 && x.length > 4 && y.length > 4 && /l[ae]r/.test(kucult(x)) && eksiz(x).slice(-4) === eksiz(y).slice(-4)
    if (!kesin && !kosut) continue
    // "A ve B-yle, C-yle": üç öge var, bağlaç yanlış yerde.
    const baglacli = aKel.slice(-3, -1).map(kucult).some((w) => /^(ve|ile|veya)$/.test(w))
    if (baglacli) {
      const uc = aKel.slice(-3).join(' ')
      return {
        parca: `${uc}, ${y}`,
        not: `Üç ögeli sıralamada bağlaç yanlış yerde: "${uc}, ${y}". Türkçede son iki öge bağlanır (TDK 8.2/1): "A, B ve C". Ögeler ayrı işlevdeyse cümleyi ikiye böl.`,
      }
    }
    return {
      parca: `${aKel.slice(-2).join(' ')}, ${y}`,
      not: `İki ögeli sıralama bağlaçsız: "${x}, ${y}". Türkçede iki öge "ve / ile / ya da" ile bağlanır, virgülle değil (TDK 8.2/1): "${x} ve ${y} …". Virgül bir yan cümleyi ayırıyorsa yok say.`,
    }
  }
  return null
}

// Yüklem 1. ya da 2. kişiyle çekimliyse virgülden önceki 3. kişi ad özne olamaz: nesne, seslenme ya da
// ara sözdür ("Bedeli, teslimden sonra ödersiniz.", "Hocam, … misiniz?").
const EMIR_DEGIL = new Set(['ürün', 'altın', 'yakın', 'bütün', 'kalın', 'uygun', 'olgun', 'yorgun', 'düzgün', 'bugün', 'dizin', 'zemin', 'tahmin', 'yemin', 'sürgün', 'haşin', 'metin', 'sakin', 'emin'])
const KISI_12 = /(yoru[mz]|yorsunuz|[ae]r[ıi][mz]|[ıiuü]r[ıiuü][mz]|m[ae]z(s[ıi]n[ıi]z)?|m[ae]y[ıi][mz]|[ae]c[ae][ğk][ıi][mz]|m[ıiuü]ş[ıiuü][mz]|m[ae]l[ıi]y[ıi][mz]|[dt][ıiuü][mkn]|[dt][ıiuü]n[ıiuü]z|s[ıiuü]n[ıiuü]z|y[ıiuü][nmz]|l[ıi]m)$/
// Yüklemden uzak düşen özne (TDK 8.2/3): virgülden sonra bu kadar kelime varsa virgül yerindedir.
const UZAK_OZNE = 8

function ozneVirgul(cumle) {
  const s = yerTutucu(cumle).trim()
  const m = s.match(/^([^,;:]{1,40}),\s+(.*)$/s)
  if (!m) return null
  const on = kelimeler(m[1])
  if (on.length < 1 || on.length > 3) return null
  if (kelimeler(s).length >= 20) return null // uzun cümlede uzak özneye virgül serbest (TDK 8.2/3)
  if (/[\d_/"“”]/.test(m[1]) || ingilizceMi(s)) return null
  const yuklem = sonKelime(s.replace(/[.!?…"“”)]+$/, ''))
  if (!YUKLEM_SONU.test(yuklem)) return null // yüklemsiz dizi: etiket
  if (KISI_12.test(yuklem)) return null // özne 3. kişi olamaz: nesne, seslenme ya da ara söz
  if (/[^aeıioöuüy][ıiuü]n$/.test(yuklem) && !EMIR_DEGIL.has(yuklem)) return null // emir: "… gelin", "… seçin"
  // Varlık cümlesi ("Ağrı, sızı yok.", "Muhtarlar, mahalle baskısı vardı."): virgülden önceki ad "var/yok"un öznesi değil.
  if (/^(var|yok)(d[ıi]|t[uı]|m[ıu]ş|d[ıi]r|t[uı]r)?$/.test(yuklem)) return null
  if (fiilMi(m[1]) || YUKLEM_AD.has(sonKelime(m[1]))) return null // "Siparişiniz alındı, ..." yüklemli yan cümle
  if (sonKelime(m[1]) === 'ki') return null // "Anladım ki, ..." ara söz
  // Sıfat sıralaması: "Yönetim panelli, veri tabanlı ...", "Arayan soran, ilgi gösteren ...". Sıfat-fiil tek başına
  // yeter; "-lı/-sız" ekli kelimede virgülden sonra ikinci bir sıfat aranır ("egzersiz" ad olabilir).
  if (SIFAT_FIIL.test(sonKelime(m[1])) && !AN_AD.has(sonKelime(m[1]))) return null
  if (sifatMi(m[1]) && kelimeler(m[2]).slice(0, 3).some((w) => sifatMi(w) || SIFAT_FIIL_GENIS.test(kucult(w)))) return null
  // Hâl ekli ara kelime: öncesi tam bir özne değil, sıfat ya da zarf öbeği ("Taş avlumuzda doğal,",
  // "Elle yürüyen,", "Satışa odaklı,").
  if (on.slice(0, -1).some((w) => /([dt][ae]n?|[ıiuü]n|[ae])$/.test(kucult(w)))) return null
  // Açık belirtme ekli nesne: özne değil ("Hangi pazar yerini, ...").
  if (/([sn][ıiuü]n[ıiuü]|[^aeıioöuü][ıiuü]n[ıiuü]|y[ıiuü])$/.test(kucult(on.at(-1)))) return null
  const ilk = kucult(on[0])
  const son = kucult(on.at(-1))
  if (VIRGUL_SERBEST.has(ilk) || EDAT.has(son) || SAYI_KELIME.has(son)) return null
  if (/[’']/.test(on.at(-1))) return null // "İzmir'de," gibi ekli özel ad
  if (OZNE_DEGIL_EK.test(son) && !/[ıiuü]$/.test(son)) return null
  if (FIIL_SONU.test(son) || ULAC_SART.test(son) || /[ıiuü]n$/.test(son)) return null
  const devam = m[2]
  if (/^["“'‘]/.test(devam)) return null // konuşan + alıntı: "Günay, "…" dedi."
  if (ilk === kucult(kelimeler(devam)[0] || '')) return null // koşut öbek: "Her zaman, her yerde"
  // Sıralamanın ilk ögesi mi? Arkadan virgül ya da bağlaçla devam eden kısa ögeler varsa sıralamadır;
  // yalın, ünsüzle biten özneyi belirtme ekli bir öge izliyorsa özne + sıralamadır ("Keşif, maliyeti, ...").
  // Çok kelimeli öbekte "-sı/-ı" iyeliktir, belirtme değil: "Kapsam, SKU sayısı ve …" sayımdır.
  const sonraki = devam.split(/,|\s(?:ve|ile|veya|ya da)\s/)[0]
  const listeDevam = /,|\s(ve|ile|veya|ya da)\s/.test(devam) && kelimeler(sonraki).length <= 3
  let ozneSirala = false
  if (listeDevam) {
    // Kesin belirtme ("süreyi", "iş sırasını") özne + sıralama; belirsiz "-ı" ("maliyeti", "Cumhurbaşkanı")
    // karar vermez, uzaklık ölçütüne bırakılır; yalın öge ("SKU sayısı ve …") sayımdır.
    const h = hal(sonKelime(sonraki))
    const unsuzSon = /[^aeıioöuüâîû]$/.test(son)
    const cokKelime = kelimeler(sonraki).length >= 2
    if (!(on.length === 1 && unsuzSon && h.has('belirtme')) || (cokKelime && h.has('yalin'))) return null
    ozneSirala = !h.has('yalin')
  }
  if (!ozneSirala && kelimeler(devam).length >= UZAK_OZNE) return null // yüklemden uzak düşen özne (TDK 8.2/3)
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
        const iki = l ? null : listeIki(birim)
        if (iki) yaz('liste-iki', idx, iki.not, iki.parca)
      }
      for (const birim of c.metin.split(';')) {
        const e = eksiltiliYuklem(birim)
        if (e) yaz('eksiltili-yuklem', idx, e.not, e.parca)
      }
    }
  }
  return bulgular
}

export const SOZ_DIZIMI_TURLERI = ['liste-ve', 'liste-iki', 'ozne-virgul', 'eksiltili-yuklem', 'tamlama-eki']
