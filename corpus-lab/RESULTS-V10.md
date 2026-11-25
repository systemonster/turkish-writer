# V10: altı teşhis deneyinin sonuçları

25 Kasım 2026. **İki modelde 336 görev tamamlandı. Bu tur, final skill yayını için yeterli kalite kanıtı üretmedi; somut düzenleme kusurlarını görünür kıldı.** Aktif skill ve master bu deneylerle değiştirilmedi.

gpt-oss-120b ve Qwen3-32B, aynı dondurulmuş 168 görevi ayrı ayrı tamamladı. Kesilme, boş son çıktı, son kanal ayırma hatası, hakem JSON hatası veya kayıt bütünlüğü hatası yok. Bunlar çalışma ve veri bütünlüğü sonuçlarıdır; metinlerin doğru veya iyi olduğunu göstermez.

[İki modelin hesaplanmış karşılaştırması](results/diagnostics-v10-comparison.json), [gpt-oss ham çıktıları](results/diagnostics-v10-gptoss120b.jsonl), [Qwen ham çıktıları](results/diagnostics-v10-qwen32b.jsonl), [gpt-oss ayrıntılı özeti](results/diagnostics-v10-gptoss120b-summary.json) ve [Qwen ayrıntılı özeti](results/diagnostics-v10-qwen32b-summary.json) saklandı.

## Kapsam ve kanıt düzeyi

Altı proje üretimi blogun temiz ve dört yerel üslup kusuru eklenmiş sürümleri kullanıldı: **12 metin, 656–720 boşlukla ayrılmış sözcük**. On iki girdi altı temel yazıdan gelir; on iki bağımsız yazar değildir. Temiz etiketi insan altın standardı anlamına gelmez. [Veri ve kaynak belgesi](LONGFORM-V10.md), kökeni ve dondurma sonrasında uygulanmayan bir düzeltmeyi açıklar.

| Deney | Model başına | İki model toplamı | İncelenen şey |
|---|---:|---:|---|
| Uzun metin düzenleme | 36 | 72 | Aynı kaynakta sade talimat, iki dosyalı çekirdek, altı dosyalı paket |
| Kural çıkarma | 16 | 32 | Dört ayrı kural grubunu kaldırınca yerel onarım ve yeni hata |
| İkinci ve üçüncü tur | 8 | 16 | Dört metinde düzenlemenin sürmesi, durması ve anlam değişimi |
| Anlam seçimi | 48 | 96 | 24 kaynakta iki seçenek sırası; sadık yeniden söyleyiş kontrolleri |
| Kısa kaynak düzenleme | 48 | 96 | Aynı 24 kaynağı gerçekten düzenlerken anlamın korunması |
| Briften üretim | 12 | 24 | Üç aynı-olgulu brif çiftinde anlatım talimatının etkisi |
| **Toplam** | **168** | **336** | |

Kaynak, talimat ve son çıktı hash'leri doğrulandı. Kaynak etiketleri ve doğru cevaplar model girdilerine verilmedi. Çıktı bütçeleri 4.096–8.192 token; düşünme içeriği bu bütçeye dahildir. Ham düşünme metni yayımlanmadı. [Protokol](DIAGNOSTICS-V10.md) ve [ölçüm sınırları](DIAGNOSTIC-METRICS.md).

Aşağıdaki editoryal incelemeler **AI, etiketleri gören geliştirme incelemeleridir**. İnsan değerlendirmesi, bağımsız holdout, istatistiksel üstünlük veya genel yazı kalitesi puanı olarak sunulmaz. İncelemelerde kaynak ve çıktıdan birebir alıntılar saklandı; düzeltilen sorunlarla yeni hatalar ayrı kaydedildi.

## 1. Anlamı seçebilmek, düzenlerken korumaya yetmedi

| Dondurulmuş proje etiketlerine uyum | gpt-oss-120b | Qwen3-32B |
|---|---:|---:|
| Bütün 24 örnek × iki sıra | 47/48 | 48/48 |
| Önceden belirsiz bulunan 024 dışarıda | 45/46 | 46/46 |
| Önceden belirsiz bulunan 021 ve 024 dışarıda | 43/44 | 44/44 |
| İki sırada da doğru olan örnek | 23/24 | 24/24 |

Duyarlılık kümeleri sonuçlar görülmeden [fikstür incelemesinde](results/semantic-fixture-review-v10.json) kaydedildi; etiketler sonradan değiştirilmedi. gpt-oss'un tek yanlış seçimi 017'nin bir sırasında geçerli bir yeniden söyleyişteki “daha” sözcüğünü anlam kayması saydı. Ters sırada ESIT seçti. Tek seed ile sunum sırası ve üretim değişkenliği ayrıştırılamaz.

