# V10: editoryal sorunları ayıran deneyler

25 Kasım 2026. Bu rapor geliştirme bulgularıdır; bağımsız insan onayı veya final yayın kararı değildir. İlk modelin 168 görevi tamamlandı; ikinci modelin aynı dondurulmuş görevleri çalışıyor. Son durum ve kimlikler [hesaplama kaydında](results/compute-ledger-v10.json).

## Deney kapsamı

Altı proje üretimi blogun temiz ve dört yerel üslup kusuru eklenmiş sürümleri kullanıldı: 12 metin, 656–720 boşlukla ayrılmış sözcük. Temiz sürüm insan altın standardı değildir. [Veri ve kaynak belgesi](LONGFORM-V10.md) üretim kökenini, hakları, korunacak bilgileri ve dondurma sonrasında uygulanmayan bir düzeltmeyi açıklar.

Her modelde 168 görev vardır: 36 uzun metin düzenleme (sade talimat, iki dosyalı çekirdek, altı dosyalı paket), 16 kural çıkarma, 8 ikinci/üçüncü tur, 48 anlam seçimi (24 örnek × iki sıra), 48 kısa kaynak düzenleme ve 12 briften üretim. Çıktı bütçeleri 4.096–8.192 tokendir; düşünme içeriği bu bütçeye dahildir. Kaynak, talimat, render ve çıktı hash'leri saklanır. [Protokol](DIAGNOSTICS-V10.md) ve [ölçüm sınırları](DIAGNOSTIC-METRICS.md).

`full` altı referans dosyasının sabit bağlama yüklenmesidir. Gerçek araçlı ajan akışının tamamı sayılmaz. Ayrı bir küçük ChatGPT ajan pilotunda tek kaynaklı oturumlar ve gerçek skill dosyaları kullanıldı; sürümü/örnekleme ayarları açıklanmayan bu çalışma, sabit sürümlü HF deneyleriyle aynı ölçekte yorumlanmaz.

## İlk model: gpt-oss-120b

[Ham son çıktılar](results/diagnostics-v10-gptoss120b.jsonl) ve [doğrulanmış özet](results/diagnostics-v10-gptoss120b-summary.json): 168/168 tamamlandı; kesilme, son kanal ayırma hatası, hakem JSON hatası ve hash uyuşmazlığı yok. Model revizyonu `b5c939de8f754692c1647ca79fbf85e8c1e70f8a`; medium reasoning, sıcaklık 0,6, seed 1125; vLLM 0.11.0, H200.

Anlam seçimi dondurulmuş proje etiketleriyle **47/48** eşleşti. 24 örneğin 23'ünde iki sıra da doğru ve tutarlıydı. Sonuçlar görülmeden kaydedilen belirsiz 024 çıkarıldığında **45/46**; 021 ve 024 çıkarıldığında **43/44**. Yanlış yanıt, 017'nin bir sırasında geçerli bir yeniden söyleyişteki “daha” sözcüğünü anlam kayması saydı. Ters sırada ESIT seçti. Bu fark sunum duyarlılığıyla örnekleme değişkenliğini birlikte içerir; tek başına nedensel bir sıra etkisi kanıtlamaz.

### Seçim başarısı düzenleme başarısına taşınmadı

Kaynakları ve gerçek çıktıları doğrudan karşılaştırınca açık hatalar var:

| Vaka | Kaynak | Düzenleme | Gözlenen değişiklik |
|---|---|---|---|
| semantic-v10-005, full | “sinyali kapının açılmasının tetikleyip tetiklemediği bilinmiyor” | “sinyalin kapının açılmasını tetikleyip tetiklemediği bilinmiyor” | Nedenselliğin yönü ters dönüyor. |
| semantic-v10-014, baseline ve full | “Tamir edilen saatin tekrar durup durmadığını bilmiyoruz.” | “Tamir edilen saatin tekrar çalışıp çalışmadığını bilmiyoruz.” | Yeniden arıza yapma sorusu, yeniden çalışmaya başlama sorusuna dönüşüyor. |
| lf10-01-flawed, full | Yerel bir tekrar ve ağır isimleştirme eklenmişti. | “işlem listesinin dışa aktarılması işlemini gerçekleştirdik” korunuyor; tekrar başka kelimelerle sürüyor. | Bazı hedef kusurlar düzelmiyor; başka yerlerde değişiklik yapılıyor. |
| lf10-06-flawed, full | “kile dokunmaya” | “kili dokunmaya” | Kaynakta olmayan hâl eki hatası oluşuyor. |

005 ve 014'te model aynı kaynakların önceden hazırlanmış anlam karşılaştırmalarını iki sırada da doğru yaptı. Bu, kolay karşılaştırma görevindeki yüksek isabetin serbest düzenlemede sadakat garantisi olmadığını bu örneklerde doğrudan gösterir. Yapay kısa karşılaştırmalar, gerçek uzun metin kalitesinin yerine geçmez.

