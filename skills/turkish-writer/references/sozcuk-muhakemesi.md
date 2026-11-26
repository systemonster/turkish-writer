# Sözcüksel muhakeme — isabet, zenginlik ve ses

Bu katman bir eş anlamlı değiştirme motoru değildir. Yaz, Düzelt ve Denetle kiplerinde düşünceyi Türkçede en iyi taşıyan ifadeyi seçmek için kullanılır. Kullanıcı başka bir üslup istemedikçe sırf edebî görünmek için ağır, seyrek veya eski sözcük ekleme.

## Karar sırası

1. Kaynaktaki olguyu, duygunun türünü ve şiddetini, kipini, nedenselliği, bakış açısını, özel adı, terimi, atfı ve anlamlı tekrarları belirle.
2. Mevcut ifade iyi mi? İyiyse değiştirme. Gereksiz tekrar bir kelime sorunu değil, paragrafın düşünceyi iki kez anlatması olabilir.
3. Doğal cümleyi veya eylemi kur. Sözcük önerisi ancak gerçekten daha isabetliyse değerlendir. Çok anlamlı kelimeye anlam numarası seçmeden alternatif önerme.
4. Kelimenin anlamı, çağrışımı, çekimi, eş dizimi ve sicilini kontrol et. Yakın anlamlı sözcüklerin birbirinin yerine her zaman geçmediğini unutma. Kaynakta olmayan duygu, yargı veya kesinlik ekleme.
5. Anlamı ve sesini iki yönlü karşılaştır. İyileşme belirsizse önceki ifadeyi koru.

## Özgün proje örnekleri

| Kaynak | Zayıf müdahale | Karar |
| --- | --- | --- |
| Bu durum insanların kendilerini kötü hissetmesine neden oldu. | Bu vaziyet insanların kendilerini fena hissetmesine sebebiyet verdi. | Duygu türü belirtilmemiş; kaynak doğalysa koru. "İçini burktu" veya "tedirgin etti" ancak üzüntü veya kaygı açıkça kastedilmişse düşünülebilir. |
| Onun söylediklerini uzun süre düşündüm. | Beyanlarını uzun müddet tefekkür ettim. | Anlatıcının sesi gereksiz eskileşiyor. "Aklımı kurcaladı" ise kaynakta olmayan huzursuzluk ima edebilir. |
| Bu bilgiye dayanarak karar verilebilir. | Bu bilgiyle karar verilir. | Olasılık/izin kesinliğe dönüştü. |
| Odaya girdi, pencereyi açtı. | İçeri intikal ederek pencereyi açtı. | Edebî derinlik sözcüğün ağırlığından gelmez; doğal olay sırası zaten iyi. |
| Bütçeyi belirledik, bütçeyi izledik, bütçeyi değiştirmedik. | Bütçeyi belirledik, sermayeyi izledik, ödeneği değiştirmedik. | Terimi koru. Gereksiz tekrarsa "Bütçeyi belirledik, izledik ve değiştirmedik." gibi aynı eyleyeni ve kapsamı koruyan bir cümle kur. |
| Yağmur dinmişti. Sokak hâlâ ıslaktı. | Yağış sona ermişti. Cadde rutubetliydi. | "Sokak/cadde" ve "ıslak/rutubetli" aynı değildir; kısa edebî ritim doğal. |
| Anlatıcı 1905'teki bir mektubunda "vaziyet" diyor. | Her "vaziyet" → "durum". | Dönem sesi ve alıntı korunur. |

Blog ve kurumsal dilde somut fiiller, doğru eş dizim ve açık bilgi sırası; roman ve öyküde anlatıcı sesi, duygu nüansı, dönem, diyalog ve ritim; şiirde imge ve dize; akademik metinde teknik kesinlik önceliklidir. Edebî metne kurumsal söz dizimi, kurumsal metne şiirsel kelime kotası dayatma.

## Araçlar — isteğe bağlı