Gerçek düzenlemelerde ise şu açık kusurlar görüldü:

| Model / kol / vaka | Kaynak | Çıktı | Değişen şey |
|---|---|---|---|
| gpt-oss full, kısa 005 | “sinyali kapının açılmasının tetikleyip tetiklemediği bilinmiyor” | “sinyalin kapının açılmasını tetikleyip tetiklemediği bilinmiyor” | Nedenselliğin yönü ters dönüyor. |
| gpt-oss baseline ve full, kısa 014 | “saatin tekrar durup durmadığını bilmiyoruz” | “saatin tekrar çalışıp çalışmadığını bilmiyoruz” | Yeniden durma sorusu yeniden çalışmaya başlama sorusuna dönüşüyor. |
| Qwen baseline, kısa 009 | “üç küçük kaba aynı malzemeden kondu” | “aynı malzemeden yapılmış üç küçük kaba” | Kapların içine konan malzeme, kapların yapıldığı malzemeye dönüşüyor; malzeme ekleme olayı kayboluyor. |
| Qwen baseline, uzun 06 | “göstermeye yetmezdi” | “kanıtlamak için yeterliydi” | Yetersiz kanıt yeterli kanıta dönüşüyor. |
| gpt-oss full, uzun 03 | Bazı örnekler açılıyor, **bütün eklerin** dosya özetleri karşılaştırılıyor. | “Örneklerin bir bölümünü açıp özetlerini karşılaştırdık” | Bazı örnekleri açma ile bütün ekleri doğrulama ayrımı kayboluyor. |

gpt-oss 005 ve 014'ün, Qwen ise 009'un seçenek karşılaştırmalarını iki sırada da doğru yaptı. Bu vakalar, karşılaştırma puanının serbest düzenlemedeki sadakat yerine kullanılamayacağını doğrudan gösteriyor.

Qwen full 001, 005 ve 012'de yalnız son metin istenmesine rağmen açıklama ekledi. 012'nin açıklaması, kaynakta zaten “üzerinden” yazdığı hâlde “üzeri → üzerinden” düzeltmesi yapıldığını iddia etti. Bu **çıktı talimatı ve gerekçe doğruluğu** sorunudur; her biri ayrı bir kritik anlam hatası diye sayılmadı. Qwen 005/014/021'deki olumsuzluk-belirsizlik kapsamı nüansları da kesin nedensellik veya olay terslemesiyle aynı kefeye konmadı.

[48 gpt-oss kısa düzenlemenin incelemesi](results/gptoss-semantic-edit-ai-review-v10.json) ve [48 Qwen kısa düzenlemenin incelemesi](results/qwen-semantic-edit-ai-review-v10.json).

## 2. Uzun metinlerde hem az düzeltme hem yeni hata görüldü

İki dosyalı çekirdek, her iki modelde de altı dosyalı paketten ve sade talimattan ortalama daha az değişiklik yaptı. Normalize token düzenleme uzaklıkları:

| Kol | gpt-oss-120b | Qwen3-32B |
|---|---:|---:|
| Sade talimat | 0,311 | 0,323 |
| İki dosyalı çekirdek | 0,110 | 0,082 |
| Altı dosyalı paket | 0,143 | 0,153 |

Bu tablo yalnız **ne kadar değiştiğini** gösterir. Az değişiklik, kusuru bırakmış olabilir; çok değişiklik, yararlı onarım veya yeni hata içerebilir. Kalite sıralaması çıkarılmadı.

Her modelin altı kusurlu kaynak × üç kol çıktısı tek tek incelendi: model başına 18 çıktı ve 72 yerel kusur yargısı. gpt-oss çekirdek/full çıktılarının 12 tekrar bölgesinden 10'unda tekrar kaldı veya yalnız başka kelimelerle söylendi; 12 boş geçişin dokuzu kaldı veya kozmetik değişti, üçü kısmen onarıldı.

Qwen'de 18 kusurlu çıktının 10'unda dört hedef kusurdan hiçbirinde esaslı onarım bulunmadı. Defter yazısının çekirdek çıktısı kaynakla birebir aynıydı ve dört kusuru da korudu. Bu sonuç, kusurlu metni hiç değiştirmemenin başarı sayılmaması gerektiğini gösteriyor.

Daha çok onarım yapan sade talimat da güvenli bir kazanan değildi. Qwen'in atölye yazısında “bütün düzeni yeniden değiştirmemeye karar verdik” ifadesi “düzeni yeniden değiştirmeyi tercih ettik” oldu. “İpucu sağlayabilirdi” olasılığı “ipucu verdi” sonucuna dönüştü. gpt-oss full bir başka çıktıda doğru “kile dokunmaya” ifadesini “kili dokunmaya” yaptı.

