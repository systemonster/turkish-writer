// node --test tests/
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { denetle, cumleler } from '../skills/turkish-writer/scripts/tr-scan.mjs'

const turler = (metin, secenek) => denetle(metin, secenek).bulgular.map((b) => b.tur)
const var_ = (metin, tur, secenek) => assert.ok(turler(metin, secenek).includes(tur), `"${tur}" bekleniyordu: ${metin}`)
const yok = (metin, tur, secenek) => assert.ok(!turler(metin, secenek).includes(tur), `"${tur}" beklenmiyordu: ${metin}`)

// ---------------------------------------------------------------------------
// Türkçe harfle başlayan/biten kelimeler: \b hatasının geri gelmemesi için
// ---------------------------------------------------------------------------

test('Türkçe harfle başlayan kapanış klişesi yakalanır', () => {
  var_('Kısaca özetle, işler yolunda.', 'kapanis-klisesi')
})

test('Türkçe harfle başlayan şişirme yakalanır', () => {
  var_('Bu çığır açan bir ürün.', 'hype')
  var_('Tamamen şeffaf ve eşsiz bir deneyim.', 'hype')
})

test('ş ile başlayan TDK hatası yakalanır', () => {
  var_('Şuan müsait değilim.', 'tdk-birlesik')
})

test('güncel TDK: ünvan doğru, unvan yanlış', () => {
  var_('Unvanı nedir?', 'tdk-yanlis-yazim')
  yok('Ünvanı nedir?', 'tdk-yanlis-yazim')
})

test('ü ile başlayan kelimede Unicode sınırı', () => {
  var_('Üst düzey, kusursuz hizmet.', 'hype')
})

test('kelime içindeki parça yanlış pozitif vermez', () => {
  // "özetle" başka kelimenin içinde geçmemeli
  yok('Bu yazının özetlenmesi gerek.', 'kapanis-klisesi')
  // "sorunsuz" kökü "sorunsuzluk" içinde yakalanır, bu kasıtlı; ama "eşsiz" "keşsiz" değil
  yok('Keşsiz bir kelime yok.', 'hype')
})

// ---------------------------------------------------------------------------
// Kalıplar
// ---------------------------------------------------------------------------

test('olumsuz koşutluk', () => {
  var_('Bu sadece bir güncelleme değil, bir devrim.', 'olumsuz-kosutluk')
  var_('Mesele para değil, zaman.', 'olumsuz-kosutluk')
  yok('Bu iş zor değil.', 'olumsuz-kosutluk')
})

test('bürokratik yüklem', () => {
  var_('Sistem otomatik çalışmaktadır.', 'burokratik')
  var_('Rapor tarafımızca hazırlanır.', 'burokratik')
  yok('Sistem otomatik çalışıyor.', 'burokratik')
})

test('çeviri kokan edat', () => {
  var_('Karar vermek adına toplandık.', 'ceviri-kokusu')
  var_('Düşünüyorum ki bu iş uzar.', 'ceviri-kokusu')
  yok('Karar vermek için toplandık.', 'ceviri-kokusu')
})

test('giriş klişesi: metin başı ve cümle başı', () => {
  var_('Elbette! Size yardımcı olayım.', 'giris-klisesi')
  var_('Tamam. Elbette yaparız.', 'giris-klisesi')
  var_('Günümüzün hızla değişen dünyasında her şey değişiyor.', 'giris-klisesi')
})

test('meta anlatım', () => {
  var_('Bir yapay zekâ dil modeli olarak bunu bilemem.', 'meta')
})

// ---------------------------------------------------------------------------
// TDK
// ---------------------------------------------------------------------------

test('birleşik ve ayrı yazılan kelimeler', () => {
  var_('Herşey yolunda.', 'tdk-birlesik')
  var_('Hiç bir şey olmadı.', 'tdk-birlesik')
  var_('Bir kaç gün sürer.', 'tdk-birlesik')
  var_('Bir çok kişi geldi.', 'tdk-birlesik')
  var_('Çay yada kahve.', 'tdk-birlesik')
  yok('Her şey yolunda, birkaç gün sürer, birçok kişi geldi, çay ya da kahve.', 'tdk-birlesik')
})

