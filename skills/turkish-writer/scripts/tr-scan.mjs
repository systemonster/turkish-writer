#!/usr/bin/env node
// turkish-writer tarayıcısı: Türkçe metinde yapay zekâ izlerini ve TDK yazım
// hatalarını sayar. Bağımlılık yok, Node 18+.
//
//   node tr-scan.mjs metin.md               # rapor
//   node tr-scan.mjs a.md b.txt --json      # makine okunur
//   cat metin.txt | node tr-scan.mjs -      # stdin
//   --tipografi                             # düz kesme (') yerine ’ iste
//
// Tarayıcı yalnızca ölçülebilir olanı yakalar. Ritim, yapı, boş cümle, üçlü
// liste gibi izler regexle güvenilir biçimde yakalanamaz; onlar SKILL.md'deki
// okuma geçişleriyle gözle bakılır. Skor bir tahmindir, karar değil.

import { readFileSync, existsSync } from 'node:fs'
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
import { esdizimDenetle } from './esdizim.mjs'

// Sözlük: sık yazım yanlışları ve bozuk eş dizimler. Dosya yoksa bu denetim
// sessizce atlanır; tarayıcı yine çalışır.
const SOZLUK_YOLU = new URL('./data/yanlis-yazim.json', import.meta.url)
const SOZLUK = existsSync(SOZLUK_YOLU) ? JSON.parse(readFileSync(SOZLUK_YOLU, 'utf8')) : { yanlis: {}, esdizim: [] }

// TDK dizini: `node tdk-dizin-derle.mjs` ile yerelde üretilir (TDK verisi,
// depoda dağıtılmaz). Yoksa bu denetim atlanır.
const DIZIN_YOLU = new URL('./data/tdk-dizin.json', import.meta.url)
const DIZIN = existsSync(DIZIN_YOLU) ? JSON.parse(readFileSync(DIZIN_YOLU, 'utf8')) : null
const TEKIL = new Set(DIZIN?.tekil ?? [])

// ---------------------------------------------------------------------------
// Metin hazırlama
// ---------------------------------------------------------------------------

