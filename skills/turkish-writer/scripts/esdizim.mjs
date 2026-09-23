// Eş dizim denetimi: "Türk böyle söyler mi?"
//
// İngilizceden birebir çevrilen kalıplar ("karar yapmak" ← make a decision,
// "fotoğraf almak" ← take a photo) Türkçede var olan kelimelerle kurulur,
// yazım denetiminden geçer ama kulağa yabancı gelir. Bunları kural listesiyle
// yakalamak bitmez; burada LLM öncesi büyük bir derlemde (OSCAR 2019) sayılmış
// (isim, fiil) çift sıklıkları kullanılır.
//
// Veri scripts/data/esdizim.json dosyasındadır; `node esdizim-derle.mjs` ile
// yerelde üretilir, depoda dağıtılmaz. Dosya yoksa denetim sessizce boş döner.
//
// Morfoloji çözümleyici yok. Kök yaklaşımı:
//   fiil: aşağıdaki fiillerin çekimli biçimleri üretilir ve bir sözlükte köke
//         bağlanır (yapıyor, yapılacak, yapamadığı → yapmak). Üretim yolu,
//         "yapı", "yapım", "veri" gibi isimlerin fiil sanılmasını kendiliğinden
//         önler: bunlar hiçbir çekim şablonundan çıkmaz.
//   isim: fiilden hemen önceki kelime; belirtme/yönelme, iyelik ve çoğul ekleri
//         soyulmuş adaylar arasından derlemde en sık geçen seçilir
//         (kararı → karar, çözüme → çözüm, soruyu → soru, kapı → kapı).

import { readFileSync, existsSync } from 'node:fs'

