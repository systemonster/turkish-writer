# V10 uzun metin geliştirme girdileri

Bu dosya, uzun Türkçe metinlerde editör davranışını incelemek için hazırlanan girdileri ve kaynak kökenini belgeler. Buradaki `keep` / `edit` etiketleri **kontrollü geliştirme beklentileridir**. İnsan editörün doğruladığı altın etiketler, kör test sonuçları veya bağımsız başarı ölçümü değildir.

## Dondurulmuş sürüm

Model koşusu için kullanılan veri `eeea2d17431016c2829c6d1fa19643b31529cedf` commit'indeki sürümdür. Sonradan fark edilen tek bir dil bilgisi kusuru koşu sırasında sessizce düzeltilmemiştir; önerilen değişiklik `results/longform-v10-errata.json` içinde ayrı tutulur. Çalışma kopyasındaki JSONL, dondurulmuş sürüme geri getirilmiştir.

| Dosya | İçerik | SHA-256 |
| --- | --- | --- |
| `longform-v10.jsonl` | 6 kaynak çifti, 12 metin | `6faa16a13d01b81dbb077a5ee2bdd0429f17b4109666d8694888413a7e46641c` |
| `brief-pairs-v10.jsonl` | Aynı olgularla 3 brief çifti, 6 brief | `f133f91f5b6af0d65f479545d0b7b28324fd1599fab90a660a8add4a40b143d0` |

Bu belge veri hazırlığını açıklar; model çıktılarının başarısını veya detektör sonuçlarını raporlamaz.

## 1. Projede üretilen uzun kaynaklar

Altı yazı bu çalışma için özgün olarak üretildi. Konuları, anlatıcıları ve somut ayrıntıları farklıdır. Uzunluk, aynı paragrafın kopyalanmasıyla sağlanmadı. Her yazıda kurum, ürün, kişi ve olayların kurmaca olduğu metnin içinde açıkça belirtilir. Deney, ölçüm ve sonuç sayıları gerçek dünyaya ilişkin doğrulanmış bulgular olarak sunulmaz.

| Çift | Başlık | Tür | Clean sözcük | Flawed sözcük |
| --- | --- | --- | ---: | ---: |
| `lf10-01` | Aynı raporu iki kişi neden farklı okudu? | `analitik-blog` | 668 | 695 |
| `lf10-02` | Bir defteri bitirmeden yenisine geçmek | `kisisel-deneme` | 663 | 699 |
| `lf10-03` | Yedek dosyanın varlığı bize neden yetmedi? | `urun-deneyimi-rehberi` | 656 | 680 |
| `lf10-04` | Fotoğrafın arkasına sığmayan hikâye | `kultur-blogu` | 673 | 703 |
| `lf10-05` | Bir rafın fotoğrafında görünmeyen ölçü | `tasarim-vaka-yazisi` | 685 | 720 |
| `lf10-06` | Atölyede sessizlik başladığında | `egitim-atolyesi-gozlemi` | 672 | 715 |

`word_count`, kaynaktaki boşluklarla ayrılan parçaların sayısıdır; başlık dahildir. Salt noktalama parçaları çıkarıldığında kaynaklar **653–717 sözcük** aralığındadır. Tam JSONL toplamı 8.229 boşlukla ayrılan parçadır; aynı yazının iki varyantı bağımsız örnek sayılmaz.

### Kaynakların içerik ve koruma hedefleri

- **Rapor yorumu:** Tıklama, sipariş, harcama ve sipariş başına maliyetin ayrı anlamları; takip yöntemi ve kârlılık belirsizliği. Daha çok siparişten doğrudan daha başarılı kampanya sonucu çıkarılmaması.
- **Kişisel deneme:** Bir anlatıcının dağınık notları ve belleği arasındaki gerilim; özgün ses, sınırlı kişisel sonuç ve tam olmayan hatırlama. Alıntının aynen kalması.
- **Ürün deneyimi:** Kurmaca bir not uygulamasında CSV/JSON, ek dosya ve saat dilimi farkları; yarım kalan yükleme ile yeniden denemenin ayrı tutulması. Tek başarılı denemeden genel güvenilirlik sonucu çıkarılmaması.
- **Kültür yazısı:** Mahalle fotoğraflarında tarama, yayın izni, kimlik ve tarihin ayrı kayıtlar olması; belirsiz bilgilerin kesinleştirilmemesi ve konuşmacının sözlerinin korunması.
- **Tasarım vakası:** Rafın dış ölçüleri ile askı aralığının ayrılması; kutu içeriği, ölçülmemiş taşıma kapasitesi ve temsili olmayan katılımcı grubunun korunması. Satış etkisi uydurulmaması.
- **Atölye gözlemi:** Farklı katılımcılardan oluşan iki oturumun sınırlı karşılaştırması; süre, katılımcı sayısı, ölçülmeyen öğrenme sonucu ve henüz kurutulmamış ürünlerin korunması.

