# Sözcüksel muhakeme — teknik geliştirme ve doğrulama

26 Kasım 2026. Master tabanı: `62c84563045acb2407f686176efccb244b22e5e9` (2.0.0-rc.1). Özellik dalı: `ozellik/esanlam-onerisi`. Test edilmiş ürün: [e0304c6](https://github.com/systemonster/turkish-writer/commit/e0304c6cd6e019463175fb5b368a806a3ff5e16b).

## Amaç

Daha zengin Türkçe, daha nadir kelimeler veya zorunlu eş anlamlı değişiklikler demek değildir. Yaz/Düzelt/Denetle akışında gerçek bir ifade sorunu olduğunda anlam, çağrışım, duygu şiddeti, sicil, çekim ve eş dizim birlikte değerlendirilir. Mevcut tr-scan korunur; ek `--editor` modu eski puandan bağımsız yazım ve bağlam bulgularını gösterir. Eski iz skorunu optimize etmek kalite hedefi değildir. Hiçbir otomatik sözcük değiştirme yapılmaz.

## Kaynak

[StarlangSoftware/TurkishWordNet-Py](https://github.com/StarlangSoftware/TurkishWordNet-Py/tree/09ebb811b08eedaedc4abb9cfde2d08eadfe71e4), XML dosyası `WordNet/data/turkish_wordnet.xml`, blob `2cdf2a59e524764cfe2c11a03fa9623495df21bb`, 31.285.446 bayt, SHA-256 `afe256845a8e8d26ab097eb8efda9627aae61c8018cba69b566adc19699593f5`. Upstream README veri lisansı CC BY-SA 4.0, kod GPL-3.0. Upstream kodu kullanılmadı. Yerel derleyici anlam kimliği, lemma, numara, POS ve tanımı ayrı lisanslı kullanıcı önbelleğine çıkarır; örnek ve ilişki verilerini almaz. Ham sözlük veya türetilmiş dizin repo/paket içinde değildir. TDK tam sözlük veri tabanı dağıtılmadı; [resmî açıklama](https://tdk.gov.tr/icerik/sikca-sorulan-sorular/turkce-sozlukun-veri-tabanini-talep-edildiginde-paylasiyor-musunuz/).

[Gerçek veri ön kontrolü](https://huggingface.co/jobs/lovefengis/6b080c7fd91f621b930a7852) COMPLETED: 78.327 anlam kümesi, 82.155 farklı lemma. Seçili sorgular:

| Madde | Küme sayısı |
| --- | ---: |
| yüz | 14 |
| kötü | 10 |
| fena | 6 |
| durum | 4 |
| vaziyet | 3 |
| düşünmek | 8 |
| bütçe | 2 |
| anlamak | 8 |

Bu, sözlük kapsamasıdır; doğrulanmış eş anlamlı değiştirme oranı değildir. Örneğin birden çok anlamı olan bir maddeye anlam seçilmeden aday verilmez. Açık seçilen kümeden en fazla üç ham aday sunulur; bağlam, eş dizim, kullanım sıklığı ve sicil onayı verilmez.

## Regresyon

[CPU 6b080cd2d91f621b930a796e](https://huggingface.co/jobs/lovefengis/6b080cd2d91f621b930a796e) COMPLETED, ürün commit'i e0304c6. Dokuz yeni Node testi geçti; 90 Corpus Lab Node, 9 Corpus Lab Python, 9 skill Python (7 Unicode + 2 KeNet) geçti. npm test sıfır çıkış, 7 atlanan test, görünen son logda kesin npm toplamı yok. Yeni dokuz Node testi npm test içinde de çalıştırıldığı için toplamda iki kez sayılmaz. 89 dosyalı dağıtım paketi, ayrı kurulum ve gerçek `--indir` ile sabit kaynak hash'i, 14 anlamlı yüz sorgusu ve açık anlam seçimi başarıyla doğrulandı. Upstream ham veri pakete alınmadı. Yeni scanner modu eski bulgu ve skor çıktısını dört özgün vaka ve bir alan bazlı JSON örneğinde birebir korudu. Ayrı kurulumun örnek JSON gövdesinde eski skor 100, yeni skor 100, TDK 4 aday bulgu ve 1 yeni bağlam notu: yazım ve editoryal inceleme eski puana gömülmedi.

Korumalar: iyi doğal cümle; tek başına "fena", "vaziyet" ve "idrak"; alıntı, kod, başlık, etiket, liste ve tablo; aynı teknik kelimenin tekrarı; yanlış anlam kimliği ve veri yokken öneri üretmeme. Bunlar proje üretimi regresyon vakalarıdır; bağımsız insan metni veya ölçülmüş yazarlık kazanımı değildir.

## Açık kabul koşulları

- Bağımsız, kaynak/yazar/konu ayrımlı insan metinlerinde 1.000 kelimede yanlış tetik/öneri oranı henüz ölçülmedi. Tekrar işareti, gerçek hata veya kabul edilmiş öneri değildir.
- 200 kör sözcük önerisi ve iki bağımsız editörün değerlendirmesi yok; %90 doğruluk hedefi doğrulanmadı.
- KeNet'in ham adaylarının çağrışım, kullanım sıklığı, eş dizim ve sicil verileri bu ilk sürümde otomatik doğrulanmıyor. Mevcut sınırlı eş dizim aracı genel anlam çözümleyicisi değildir. Ajan bağlamda karar verir.
- Yeni yazarlık ve editörlük kalitesi farklı model ailelerinde doğrulanmadı. Yeni GPU işi başlatılmadı. Master değişmedi; yeni özellik PR incelemesine adaydır.

## Maliyet

| İş | CPU Basic sınırı | Durum | Duvar süresi | Wall-rate tahmini USD |
| --- | --- | --- | ---: | ---: |
| 6b080c7fd91f621b930a7852 | 5 dk | COMPLETED | 21,477 sn | 0,0000596583 |
| 6b080cd2d91f621b930a796e | 7 dk | COMPLETED | 26,426 sn | 0,0000734056 |

26 Kasım kayıtlı tarife: CPU Basic 0,01 USD/saat ([HF pricing](https://huggingface.co/docs/hub/en/jobs-pricing)); toplam nominal azami 0,002 USD; wall-rate tahmini 0,0001330639 USD, gerçek fatura değildir. Başka projeler ve master değiştirilmedi.