// ---------------------------------------------------------------------------
// Fiiller
// ---------------------------------------------------------------------------
// k: kök, e: edilgen gövde (null: üretme; ör. "katıl-" ayrı bir fiil,
// "bulun-" ayrı sayılıyor), g: geniş zaman eki ('' = düzenli: ünlüyle biten
// kökte -r, çok heceli kökte -Ir, tek heceli kökte -Ar), y: t→d yumuşaması
// (et-, kaydet-), b: yalın emir biçimi ("karar ver") eşleşsin mi. Yalın emir
// yalnız başka bir kelimeyle karışmayan köklerde açık: "at", "kat", "aç",
// "koy", "kur", "düş", "kazan" hem fiil hem isim.
export const FIILLER = [
  { m: 'yapmak', k: 'yap', e: 'yapıl', g: 'Ar', b: 1 },
  { m: 'etmek', k: 'et', e: 'edil', g: 'Ar', y: 1, b: 1 },
  { m: 'vermek', k: 'ver', e: 'veril', g: 'Ir', b: 1 },
  { m: 'almak', k: 'al', e: 'alın', g: 'Ir' },
  { m: 'sağlamak', k: 'sağla', e: 'sağlan', b: 1 },
  { m: 'yaratmak', k: 'yarat', e: 'yaratıl', b: 1 },
  { m: 'oluşturmak', k: 'oluştur', e: 'oluşturul', b: 1 },
  { m: 'gerçekleştirmek', k: 'gerçekleştir', e: 'gerçekleştiril', b: 1 },
  { m: 'sunmak', k: 'sun', e: 'sunul', g: 'Ar' },
  { m: 'getirmek', k: 'getir', e: 'getiril', b: 1 },
  { m: 'katmak', k: 'kat', e: null, g: 'Ar' },
  { m: 'kazanmak', k: 'kazan', e: 'kazanıl' },
  { m: 'çekmek', k: 'çek', e: 'çekil', g: 'Ar' },
  { m: 'tutmak', k: 'tut', e: 'tutul', g: 'Ar' },
  { m: 'bulunmak', k: 'bulun', e: null },
  { m: 'olmak', k: 'ol', e: null, g: 'Ir' },
  { m: 'geçmek', k: 'geç', e: null, g: 'Ar' },
  { m: 'açmak', k: 'aç', e: 'açıl', g: 'Ar' },
  { m: 'koymak', k: 'koy', e: 'konul', g: 'Ar' },
  { m: 'atmak', k: 'at', e: 'atıl', g: 'Ar' },
  { m: 'göstermek', k: 'göster', e: 'gösteril', b: 1 },
  { m: 'taşımak', k: 'taşı', e: null },
  { m: 'üstlenmek', k: 'üstlen', e: 'üstlenil', b: 1 },
  { m: 'oynamak', k: 'oyna', e: 'oynan', b: 1 },
  { m: 'kurmak', k: 'kur', e: 'kurul', g: 'Ar' },
  { m: 'düşmek', k: 'düş', e: null, g: 'Ar' },
  { m: 'harcamak', k: 'harca', e: 'harcan', b: 1 },
  { m: 'ödemek', k: 'öde', e: 'öden', b: 1 },
  { m: 'sormak', k: 'sor', e: 'sorul', g: 'Ar' },
  { m: 'bırakmak', k: 'bırak', e: 'bırakıl', b: 1 },
  { m: 'bulmak', k: 'bul', e: null, g: 'Ir' },
  { m: 'çıkarmak', k: 'çıkar', e: 'çıkarıl' },
  { m: 'kaydetmek', k: 'kaydet', e: 'kaydedil', g: 'Ar', y: 1, b: 1 },
  { m: 'edinmek', k: 'edin', e: 'edinil' },
  { m: 'geçirmek', k: 'geçir', e: 'geçiril', b: 1 },
  { m: 'kullanmak', k: 'kullan', e: 'kullanıl', b: 1 },
  { m: 'uygulamak', k: 'uygula', e: 'uygulan', b: 1 },
  { m: 'yürütmek', k: 'yürüt', e: 'yürütül', b: 1 },
  { m: 'sürdürmek', k: 'sürdür', e: 'sürdürül', b: 1 },
  { m: 'görmek', k: 'gör', e: 'görül', g: 'Ir' },
  { m: 'yaşamak', k: 'yaşa', e: 'yaşan' },
  { m: 'duymak', k: 'duy', e: 'duyul', g: 'Ar' },
  { m: 'çözmek', k: 'çöz', e: 'çözül', g: 'Ar' },
  { m: 'izlemek', k: 'izle', e: 'izlen', b: 1 },
  { m: 'kaybetmek', k: 'kaybet', e: 'kaybedil', g: 'Ar', y: 1 },
  { m: 'kurtarmak', k: 'kurtar', e: 'kurtarıl' },
  { m: 'girmek', k: 'gir', e: null, g: 'Ar' },
  { m: 'bakmak', k: 'bak', e: 'bakıl', g: 'Ar' },
  { m: 'tanımak', k: 'tanı', e: 'tanın' },
  { m: 'belirlemek', k: 'belirle', e: 'belirlen', b: 1 },
  { m: 'düzenlemek', k: 'düzenle', e: 'düzenlen', b: 1 },
  { m: 'artırmak', k: 'artır', e: 'artırıl', b: 1 },
  { m: 'göndermek', k: 'gönder', e: 'gönderil', b: 1 },
  { m: 'kalmak', k: 'kal', e: null, g: 'Ir' },
  { m: 'kaldırmak', k: 'kaldır', e: 'kaldırıl' },
  { m: 'yakalamak', k: 'yakala', e: 'yakalan' },
  { m: 'doğurmak', k: 'doğur', e: null },
  { m: 'çalmak', k: 'çal', e: 'çalın', g: 'Ar' },
  { m: 'yazmak', k: 'yaz', e: 'yazıl', g: 'Ar' },
  { m: 'ulaşmak', k: 'ulaş', e: null },
]

// Fiilin çekimli biçimi olarak da üretilen ama metinde çoğunlukla isim ya da
// başka bir kelime olan biçimler. Bunlar fiil sayılmaz.
const ESSESLI = new Set([
  'alan', 'alanı', 'alana', 'alanın', 'alanlar', 'alanları', 'alanlara', 'alanların',
  'sorun', 'koyun', 'atın', 'bakan', 'bakanı', 'bakanlar', 'bakanları', 'bakanın',
  'yazar', 'yazarlar', 'yazarı', 'yazarın', 'okur', 'tutar', 'tutarı', 'katar',
  'düşünce', 'düşün', 'düşünüz', 'olarak', 'tanıdık', 'tanıdıklar', 'kazan',
  'kurun', 'çalın', 'yaşar', 'çıkarı', 'çıkarlar', 'çıkarları', 'çekince', 'çekinceler',
  'yakalar', 'ödem', 'girişim', 'atar', 'bulun', 'yazın', 'kaldırım', 'oldukça',
])