### İki kol nasıl kuruldu?

`source_clean` kolunda, metnin anlamını ya da işlevini belirgin biçimde değiştirecek bir kusur eklenmedi; beklenen karar `keep`. Bu, metnin kusursuz olduğu veya her insan editörün değiştirmeden bırakacağı anlamına gelmez.

`source_flawed` kolunda aynı metne dört yerel değişiklik eklendi; beklenen karar `edit`. Dönüşümler yalnız anlatım düzeyindedir: gereksiz isimleştirme, aynı anlamı yeniden söyleme, boş geçiş cümlesi ve gereksiz dolaylı anlatım. Her dönüşüm `seeded_defects` içinde önceki ve sonraki tam dizeyle kayıtlıdır. Bir varyanttaki dört dönüşüm tersine uygulandığında temiz kaynak bayt düzeyinde geri elde edilir. Dönüşümlerin hiçbirinde sayı, olay, atıf veya bilinçli olgu bozulması hedeflenmemiştir.

**Bilinen istisna:** `lf10-03-flawed` içindeki tekrar tohumu ayrıca istenmeden bir durum eki/fiil yönetimi kusuru içerir: “sayının kendisini güvenmek”. Bu girdi yalnızca saf tekrar kusuru olarak yorumlanmamalıdır. Sonradan önerilen dil bilgisi düzeltmesi dondurulmuş koşuya uygulanmadı; eski ve önerilen tam dizeler, kaynak karmaları ve sözcük sayıları errata dosyasındadır.

### Şema ve etiket sızıntısı

Her satır şu alanları taşır:

| Alan | Kullanım |
| --- | --- |
| `id`, `pair_id` | Kaydı ve bağlı çifti tanımlar. |
| `arm`, `decision` | Deney kolu ve beklenen geliştirme kararıdır. Modele gönderilmez. |
| `genre`, `purpose` | Kaynağın türü ve görev amacı; ölçümün bağlamı. |
| `source` | Editörün işleyeceği gerçek kaynak metin. |
| `protected_facts` | Korunması gereken anlam, koşul, olumsuzluk ve belirsizlikleri açıklayan değerlendirme notları. |
| `protected_literals` | Kaynakta doğrulanan, aynen korunması istenen sayılar, ölçüler, alıntılar veya ürün terimleri. |
| `seeded_defects` | Yalnız değerlendirme için kontrollü değişiklik kaydı. Modele gönderilmez. |
| `provenance` | `generated_development`, `human_verified=false`, `independent_holdout=false`, kurmaca ve proje üretimi bilgileri. |
| `word_count`, `source_sha256` | Sayım ve veri bütünlüğü alanları. |

Modele değerlendirme nesnesinin tamamı verilmemelidir. Editör istemi yalnız kaynak ve normal görev yönergesinden kurulmalı; karar etiketi, kol adı, korunacak olgu listesi ve kusur haritası değerlendirme tarafında kalmalıdır. Korunan literal listesi bütün anlamı kapsamaz: literal eşleşmesi, anlamsal korumanın tek başına kanıtı değildir.

Her çift aynı geliştirme bölümünde tutulmalı. Temiz varyantı bir bölümde, kusurlu varyantı başka bölümde kullanmak bağımsız değerlendirme sağlamaz. Altı çiftten elde edilen sonuçlar insan yazısına veya bütün Türkçe türlerine genellenemez.

## 2. Brief karşılaştırması

Üç konu için olgular ve çıktı uzunluğu sabit tutularak iki anlatım düzeni hazırlandı:

| Çift | Konu | Sabit içerikteki ayırt edici sınır |
| --- | --- | --- |
| `brief10-01` | Kurmaca kitaplık paylaşım odası | İşlem sayısı kişi sayısı değildir; okuma alışkanlığı etkisi ölçülmedi. |
| `brief10-02` | Kurmaca işletmenin sipariş e-postaları | Alındı mesajı stok veya kabul onayı değildir; kayıp durum kayıtları korunur. |
| `brief10-03` | Kurmaca yürüyüş notu | GPS mesafesi ve çeşme suyunun içilebilirliği doğrulanmadı; genel uygunluk iddiası yok. |