```bash
node scripts/tr-scan.mjs metin.md --json --editor
node scripts/tr-scan.mjs icerik.json --json --editor
python3 scripts/kenet-derle.py --indir
node scripts/sozcuk-muhakemesi.mjs --kelime yüz
```

KeNet (Turkish WordNet), StarlangSoftware ve katkıcılarının ayrı CC BY-SA 4.0 lisanslı veri kaynağıdır. [Sabit kaynak](https://github.com/StarlangSoftware/TurkishWordNet-Py/tree/09ebb811b08eedaedc4abb9cfde2d08eadfe71e4); veri dosyası WordNet/data/turkish_wordnet.xml, Git blob 2cdf2a59e524764cfe2c11a03fa9623495df21bb. Bakay ve arkadaşları, Turkish WordNet KeNet, Proceedings of GWC 2021 (kaynak deponun atıf künyesi). GPL-3.0 upstream kodu alınmadı. Yerel standart kütüphane derleyicisi sabit XML boyutunu ve Git blob hash'ini doğrular; anlam kimliği, lemma, anlam numarası, POS ve tanım alanlarını yerelde indeksler. Örnek cümle ve anlam dışı ilişkiler alınmaz. Veri kaynak paketiyle dağıtılmaz; varsayılan konumu ~/.cache/turkish-writer altındadır. Ağ erişimi yalnız açık --indir çağrısında yapılır. TDK'nın bütün sözlük verisini toplama/dağıtma yok; [TDK veri tabanı paylaşım açıklaması](https://tdk.gov.tr/icerik/sikca-sorulan-sorular/turkce-sozlukun-veri-tabanini-talep-edildiginde-paylasiyor-musunuz/).

AnlamAra, kelimeye ait kümeleri gösterir. Editör seçili anlamın kimliğini belirlediğinde --anlam ID ile en fazla üç aynı küme adayı alabilir. Sıklık, eş dizim veya sicil bilinmiyorsa bilinmiyor olarak kalır; adaylar öneri onayı değildir. Mevcut esdizim.mjs sınırlı isim-fiil ilişkilerini inceler, bütün anlam ve dil bilgisi sorunlarını çözmez. Sözlük yokken yerleşik kılavuz, proje örnekleri ve tarayıcı editör modu çalışır.

## Site ve dosya denetimi

tr-scan'in eski puanı ve varsayılan JSON sözleşmesi korunur. --editor kipi, TDK bulgu yoğunluğunu, söz dizimi bulgularını, eski tarayıcıdan seçili inceleme ipuçlarını ve bağlam/tekrar notlarını ekler. JSON içindeki her metin alanı ayrı değerlendirilir; başlık ve butonlarda yeni kelime önerisi üretilmez. Sayfa metnini Markdown veya görünür içerik JSON olarak ver; ham HTML/CSS/JS ya da teknik alanları yazı gibi değerlendirme. Alıntı ve kaynak açıklamalarını değiştirme. TDK bulguları önce doğrulanır. Okuma ve kaynak sadakati olmadan bulguların sıfırlanması başarı değildir. Bu katman henüz bağımsız insan editör deneyinde doğrulanmamıştır.


## İlk gerçek veri kontrolü (26 Kasım 2026)

Sabit XML dosyasından 78.327 anlam kümesi ve 82.155 farklı lemma indekslendi (upstream README'deki tarihsel sayımla karıştırma). `yüz` 14, `kötü` 10, `fena` 6, `durum` 4, `vaziyet` 3, `düşünmek` 8 anlam kümesinde bulundu. Sayılar sözcüklerin bağlam içinde birbirinin yerine geçebileceğini göstermez. Kaynak hash'i, testler ve henüz ölçülmeyen kabul koşulları [deney kaydında](https://github.com/systemonster/turkish-writer/blob/ozellik/esanlam-onerisi/corpus-lab/LEXICAL-JUDGMENT.md) yer alır.