test('soru eki ayrı yazılır', () => {
  var_('Yarın gelecekmisin?', 'tdk-mi-bitisik')
  var_('Bunu yaparmısın?', 'tdk-mi-bitisik')
  yok('Yarın gelecek misin?', 'tdk-mi-bitisik')
})

test('bağlaç ki ayrı yazılır, kalıplaşmışlar bitişik', () => {
  var_('Diyorumki olmaz.', 'tdk-ki-bitisik')
  var_('Demekki gelmeyecek.', 'tdk-ki-bitisik')
  yok('Belki gelir, sanki bilmiyor, halbuki söyledim, oysaki biliyordu.', 'tdk-ki-bitisik')
})

test('kesme işareti', () => {
  var_("Türkçe'de bu böyle.", 'tdk-kesme')
  var_("Türk Dil Kurumu'na yazdık.", 'tdk-kesme')
  var_("İstanbul'lu bir aile.", 'tdk-kesme')
  yok('Türkçede bu böyle. Türk Dil Kurumuna yazdık. İstanbullu bir aile.', 'tdk-kesme')
})

test('yüzde işareti', () => {
  var_('İndirim 50% oldu.', 'tdk-yuzde')
  var_('İndirim % 50 oldu.', 'tdk-yuzde')
  yok('İndirim %50 oldu.', 'tdk-yuzde')
})

test('düzeltme işareti', () => {
  var_('Yapay zeka her yerde.', 'tdk-duzeltme')
  var_('KDV dahil fiyat.', 'tdk-duzeltme')
  yok('Yapay zekâ her yerde. KDV dâhil fiyat.', 'tdk-duzeltme')
})

test('ses uyumu: alıntı kelime ve yumuşamaya aykırılık', () => {
  var_('Saatı kaç?', 'tdk-ses-uyumu')
  var_('Hukuğu bilmiyor.', 'tdk-ses-uyumu')
  yok('Saati kaç? Hukuku bilmiyor. Kalbi kırık. Rolü büyük.', 'tdk-ses-uyumu')
})

test('ünsüz benzeşmesi: sert ünsüzden sonra -te/-ta', () => {
  var_('Kitapda yazıyor.', 'tdk-ses-uyumu')
  var_("Ahmet'de kaldı.", 'tdk-ses-uyumu')
  yok("Kitapta yazıyor. Ahmet'te kaldı.", 'tdk-ses-uyumu')
})

test('kısaltmada okunuşa göre ek: PDF’de doğru', () => {
  yok("Dosya PDF'de duruyor.", 'tdk-ses-uyumu')
})

test('düz kesme yalnız --tipografi ile işaretlenir', () => {
  yok("Excel'e geçirdi.", 'tipografi-kesme')
  var_("Excel'e geçirdi.", 'tipografi-kesme', { tipografi: true })
  yok('Excel’e geçirdi.', 'tipografi-kesme', { tipografi: true })
})

// ---------------------------------------------------------------------------
// Biçim
// ---------------------------------------------------------------------------

test('uzun tire, sayı aralığındaki en tire değil', () => {
  var_('Ürün — en iyisi.', 'uzun-tire')
  yok('Teslim 5–8 gün.', 'en-tire')
  var_('Ürün – en iyisi.', 'en-tire')
})

test('başlıkta her kelime büyük', () => {
  var_('## Dijital Dönüşümün Önemi Ve Avantajları\n', 'baslik-buyuk')
  yok('## Dijital dönüşümün önemi\n', 'baslik-buyuk')
})

test('emoji', () => {
  var_('Yayına aldık 🚀', 'emoji')
  yok('Tamamlandı ✓', 'emoji')
})

// ---------------------------------------------------------------------------
// Cümle bölme
// ---------------------------------------------------------------------------

test('cümle bölme sayı ve kısaltmada bölmez', () => {
  assert.equal(cumleler('Fiyat 14.900 TL oldu ve herkes şaştı. Prof. Ahmet de geldi, çok konuştu.').length, 2)
})