`neutral`, bilgi sırasını konuya bırakır ve öneriyi yalnız işlevli olduğu yerde ister. `overdirective`, her ana bilgiden sonra eylem önerisi, her paragraf sonunda öneri ve sonunda tekrar özet ister. İki kol da 650–900 sözcük ister; kurmaca bildirimini, olgu sınırlarını ve yeni bilgi eklememe kuralını aynen taşır.

Bir çiftin `facts` dizileri eşittir. `brief` metninin “Anlatım düzeni:” öncesindeki bölümü de birebir aynıdır; değişen unsur yalnız anlatım yönergesidir. Bu nedenle koşul farkı, brief'in öneri yoğunluğunu zorlamasına bağlanabilecek dar bir deneydir. Yine de model örnekleme değişkenliği ayrı kalır; tek çıktıdan evrensel bir sonuç çıkarılmaz. Bu brief'ler insan tarafından yazılmış bağımsız bir test seti değildir.

## 3. Lisansı kontrol edilen yayımlanmış Türkçe kaynaklar

Aşağıdaki sayfaların HTML kayıtları ve metin seçkileri 25 Kasım 2026 tarihinde çalışma klasörüne alındı. Yayımlanmış olmak, insan tarafından tek başına yazılmış olmayı veya içerikteki olguların doğru olmasını kanıtlamaz. Bütün kayıtlar `licensed_published_exploratory`, `human_verified=false`, `independent_holdout=false` olarak işaretlidir. Yapay zekâ yardımı kullanılıp kullanılmadığı bilinmiyor.