// ---------------------------------------------------------------------------
// Ses uyumu ile ek ekleme
// ---------------------------------------------------------------------------
const UNLU = 'aeıioöuü'
const KALIN = 'aıou'
const YUVARLAK = 'oöuü'
const SERT = 'çfhkpsşt'
const unlu = (c) => UNLU.includes(c)
function sonUnlu(s) {
  for (let i = s.length - 1; i >= 0; i--) if (unlu(s[i])) return s[i]
  return 'e'
}
const harfA = (s) => (KALIN.includes(sonUnlu(s)) ? 'a' : 'e')
function harfI(s) {
  const u = sonUnlu(s)
  if (KALIN.includes(u)) return YUVARLAK.includes(u) ? 'u' : 'ı'
  return YUVARLAK.includes(u) ? 'ü' : 'i'
}

// Şablon harfleri: A (a/e), I (ı/i/u/ü), D (d/t), Y (ünlüden sonra y),
// J (-Iyor için: gövde ünlüyle bitiyorsa o ünlü düşer, yerine I gelir:
// sağla+Jyor → sağlıyor). Kökten sonra gelen k, ünlüden önce ğ olur
// (yapacak+Im → yapacağım); kökün kendi k'si yumuşamaz (çeker, bırakır).
function ekle(govde, sablon, kokUzunluk) {
  let s = govde
  for (const c of sablon) {
    let ek
    if (c === 'A') ek = harfA(s)
    else if (c === 'I') ek = harfI(s)
    else if (c === 'D') ek = SERT.includes(s[s.length - 1]) ? 't' : 'd'
    else if (c === 'Y') ek = unlu(s[s.length - 1]) ? 'y' : ''
    else if (c === 'J') {
      if (unlu(s[s.length - 1])) s = s.slice(0, -1)
      ek = harfI(s)
    } else ek = c
    if (ek && unlu(ek[0]) && s.endsWith('k') && s.length > kokUzunluk) s = s.slice(0, -1) + 'ğ'
    s += ek
  }
  return s
}

const KISI_DI = ['', 'm', 'n', 'k', 'nIz', 'lAr']
const SABLONLAR = [
  ...KISI_DI.map((k) => 'DI' + k),
  ...['', 'Im', 'sIn', 'Iz', 'sInIz', 'lAr', 'tIr', 'tI', 'tIm', 'tIk', 'lArdIr', 'sA', 'lAr'].map((k) => 'mIş' + k),
  ...['', 'um', 'sun', 'uz', 'sunuz', 'lar', 'du', 'dum', 'duk', 'lardı', 'muş', 'sa', 'dur'].map((k) => 'Jyor' + k),
  ...['', 'Im', 'sIn', 'Iz', 'sInIz', 'lAr', 'tIr', 'tI', 'sA', 'mIş', 'lArdIr', 'I', 'InI', 'InA', 'IndA', 'IndAn', 'InIn', 'ImIz', 'lArI', 'lArInI'].map((k) => 'YAcAk' + k),
  ...['', 'yIm', 'yIz', 'sIn', 'sInIz', 'dIr', 'ydI', 'lAr'].map((k) => 'mAlI' + k),
  ...KISI_DI.map((k) => 'sA' + k),
  'YAyIm', 'YAlIm', 'YIn', 'YInIz', 'sIn', 'sInlAr',
  ...['', 'tA', 'tAdIr', 'tAdIrlAr', 'tAyIz', 'tAydI', 'tAn', 'lA', 'sIzIn', 'tIr'].map((k) => 'mAk' + k),
  ...['', 'sI', 'sInI', 'sInA', 'sIndA', 'sIndAn', 'sIylA', 'sInIn', 'yI', 'yA', 'dA', 'dAn', 'm', 'mIz', 'nIz', 'lArI', 'lArInI', 'lArInA', 'yIz'].map((k) => 'mA' + k),
  ...['', 'lAr', 'lArI', 'lArA', 'lArIn', 'lArdAn', 'lArdA', 'In', 'A', 'I'].map((k) => 'YAn' + k),
  ...['', 'I', 'InI', 'InA', 'IndA', 'IndAn', 'InIn', 'Im', 'ImIz', 'InIz', 'lArI', 'lArInI', 'lArInA', 'lArIndA', 'tAn', 'çA', 'IylA', 'ImI', 'ImIzI'].map((k) => 'DIk' + k),
  'YIp', 'YArAk', 'YIncA', 'mAdAn', 'mAksIzIn', 'YAlI',
]
const GENIS_KISI = ['', 'Im', 'sIn', 'Iz', 'sInIz', 'lAr', 'DI', 'DIm', 'DIk', 'lArDI', 'sA', 'mIş', 'DIr', 'lArdIr']
const OLUMSUZ_GENIS = ['z', 'zlAr', 'zDI', 'zsA', 'zmIş', 'zsIn', 'm', 'yIz', 'zsInIz']