### Kural çıkarma ve tekrar düzenleme

Çekirdek minimal müdahale maddesi, söyleyiş/ritim bölümleri, karşı örnekler ve blog yapı bölümleri ayrı ayrı çıkarıldı. Her çıkarma dört metinde sınandı; başka yerdeki benzer ilkeler tamamen silinmedi. İlk iki kusurlu kaynakta tekrar ve boş geçiş sorunları bütün bu kolların örneklerinde sürdü. Tek bir bölümü çıkarmanın bu örneklerde sorunu çözdüğü gösterilemedi. Tek seed ve iki kaynak çiftiyle genel bir kural etkisi sıralaması çıkarılmıyor.

Dört metne ikinci ve üçüncü düzenleme uygulandı; üçüncü turda hiçbiri önceki turla birebir aynı değildi. Değişiklik miktarı azaldı, fakat azalan değişim kalite kanıtı değil. Örneğin defter yazısında “ikinci defterin başında bırakmıştım” ifadesi “ikinci defteri başından bırakmıştım” oldu. Bir başka tur “çoğunlukla” yerine “çoğu” getirerek cümleyi bozdu. İlk turda eklenen `sağlamakti` yazım yanlışı sonraki turda düzeldi; dolayısıyla her ek tur yalnız kötü veya yalnız iyi olarak etiketlenmiyor.

### Brif etkisi

Üç brif çiftinde olgu bölümü birebir aynı, anlatım talimatı farklıdır. Bir kolda her paragrafta öneri ve sonda tekrar istenir; diğerinde önerilerin yalnız işlevli yerde verilmesi istenir. İki kol da aynı 650–900 sözcük hedefini taşır; uzunluk baskısının bağımsız etkisi bu deneyde ayrıştırılmadı.

İlk modelde daha az yönlendiren brif tek başına yeterli olmadı. Kitaplık örneğinin `neutral:full` çıktısı sekiz “Öneri:” etiketi ve kaynakta bulunmayan bir “Kişisel gözlem” bölümü üretti. Bölümde kitap türleri ve sık ödünç alınan kitaplar hakkında uydurulmuş gözlemler var; buna rağmen sonunda kişisel deneyim eklenmediğini iddia ediyor. E-posta örneğinin nötr full çıktısı da kişisel gözlem ve ölçülmemiş satış etkisine ilişkin güçlü bir kapanış ekledi. İkinci model bitmeden bu davranışın model ailesinden bağımsız olduğu söylenmez.

## Gerçek dedektör taramaları

[İlk pilot](results/detector-pilot-v10.json): aynı olgularla yazılmış 264 ve 253 sözcüklük iki AI üretimi metin, Pangram 4.1'de AI %100 / AI-assisted %0 / Human %0 aldı. İkisi de bütün metin olarak tek segmentte işaretlendi.

[Gerçek V2 çıktı alıntısı](results/detector-v2-excerpt-v10.json): dondurulmuş kusurlu kaynaktan 186 sözcük ve gpt-oss `full` çıktısından 193 sözcük, yine aynı yüzdeleri ve tek segment etiketini aldı. Bunlar birebir, kesintisiz, benzer uzunlukta alıntılardır; bütün metin sonucu değildir. Her iki çiftte görünen skor üslup değişimini veya belirli cümle sorunlarını açıklamadı. İnsan yanlış-pozitif oranı, genel dedektör doğruluğu veya editoryal kalite sonucu hesaplanamaz.

Originality'nin ücretsiz Model 5.0 arayüzü metni kabul etti, ancak iki denemede doğrulanmış sonuç vermedi; neden bilinmiyor. Eksik sonuç sıfır AI veya başarı sayılmadı. Dört gerçek Pangram taraması ücretsiz 10 kredi kullandı; satın alma yapılmadı. [Bağlantı araçları, API sınırları ve testler](DETECTOR-PILOT.md).

## Karar ve açık işler

Aktif skill bu bulgularla henüz değiştirilmedi. İlk modelde çekirdek ve tam paket, sade talimata göre bazı yapısal müdahaleleri azalttı; fakat yeni anlam/dil hataları ve hedef kusurları bırakma davranışı kaldı. Otomatik literal uyarıları doğrudan anlam hatası sayılmıyor: noktalama, tırnak ve sayı biçimi değişiklikleri de uyarı üretebilir; ters nedensellik gibi önemli kusurlar ise literal kontrolünden kaçabilir.

Qwen3-32B aynı 168 görevi düşünme açık ve sabit revizyonla çalıştırıyor. İki modelin tamamlanmış çıktıları, AI inceleme notları, maliyet kaydı ve tek kaynaklı native ajan pilotu nihai V10 karşılaştırmasında birlikte değerlendirilecek. Bağımsız insan editör sonucu ve yeni doğrulanmış holdout olmadan final yayın kapısı açılmaz.