// Markdown'dan görünmeyen parçaları at: kod blokları, satır içi kod, URL,
// HTML etiketleri, ön madde (front matter). Yerine boşluk koyulur ki satır
// numaraları kaymasın.
function temizle(src) {
  const bosluk = (m) => m.replace(/[^\n]/g, ' ')
  return src
    .replace(/^---\n[\s\S]*?\n---\n/, bosluk)
    .replace(/```[\s\S]*?```/g, bosluk)
    .replace(/`[^`\n]*`/g, bosluk)
    .replace(/https?:\/\/\S+/g, bosluk)
    .replace(/<[^>\n]+>/g, bosluk)
}

const HARF = 'a-zçğıöşüâîûA-ZÇĞİÖŞÜÂÎÛ'
const KELIME_RE = new RegExp(`[${HARF}]+(?:['’][${HARF}]+)?`, 'g')
const kucult = (s) => s.toLocaleLowerCase('tr')

function kelimeler(metin) {
  return metin.match(KELIME_RE) || []
}

// Cümle bölme: nokta, soru, ünlem, üç nokta. Kısaltma ve sayıdaki noktalar
// (vb., 14.900, 1.) bölme yapmasın diye kaba bir koruma var.
function cumleler(metin) {
  const korunan = metin
    .replace(/\b(vb|vs|bkz|Dr|Prof|Doç|Av|Sn|örn|yy|s|no|Tel|Mah|Cad|Sok|Blv|Apt)\./gi, '$1\u0000')
    .replace(/(\d)\.(\d)/g, '$1\u0000$2')
  return korunan
    .split(/(?<=[.!?…])\s+|\n{2,}/)
    .map((c) => c.replace(/\u0000/g, '.').trim())
    .filter((c) => kelimeler(c).length >= 1 && !/^#{1,6}\s/.test(c) && !/^[-*|>]/.test(c))
}

// JavaScript'te \b yalnız ASCII harfleri tanır: "özetle", "çığır", "şuan" gibi
// Türkçe harfle başlayan ya da biten kelimelerde sınır bulunmaz ve kalıp hiç
// eşleşmez. Bütün regexler bu yardımcıdan geçer: \b, Unicode harf sınırına
// çevrilir ve u + g bayrakları eklenir.
const UB = String.raw`(?:(?<!\p{L})(?=\p{L})|(?<=\p{L})(?!\p{L}))`
function tr(re, ekBayrak = '') {
  // Kaynaktaki "\b" dizisini (ters bölü + b) değiştir; "\\b" (kaçışlı ters
  // bölü + b) ya da karakter sınıfı içindeki \b yok, bu kalıplarda kullanılmıyor.
  const kaynak = re.source.split(String.raw`\b`).join(UB)
  const bayrak = new Set([...re.flags, 'u', 'g', ...ekBayrak])
  return new RegExp(kaynak, [...bayrak].join(''))
}

function heceSayisi(kelime) {
  return (kucult(kelime).match(/[aeıioöuüâîû]/g) || []).length
}

function satirNo(src, idx) {
  let n = 1
  for (let i = 0; i < idx; i++) if (src[i] === '\n') n++
  return n
}

// ---------------------------------------------------------------------------
// Kalıp listeleri
// ---------------------------------------------------------------------------

// Her kalıp: [ad, regex, not]. Regexler küçük harfe çevrilmiş metne uygulanır.
const KALIPLAR = [
  // Giriş ve kapanış
  ['giris-klisesi', /(^|[.!?]\s+)(elbette|tabii ki|kesinlikle|harika bir soru|işte (size|sizin için))\b/, 'Doğrudan konuya gir.'],
  ['giris-klisesi', /günümüz(ün)? (hızla değişen )?dünyasında|gelin,? birlikte (inceleyelim|bakalım)|bu yazıda\b|bu noktada şunu belirtmek gerekir/, 'Doğrudan konuya gir.'],
  ['kapanis-klisesi', /\b(sonuç olarak|özetle|kısacası|özetlemek gerekirse|netice itibarıyla|görüldüğü üzere)\b/, 'Söylenecek bittiyse metin biter.'],
  ['kapanis-klisesi', /unutma(yın|mak gerekir|malıdır) ki|umarım (faydalı|yardımcı) ol|başka bir konuda yardımcı olmamı|çekinmeyiniz|çekinmeyin\b/, 'Kapanış yeni bilgi taşımıyorsa sil.'],
  ['meta', /bir yapay zek[aâ] (dil modeli )?olarak|eğitim verilerime göre|mevcut bilgilere dayanarak/, 'Sohbet artığı metne girmez.'],

  // Mekanik geçiş: tek tek kusur değil, yoğunluğu ölçülür (aşağıda)
  // Boş vurgu ve şişirme
  ['bos-vurgu', /büyük önem (taşı|arz)|kritik (bir )?rol oyna|hayati önem|kritik öneme sahip|önemli bir rol oyna|önemli katkı sağla/, 'Önemli deme, önemini göster.'],
  ['bos-vurgu', /(kapsamlı|etkili|mükemmel) bir (şekilde|biçimde)|son derece önemli/, 'Zarfı sil ya da ölçülebilir olgu koy.'],
  ['hype', /\b(benzersiz|eşsiz|kusursuz|sorunsuz|zahmetsizce|muhteşem|büyüleyici|devrim niteliğinde|çığır açan|oyun değiştir|dünya standartlarında|son teknoloji|yeni nesil|geleceğe hazır|vizyoner|sihirli)/, 'Sıfatı sil, olgu koy.'],
  ['hype', /(dönüştürün|güçlendirin|keşfedin|potansiyelinizi|bir üst seviyeye|zirveye taşı|fark yaratın|hayal edin|dijital yolculu|çözüm ortağınız|ihtiyacınız olan her şey|başarıya giden yol|tek tıkla(?!ma))/, 'Ne yaptığını düz Türkçeyle yaz.'],

  // Olumsuz koşutluk
  ['olumsuz-kosutluk', /\b(sadece|yalnızca)\b[^.!?]{2,60}\bdeğil\b/, 'Ne olduğunu doğrudan söyle.'],
  ['olumsuz-kosutluk', /\bdeğil,\s*(aynı zamanda|bilakis|asıl|tam tersine)\b|\bmesele\b[^.!?]{2,40}\bdeğil\b/, 'Olumsuzlanan kısmı at.'],

  // Bürokratik yüklem ve edilgen
  ['burokratik', /\b\p{L}+(maktadır|mektedir)\b/u, '-yor ya da geniş zamana çevir.'],
  ['burokratik', /\b(tarafından|tarafımızca|firmamızca)\b/, 'Etkene çevir, özneyi düşür.'],
  ['burokratik', /\bsöz konusu(dur)?\b|\bmevcuttur\b/, 'Somut fiil kullan.'],

  // Çeviri kokan edat kalıpları
  ['ceviri-kokusu', /\b\p{L}+(mak|mek) adına\b/u, '"-mek için" yaz.'],
  ['ceviri-kokusu', /\b\p{L}+ noktasında\b|\baçısından bakıldığında\b|\bile ilgili olarak\b|\bbazında\b|\bnezdinde\b/u, 'Edat kalıbını sil ya da sadeleştir.'],
  ['ceviri-kokusu', /\b(düşünüyorum|görülmektedir|söylenebilir) ki\b|\bolduğu söylenebilir\b/, 'Yan cümleyi öne al: "X diye düşünüyorum".'],
  ['ceviri-kokusu', /\bdeğer kat|\bbir etki yarat/, 'Hangi değeri, hangi etkiyi? Somut yaz.'],
  ['ceviri-kokusu', /\bdinamik dünyasında|(sürekli|hızla) değişen dünyasında|oyun değiştiri\p{L}*|konfor alanı\p{L}*|bir sonraki seviyeye|kendinize şu soruyu sorun|doğru duydunuz|\bgoblen/, 'Birebir çevrilmiş metafor; düz Türkçeyle söyle.'],

  // Aşağıdakiler insanca (MIT) ve turkish-humanify (MIT) kaynaklarından uyarlandı;
  // kalibrasyonda ayrıca ölçülmedi, ağırlıkları düşük. Bkz. _kaynak/fark-tr.md §F.
  ['giris-klisesi', /dijitalleşen dünyada|hepimizin bildiği gibi|hayatımızın vazgeçilmez (bir )?parçası|teknolojinin hızla (geliş|ilerle)\p{L}*|giderek (daha )?önem kazan\p{L}*|(^|[.!?]\s+)günümüzde\b/, 'İlk cümle asıl bilgiyle başlasın.'],
  ['yalanci-aralik', /\b(?!(?:pazartesi|salı|çarşamba|perşembe|cuma|cumartesi|pazar|ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık|sabah|akşam|baştan|uçtan))\p{L}+(dan|den|tan|ten)\s+(\p{L}+\s+){0,2}\p{L}+(a|e|ya|ye|na|ne)\s+(kadar|uzanan)\b/, 'Sahte aralık ("küçük işletmelerden büyük kurumlara kadar"): uçları at, neyi kapsadığını say.'],
  ['anons-ikinokta', /\b(asıl (soru|mesele|sorun|fark|değer)|sorun|cevap|çözüm|ortak nokta|gerçek|işin sırrı|mesele) (şu|basit|belli|açık|net)\s*:/, 'Önce söyle, sonra adlandır; iki noktayı liste ve alıntıya sakla.'],
  ['kosac-kacisi', /işlevi gör\p{L}*|olarak hizmet vermekte\p{L}*|olarak öne çıkmakta\p{L}*|niteliği taşı\p{L}*|özelliğine sahip|konumundadır|barındırmaktadır/, 'Düz söyle: "X, Y." / "X\'te Y var."'],
  ['yuzeysel-ulac', /\b(katkıda bulunarak|katkı sağlayarak|gözler önüne serer\p{L}*|altını çizerek|ışık tutarak|pekiştirerek|ortaya koyarak|yansıtarak|vurgulayarak)\b/, 'Cümle sonuna asılan -arak öbeği bilgi taşımıyorsa sil.'],
  ['kesik-yigin', /(?<=^|[.!?…]\s)(?:(?:[\p{L}\d'’%]+\s){0,3}[\p{L}\d'’%]+[.!?…](?:\s+|$)){3,}/, 'Art arda kısa cümle yığını ("Hızlı. Güvenli. Basit."): bağla, vurgu için birini bırak.'],
  ['retorik-soru', /\bpeki (bu ne anlama geliyor|neden|ya siz|ya sonuç|ne yapmalı)|cevap (çok )?basit\s*:|hiç merak ettiniz mi|sonuç mu\s*\?/, 'Kendi sorusunu cevaplama; bilgiyi düz ver.'],
  ['saga-dallanma', /,\s*bu (sistem|özellik|hizmet|araç|yöntem|platform|çözüm|uygulama|modül|paket)\p{L}*\s/, 'İngilizce sağa dallanma: niteleyeni öne al ("her gece rapor üreten bir sistem kurduk").'],
  ['yapi-nakli', /\b\p{L}+(la|le|yla|yle) (da |de )?kalmıyor|\bile (de )?kalmıyor|\p{L}+(dan|den|tan|ten) öte,? bir\b/, '"X\'le kalmıyor, Y" çift kanadı: tek iddiayı söyle.'],
  ['aforizma', /\b\p{L}+(nın|nin|nun|nün|ın|in|un|ün) dilidir\b|bir yaşam biçimi|başarının anahtarı|\bher şey \p{L}+ (ile )?başlar\b|(^|[.!?]\s+)belki de (asıl|en)\b|\ben büyük \p{L}+,? en derin/, 'Vecizenin işaret ettiği somut iddiayı yaz.'],
  ['anons', /\b(yakından bakalım|derinliklerine dal\p{L}*|derinlemesine (inceleyelim|dalalım|bakalım)|bilmeniz gereken her şey|lafı uzatmadan|şimdi \p{L}+ geçelim|hadi başlayalım)\b/, 'Anons etme, yap.'],
  ['sahte-samimi', /\b(dürüst olmak gerekirse|açık konuşalım|işin aslı şu|gerçek şu ki|itiraf edeyim)\b/, 'Teatral kancayı at, doğrudan söyle.'],
  ['bos-dogru', /güven zamanla (inşa edilir|kazanılır)|başarı bir gecede|her (büyük )?yolculuk (ilk|tek) (bir )?adımla|değişim kaçınılmaz|her ilişkinin (temeli|anahtarı)|tutarlılık (çok )?önemli/, 'Tersini savunan yoksa bilgi yok: somutlaştır ya da sil.'],
  ['relatif-ki', /(?<!(öyle|böyle|şöyle|o kadar|bu kadar)[^.!?]{0,40})\b\p{L}+(d|t)(ı|i|u|ü)k ki\b/, 'İngilizce "that" kalkı: sıfat-fiille öne al ("şablon kaydetmeyi sağlayan bir özellik ekledik").'],
  ['yer-tutucu-ek', /\]['’]\p{L}+/, 'Yer tutucuya ek bağlanmış: cümleyi etrafından kur.'],

  // GPT'nin kendi sözlüğü (SONUC-FARK.md, 28 çift, metin sayısı insan/gpt-4o):
  // adeta 1/12, macera 2/9. Tek başına kusur değil, kümelenince imza.
  ['gpt-sozlugu', /\b(adeta|macera\p{L}*|serüven\p{L}*|yelken aç\p{L}*|zamanda yolculu\p{L}*|büyülü (bir )?dünya\p{L}*|tanışma fırsatı\p{L}*|kalbimi fethet\p{L}*|deneyimi sun\p{L}*|deneyim sun\p{L}*|unutulmaz bir deneyim|paha biçilmez|kendimi \p{L}+ken buldum)\b/, 'GPT sözlüğü: olguyu düz söyle ("16 USD\'ye geldim", "yolculuk cüzdanıma yük bindirdi" değil).'],
  ['giris-klisesi', /(^|\n)\s*(merhaba|selam)(lar)?,? (sevgili|değerli) (okur|okuyucu|takipçi)\p{L}*|bugün (sizi|sizlere|sizinle) \p{L}+ (götür|anlat|paylaş)\p{L}*|hazırsanız başlayalım/, 'Selamla, anonsla açma: ilk cümle olayı ya da iddiayı versin.'],
]

// Mekanik geçişler: her biri tek başına doğru; kusur yoğunlukta.
const GECISLER = /\b(bununla birlikte|öte yandan|bu bağlamda|bu doğrultuda|bu kapsamda|dolayısıyla|buna ek olarak|ek olarak|dahası|ayrıca|öncelikle|ikinci olarak)\b/g

// Hafif fiiller
const HAFIF_FIIL = /\b(gerçekleştir|sağla(?!m)|oluştur|bulunma|yer al|ifade et)\p{L}*/gu

// Ulaçlar: -ip, -ArAk, -IncA, -DIkçA, -mAdAn, -ken, -AlI, -DIğIndA
const ULAC = new RegExp(
  '\\b\\p{L}{2,}(' +
    [
      'ıp', 'ip', 'up', 'üp',
      'arak', 'erek',
      'ınca', 'ince', 'unca', 'ünce',
      'dıkça', 'dikçe', 'dukça', 'dükçe', 'tıkça', 'tikçe', 'tukça', 'tükçe',
      'madan', 'meden',
      'ken',
      'dığında', 'diğinde', 'duğunda', 'düğünde', 'tığında', 'tiğinde', 'tuğunda', 'tüğünde',
    ].join('|') +
    ')\\b',
  'gu',
)
// Ulaç gibi görünüp ulaç olmayan sık kelimeler
const ULAC_DEGIL = new Set([
  'kip', 'tip', 'ekip', 'sahip', 'garip', 'kalıp', 'hap', 'kitap', 'grup', 'kulüp', 'tüp',
  'erken', 'iken', 'şeken', 'keken', 'dikken', 'mekan', 'göken',
  'bayrak', 'yaprak', 'toprak', 'kaymak', 'parmak', 'kucak', 'ancak', 'sıcak', 'bıçak',
  'tarak', 'durak', 'kurak', 'örnek', 'yemek', 'ekmek', 'dilek', 'yürek', 'erkek', 'ördek',
  'bebek', 'gerek', 'melek', 'çiçek', 'çilek', 'kelebek', 'etek', 'bilek', 'yedek',
  'balkan', 'ince', 'ilince', 'bence', 'sence', 'bizce', 'sizce',
  'arabaken', 'derken',
])

const EDILGEN_YAKLASIK = /\b\p{L}{3,}(ıl|il|ul|ül)(makta|mekte|mıştır|miştir|muştur|müştür|acaktır|ecektir|ır|ir|ur|ür)\b/gu
const EDILGEN_DEGIL = /^(bil|gel|kal|ol|sil|del|böl|dol|sal|çal|al|bul|kur|dil|yıl|el|kıl|gül|öl|ver|dön)/

// ---------------------------------------------------------------------------
// TDK yazım denetimleri
// ---------------------------------------------------------------------------

// [ad, regex (özgün harfli metne), doğrusu]
const TDK = [
  ['birlesik', /\bher ?şey\b(?<!her şey)/i, 'her şey'],
  ['birlesik', /\bherşey/i, 'her şey'],
  ['birlesik', /\bhiç bir\b/i, 'hiçbir'],
  ['birlesik', /\bhiçbirşey/i, 'hiçbir şey'],
  ['birlesik', /\bbir kaç\b/i, 'birkaç'],
  ['birlesik', /\bbir çok\b/i, 'birçok'],
  ['birlesik', /\bbirşey/i, 'bir şey'],
  ['birlesik', /\bbirsürü\b/i, 'bir sürü'],
  ['birlesik', /\b(her ?gün|herzaman|herkez|hergün)\b(?<!her gün)/i, 'her gün / her zaman / herkes'],
  ['birlesik', /\bşuan(da)?\b/i, 'şu an / şu anda'],
  ['birlesik', /\byada\b/i, 'ya da'],
  ['birlesik', /\bpeşpeşe\b/i, 'peş peşe'],
  ['birlesik', /\bhoşgeldin/i, 'hoş geldin'],
  ['birlesik', /\bsağol(un)?\b/i, 'sağ ol / sağ olun'],
  ['birlesik', /\b(işbirliği|anasayfa|veritabanı|çevrimiçi|çevrimdışı|önizleme)\b/i, 'iş birliği / ana sayfa / veri tabanı / çevrim içi / ön izleme'],
  ['birlesik', /\b(birtek|birde)\b/, 'bir tek / bir de (bağlaçsa)'],

  ['yanlis-yazim', /\b(yanlız|yalnış)/i, 'yalnız / yanlış'],
  ['yanlis-yazim', /\borjinal/i, 'orijinal'],
  ['yanlis-yazim', /\beşortman/i, 'eşofman'],
  ['yanlis-yazim', /\btraş/i, 'tıraş'],
  ['yanlis-yazim', /\bklavuz/i, 'kılavuz'],
  ['yanlis-yazim', /\bmakina\b/i, 'makine'],
  // Güncel TDK: "ünvan" (GTS madde başı ve Yazım Kılavuzu dizini); "unvan" ikisinde de yok.
  ['yanlis-yazim', /\bunvan/i, 'ünvan'],
  // "mütevazi" ayrı kelime (paralel); alçak gönüllü anlamında "mütevazı".
  ['yanlis-yazim', /\bmütevazi\b/i, 'alçak gönüllü anlamındaysa: mütevazı'],
  ['yanlis-yazim', /\bmuhattap/i, 'muhatap'],
  ['yanlis-yazim', /\bayrıyeten\b/i, 'ayrıca'],
  ['yanlis-yazim', /\bentegere/i, 'entegre'],

  // "mi" soru eki ayrı yazılır: gelirmisin, olurmu
  // Yalnız soru işaretinin hemen önünde: "yönetimi", "üretimi", "denetimi" iyelik ekli
  // addır, "geldimi" değil; iki biçim ancak soru işaretine bitişik konumda ayrılır.
  // Kaçan: "Geldimi bugün?" gibi seyrek biçimler.
  ['mi-bitisik', new RegExp(`\\b[${HARF}]{3,}(r|z|yor|cak|cek|dı|di|du|dü|tı|ti|tu|tü|mış|miş|muş|müş)(mı|mi|mu|mü)(sın|sin|sun|sün|yım|yim|yum|yüm|yız|yiz|yuz|yüz|sınız|siniz|sunuz|sünüz|dır|dir)?\\b(?=\\s*\\?)`, 'i'), 'soru eki "mi" ayrı yazılır'],

  // "ki" bağlacı ayrı yazılır: diyorumki, demekki
  ['ki-bitisik', /\b\p{L}+(um|im|ım|üm|ek|ak|iz|ız|uz|üz|sin|sın|dir|dır)ki\b/iu, 'bağlaç olan "ki" ayrı yazılır'],

  // Kesme işareti
  ['kesme', /\bTürkçe['’]/, 'dil adına gelen ek kesmeyle ayrılmaz: Türkçede, Türkçeye'],
  ['kesme', /\b(Kurumu|Bakanlığı|Üniversitesi|Başkanlığı|Müdürlüğü|Derneği|Vakfı|Meclisi|Belediyesi|Bankası)['’]/, 'kurum adlarına gelen ek kesmeyle ayrılmaz'],
  // Önce küçük harf: kısaltma ve sayıya gelen yapım eki kesmeyle ayrılır (GB'lık, TDK'lı, 1990'lı).
  ['kesme', /(?<=[a-zçğıöşüâîû])['’](lı|li|lu|lü|lık|lik|luk|lük|ca|ce|ça|çe|laş|leş|cı|ci|cu|cü|çı|çi|çu|çü)\b/, 'yapım eki kesmeyle ayrılmaz: İstanbullu, Türkçeleşmek'],

  // Sayı ve işaret
  ['yuzde', /(?<![\d.,])\d+([.,]\d+)?\s?%/, 'yüzde işareti sayıdan önce: %50'],
  ['yuzde', /%\s+\d/, 'yüzde işaretiyle sayı bitişik: %50'],

  // Düzeltme işareti (anlamı tek olanlar)
  ['duzeltme', /\b(yapay zeka|zekası|zekayı|zekaya)\b/i, 'zekâ'],
  ['duzeltme', /\bdahil\p{L}*/iu, 'dâhil'],
  // TDK dizini derlenmişse bu liste de dizinden gelir; bu satır dizin yokken çalışan asgari liste.
  // (?!i[zk]): "mekanizma", "mekanik" mekân değil.
  ['duzeltme', /\b(hikaye|dükkan|kağıt|rüzgar|imkan|mekan|kainat|yadigar|tezgah|karargah|dergah)(?!i[zk])\p{L}*/iu, 'düzeltme işareti: hikâye, dükkân, kâğıt, rüzgâr, imkân, mekân…'],
  ['duzeltme', /\b(resmi|askeri|dini|ilmi|milli|siyasi|tarihi|kültürel) (kurum|kuruluş|okul|bilgi|tatil|bayram|makam|belge|yazı)/iu, 'nispet î: resmî kurum, millî bayram (belirtme/iyelik değilse)'],

  // Ses uyumu: alıntı kelimelerde ince ünlü, yumuşamaya aykırılık
  ['ses-uyumu', /\b(saatı|saatlar|kalpı|harfı|harflar|halı(?= )|rolu|golu|alkolu|petrolu|kabulu|usulu|meşgulu|mahsulu|dikkatı|hakikatı|menfaatı)\b/i, 'ince ünlü: saati, kalbi, harfi, rolü, kabulü, usulü, dikkati'],
  ['ses-uyumu', /\b(hukuğu|hukuğun|ahlağı|merağı|evrağı|tazyiği|sanadı|milledi|devledin|hizmedi|dikkadi|kıymedi|sepedi|tespidi|tesbit)\b/i, 'yumuşamaz: hukuku, ahlakı, merakı, evrakı, sanatı, milleti, devletin, hizmeti, dikkati, sepeti, tespit'],
  ['ses-uyumu', new RegExp(`\\b[a-zçğıöşü]*[a-zçğıöşü][fstkçşhp]['’]?(da|de|dan|den)\\b`, 'i'), 'sert ünsüzden sonra -ta/-te/-tan/-ten: kitapta, Ahmet’te'],
]

// Kısaltmada sertleşme okunuşa göre (PDF'de doğru), büyük harfle biten
// kelimeleri ses-uyumu denetiminden çıkar.
const KISALTMA_ONCESI = /[A-ZÇĞİÖŞÜ]{2,}['’](da|de|dan|den)\b/

// ---------------------------------------------------------------------------
// Biçim izleri
// ---------------------------------------------------------------------------

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2B50}\u{2B55}]/u

function bicimIzleri(src, temiz) {
  const bulgular = []
  const yaz = (tur, idx, not, parca) => bulgular.push({ satir: satirNo(src, idx), tur, not, parca })

  // Uzun tire her yerde; en tire yalnız sayı aralığı dışında
  for (const m of temiz.matchAll(/—/g)) yaz('uzun-tire', m.index, 'virgül, nokta ya da parantez; iki nokta DEĞİL', temiz.slice(Math.max(0, m.index - 30), m.index + 30).trim())
  for (const m of temiz.matchAll(/(?<!\d\s?)–(?!\s?\d)/g)) yaz('en-tire', m.index, 'en tire; virgül ya da nokta kullan', temiz.slice(Math.max(0, m.index - 30), m.index + 30).trim())
  for (const m of temiz.matchAll(/\d\s?–\s?\d/g)) yaz('tdk-aralik', m.index, 'TDK: aralıkta kısa çizgi (5-8 gün)', m[0])
  // Uzun tirenin kılığı: boşluklu kısa çizgi. Liste başı ve sayı aralığı hariç.
  // Boşluk yalnız satır içi ([ \t]): "\n- " madde işaretidir, tire değil.
  for (const m of temiz.matchAll(/(?<![\d\s])[ \t][-–]{1,2}[ \t](?!\d)/gu)) yaz('bosluklu-tire', m.index, 'tire yerine virgül ya da nokta', temiz.slice(Math.max(0, m.index - 30), m.index + 30).trim())
  for (const m of temiz.matchAll(new RegExp(EMOJI.source, 'gu'))) yaz('emoji', m.index, 'piktografik emoji', m[0])

  // Başlıkta Her Kelime Büyük
  for (const m of temiz.matchAll(/^#{1,6}\s+(.+)$/gm)) {
    const kel = kelimeler(m[1]).filter((k) => k.length > 3)
    const buyuk = kel.slice(1).filter((k) => /^[A-ZÇĞİÖŞÜ][a-zçğıöşü]/.test(k))
    if (kel.length >= 3 && buyuk.length >= kel.length - 1) yaz('baslik-buyuk', m.index, 'başlıkta yalnız ilk kelime ve özel adlar büyük', m[1])
  }

  // Satır içi kalın başlıklı liste: "- **Etiket:** metin"
  const etiketli = [...temiz.matchAll(/^\s*[-*]\s+\*\*[^*]{2,40}:\*\*/gm)]
  if (etiketli.length >= 3) yaz('etiketli-liste', etiketli[0].index, `${etiketli.length} maddede "**Etiket:**" kalıbı; düzyazıya çevir`, '')

  // Kalın yoğunluğu
  const kalin = (temiz.match(/\*\*[^*]+\*\*/g) || []).length
  const kelimeSay = kelimeler(temiz).length
  if (kelimeSay > 0 && kalin / kelimeSay > 0.02 && kalin >= 4) yaz('kalin-yogun', 0, `${kalin} kalın vurgu / ${kelimeSay} kelime`, '')

  // Ünlem
  const unlem = (temiz.match(/!(?!\[)/g) || []).length
  if (unlem >= 3) yaz('unlem', 0, `${unlem} ünlem`, '')

  return bulgular
}

// ---------------------------------------------------------------------------
// Ölçümler
// ---------------------------------------------------------------------------

function ortalama(a) {
  return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0
}
function sapma(a) {
  if (a.length < 2) return 0
  const o = ortalama(a)
  return Math.sqrt(ortalama(a.map((x) => (x - o) ** 2)))
}

// Eşikler tests/kalibrasyon/SONUC.md'den: 100 LLM öncesi insan metni (haber +
// blog/forum) ile 100 gpt-4o / gpt-4o-mini metni karşılaştırıldı, her eşik
// Youden J'yi en büyük yapan değer. Parantez içi AUC'nin ayırma gücü.
const ESIK = {
  cumleCVGuclu: 0.3, // bunun altı güçlü iz (20 puan), 0,30-0,37 zayıf (8 puan)
  cumleCV: 0.37, //     (0,93) cümle uzunluğu değişim katsayısı; LLM düşük
  veYuzde: 2.7, //      (0,72) serbest metinde güçlü, haberde zayıf
  birYuzde: 2.75, //    (0,70)
  hafifFiil200: 1, //   (0,66) sınırda
  uzunCumleYokMin: 8, // (0,76) 8+ cümlelik metinde hiç 25+ kelimelik cümle yoksa
}
// Ölçülüp AYIRT ETMEDİĞİ görülenler (AUC 0,50–0,57): cümle başına ulaç,
// -maktadır, -DIr oranı, edilgen, ortalama cümle uzunluğu. Bunlar skoru
// etkilemez; site metninde üslup sorunu oldukları için "üslup" olarak raporlanır.

function olc(temiz) {
  const kel = kelimeler(temiz)
  const kucuk = kel.map(kucult)
  const n = kel.length || 1
  const cum = cumleler(temiz)
  const uzunluk = cum.map((c) => kelimeler(c).length)

  const say = (k) => kucuk.filter((x) => x === k).length
  const kucukMetin = kucult(temiz)

  const ulaclar = [...kucukMetin.matchAll(tr(ULAC))].map((m) => m[0]).filter((w) => !ULAC_DEGIL.has(w))
  const edilgen = [...kucukMetin.matchAll(tr(EDILGEN_YAKLASIK))].map((m) => m[0]).filter((w) => !EDILGEN_DEGIL.test(w) || w.length > 9)
  const dirSonu = cum.filter((c) => /(dır|dir|dur|dür|tır|tir|tur|tür)[.!?…]*$/i.test(c.trim())).length

  return {
    kelime: kel.length,
    cumle: cum.length,
    bir100: (say('bir') / n) * 100,
    ve100: (say('ve') / n) * 100,
    ulac: ulaclar.length,
    ulacCumle: cum.length ? ulaclar.length / cum.length : 0,
    maktadir: (kucukMetin.match(tr(/\p{L}+(maktadır|mektedir|makta|mekte)\b/)) || []).length,
    dirOran: cum.length ? dirSonu / cum.length : 0,
    hafifFiil200: ((kucukMetin.match(tr(HAFIF_FIIL)) || []).length / n) * 200,
    edilgen: edilgen.length,
    gecis100: (((kucukMetin.match(tr(GECISLER)) || []).length) / n) * 100,
    heceOrt: ortalama(kel.map(heceSayisi)),
    cumleOrt: ortalama(uzunluk),
    cumleSapma: sapma(uzunluk),
    cumleCV: ortalama(uzunluk) ? sapma(uzunluk) / ortalama(uzunluk) : 0,
    uzunCumle: uzunluk.filter((u) => u > 25).length,
    acilisTekrari: acilisTekrari(cum),
  }
}

// Art arda üç cümle aynı kelimeyle açılıyor mu? Üçü art arda gelince tekrar
// okurun kulağına takılır.
function acilisTekrari(cum) {
  const ilk = cum.map((c) => kucult(kelimeler(c)[0] || ''))
  for (let i = 2; i < ilk.length; i++) if (ilk[i] && ilk[i] === ilk[i - 1] && ilk[i] === ilk[i - 2]) return ilk[i]
  return null
}

function olcumBulgulari(o) {
  const b = []
  const yaz = (tur, not, agirlik) => b.push({ satir: 0, tur, not, parca: '', ...(agirlik !== undefined && { agirlik }) })
  if (o.kelime < 60) return b // kısa metinde oran ölçümü anlamsız

  // Kademeli: insan site metninin medyanı 0,38, yani 0,30-0,37 arası gri bölge (SONUC-SITE.md).
  if (o.cumle >= 6 && o.cumleCV < ESIK.cumleCV) {
    const guclu = o.cumleCV < ESIK.cumleCVGuclu
    yaz('duz-ritim', `cümle uzunluğu değişim katsayısı ${o.cumleCV.toFixed(2)} (insan medyanı 0,51, LLM 0,29). Cümleler aynı boyda; kısa ve uzun cümleyi anlamın gerektirdiği yerde karıştır.`, guclu ? 20 : 8)
  }
  if (o.cumle >= ESIK.uzunCumleYokMin && o.uzunCumle === 0) yaz('uzun-cumle-yok', `${o.cumle} cümlenin hiçbiri 25 kelimeyi geçmiyor. İnsan metinlerinin çoğunda en az bir uzun cümle var.`)
  if (o.acilisTekrari) yaz('acilis-tekrari', `art arda 3 cümle "${o.acilisTekrari}" ile başlıyor.`)
  // Aşırı düzeltme: kör testte becerili metinde 1,7, insanda 3,4 (SONUC-BECERI.md).
  if (o.kelime >= 150 && o.ve100 < 1.2) yaz('ve-seyrek', `100 kelimede ${o.ve100.toFixed(1)} "ve"; insan metninde 2-3,5. "ve"yi tümden silmek de bir izdir.`, 0)
  if (o.ve100 > ESIK.veYuzde) yaz('ve-yogunlugu', `100 kelimede ${o.ve100.toFixed(1)} "ve" (eşik ${ESIK.veYuzde}). Bir kısmını ulaçla bağla ya da cümleyi böl.`)
  if (o.bir100 > ESIK.birYuzde) yaz('bir-enflasyonu', `100 kelimede ${o.bir100.toFixed(1)} "bir" (eşik ${ESIK.birYuzde}). Sayı/vurgu taşımayanları sil.`)
  if (o.hafifFiil200 > ESIK.hafifFiil200) yaz('hafif-fiil', `200 kelimede ${o.hafifFiil200.toFixed(1)} hafif fiil (gerçekleştir/sağla/oluştur...). Somut fiil kullan.`)
  return b
}

// ---------------------------------------------------------------------------
// Denetim
// ---------------------------------------------------------------------------

// Kelimeyi TDK dizinine bakar. Önce tam eşleşme, sonra kök + kısa ek:
// "işbirliğini" kökü "işbirliği" değil ("işbirliğ-") olduğu için ek sınırında
// ünsüz yumuşaması hesaba katılır. Kök en az 5 harf, ek en fazla 6 harf:
// kısa köklerde önek eşleşmesi yanlış pozitif üretir.
const YUMUSAK = { ğ: 'k', b: 'p', c: 'ç', d: 't', g: 'k' }
// k, TDK'da tek kelimelik bir maddenin kendisi ya da o madde + kısa ek mi?
// Eşleşen sözlük anahtarından (anahtarUz) daha uzun bir doğru kök varsa kelime
// doğrudur: "mekanizmasına" → "mekanizma" (mekân değil), "birbirine" → "birbiri".
// Kök ek almış olabilir: yumuşamış son ünsüzü de dene.
// Tam eşleşmede de aynı soru sorulur: "kanunu" hem "kan unu" hem "kanun + u";
// kelimenin sonundan en fazla 3 harf atınca doğru bir madde kalıyorsa doğru say.
// Tam eşleşmede atılan kısım gerçekten bir ek olmalı: "kanun + u" evet, ama
// "doğal + gaz" hayır ("gaz" ek değil, kelime).
const KISA_EK = /^(y?[ıiuü]|[ıiuü]?n[ıiuü]?|y?[ae]|[dt][ae]|[dt][ae]n|l[ae]r|s[ıiuü]|[ıiuü]?m|[ıiuü]?z)$/
// Fiil çekimi: "boşalan" = boşal(mak) + an, "boş alan" değil. Dizinde fiiller
// mastarla durur; kelime bir fiil gövdesi + çekim eki ise doğru say.
const FIIL_EK = /^(y?[ae]n|y?[ae]r|[ıiuü]r|[dt][ıiuü]|m[ıiuü]ş|y?[ae]c[ae]k|[ıiuü]?yor|m[ae]k|m[ae]|y?[ıiuü]p|y?[ae]r[ae]k)/
function fiilCekimiMi(k) {
  for (let n = k.length - 2; n >= 3; n--) {
    const govde = k.slice(0, n)
    const ek = k.slice(n)
    if (!FIIL_EK.test(ek)) continue
    if (TEKIL.has(govde + 'mak') || TEKIL.has(govde + 'mek')) return true
  }
  return false
}

function dogruKokVar(k, anahtarUz) {
  if (fiilCekimiMi(k)) return true
  if (anahtarUz === k.length) {
    for (let n = k.length - 1; n >= Math.max(3, k.length - 3); n--) {
      if (!KISA_EK.test(k.slice(n))) continue
      const kok = k.slice(0, n)
      const sert = YUMUSAK[kok.at(-1)]
      if (TEKIL.has(kok) || (sert && TEKIL.has(kok.slice(0, -1) + sert))) return true
    }
    return false
  }
  for (let n = k.length; n > anahtarUz; n--) {
    const kok = k.slice(0, n)
    if (TEKIL.has(kok)) return true
    const sert = YUMUSAK[kok.at(-1)]
    if (sert && TEKIL.has(kok.slice(0, -1) + sert)) return true
  }
  return false
}

function dizinBak(k) {
  for (const [sozluk, tur] of [[DIZIN.ayri, 'tdk-ayri-yazim'], [DIZIN.sapka, 'tdk-duzeltme']]) {
    if (sozluk[k]) {
      if (dogruKokVar(k, k.length)) continue
      return { tur, dogru: sozluk[k] }
    }
    for (let n = k.length - 1; n >= Math.max(5, k.length - 6); n--) {
      let kok = k.slice(0, n)
      let dogru = sozluk[kok]
      const sert = YUMUSAK[kok.at(-1)]
      if (!dogru && sert) {
        kok = kok.slice(0, -1) + sert
        dogru = sozluk[kok]
      }
      if (!dogru) continue
      if (dogruKokVar(k, n)) break
      return { tur, dogru: dogru + ' (+ek)' }
    }
  }
  return null
}

// Cümle ortasında büyük harfle başlayan kelime özel addır (Albayrak, Pazaryeri,
// Dışişleri Bakanlığı): sözlük denetimine girmez.
function ozelAdMi(temiz, idx) {
  if (!/\p{Lu}/u.test(temiz[idx])) return false
  const once = temiz.slice(0, idx).trimEnd()
  return once.length > 0 && !/[.!?…:\n#>*-]$/.test(once)
}

function denetle(src, secenek = {}) {
  const temiz = temizle(src)
  const kucukMetin = kucult(temiz)
  const bulgular = []

  for (const [tur, re, not] of KALIPLAR) {
    for (const m of kucukMetin.matchAll(tr(re, 'm'))) {
      bulgular.push({ satir: satirNo(src, m.index), tur, not, parca: m[0].trim() })
    }
  }

  for (const [tur, re, dogru] of TDK) {
    // Dizin yüklüyse düzeltme işareti listesini dizin karşılar; iki kez raporlama.
    if (DIZIN && tur === 'duzeltme' && /hikaye\|dükkan/.test(re.source)) continue
    for (const m of temiz.matchAll(tr(re))) {
      if (tur === 'ses-uyumu' && KISALTMA_ONCESI.test(temiz.slice(Math.max(0, m.index - 8), m.index + m[0].length))) continue
      bulgular.push({ satir: satirNo(src, m.index), tur: 'tdk-' + tur, not: dogru, parca: m[0] })
    }
  }

  if (secenek.tipografi) {
    for (const m of temiz.matchAll(tr(new RegExp(`[${HARF}]'[a-zçğıöşü]{1,6}\\b`))))
      bulgular.push({ satir: satirNo(src, m.index), tur: 'tipografi-kesme', not: 'tipografik kesme (’) kullan', parca: m[0] })
  }

  // Sözlük denetimi: tam kelime eşleşmesi, küçük harfli metinde
  for (const m of kucukMetin.matchAll(tr(/\p{L}+/))) {
    const k = m[0]
    const dogru = SOZLUK.yanlis[k]
    if (dogru) bulgular.push({ satir: satirNo(src, m.index), tur: 'tdk-sozluk', not: dogru, parca: k })
    else if (DIZIN && !ozelAdMi(temiz, m.index)) {
      const d = dizinBak(k)
      if (d) bulgular.push({ satir: satirNo(src, m.index), tur: d.tur, not: d.dogru, parca: k })
    }
  }
  for (const { kalip, dogru, not } of SOZLUK.esdizim) {
    let i = kucukMetin.indexOf(kalip)
    while (i !== -1) {
      const onceki = kucukMetin[i - 1]
      if (!onceki || !/\p{L}/u.test(onceki)) {
        bulgular.push({ satir: satirNo(src, i), tur: 'esdizim', not: `${dogru}${not ? ' (' + not + ')' : ''}`, parca: kalip })
      }
      i = kucukMetin.indexOf(kalip, i + kalip.length)
    }
  }

  // Derlem eş dizimi (esdizim-derle.mjs ile yerelde üretilmişse): "Türk böyle söyler
  // mi?" İnsan/LLM ayırmıyor (SONUC-ESDIZIM.md, AUC 0,45), düzeltme önerisi verir;
  // bu yüzden skoru etkilemez.
  let aramaBas = 0
  for (const e of esdizimDenetle(temiz)) {
    const i = kucukMetin.indexOf(e.ifade, aramaBas)
    if (i !== -1) aramaBas = i + e.ifade.length
    bulgular.push({ satir: i === -1 ? 0 : satirNo(src, i), tur: 'esdizim-derlem', not: e.mesaj, parca: e.ifade })
  }

  bulgular.push(...bicimIzleri(src, temiz))
  const olcum = olc(temiz)
  bulgular.push(...olcumBulgulari(olcum))

  // Aynı satırda aynı türden aynı parçayı tekrar yazma
  const gorulen = new Set()
  const tekil = bulgular.filter((b) => {
    const k = `${b.satir}|${b.tur}|${b.parca}`
    if (gorulen.has(k)) return false
    gorulen.add(k)
    return true
  })

  return { olcum, bulgular: tekil.sort((a, b) => a.satir - b.satir), skor: skorla(tekil, olcum) }
}

// Skor: 100'den düşülür. Ağırlıklar, turkce-parmak-izi.md ve denetleyici.md'deki
// sıralamayı izler: yapı ve söz dizimi izleri kelime izlerinden ağır basar.
// Ağırlıklar kalibrasyondaki ayırma gücünü izler. Kalıplarda bulgu oranı
// (insan % / LLM %): kapanış klişesi 3/28, olumsuz koşutluk 3/24, boş vurgu 1/18,
// bürokratik 29/28 (ayırt etmiyor, ağırlık 0).
// Kalibrasyonda ölçülmemiş kurallar (biçim izleri, meta, çeviri kokusu) literatürdeki
// yerlerine göre ağırlıklandırıldı; yeni veriyle yeniden ölçülmeli.
const AGIRLIK = {
  // bir-enflasyonu, hafif-fiil, giris-klisesi: bağımsız site/blog derleminde ayırmadı (bir: site AUC 0,54, blog
  // 0,43; hafif-fiil %57/%60; giriş klişesi insan sitelerinde daha sık). Üslup notu olarak kalır.
  'duz-ritim': 20, 'uzun-cumle-yok': 6, 've-yogunlugu': 6, 'bir-enflasyonu': 0, 'hafif-fiil': 0,
  'kapanis-klisesi': 8, 'olumsuz-kosutluk': 8, 'bos-vurgu': 6, 'giris-klisesi': 0, 'meta': 15,
  'hype': 3, 'ceviri-kokusu': 3, 'esdizim': 3,
  'uzun-tire': 3, 'etiketli-liste': 4, 'baslik-buyuk': 2, 'emoji': 2, 'kalin-yogun': 2, 'unlem': 0, 'en-tire': 2, 'bosluklu-tire': 0,
  // insanca / humanify kaynaklı. 200 metinlik derlemde (SONUC.md) kesik-yigin (insan %5,
  // LLM %0), bosluklu-tire (%6/%0) ve acilis-tekrari (%2/%1) insan metninde daha sık
  // çıktı: skoru etkilemez, üslup notu olarak kalır. Derlemde site hero metni yoktu;
  // "Hızlı. Güvenli. Basit." gibi kalıplar site metniyle ayrıca ölçülmeli.
  'yalanci-aralik': 1, 'anons-ikinokta': 3, 'kosac-kacisi': 2, 'yuzeysel-ulac': 2, 'kesik-yigin': 0,
  'retorik-soru': 3, 'saga-dallanma': 2, 'yapi-nakli': 3, 'aforizma': 3, 'anons': 3, 'sahte-samimi': 2,
  'bos-dogru': 3, 'relatif-ki': 2, 'gpt-sozlugu': 3, 'yer-tutucu-ek': 0, 'acilis-tekrari': 0,
  'burokratik': 0, 'tipografi-kesme': 0, 'esdizim-derlem': 0,
}
const agirlik = (tur) => (tur.startsWith('tdk-') ? 0 : AGIRLIK[tur] ?? 1)

function skorla(bulgular, olcum) {
  if (olcum.kelime === 0) return 100
  let dusus = 0
  for (const b of bulgular) {
    dusus += b.agirlik ?? agirlik(b.tur) // TDK hatası ve üslup notu skoru etkilemez
  }
  return Math.max(0, Math.round(100 - dusus))
}

// ---------------------------------------------------------------------------
// Çıktı
// ---------------------------------------------------------------------------

// Bantlar iki derlemden (SONUC.md, SONUC-SITE.md): ≤65 güçlü iz, 66-80 gri bölge,
// >80 zayıf iz. Bağımsız site/blog derleminde ≤80 eşiği duyarlılık 0,79, özgüllük 0,78.
// Yani insan metinlerinin beşte biri de 80'in altına düşebilir: skor karar değildir.
function bant(skor, kelime) {
  if (kelime < 60) return 'metin kısa, skor güvenilmez'
  if (skor <= 65) return 'güçlü yapay zekâ izi'
  if (skor <= 80) return 'gri bölge'
  return 'zayıf iz'
}

function rapor(ad, s) {
  const o = s.olcum
  const tdk = s.bulgular.filter((b) => b.tur.startsWith('tdk-'))
  const agr = (b) => b.agirlik ?? agirlik(b.tur)
  const iz = s.bulgular.filter((b) => agr(b) > 0)
  const uslup = s.bulgular.filter((b) => !b.tur.startsWith('tdk-') && agr(b) === 0)
  const satirlar = []
  satirlar.push(`\n${ad}`)
  satirlar.push(`  iz skoru ${s.skor}/100 (${bant(s.skor, o.kelime)}) · TDK hatası ${tdk.length} · ${o.kelime} kelime, ${o.cumle} cümle`)
  satirlar.push(
    `  bir/100k ${o.bir100.toFixed(1)} · ve/100k ${o.ve100.toFixed(1)} · ulaç ${o.ulac} · -maktadır ${o.maktadir} · ` +
      `-DIr %${Math.round(o.dirOran * 100)} · hece ${o.heceOrt.toFixed(2)} · cümle ${o.cumleOrt.toFixed(1)}±${o.cumleSapma.toFixed(1)} (CV ${o.cumleCV.toFixed(2)})`,
  )
  if (iz.length) {
    satirlar.push('  yapay zekâ izleri:')
    for (const b of iz) satirlar.push(`    ${b.satir ? String(b.satir).padStart(4) + ':' : '  --:'} [${b.tur}] ${b.not}${b.parca ? ' → ' + b.parca.slice(0, 80) : ''}`)
  }
  if (uslup.length) {
    satirlar.push('  üslup (skoru etkilemez, site metninde yine de düzelt):')
    for (const b of uslup) satirlar.push(`    ${String(b.satir).padStart(4)}: [${b.tur}] ${b.not}${b.parca ? ' → ' + b.parca.slice(0, 80) : ''}`)
  }
  if (tdk.length) {
    satirlar.push('  TDK:')
    for (const b of tdk) satirlar.push(`    ${String(b.satir).padStart(4)}: [${b.tur}] ${b.parca} → ${b.not}`)
  }
  if (!iz.length && !tdk.length && !uslup.length) satirlar.push('  temiz: tarayıcının yakalayabildiği iz yok. Okuma geçişlerini yine de yap.')
  return satirlar.join('\n')
}

function main() {
  const argv = process.argv.slice(2)
  const json = argv.includes('--json')
  const tipografi = argv.includes('--tipografi')
  const dosyalar = argv.filter((a) => !a.startsWith('--'))
  if (!dosyalar.length) {
    console.error('kullanım: node tr-scan.mjs <dosya...> [--json]   (stdin için: -)')
    process.exit(2)
  }

  const sonuc = dosyalar.flatMap((f) => {
    const src = (f === '-' ? readFileSync(0, 'utf8') : readFileSync(f, 'utf8')).replace(/\r\n/g, '\n')
    if (f.endsWith('.json')) return jsonDenetle(f, src, { tipografi })
    return [{ dosya: f, ...denetle(src, { tipografi }) }]
  })

  if (json) console.log(JSON.stringify(sonuc, null, 2))
  else for (const s of sonuc) console.log(s.alanlar ? jsonRapor(s) : rapor(s.dosya, s))

  const kirli = sonuc.some((s) => s.bulgular.length > 0)
  process.exitCode = kirli ? 1 : 0
}

// ---------------------------------------------------------------------------
// JSON içerik dosyaları: her string değer, alan yoluyla ayrı ayrı taranır.
// Anahtar adları, URL, sınıf adı gibi teknik değerler atlanır. Skor, bütün
// metin alanları art arda okunmuş gibi tek metin üzerinden hesaplanır; kısa
// alanlarda (başlık, buton) tek başına skor anlamsızdır.
// ---------------------------------------------------------------------------

function metinAlanlari(deger, yol = '$', cikti = []) {
  if (typeof deger === 'string') {
    const t = deger.trim()
    const teknik = /^(https?:|\/|#|[\w.-]+@[\w.-]+|[\w-]+\.(png|jpe?g|svg|webp|json|js|css)$)/i.test(t)
    if (!teknik && t.length >= 8 && /\s/.test(t) && /\p{L}/u.test(t)) cikti.push({ yol, metin: t })
  } else if (Array.isArray(deger)) deger.forEach((d, i) => metinAlanlari(d, `${yol}[${i}]`, cikti))
  else if (deger && typeof deger === 'object') for (const [k, d] of Object.entries(deger)) metinAlanlari(d, `${yol}.${k}`, cikti)
  return cikti
}

function jsonDenetle(dosya, src, secenek) {
  let veri
  try {
    veri = JSON.parse(src)
  } catch (e) {
    return [{ dosya, hata: 'JSON okunamadı: ' + e.message, bulgular: [{ tur: 'hata', not: e.message }], skor: 0, olcum: olc('') }]
  }
  const alanlar = metinAlanlari(veri).map(({ yol, metin }) => {
    // Başlık alanı markdown "#" taşımaz: başlık denetimi için başına ekle.
    const baslikMi = /(baslik|başlık|title|heading|h[1-3]|headline)$/i.test(yol)
    const d = denetle(baslikMi ? '# ' + metin : metin, secenek)
    // Kısa alanda ölçüm bulguları (ritim, yoğunluk) anlamsız: yalnız kalıp ve TDK.
    // Aynı kelime iki TDK kuralından gelirse bir kez yaz.
    const gorulen = new Set()
    const bulgular = d.bulgular.filter((b) => {
      if (b.satir === 0) return false
      const k = b.tur.startsWith('tdk-') ? 'tdk|' + kucult(b.parca) : b.tur + '|' + b.parca
      if (gorulen.has(k)) return false
      gorulen.add(k)
      return true
    })
    return { yol, metin, bulgular }
  })
  const butun = denetle(alanlar.map((a) => a.metin).join('\n\n'), secenek)
  return [{ dosya, alanlar, skor: butun.skor, olcum: butun.olcum, bulgular: alanlar.flatMap((a) => a.bulgular), butunBulgular: butun.bulgular.filter((b) => b.satir === 0) }]
}

function jsonRapor(s) {
  const satirlar = [`\n${s.dosya}`]
  satirlar.push(`  ${s.alanlar.length} metin alanı · bütün metin iz skoru ${s.skor}/100 (${bant(s.skor, s.olcum.kelime)}) · ${s.olcum.kelime} kelime`)
  for (const b of s.butunBulgular) satirlar.push(`    [bütün] [${b.tur}] ${b.not}`)
  for (const a of s.alanlar) {
    if (!a.bulgular.length) continue
    satirlar.push(`  ${a.yol}: "${a.metin.slice(0, 70)}${a.metin.length > 70 ? '…' : ''}"`)
    for (const b of a.bulgular) {
      satirlar.push(b.tur.startsWith('tdk-')
        ? `    [${b.tur}] ${b.parca} → ${b.not}`
        : `    [${b.tur}] ${b.not}${b.parca ? ' → ' + b.parca.slice(0, 60) : ''}`)
    }
  }
  if (!s.bulgular.length && !s.butunBulgular.length) satirlar.push('  temiz: tarayıcının yakalayabildiği iz yok.')
  return satirlar.join('\n')
}

export { denetle, olc, cumleler, kelimeler, bant, jsonDenetle, metinAlanlari }

// Doğrudan çalıştırıldı mı, yoksa import mu edildi? node -e ve REPL'de argv[1] yoktur.
if (anaModulMu()) main()