| Kaynak | Görünen yazar | Yayın tarihi | Seçki sözcük | Uzun metin için ≥650 |
| --- | --- | --- | ---: | --- |
| [Okuma ve Okuduğunu Unutmamak Rehberi: Okuma Alışkanlığından Kitap Notuna ve Yazıya](https://nitorel.com/yazilar/okuma-ve-okudugunu-unutmamak) | Ahmet Canal | 2026-10-07 | 1134 | Evet |
| [Kitap Okuma Alışkanlığı Nasıl Kazanılır? Günde 10 Dakikadan Başlamak](https://nitorel.com/yazilar/kitap-okuma-aliskanligi) | Ahmet Canal | 2026-10-07 | 744 | Evet |
| [Osmanlı Minyatür Sanatında İkonografik Bir Okuma: “Gül Koklayan Fatih” Portresi ve Gül-i Muhammedî Sembolizmi](https://mirasium.org/gul-koklayan-fatih-portresi-ve-gul-i-muhammedi/) | Emre Kaya | 2026-04-17 | 714 | Evet |
| [Osmanlı’nın Görsel Şahidi: Matrakçı Nasuh ve Beyan-ı Menazil Minyatürleri](https://mirasium.org/matrakci-nasuh-ve-beyan-i-menazil-minyaturleri/) | Fatih Ars | 2025-12-17 | 398 | Hayır: 650 altı |

İlk üç seçki uzunluk bakımından kullanılabilir. Matrakçı Nasuh seçkisi, üçüncü taraf alıntılarını geniş biçimde dışarıda bırakan ayıklamadan sonra 398 sözcük kaldığı için `longform_eligible=false` olarak kayıtlıdır; uzun metin örneği sayısına katılmaz.

### Lisans dayanakları ve kapsam

- [Nitorel lisans sayfası](https://nitorel.com/lisans), siteye ait özgün yazı ve rehberleri CC BY 4.0 kapsamında tanımlar; yazar, kaynak, lisans ve değişiklik bilgisiyle yeniden kullanım mümkündür. Logo, tasarım ve üçüncü taraf içerikler aynı varsayımla alınmaz.
- [Mirasium kamu malı ve lisans kılavuzu](https://mirasium.org/kamu-mali-kilavuzu/), sitedeki özgün yazı ve yorumlar için CC BY 4.0 beyanı içerir; başkalarına ait eser ve alıntıların hak durumu ayrıca ele alınır.
- Kullanılan lisansın metni: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).

Her kaydın metadata dosyasında kaynak URL'si, görünen yazar, yayın tarihi, erişim tarihi, hak beyanı URL'si, CC bağlantısı, atıf metni, yapılan ayıklama, kaynak grubu, yazar grubu, konu grubu ve karmalar bulunur. Bu atıf bilgileri sonraki yeniden kullanımlarda kaynakla birlikte taşınmalıdır.

### Ayıklama ve kalite sınırları

HTML'den gövde metni alındı. Menü, görüntü, medya, kod/şablon blokları, bölüm başlıkları ve kaynakça çıkarıldı. Çift tırnak içeren paragraflar, üçüncü taraf alıntılarını yanlışlıkla içeri almamak için bütünüyle dışarıda bırakıldı. Bu kural bazı yazara ait paragrafları da kaldırabilir. Kalan paragraflar özgün sırada tutuldu; üst sınır 1.400 sözcük ve tam paragraf sonu olarak belirlendi. Ortaya çıkan metin **tam makale değil, kısaltılmış seçkidir**; kaynakta bulunmayan bağlayıcı cümle eklenmedi.

Nitorel okuma rehberindeki görünür boş/yer tutucu bağlantı gibi siteye ait metin izleri düzeltilmedi. Bu kaynaklar kusursuz insan yazısı için kalite eşiği sağlamaz; yalnız yayımlanmış, atıflı ve lisansı kontrol edilmiş ek inceleme malzemesidir. Seçkilerin bütün olguları bağımsız olarak doğrulanmadı. Kör değerlendirmede doğal akış veya bütün makale yapısı puanlanacaksa bu ayıklanmış seçkiler uygun bir tek başına referans değildir.

İki Nitorel kaynağı aynı yazar ve aynı okuma konusu grubundadır. Okuma rehberi V9 kaynak incelemesinde zaten görülmüştür; alışkanlık yazısı da aynı yazar/konu grubuna aittir. Bu ikisi yeni bir bağımsız holdout olarak tanımlanamaz. Mirasium kaynakları da aynı yayın alanında ve sanat tarihi konu grubundadır. Yazar/alan/konu grupları rastgele satır bölünmesiyle birbirinden ayrılmamalıdır. Bu metinlere insan etiketi atayıp bir AI detektörünün yanlış pozitif oranı hesaplanamaz.

### Özel çalışma dosyaları ve karmalar

Ham HTML, seçkiler, metadata, `candidates.jsonl` ve `source-manifest.json`, git tarafından dışlanan `corpus-lab/work/v10-sources/` altındadır. Yayımlanmış makale gövdeleri depoya eklenmedi. Bu toplama adımında kaynaklar bir detektör veya üretim sağlayıcısına gönderilmedi.

```text
rights-evidence-nitorel-license
  html:    5ae5f828022df1e1a63dabbbd0f83ffd99c842913d07572c8e4eefc3cf2f1261
rights-evidence-mirasium-license
  html:    5600f43538145d03bcfb61db9cf13aa0620f3f1dbbfa8bf98173d107ad375eab
external-v10-nitorel-reading
  excerpt: 316e8ba1dd32882460652d0fc4eb82083e464a9a3e63851d7aba0ba4653819c4
  html:    d9471a6af29b55b9ed3ccceae956d1bdf91cdaadf55f0498a00d4ab6e6fce4ff
external-v10-nitorel-habit
  excerpt: 908ac12526be1b89f4ff13ac3db07e1962ec66f9e950f2c6ec8d86105cf3b1c7
  html:    383d56d3abdb74605346e99bfae1ddbe2067138e5a4de8769472dfaafa23ed80
external-v10-mirasium-fatih
  excerpt: 11a95a55b3ff37d24a6833e505b5913f9ab8bf0fe370b3e1012e2ab36feb369d
  html:    3813e7b89cc2a373401cb6871f8484aa632edc08b37403f4bcded76a4d70feff
external-v10-mirasium-matrakci
  excerpt: 46d700d540834bb957082d39e80cf52915959c3546bee2970c81ce746a1272c8
  html:    0784dfd51e424efe1a8cc8cd272ccd4c9fc9475380c8fcbec25fafaecf8b365d
```

## 4. Doğrulama ve yorum sınırı

Veri hazırlığında şu kontroller geçti: 12 benzersiz kaynak kimliği; altı iki kollu çift; 650–1100 boşlukla ayrılan sözcük aralığı; her kaynak karmasının yeniden hesaplanması; korunan literallerin her iki varyantta bulunması; kusur değişikliklerinin tersine çevrilince temiz metni vermesi; eşit olgu ve literal listeleri; altı brief'in üç çiftte aynı olgu gövdesini taşıması.

Bu kontroller veri tutarlılığını gösterir. Doğru editör kararı, doğal Türkçe, insan tercihi, detektör kalibrasyonu veya dağılım dışı başarı için sonuç yerine geçmez. Tekrarlı düzenleme, kural çıkarma ve anlam koruma koşularının yorumunda her kaynak çifti bağlı gözlem olarak ele alınmalıdır. Sonuç raporları dondurulmuş kaynak karmasını ve bilinen erratayı belirtmelidir.