// ---------------------------------------------------------------------------
// Uçtan uca örnekler
// ---------------------------------------------------------------------------

test('yapay metin düşük, insan metni yüksek skor alır', () => {
  const ai = denetle(readFileSync(new URL('./ornekler/ai-metin.md', import.meta.url), 'utf8'))
  const insan = denetle(readFileSync(new URL('./ornekler/insan-metin.md', import.meta.url), 'utf8'))
  assert.ok(ai.skor < 30, `yapay metin skoru ${ai.skor}`)
  assert.ok(insan.skor > 85, `insan metni skoru ${insan.skor}`)
  assert.equal(insan.bulgular.filter((b) => b.tur.startsWith('tdk-')).length, 0)
})

// ---------------------------------------------------------------------------
// TDK dizini (yalnız yerelde derlendiyse: node scripts/tdk-dizin-derle.mjs)
// ---------------------------------------------------------------------------

import { existsSync } from 'node:fs'
const dizinVar = existsSync(new URL('../skills/turkish-writer/scripts/data/tdk-dizin.json', import.meta.url))

test('dizin: ayrı yazılan birleşik ve düzeltme işareti', { skip: !dizinVar && 'TDK dizini derlenmemiş' }, () => {
  var_('Bu bir işbirliği projesi.', 'tdk-ayri-yazim')
  var_('Doğalgaz faturası geldi.', 'tdk-ayri-yazim')
  // Düzeltme işareti hem dizinden (tdk-duzeltme) hem yanlış yazım sözlüğünden
  // (tdk-sozluk) gelebilir; hangisinin yakaladığı önemli değil.
  for (const m of ['Güzel bir hikayesi var.', 'Şikayet formu burada.']) {
    assert.ok(turler(m).some((t) => t === 'tdk-duzeltme' || t === 'tdk-sozluk'), m)
  }
})

test('dizin: doğru kelime + ek yanlış pozitif vermez', { skip: !dizinVar && 'TDK dizini derlenmemiş' }, () => {
  const temiz = 'Birbirlerine baktılar. Para birikiyor. Aramalar sürüyor. Kanunu okudu. Mekanizmasına bakın. Birbirine benziyor.'
  yok(temiz, 'tdk-ayri-yazim')
  yok(temiz, 'tdk-duzeltme')
})

test('dizin: cümle ortasındaki özel ad atlanır', { skip: !dizinVar && 'TDK dizini derlenmemiş' }, () => {
  yok('Toplantıya Albayrak ailesi de geldi.', 'tdk-ayri-yazim')
})

test('skor: kalibre eşik aralıkları', () => {
  // SONUC.md 2. tur: insan medyanı 94, LLM medyanı 62
  const insan = denetle(readFileSync(new URL('./ornekler/insan-metin.md', import.meta.url), 'utf8'))
  assert.ok(insan.skor > 72, `insan örneği ${insan.skor}`)
})

test('boşluklu tire: madde işareti değil, satır içi tire', () => {
  var_('Uygulama ücretsiz - en azından şimdilik.', 'bosluklu-tire')
  yok('Şunlar lazım.\n- alan adı\n- e-posta', 'bosluklu-tire')
  yok('Teslim 5 - 8 gün sürer.', 'bosluklu-tire')
})