function biçimler(f) {
  const cikti = new Set()
  const govdeler = [[f.k, f.g ?? (unlu(f.k.at(-1)) ? 'r' : 'Ir')]]
  if (f.e) govdeler.push([f.e, 'Ir'])
  for (const [g, genis] of govdeler) {
    const kokMu = g === f.k
    const n = g.length
    const tabanlar = [
      [g, genis],
      [ekle(g, 'mA', n), null],
      [ekle(g, 'YAbil', n), 'Ir'],
      [ekle(g, 'YAmA', n), null],
    ]
    for (const [t, gz] of tabanlar) {
      for (const s of SABLONLAR) cikti.add(ekle(t, s, n))
      if (gz) for (const k of GENIS_KISI) cikti.add(ekle(t, gz + k, n))
      else for (const k of OLUMSUZ_GENIS) cikti.add(ekle(t, k, n))
    }
    cikti.add(ekle(g, 'mA', n)) // "yapma": olumsuz emir / fiil adı
    if (kokMu && f.b) cikti.add(g)
  }
  // et- → ed-: kökten hemen sonra ünlü geliyorsa (ediyor, edecek, kaydeder)
  if (!f.y) return cikti
  const n = f.k.length
  const duz = new Set()
  for (const b of cikti) duz.add(b.startsWith(f.k) && unlu(b[n] || '') ? f.k.slice(0, -1) + 'd' + b.slice(n) : b)
  return duz
}

// biçim → fiil sırası. Aynı biçimi iki fiil üretiyorsa ilk yazılan kazanır
// ("edin": etmek'in emri, edinmek'in kökü → etmek).
export const FIIL_BICIM = (() => {
  const m = new Map()
  FIILLER.forEach((f, i) => {
    for (const b of biçimler(f)) if (!m.has(b) && !ESSESLI.has(b)) m.set(b, i)
  })
  return m
})()

