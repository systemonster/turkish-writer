# Bağımsız değerlendirme protokolü / Independent evaluation

Durum (25 Kasım 2026): **insan onaylı bağımsız test henüz yok.** V1–V4 için kullanılan 52 proje üretimi vaka geliştirme setidir. Aşağıdaki kaynaklar yeni veri için adaydır, kabul edilmiş belge veya veri kümesi değildir.

## Aday kaynaklar

| Kaynak | Hak kanıtı ve kapsam | İnceleme |
|---|---|---|
| [Nitorel](https://nitorel.com/) | [CC BY 4.0 metin lisansı](https://nitorel.com/lisans); Ahmet Canal'ın özgün yazı ve rehberleri, üçüncü taraf parçaları hariç | Bilgi yönetimi, uygulamalı rehber; yazı tarihi, yazar, doğal Türkçe ve bağımsızlık ayrıca doğrulanmalı. |
| [Mirasium](https://mirasium.org/) | [Kamu malı kılavuzu](https://mirasium.org/kamu-mali-kilavuzu/); özgün makale ve analiz metinleri CC BY 4.0 | **Geliştirme kaynağı — bağımsız testten hariç.** V31'de v31-mirasium-history kullanıldı; insan yazarlığı doğrulanmadı. |
| [Özgür Yazılım Derneği](https://oyd.org.tr/yazilar/) | Yazı bazında lisans kanıtı gereklidir; örneğin [EFF çevirisi](https://www.oyd.org.tr/yazilar/eff-ifade-ozgurlugu/) özgün makale için CC BY 3.0 US bildiriyor. | Çeviri metinleri yerli Türkçe özgün blog kohortuna katma. Özgün, izinli ve mümkünse 2022 öncesi makaleler için aday havuzu. |

Kaynakların lisans sayfaları ve arşivleri 2026-11-25 tarihinde incelendi. Lisans, insan yazarlığını veya editoryal kaliteyi ispatlamaz. Bu kaynaklardan ham metin, kişisel veri ya da model değerlendirmesi henüz yayımlanmadı. Daron Yöndem, BOUN, Wikipedia, Mirasium ve CC Türkiye gibi önceki geliştirme kaynaklarını bağımsız test havuzuna yeniden koyma.

## Kabul ve ayrım

1. Bağımsız editör özgün, doğal Türkçe, en az 3 paragraf ve 150 sözcük olan belgeler seçer; hedef 40 belge, farklı yazarlar, yayınlar ve konular. Mümkünse insan tarafından yazıldığı doğrulanmış veya 2022 öncesi tarihsel yazıları seç; tarih tek başına kanıt değildir. İyi yazılmış metni koruma vakalarını ve gerçekten edit gerektiren taslakları dengeli topla. Sentetik olarak bozulan insan metni ayrı stres testi olarak işaretlenir, gerçek taslak diye sunulmaz.
2. Kaynak/yazar/konu grupları yalnızca bir bölümde bulunur. Bir yazı, çevirisi, yakın kopyası, alıntı zinciri ve aynı yazarın ilgili yazıları ayrı bölümlere sızmaz. Eğitim/ön inceleme geçmişindeki kaynakları ayrıca karşılaştır. Model ön eğitimine sızma denetlenemiyorsa bunu açıkça belirt. Test setini aday kurallar belirlenmeden dondur; düzenleyici ekibe cevapları gösterme.
3. Yerel ve git dışı `corpus-lab/work/private-manifest.jsonl` dosyasında id, source_group, author_group, topic_group, source_url, rights_evidence, reviewer_id (anonim), source_sha256, split, review_status, paragraphs, words alanlarını tut. Gerçek kaynak dosyasının normalleştirilmiş UTF-8 metninin SHA-256 değerini doğrula; yakın kopyaları ve kişi bilgilerini insan incelemesinden geçir. Sadece gerçekten doğrulanan insan incelemesinde `editor_verified` kullan.
4. `node corpus-lab/validate-holdout.mjs corpus-lab/work/private-manifest.jsonl` ile açık grup sızıntısı ve zorunlu alanları kontrol et. Bu araç hak kanıtını, SHA değerinin doğru hesaplandığını, gerçek insan onayını veya yakın kopyaları kanıtlamaz. Geliştirme manifestindeki kaynakları da dahil et; boş veya yalnız test içeren manifest geçmez.
5. Aynı metin ve brifle yalın talimat, mevcut skill ve aday skill'i ayrı oturumlarda çalıştır. Model sürümü, bağlam, çıktı token sınırı ve örnek ID sabitlenir. En az iki farklı model ailesi. Çıktılar bağımsız iki Türkçe editör tarafından kol ve model kimliği bilinmeden okunur. Model hakeminin A/B seçimini insan değerlendirmesi sayma. Sunum sırası rastgele ve dengeli olmalı. Kaynağı referans olarak ayrıca göster; adayların model ve kol kimliklerini puanlar dondurulana dek gizle.
6. Her vakada 1–5 anlam, doğal Türkçe, editoryal isabet, akış, yazım/biçim; kritik kusur kategorileri (olgu, koşul, olumsuzluk, kip, özne, atıf, kaynak, sayı, teknik değer), gereksiz müdahale, düzeltme süresi ve tercih (A/B/eşit) kaydedilir. Ciddi anlam kaybı olan aday üslup puanıyla geçemez. Editör anlaşmazlığında üçüncü bağımsız inceleme; sonuçlar yazar veya kaynak kümeleri bazında belirsizlikle raporlanır.

Test seti, insan değerlendirmesi ve gerçek bağımsız karşılaştırma tamamlanmadan V2'yi yayınlama. Üçüncü taraf metinleri ve anonim olmayan değerlendirici kayıtları git'e koyma. Bu dosya test tasarımıdır, tamamlanmış doğrulama değildir.

## Kör değerlendirme paketini hazırlama

[build-review-packets.mjs](build-review-packets.mjs) iki ayrı editör paketi ve ayrı koordinatör anahtarı üretir. Node 18+ dışında bağımlılığı yoktur. Özel girdiyi git dışında tut:

```sh
node corpus-lab/build-review-packets.mjs corpus-lab/work/private-input.json inceleme-01
```

Girdi JSON nesnesi: `mode` ("independent_test" veya yalnız sentetik deneme için "development_dry_run"), `manifest` (yukarıdaki tüm bölüm envanteri), `documents` (id, split, source, source_sha256, genre, purpose), `models` (id, family, revision, baseline_commit, candidate_commit, baseline_protocol, candidate_protocol), `outputs` (id, model, arm: baseline/candidate, text, source_sha256, complete: boolean). Kaynak hash'i, modelin gerçekten gördüğü metnin UTF-8 baytlarından hesaplanır; normalleştirme yapılacaksa model çalıştırmadan önce bir kez yapılır. Aynı test belgesi ve aynı model sürümü için her iki kol bulunmalıdır. Eksik çıktı boş metin ve complete=false olarak kaydedilir; yanıltıcı biçimde dışlanmaz. Gerçek testte en az iki model ailesi, manifestle birebir kaynak hash'i ve asgari metin uzunluğu doğrulanır. Dosyayı üreten kişinin beyanı insan doğrulaması değildir.

Çıktı yalnız `corpus-lab/work/inceleme-01/` içinde oluşturulur; var olan paketlerin üzerine yazılmaz. `reviewer-1` ve `reviewer-2` klasörlerini ayrı editörlere ver. `coordinator/private-key.json` dosyasını hiçbir değerlendiriciyle paylaşma. A/B sırası her model içinde dengeli ve iki editör arasında terslenmiş; vaka kimlikleri de anonimleştirilmiştir. Metnin kendisi kaynak hakkında ipucu verebilir; bu araç model/kol kimliğini gizler, kaynak içeriğini değiştirmez.

### Editöre verilecek ortak yönerge

Her iki metni kaynak ve amaçla ayrı ayrı karşılaştır. 1 = ciddi kusur, 2 = belirgin kusur, 3 = yeterli ama düzenleme gerekli, 4 = iyi, 5 = yayınlanabilir düzeyde. Beş alan: anlam sadakati, doğal Türkçe, editoryal katkı/isabet, akış, yazım/biçim. Anlamı veya olguyu değiştiren ifadeyi kritik hata olarak kategori ve kısa gerekçeyle kaydet. Gereksiz müdahaleleri say; gerçek düzeltme süresini ölçebiliyorsan dakika olarak gir, tahmin uydurma. Tercih A, B veya eşit; iyi yazılmış kaynakta gereksiz düzenleme olumlu katkı değildir. İki çıktı aynıysa eşit tercih ver. Boş veya eksik metni başarı sayma. Yalnız değerlendirme dosyanı koordinatöre teslim et; diğer editörle görüşmeden önce puanları dondur.

Pilot: 12 mevcut sentetik uzun geliştirme vakası, Qwen3-32B ve Turkish Gemma 9B'nin önceki V2 baseline/skill çıktıları (24 karşılaştırma/editör, 48 toplam atama). Bu, paket mekanizmasının yazılım testidir; bağımsız editör puanı veya yeni holdout değildir. Gerçek veriler henüz toplanmadı. Sonuçları birleştirme, körlüğü koruma ve değerlendiriciler arası anlaşmazlığı çözme işlemi koordinatör sorumluluğunda; aşağıdaki V9 aracıyla puan toplama ve temel anlaşmazlık kontrolü yapılabilir.


## Puan toplama ve anlaşmazlık kontrolü (V9)

İki gerçek bağımsız editör kendi paketindeki `response-template.json` dosyasını doldurup `response.json` olarak teslim eder. Her birine farklı anonim `reviewer_id` verilir. Beş puan 1–5 tam sayı, gereksiz müdahale sayısı sıfır veya pozitif tam sayı, süre ölçülmediyse `null`, kritik hata kaydı `{"category":"modality","reason":"somut gerekçe"}` biçimindedir. Tercih alanı `A`, `B` veya `equal`; gerekçe zorunludur. Özdeş metinler eşit tercih alır. Tamamlanmamış/boş çıktılara beş alanda 1 ve başarısızlığı açıklayan not verilir. Gerçek insan puanları olmadan bu dosyaları doldurmuş gibi yapma.

Puanlar ayrı ayrı dondurulduktan sonra koordinatör çalıştırır:

```sh
node corpus-lab/collect-reviews.mjs inceleme-01 report-01
```

Her iki paketteki kaynak/çıktı hash'lerini, tüm atamaları, model-vaka matrisini ve puan şemasını doğrular. Eksik/çift kayıt, değiştirilmiş metin, aynı değerlendirici kimliği ve geçersiz puan reddedilir. Eşitliği ve başarısız çıktıyı gizlemez. Her modelin ayrı ortalamaları, tercih sayıları, kritik hata işaretli vaka sayısı, eksik çıktı sayısı ve tercih/kritik hata varlığı konusunda anlaşmazlık gösterilir. Rapor yalnız özel koordinatör klasörüne, üzerine yazmadan kaydedilir. Çıktı ham metin ya da değerlendirici kimliği içermez; yine de vaka kimlikleri özel envanterle ilişkilendirilebildiğinden git'e koyulmaz.

Bu araç insan kimliğini, bağımsızlığı, lisansı veya değerlendirmenin doğruluğunu ispatlamaz. Kritik hata kategorisi ve gerekçe farklılıkları, yalnız puan farkı olan vakalar, yazar/kaynak kümelerine göre belirsizlik ve üçüncü editörün kararı ayrıca incelenmelidir. Ortalama kalite puanı kritik anlam hatasını telafi etmez. Raporun `release_gate` alanı her durumda `NOT_EVALUATED` kalır. Pilot puanlar yalnız sentetik yazılım testi içindir.

### 25 Kasım kaynak elemesi

- Nitorel'in [okuma rehberi](https://nitorel.com/yazilar/okuma-ve-okudugunu-unutmamak) ve [notlardan yazıya](https://nitorel.com/yazilar/notlardan-yaziya) örnekleri 2026 tarihli ve aynı yazara ait. İzin sayfası tek başına bağımsız insan yazarlığını doğrulamadığından tarihsel kohorta alınmadı.
- ÖYD'nin [özgür yazılım yazısı](https://oyd.org.tr/yazilar/ozgur-yazilim/) uzun metin adayı; yazıdaki görsel lisansı metne ilişkin izin değildir. Metnin hak kanıtı, yazar ve tarih ayrı doğrulanmadan kabul edilmez.
- Mirasium'un [kendi metinlerine ilişkin lisans bildirimi](https://mirasium.org/kamu-mali-kilavuzu/) CC BY 4.0 kapsamını açıklar. Üçüncü taraf kitaplar, çeviriler ve güncel katalog açıklamaları kendiliğinden özgün insan blog örneği değildir.

Yukarıdakiler yalnız kaynak incelemesidir. Yeni holdout'a kabul edilmiş metin yoktur; ham yazı veya yeni kişi verisi depoya eklenmedi.

## 26 Kasım — yayın adayına geçiş

V31 ön kontrolü dört geliştirme vakasını dondurdu (CC Türkiye, Mirasium, iki proje üretimi vaka). Bkz. [V31 iş kaydı](README.md#v31-ön-kontrol-ve-karşılaştırma-yeniden-başlatma--26-kasım-2026-0045-utc). Bu vakaları veya aynı yayın/yazar/konu gruplarını bağımsız test diye kullanma. V31'deki tek kılavuz paragrafı karşılaştırmasının başarılı olması tüm V2 ürününü doğrulamaz.

Sonraki bağımsız değerlendirmede güncel aday ve karşılaştırma sürümleri sabit commit'lere bağlanmalı; yeni kaynakları editörler seçmeli ve mevcut geliştirme envanteriyle çakışma kontrolü yapılmalı. İki bağımsız Türkçe editörün gerçek kör incelemesi için mevcut paketleme/toplama araçlarını kullan; yeni yapay hakem döngüsünü insan puanı yerine koyma. Kritik kusurları açıkça çöz, kalan teknik ve kaynak/lisans denetimlerini tamamla. Sonuçlar olumsuzsa yayın kapısını geçirme; yeni bir deney yalnız somut kusuru çözmek veya gerçekten yeni bilgi sağlamak için yapılır. Kullanıcıdan istenen dış katkı: bağımsız metin seçimi ve iki editör incelemesi. Bu kayıt yeni insan değerlendirmesi veya yayın yetkisi değildir.

## Yayın adayı için editör teslimi — 26 Kasım 2026

Ürün adayı (yalnız bu commit'teki skill dosyaları): [c99c4b4763204f0aac68194bf1dfea8959a3771a](https://github.com/systemonster/turkish-writer/commit/c99c4b4763204f0aac68194bf1dfea8959a3771a). Yeni ürün özelliği ekleme; adayın değişmesi gerekirse yeni commit ve yeni değerlendirme turu kaydet. Eski V31 metinleri test seti değildir. V31'de dört Mistral çıktısı kılavuzu tekrar etti ve kesildi; Qwen'in iki onarım kolu da teşhis metnindeki anlatım kusurlarını bıraktı. Bu sonuçlar yayın için yeterli değildir.

**Girdi teslimi:** Geliştirme ekibinden bağımsız bir Türkçe editörün (iki değerlendiriciden biri de olabilir; model sonuçlarını önceden görmemeli) seçtiği 40 belge hedeflenir. Gerçek, yayıma hazır metinler ile gerçek düzenleme gerektiren taslakları dengeli tut. En az üç metin paragrafı ve 150 sözcük; blog ve rehber yanında deneme, anlatı/diyalog ve kurumsal/bilgilendirici düzyazı gibi çeşitliliği sağla. Şiir, uzun kitap ve özgün yazarlık iddiaları ayrı görevlerle değerlendirilmelidir; bu düzyazı testi tüm türlerdeki kaliteyi kanıtlamaz. Özellikle henüz yayımlanmamış, yazarının test kullanımına izin verdiği özgün metinler, FineWeb ve model ön eğitimi çakışması riskini azaltır; bu riskin tamamen ortadan kalktığı iddia edilmez. Daha önce proje tarafından görülen metni seçme.

Editör, her belge için şu bilgileri **özel** teslim eder (bir satır = bir belge):

| Alan | Girilecek bilgi |
| --- | --- |
| id | Benzersiz anonim belge kodu |
| source | UTF-8 kaynak metin, başlık ve biçim korunmuş |
| source_url | Yayın adresi veya izinli özel belgeyi gösteren anonim kalıcı tanımlayıcı |
| rights_evidence | Test/işleme izni ve gerekiyorsa lisans kaydı; kişisel bilgiler özel kalır |
| source_group / author_group / topic_group | Tutarlı anonim yayın, yazar ve konu grupları |
| genre / purpose | Metin türü, hedef okur/amaç ve düzenleme kapsamı |
| review_status | İnsan gerçekten incelemişse editor_verified |
| reviewer_id | Seçimi yapan editörün anonim kodu |
| source_sha256 / paragraphs / words / split | Koordinatör gerçek dosyadan doğrular ve test olarak dondurur |

Bilinen geliştirme dışlama grupları: Daron Yöndem arşivi, SUDO Portal, BOUN train, Türkçe Vikipedi revizyonları, FineWeb Türkçe taramasında kullanılan kaynaklar ve konu kümeleri (salt toplu tarama olduğunda birebir belge çakışmasını kanıtlayamadığımızı kaydet), Creative Commons Türkiye, Mirasium, V20 Wikisource eserleri ve bunların yakın türevleri, tüm proje üretimi teşhis/benchmark metinleri. Bu liste tam belge manifestinin yerine geçmez. Yazar, kaynak, konu ve metin hash'i çakışmalarını özel tam envanterle kontrol et; bilinmeyen çakışmaları saklama. Yeni editör incelemesi olmadan herhangi bir test satırını editor_verified olarak işaretleme.

**Geliştirme dışlama envanteri düzeltmesi:** Eski validator, bağımsız olmayan kısa ve hiç insan tarafından doğrulanmamış geliştirme satırlarını da 150 sözcük/3 paragraf ve editor_verified şartına zorladığı için gerçek geçmişi dürüst biçimde kaydetmeyi engelliyordu. Artık sadece development satırlarında development_unreviewed + not_reviewed ve en az bir paragraf/sözcük kabul edilir; tüm kaynak/yazar/konu/hash ayrım denetimleri aynen uygulanır. Test ve validation için insan inceleme beyanı ve uzunluk şartı değişmedi. Bkz. [düzeltme](https://github.com/systemonster/turkish-writer/commit/e6cd2e539903945a8aa310f10280176e05298084) ve [beş regresyon](https://github.com/systemonster/turkish-writer/commit/7538f15901b385947de66f9faee0689dfce345ef).

**Karşılaştırma:** Kaynak ve amaç dondurulduktan sonra, iki farklı model ailesinde aynı kullanıcı düzenleme brifini kullan. Yalın kol yalnız görev ve kaynak; aday kol aynı görev, sabit skill ve gerçekten görev için gereken referanslar. Model sürümü ve parametreler, her vaka için açılan dosya listesi ve istem hash'i kaydedilmeli. Mümkünse gerçek Agent Skills akışını kullan; sabit referans bağlamı kullanılırsa bunu açıkça belirt. Yönerge ve hedefi ayrı role/veri sınırlarıyla ayır; kılavuz çıktısı, eksik çıktı veya kaynakla ilgisiz metin geçerli sayılmaz. İki kol da eşit token sınırı ve bağlam bütçesine tabi. Dondurulmuş kaynaklar görülmeden yeni skill ayarı yapma. Kusur nedeniyle aday değişirse bu test geliştirme/validation olarak yeniden sınıflandırılır, yeni bağımsız test gerekir.

**Teslim sırası:** Önce insan tarafından seçilmiş metinlerin özel manifesti; ardından iki modelin eşleştirilmiş çıktıları; sonra mevcut build-review-packets.mjs ile iki ayrı kör paket ve collect-reviews.mjs ile puan toplama. Her editör 40 belge × 2 model = 80 eşleştirme görür (40 belge hedefi karşılanırsa). Hakemler ayrı çalışır, kol kimliğini ve koordinatör anahtarını görmez. Kritik anlam hatalarını ortalamaya gömme; anlaşmazlığı bağımsız üçüncü değerlendirmeye gönder. Yayın sonucu gerçek değerlendirmeye bağlıdır; hiçbir paket veya insan puanı henüz üretilmedi. Bağımsız girdi ve editörler olmadan yeni GPU çalıştırmak bu kapıyı geçiremez.