Yararlı değişiklikler de kaydedildi: Qwen core arşiv yazısında üç yerel kusuru giderdi; Qwen full yedek yazısında tekrar ve boş geçişi temizlerken bütün eklerin dosya özeti kapsamını ve 2.4 sürümünü korudu. Aynı çıktılarda başka sorunlar bulunması, tek bir yerel onarımın bütün yazıya başarı etiketi vermeye yetmediğini gösteriyor.

[gpt-oss uzun metin incelemesi](results/gptoss-longform-ai-review-v10.json), [Qwen uzun metin incelemesi](results/qwen-longform-ai-review-v10.json).

### Temiz kaynakta koruma kontrolü

İki modelin altı temiz kaynak üzerindeki full çıktıları ayrıca incelendi: 12 çıktı. gpt-oss ürün yazısında “Çizimde yalnız dış ölçüler bulunmuyordu” cümlesini “Çizimde yalnız dış ölçüler bulunuyordu” yaptı; sonraki cümle askı noktaları arasındaki 58 cm mesafeyi hâlâ verdiği için içeride doğrudan çelişki oluştu. Qwen mağaza yazısında siparişin açılma zamanını iptal zamanına çevirdi; yedek yazısında bütün ekleri doğrulama kapsamını kaybetti.

Qwen'in temiz defter çıktısı kaynağın aynısıydı; temiz ürün çıktısında yalnız boşluk farkı vardı. Bunlar bu incelemede meşru koruma olarak kaydedildi. Kaynağın kendisinde bulunan bir ifade sorunu da modele yüklenmedi. Temiz etiketinin kusursuz insan metni anlamına gelmediği sınırı korundu. [Temiz full çıktılarının incelemesi](results/clean-full-ai-review-v10.json).

## 3. Kural çıkarma tek bir suçlu kural göstermedi

Minimal müdahale maddesi, söyleyiş/ritim bölümleri, karşı örnekler ve blog yapı bölümleri ayrı ayrı çıkarıldı. Her çıkarma aynı dört kaynak sürümünde sınandı. Başka dosyalarda benzer ilkeler kaldığı için bunlar bütün kavramın tamamen kaldırıldığı deneyler değildir.

gpt-oss'ta iki kusurlu kaynağın tekrar ve boş geçiş sorunları bütün çıkarma kollarında sürdü. Qwen'de mağaza yazısının ağır yapıları bazı kollarda düzeldi; defter yazısındaki dört kusur ise bütün çıkarma kollarında kaldı. Bir Qwen kolu mağaza yazısını kısaltırken harcama tutarlarını kaldırdı ve siparişin son gün açılması bilgisini son gün iptal edilmesiyle değiştirdi.

Dolayısıyla tek kural grubunu kaldırıp bütün sorunu çözdüğümüz gösterilemedi. Tek seed ve iki temel yazı üzerinden genel bir kural sıralaması çıkarılmadı.

[gpt-oss kural çıkarma ve tur incelemesi](results/gptoss-ablation-stability-ai-review-v10.json), [Qwen kural çıkarma ve tur incelemesi](results/qwen-ablation-stability-ai-review-v10.json).

## 4. Tekrar düzenleme ve durma davranışı

Dört metne aynı full bağlamla ikinci ve üçüncü düzenleme uygulandı.

| Önceki turdan değişen metin | gpt-oss-120b | Qwen3-32B |
|---|---:|---:|
| İkinci tur | 4/4 | 3/4 |
| Üçüncü tur | 4/4 | 1/4 |

gpt-oss'un değişiklik miktarı küçüldü, fakat yeni dil hataları oluştu: “ikinci defterin başında bırakmıştım” ifadesi “ikinci defteri başından bırakmıştım” oldu. “Çoğunlukla” yerine “çoğu” getiren başka bir tur da cümleyi bozdu. Buna karşılık ilk turda eklenen `sağlamakti` yazım yanlışı sonraki turda düzeldi.

Qwen'in üç metni üçüncü turda birebir sabitlendi; bunların arasında hedef kusurlarını koruyan metinler de var. Mağaza yazısında ikinci tur, maliyetlerin raporda bulunmamasını sipariş başı reklam giderinin yükselme nedeni gibi bağladı; bu yeni nedensellik üçüncü turda kaldı. Aynı süreçte “14’şer” → “14’er” gibi yararlı bir düzeltme de yapıldı.