// ---------------------------------------------------------------------------
// Metni kelimelere bölme
// ---------------------------------------------------------------------------
// Cümle ve yan cümle sınırları (nokta, virgül, parantez, tırnak, tire...)
// çiftleri böler; "karar, verdi" bir çift değildir. Rakam, kesme işaretli özel
// ad ("Türkiye'nin") ve harf dışı içeren parçalar da sınır sayılır (null).
const SINIR = /[.!?…;:,()[\]{}"“”«»‘’\n\r\t–—/\\|*•·=+<>#@&%$€₺]+/
export function kelimeDizileri(metin) {
  const diziler = []
  for (const parca of metin.toLocaleLowerCase('tr').split(SINIR)) {
    const d = []
    for (const k of parca.split(/\s+/)) {
      if (!k) continue
      d.push(/^\p{L}+$/u.test(k) ? k : null)
    }
    if (d.length > 1) diziler.push(d)
  }
  return diziler
}

// ---------------------------------------------------------------------------
// İsim kökü
// ---------------------------------------------------------------------------
// g→k yalnız -nk sonunda (renk → rengi); yoksa "ilgi" → "ilk" olurdu.
const YUMUSAK = { ğ: 'k', b: 'p', c: 'ç', d: 't' }
// [ek deseni, önündeki harf: 'u' ünsüz olmalı, 'v' ünlü olmalı, '' fark etmez]
const EK_SOY = [
  [/(lar|ler)(ı|i|a|e|ına|ine|ını|ini)?$/, ''],
  [/(ın|in|un|ün)(ı|i|u|ü|a|e)$/, 'u'],
  [/(sın|sin|sun|sün)(ı|i|u|ü|a|e)$/, 'v'],
  [/y(ı|i|u|ü|a|e)$/, 'v'],
  [/s(ı|i|u|ü)$/, 'v'],
  [/(ı|i|u|ü|a|e)$/, 'u'],
]
export function isimAdaylari(k) {
  const a = [k]
  for (const [re, once] of EK_SOY) {
    const m = k.match(re)
    if (!m) continue
    const g = k.slice(0, m.index)
    if (g.length < 2) continue
    const son = g[g.length - 1]
    if (once === 'u' && unlu(son)) continue
    if (once === 'v' && !unlu(son)) continue
    a.push(g)
    // Ünlüyle başlayan ek önündeki yumuşamayı geri al: kitabı → kitap
    if (once === 'u' && YUMUSAK[son]) a.push(g.slice(0, -1) + YUMUSAK[son])
    if (once === 'u' && son === 'g' && g.endsWith('ng')) a.push(g.slice(0, -1) + 'k')
  }
  return a
}
// Adaylardan derlemde en sık geçen biçim; hiçbiri bilinmiyorsa kelimenin kendisi.
// Yönelme eki soyulduysa köke "+A" eklenir: yönelme durumundaki isim fiile
// başka bir bağla bağlanır ("çözüme ulaşmak", "yakınlarına duyulan") ve
// dağılımı yalın/belirtme hâlinden ayrı tutulur. Yoksa "sınava alınmak"
// "sınav almak" sayılır.
export function isimKoku(k, siklik) {
  let en = k
  let enS = siklik(k)
  for (const a of isimAdaylari(k).slice(1)) {
    const s = siklik(a)
    if (s > enS) { en = a; enS = s }
  }
  return en !== k && /[ae]$/.test(k) ? en + '+A' : en
}
// Gösterim: "çözüm+A" → "çözüm(e)"
export const isimGoster = (i) => (i.endsWith('+A') ? i.slice(0, -2) + '(' + harfA(i.slice(0, -2)) + ')' : i)

// ---------------------------------------------------------------------------
// Veri ve denetim
// ---------------------------------------------------------------------------
export const VERI_YOLU = new URL('./data/esdizim.json', import.meta.url)
let _veri
export function veriYukle(yol = VERI_YOLU) {
  if (_veri !== undefined && yol === VERI_YOLU) return _veri
  let v = null
  if (existsSync(yol)) {
    const ham = JSON.parse(readFileSync(yol, 'utf8'))
    const isimler = new Map()
    for (const [ad, [siklik, toplam, dizi]] of Object.entries(ham.isimler)) {
      const fiil = new Map()
      if (dizi) for (const p of dizi.split(',')) { const [i, c] = p.split(':'); fiil.set(+i, +c) }
      isimler.set(ad, { siklik, toplam, fiil })
    }
    const bicim = new Map(Object.entries(ham.kelimeler))
    const ciftToplam = ham.fiilCift.reduce((a, b) => a + b, 0)
    v = { ...ham, isimler, bicim, fiilPay: ham.fiilCift.map((c) => c / ciftToplam) }
  }
  if (yol === VERI_YOLU) _veri = v
  return v
}
export const esdizimVerisiVar = () => existsSync(VERI_YOLU)

// Eşikler (tests/kalibrasyon/SONUC-ESDIZIM.md'deki sınamayla seçildi):
//   isim derlemde en az MIN_ISIM kez geçmeli ve listedeki fiillerden birinin
//   önünde en az MIN_TOPLAM kez görülmüş olmalı (dağılım güvenilir olsun).
//   Gözlenen/beklenen oranı (O/E) ORAN'ın altındaysa ve beklenen en az
//   MIN_BEKLENEN ise çift zayıftır. Beklenen = ismin toplamı × fiilin genel payı.
//   Ayrıca ismin fiil dağılımında payı PAY'ın altındaysa (‰1) ve isim yeterince
//   sıksa (toplam ≥ 1/PAY × 3) zayıftır.
export const ESIK = { MIN_ISIM: 200, MIN_TOPLAM: 50, ORAN: 0.2, MIN_BEKLENEN: 30, PAY: 0.001 }

// Varlık/iyelik fiilleri: "sunumu olacak", "görevleri olduğunu", "eylemi
// bulunduğunu" eş dizim değil, "(bir şeyi) var" yapısıdır. Bu fiiller
// dağılımda sayılır ve öneri olarak çıkabilir ama işaretlenmez.
const ISARETLENMEZ = new Set(['olmak', 'bulunmak'].map((m) => FIILLER.findIndex((f) => f.m === m)))

// Fiilin önünde durup nesnesi olmayan kelimeler: edat, bağlaç, zamir, soru ve
// durum zarfları ("ne alsam", "için ulaşmanız", "gibi koyuyordu", "neden
// gösteremiyor"). İnsan metnindeki yanlış pozitiflerin çoğu bunlardı.
const NESNE_DEGIL = new Set(`ne için gibi üzerine üzere var yok neden niye niçin nasıl öyle böyle şöyle
tabi tabii iyi iyice çok daha en az bir bu şu o her hiç kadar göre karşı sonra önce ile ve veya ya yahut
de da ki mi mı mu mü bile hem ama fakat ancak çünkü yakın uzak hep artık hala hâlâ zaten sadece yalnız
yalnızca yine gene şimdi bugün dün yarın kim hangi biz siz ben sen onlar bunu şunu onu bunları onları
bana sana ona bize size onlara beni seni bizi sizi kendi kendini kendine birlikte beraber geri ileri
hemen hızla hızlı kolay kolayca asla bazen sık sık hep hiçbir herkes birini birine şey şeyi şeyler
şeyleri böylece ayrıca aynı başka diğer tüm bütün hangi birçok bazı pek gayet oldukça gerçekten
mutlaka kesinlikle belki sanki adeta hatta`.split(/\s+/))
// Bulunma/ayrılma durumundaki isim ("bölgesinde verdiği", "elden sağlanması")
// nesne değildir. Kelime, ekini atınca derlemde daha sık bir biçime
// iniyorsa bulunma/ayrılma sayılır ("fayda" → "fay" inmez, "alanda" → "alan" iner).
function bulunmaAyrilma(k, siklik) {
  const m = k.match(/n?(da|de|ta|te|dan|den|tan|ten)$/)
  if (!m || m.index < 2) return false
  const g = k.slice(0, m.index)
  return siklik(g) > siklik(k) || (m[0][0] === 'n' && siklik(g + 'n') > siklik(k))
}

const yuzde = (x) => (x >= 0.1 ? Math.round(x * 100) : (x * 100).toFixed(1).replace('.', ','))

export function esdizimDenetle(metin, secenek = {}) {
  const v = secenek.veri ?? veriYukle()
  if (!v) return []
  const e = { ...ESIK, ...secenek.esik }
  const siklik = (k) => v.bicim.get(k) || 0
  const bulgular = []
  for (const d of kelimeDizileri(metin)) {
    for (let i = 1; i < d.length; i++) {
      const fi = d[i] && FIIL_BICIM.get(d[i])
      if (fi === undefined || fi === null || ISARETLENMEZ.has(fi) || !d[i - 1] || FIIL_BICIM.has(d[i - 1])) continue
      if (NESNE_DEGIL.has(d[i - 1]) || bulunmaAyrilma(d[i - 1], siklik)) continue
      const isim = isimKoku(d[i - 1], siklik)
      const s = v.isimler.get(isim)
      if (!s || s.siklik < e.MIN_ISIM || s.toplam < e.MIN_TOPLAM) continue
      const o = s.fiil.get(fi) || 0
      const beklenen = s.toplam * v.fiilPay[fi]
      const pay = o / s.toplam
      const zayifOran = beklenen >= e.MIN_BEKLENEN && o / beklenen < e.ORAN
      const zayifPay = s.toplam >= 3 / e.PAY && pay < e.PAY
      if (!zayifOran && !zayifPay) continue
      const oneriler = [...s.fiil.entries()]
        .filter(([j]) => j !== fi)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([j, c]) => ({ fiil: FIILLER[j].m, pay: c / s.toplam }))
        .filter((o) => o.pay >= 0.03)
      const fiil = FIILLER[fi].m
      const ad = isimGoster(isim)
      bulgular.push({
        tur: 'esdizim',
        ifade: `${d[i - 1]} ${d[i]}`,
        isim,
        fiil,
        cift: o,
        isimToplam: s.toplam,
        beklenen: Math.round(beklenen),
        pay,
        oneriler,
        mesaj:
          `"${ad} ${fiil}" derlemde zayıf (${o} kez, beklenen ~${Math.round(beklenen)}). ` +
          (oneriler.length
            ? `Türkçede "${ad}" en çok şu fiillerle geçer: ${oneriler.map((o) => `${o.fiil} (%${yuzde(o.pay)})`).join(', ')}`
            : 'Başka bir fiil deneyin.'),
      })
    }
  }
  return bulgular
}
