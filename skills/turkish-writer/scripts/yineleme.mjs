// Paragraf sonu yinelemesi: paragrafın son cümlesi, önceki cümlelerini yeni bilgi eklemeden
// başka kelimelerle tekrar ediyor mu? Uzunluk baskısı altındaki model yeni olgu ekleyemeyince
// paragrafı böyle bir cümleyle kapatır ("Girdi ve çıktı, aynı kullanım sırasında ayrı ayrı kişisel
// veri içerebilir."). Silme testinin (mantık kapısı) ölçülebilir hâli: cümle silinince bilgi
// kaybolmuyorsa dolgudur.
//
// Ölçüt (deterministik, bağımlılıksız):
//   oran  = son cümlenin içerik kelimelerinden (kök = ilk 4 harf; işlev kelimeleri ve içi boş
//           genel yüklemler hariç) paragrafın önceki cümlelerinde geçenlerin payı
//   yeni  = son cümlede metnin o noktaya kadar geçmediği rakam ya da özel ad, veya bağlantı var mı
//   bulgu = yeni yok VE en az 6 içerik kökü VE
//           (oran ≥ 0,55  ya da  bağlaç/genel hüküm kalıbıyla ("Bu nedenle…", "…ayrıca değerlendir-") oran ≥ 0,40)
// Yalnız en az iki cümlelik paragrafın son cümlesi ölçülür; başlık, liste ve alıntı satırı ölçülmez.
//
// Ayar (2026-09-27): uzunluk baskısıyla yazılmış iki blog taslağında elle işaretlenen 17 dolgu
// cümlesinin 16'sını yakalar, yeni olgu ya da kaynak taşıyan paragraf sonlarını yakalamaz. İnsan
// derlemlerinde ölçülen paragrafların %1-5'inde bulgu çıkar (tek paragraflık haber metinlerinde
// daha çok). Yapay zekâ izi değildir, skoru etkilemez: bulgu "silme testini uygula" demektir.

export const YINELEME_ESIK = 0.55
export const YINELEME_KALIP_ESIK = 0.4
export const YINELEME_EN_AZ_KELIME = 6

// Kök karşılaştırmasına girmeyen işlev kelimeleri ve içi boş genel yüklemler (kök biçiminde, ≤5 harf).
const ISLEV = new Set(`
bu şu o ve ile ya da de ki mi mı mu mü için gibi kadar daha en çok her hem ama ancak fakat yalnız
bir iki olara olan olup olmas olur olmaz olmak ise bile yani çünkü dolay böyle nedenl yüzde ayrıc
aynı ayrı tek siz sizin ben biz onu bunu bunun buna bunla bunda şunu onun ona onla değil
şey gerek sayıl eder edil yapar yapıl ilgil göre karşı üzeri sonra önce içind içinde arasın
değer ele alır alınm alına incel önem taşır sağla göste kabul birli bağlı durum biçim şekil
yer yeri konu kapsa açısı bakım yönün tarafı hâle hale olduğ olmad varlı yoktu bulun
`.trim().split(/\s+/).map((k) => (k.length > 4 ? k.slice(0, 4) : k)))

// Paragrafı genel hükümle kapatan bağlaçlar ve "ayrıca değerlendir-" türü kalıplar.
const KALIP_RE = /^(?:bu nedenle|bu yüzden|bu sebeple|dolayısıyla|böylece|bu sayede|bu sırada|bu da|yani|kısacası|özetle|sonuç olarak|bu açıdan|bu bakımdan)(?!\p{L})|(?<!\p{L})(?:ayrı(?:ca)?|birlikte|ayrı ayrı)\s+(?:\p{L}+\s+)?(?:değerlendir|ele al|incele|tut|düşün)\p{L}*/iu