**Tekrar çalıştırmak otomatik kalite artışı sağlamadı; sabitlenmek de kusursuzluk anlamına gelmedi.**

## 5. Brifin etkisi ve olgu sınırları

Üç brif çiftinde sekiz olgu birebir aynı tutuldu. Bir kol her paragrafta öneri ve sonda tekrar istiyor; nötr kol öneriyi yalnız işlevli yerde istiyor. İki kolun da 650–900 sözcük hedefi aynı. Uzunluk baskısının bağımsız etkisi bu deneyde ölçülmedi.

Nötr brif tek başına olgu üretimini engellemedi:

- **gpt-oss, kitaplık / nötr full:** sekiz “Öneri:” etiketi ve kitap türleriyle popüler kitaplar hakkında uydurulmuş “Kişisel gözlem” bölümü. Sonunda kişisel deneyim eklenmediğini de iddia ediyor.
- **Qwen, kitaplık / nötr full:** “her ziyarette en fazla iki kitap” kuralına, aynı gün yeniden gelince sayının artmayacağını ekliyor. Kaynakta günlük toplam sınırı yok.
- **Qwen, yürüyüş / nötr baseline:** başlangıç saatini 09.00 yapıyor; katılımcıların ekipmanını, fotoğrafçılık ilgisini ve acemiliğini uyduruyor.
- **Qwen, yürüyüş / nötr full:** yalnız görülmüş çeşmeyi, yürüyüşçülerin su almak için durduğu bir olaya dönüştürüyor.
- **İki modelin başka çıktıları:** kaydedilmemiş son durumlardan otomasyon seviyesi veya çalışan davranışı çıkarma, ölçülmemiş etkileri sonuç gibi sunma.

Açık varsayım olarak sunulan olası nedenler, genel tavsiyeler ve verilen sayılardan hesaplanan değerler, yaşanmış olay uydurmakla aynı sınıfa alınmadı. Aşırı yönlendiren brifin istediği tekrar yapısını üretmek de tek başına model hatası sayılmadı.

Qwen'in 12 çıktısının tamamı hedefin altında kaldı: 324–553 sözcük. gpt-oss'ta yedi çıktı hedefin altında, beşi boşluk sayımına göre 650–900 aralığında. Hiçbiri kesilmiş değildi. Sayım Markdown işaretlerini de içerebilir; sınırdaki 650 değeri dilbilimsel kesin sözcük sayısı değildir.

[gpt-oss brif incelemesi](results/gptoss-brief-ai-review-v10.json), [Qwen brif incelemesi](results/qwen-brief-ai-review-v10.json).

## 6. Gerçek AI dedektörü taramaları

Pangram 4.1'de dört gerçek tarama yapıldı:

| Karşılaştırma | Yerel boşluk sayımı | Sonuç |
|---|---|---|
| Aynı olgulardan iki proje üretimi sürüm | 264 ve 253 sözcük | İkisi de AI %100 / AI-assisted %0 / Human %0 |
| Kusurlu uzun kaynaktan ve gerçek gpt-oss full çıktısından kesintisiz alıntılar | 186 ve 193 sözcük | İkisi de AI %100 / AI-assisted %0 / Human %0 |

Her taramada bütün gönderilen metin tek segment olarak işaretlendi; cümleye özgü hata teşhisi gelmedi. Bu iki çiftte skor, editoryal farkı açıklamadı. İkinci çift bütün uzun yazı sonucu değildir; benzer uzunlukta birebir alıntıların sonucudur. İnsan kontrol metni bulunmadığından insan yanlış-pozitif oranı veya genel dedektör doğruluğu hesaplanmadı.

Originality'nin ücretsiz Model 5.0 arayüzü metni kabul etti, ancak iki denemede doğrulanmış sonuç vermedi; neden bilinmiyor. Eksik sonuç sıfır AI veya başarı sayılmadı. Pangram'ın dört taraması ücretsiz toplam 10 kredi kullandı; satın alma yapılmadı. API adaptörlerinin hazırlanması ayrıca bir API taraması yapıldığı anlamına gelmez.

[İlk tarama kayıtları](results/detector-pilot-v10.json), [gerçek V2 çıktı alıntısı kayıtları](results/detector-v2-excerpt-v10.json), [dedektör araçları ve sınırları](DETECTOR-PILOT.md).

## Ayrı küçük deney: gerçek skill dosyalarıyla ajan akışı

Sabit altı dosyalı full bağlam, dinamik dosya seçen ve araç kullanan bütün ajan akışına eşit değildir. Bu ayrımı sınamak için bir yazının temiz ve kusurlu sürümü, her koşulda yeni ve tek kaynak gören ChatGPT ajan oturumlarında çalıştırıldı: dört geçerli çıktı.