test('F bölümü kuralları: pozitif ve negatif', () => {
  const ciftler = [
    ['yalanci-aralik', 'Küçük işletmelerden büyük kurumlara kadar herkese hizmet veriyoruz.', 'Pazartesiden cumaya kadar açığız.'],
    ['anons-ikinokta', 'Sorun şu: çalışanlar kullanmıyor.', 'Üç şey lazım: alan adı, barındırma ve e-posta.'],
    ['kosac-kacisi', 'Galeri, derneğin sergi alanı işlevi görmektedir.', 'Galeri derneğin sergi alanı.'],
    ['kesik-yigin', 'Hızlı. Güvenli. Basit. Kurulum on dakika sürer.', 'Kurulum on dakika sürer. Sonra paneli açıp ilk ürünü eklersiniz.'],
    ['retorik-soru', 'Peki bu ne anlama geliyor? Cevap basit: daha az maliyet.', 'Neden bu kadar pahalı diye soranlar oluyor.'],
    ['yapi-nakli', 'İşi hızlandırmakla kalmıyor, karara ortak oluyor.', 'Stokta ürün kalmıyor, yenisini sipariş ediyoruz.'],
    ['aforizma', 'Tasarım, güvenin dilidir.', 'Her şeyden önce ödeme gerekir.'],
    ['sahte-samimi', 'Dürüst olmak gerekirse herkes için doğru seçim değil.', 'Açıkçası bu fiyat bize de yüksek geliyor.'],
    ['bos-dogru', 'Güven zamanla inşa edilir.', 'Güven puanımız 4,8.'],
    ['relatif-ki', 'Bir özellik ekledik ki kullanıcılar şablon kaydedebiliyor.', 'Öyle yorulduk ki erken yattık.'],
  ]
  for (const [tur, pozitif, negatif] of ciftler) {
    var_(pozitif, tur)
    yok(negatif, tur)
  }
})

test('TDK: aralıkta kısa çizgi', () => {
  var_('Teslim 5–8 gün.', 'tdk-aralik')
  yok('Teslim 5-8 gün.', 'tdk-aralik')
})

test('soru eki: iyelik ekli ad yanlış pozitif vermez', () => {
  yok('Site yönetimi bizde. Üretimi ve denetimi siz yaparsınız.', 'tdk-mi-bitisik')
  yok('Yönetimi kim yapıyor?', 'tdk-mi-bitisik')
  var_('Yarın gelecekmisin?', 'tdk-mi-bitisik')
})

test('kör testte bulunan yanlış pozitifler', () => {
  for (const t of ['Sürpriz bir hediye.', 'Egzersiz yapın.', 'Kirpik serumu.', 'Süveter giydi.']) {
    assert.ok(!turler(t).some((x) => x.startsWith('tdk-')), t)
  }
  yok("64 GB'lık bellek, 1990'lı yıllar, TDK'lı kaynak.", 'tdk-kesme')
  var_("İstanbul'lu bir aile.", 'tdk-kesme')
})

test('dizin: fiil çekimi ayrı yazım sanılmaz', { skip: !dizinVar && 'TDK dizini derlenmemiş' }, () => {
  yok('Su boşalan depo yeniden doldu.', 'tdk-ayri-yazim')
  var_('Bu bir işbirliği projesi.', 'tdk-ayri-yazim')
  var_('Doğalgaz faturası geldi.', 'tdk-ayri-yazim')
})

import { jsonDenetle } from '../skills/turkish-writer/scripts/tr-scan.mjs'
test('JSON içerik dosyası: alan yoluyla tarama, teknik değerler atlanır', () => {
  const [s] = jsonDenetle('icerik.json', readFileSync(new URL('./ornekler/icerik.json', import.meta.url), 'utf8'), {})
  const yollar = s.alanlar.map((a) => a.yol)
  assert.ok(yollar.includes('$.sss[0].cevap'))
  assert.ok(!yollar.includes('$.hero.gorsel') && !yollar.includes('$.iletisim'))
  const cevap = s.alanlar.find((a) => a.yol === '$.sss[0].cevap')
  assert.ok(cevap.bulgular.some((b) => b.tur.startsWith('tdk-')))
  assert.ok(s.alanlar.find((a) => a.yol === '$.hero.alt').bulgular.some((b) => b.tur === 'olumsuz-kosutluk'))
})

test('GPT sözlüğü ve selamlı açılış (SONUC-FARK)', () => {
  var_('Şehir adeta bir masal diyarı.', 'gpt-sozlugu')
  var_('Bu macera beni çok etkiledi.', 'gpt-sozlugu')
  yok('Otobüsle 16 USD’ye geldim, yol dört saat sürdü.', 'gpt-sozlugu')
  var_('Merhaba sevgili okurlar! Bugün sizi Lviv’e götüreceğim.', 'giris-klisesi')
})