const BAGLANTI_RE = /\[([^\]]*)\]\(\s*([^)\s]+)[^)]*\)/g
const baglantisiz = (s) => s.replace(BAGLANTI_RE, '$1')
const kok = (kelime) => kelime.toLocaleLowerCase('tr').replace(/['’].*$/, '').slice(0, 4)
const kelimeler = (s) => s.match(/\p{L}+(?:['’]\p{L}+)?/gu) || []
const icerikKokleri = (s) => kelimeler(s).filter((k) => k.replace(/['’].*$/, '').length >= 3).map(kok).filter((k) => !ISLEV.has(k))
const sayilar = (s) => new Set(s.match(/\d+(?:[.,]\d+)*/g) || [])

function cumleBol(paragraf) {
  const korunan = paragraf
    .replace(/(?<!\p{L})(vb|vs|bkz|Dr|Prof|Doç|Av|örn|no|md|m)\./giu, '$1\u0000')
    .replace(/(\d)\.(\d)/g, '$1\u0000$2')
  return korunan.split(/(?<=[.!?…])\s+(?=[\p{Lu}\d"“'‘(\[])/u).map((c) => c.replace(/\u0000/g, '.').trim()).filter(Boolean)
}

/** Son cümlenin taşıdığı yeni bilgi: bağlantı, metnin önceki kısmında olmayan sayı ya da özel ad. */
function yeniBilgi(son, onceki) {
  const sebep = []
  if (/\[[^\]]*\]\(/.test(son)) sebep.push('bağlantı')
  const d = baglantisiz(son), o = baglantisiz(onceki)
  const os = sayilar(o)
  if ([...sayilar(d)].some((n) => !os.has(n))) sebep.push('yeni sayı')
  const ok = new Set(kelimeler(o).map(kok))
  // Cümle başındaki kelime büyük harfle başlar; özel ad sayılmaz.
  if (kelimeler(d).slice(1).some((k) => /^\p{Lu}/u.test(k) && !ok.has(kok(k)))) sebep.push('yeni özel ad')
  return sebep
}

/** Her paragrafın son cümlesi için ölçüm: {paragraf, son, oran, kok, kalip, yeni, bulgu}. Eşik ayarı için. */
export function yinelemeOlc(metin) {
  const olcum = []
  const paragraflar = String(metin || '').replace(/\r\n/g, '\n').split(/\n\s*\n/)
    .map((p) => p.trim()).filter((p) => p && !/^(?:#{1,6}\s|[-*+>|]\s?|\d+[.)]\s)/.test(p))
  let gecmis = ''
  paragraflar.forEach((p, i) => {
    const oncekiMetin = gecmis
    gecmis += ' ' + p
    const cumleler = cumleBol(p.replace(/\s*\n\s*/g, ' '))
    if (cumleler.length < 2) return
    const son = cumleler.at(-1)
    const onceki = cumleler.slice(0, -1).join(' ')
    const yeni = yeniBilgi(son, oncekiMetin + ' ' + onceki)
    const oncekiKok = new Set(icerikKokleri(baglantisiz(onceki)))
    const sonKok = [...new Set(icerikKokleri(baglantisiz(son)))]
    const oran = sonKok.length ? sonKok.filter((k) => oncekiKok.has(k)).length / sonKok.length : 0
    const kalip = KALIP_RE.test(son)
    const bulgu = !yeni.length && sonKok.length >= YINELEME_EN_AZ_KELIME &&
      (oran >= YINELEME_ESIK || (kalip && oran >= YINELEME_KALIP_ESIK))
    olcum.push({ paragraf: i + 1, son: baglantisiz(son), oran: +oran.toFixed(2), kok: sonKok.length, kalip, yeni, bulgu })
  })
  return olcum
}

/**
 * Markdown/düz metinde paragraf sonu yinelemeleri.
 * Dönüş: [{tur: 'yineleme', parca, not, oran, paragraf}]; paragraf 1'den sayılır (başlık ve liste hariç).
 */
export function yinelemeDenetle(metin) {
  return yinelemeOlc(metin).filter((o) => o.bulgu).map((o) => ({
    tur: 'yineleme',
    parca: o.son,
    not: `paragraf sonu yinelemesi (içerik kelimelerinin %${Math.round(o.oran * 100)}'i önceki cümlelerde, yeni sayı/ad/kaynak yok${o.kalip ? ', genel hüküm kalıbı' : ''}) → cümleyi sil`,
    oran: o.oran,
    paragraf: o.paragraf,
  }))
}