Bu tek yazıda skill akışı temiz kaynağı birebir korudu. Kusurlu kaynakta hem sade talimat hem skill akışı dört eklenmiş kusuru düzeltti; skill akışı onarım bölgeleriyle sınırlı kaldı, sade talimat ek yerlerde de değişiklik yaptı. Bu, yalnız bu örnekte seçici müdahaleye ilişkin bir bulgudur.

İlk denemede birden fazla kaynak sürümünü birlikte gören oturumlar, referans sızıntısı nedeniyle karşılaştırmadan çıkarıldı. Yeni pilotun tam arka uç model sürümü ve örnekleme ayarları açıklanmadığından HF sonuçlarıyla kontrollü bir model karşılaştırması yapılamaz. Dosya/araç kullanımı ajan raporlarına dayanır; bağımsız araç izi denetimi değildir.

Yerel Codex CLI denemesi `Read-only file system` hatasıyla başlayamadı. Yetki veya kimlik dosyası değiştirilmedi. ChatGPT ajan pilotu yapıldı; tam Codex CLI denemesi tamamlanmış sayılmadı.

[Native ajan pilotu](NATIVE-RUNTIME-V10.md), [inceleme verisi](results/native-runtime-review-v10.json).

## Karar ve sonraki hipotez

Bu tur, finali engelleyen üç somut davranış gösterdi:

1. Kaynakta bulunan üslup kusurunu bırakma veya yalnız başka kelimelerle tekrarlama.
2. Düzeltilmesi gerekmeyen çevre cümlelerini değiştirirken anlam/dil hatası ekleme.
3. Brifte verilmeyen kuralı, olayı veya gözlemi boşluğu doldurmak için üretme.

Bir sonraki aday için desteklenen **henüz sınanmamış hipotez** şudur: önce tam kusur bölgesini belirle; silme/birleştirme yeterliyse yalnız o bölgeyi değiştir; değişen cümlede eyleyen/nesne, olumsuzluk, neden–sonuç, zaman, bütün/bazı kapsamı ve olasılık/sonuç ayrımını kaynakla yeniden karşılaştır. Bu çalışma, o yaklaşımın başarılı olduğunu veya mevcut kurallardan hangisinin tek başına sorumlu olduğunu kanıtlamaz.

Bu hipotez yeni temiz ve kusurlu kaynaklarda sınanmalıdır. Aynı geliştirme örneklerinde daha iyi skor elde etmek, bağımsız genelleme veya yayın onayı sayılmayacak. Bağımsız insan incelemesi ve doğrulanmış holdout kapısı duruyor; mevcut somut hatalar da çözülmüş değil.

Ayrı tarihsel kaynak karşılaştırma akışı bu rapordaki 336 görevin parçası değildir. O akışın yalnız başlatılmış veya bekleyen işleri burada tamamlanmış sonuç gibi sayılmadı; kaynak metinleri bu rapora aktarılmadı.

## Hesaplama ve doğrulama kaydı

- gpt-oss-120b: revizyon `b5c939de8f754692c1647ca79fbf85e8c1e70f8a`, medium reasoning.
- Qwen3-32B: revizyon `9216db5781bf21249d130ec9da846c4624c16137`, düşünme açık.
- Ortam: vLLM 0.11.0, H200; her görevde seed 1125, sıcaklık 0,6. Modele özgü top-k ayarı kaydedildi. Bu iki başarılı model işi sırayla çalıştı.
- Başlangıçtaki gpt-oss işi, konteynerde `python` komutu bulunmadığından model çalışmadan durdu; `python3` ile düzeltildi. Başarısız başlangıç gizlenmedi.
- Bu rapordaki üç H200 işinin oluşturulma–bitme sürelerini yaklaşık 5 USD/saat tarifeyle çarpmak **2,6624 USD** verir. Bu gerçek fatura değildir: planlama/bekleme süresi içerir, faturalandırma ve dakika yuvarlaması farklı olabilir. Önceki deneyler ve ayrı tarihsel akış dahil değildir.
- Son birleşik araştırma testleri: **85 Node testi + dört Python testi başarılı**. Veri incelemesi ayrıca 336 benzersiz, tamamlanmış kayıt ve bütün son çıktı hash'lerini doğruladı. Aktif skill'in önceki bu-tur testi 167 başarılı / yedi atlanan / sıfır başarısızdı; burada yeniden bir skill değişikliği yapılmadı.

[Maliyet ve iş durumları](results/compute-ledger-v10.json). Testlerin geçmesi, üretilen yazıların editoryal olarak doğru olduğu anlamına gelmez.
