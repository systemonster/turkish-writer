# V10: doğrudan editoryal teşhis programı

25 Kasım 2026'da kullanıcı şu çalışmaların tamamını onayladı: gerçek blog boyutunda karşılaştırma, anlam koruma, kural çıkarma, ikinci/üçüncü düzenleme, brif etkisi ve dedektör destekli teşhis. Bu dosya sonuç gelmeden başarı iddiası içermez. V2 final yayın koşulları değişmez.

## Deneylerin kapsamı

- Yeni proje üretimi 6 kaynak çifti: 12 metin, her biri 600–1.500 sözcük. Temiz ve bilinen üslup kusuru eklenmiş sürümler aynı olguları taşır. Temiz sürüm **insan altın standardı değildir**.
- Her metinde sade talimat, önceki iki dosyalı çekirdek ve altı dosyalı blog kılavuzu karşılaştırılır. Modelin gerçekten gördüğü talimatların hash'i kaydedilir.
- İki kaynak çiftinde dört ayrı çıkarma deneyi: çekirdek minimal müdahale maddesi; muhakeme kılavuzunun söyleyiş/ritim bölümleri; örnekler; blog yapı bölümleri. Bunlar yalnız belirtilen parçaları kaldırır; başka dosyalardaki benzer ilkelerin tamamen kaldırıldığı iddia edilmez.
- Aynı dört metne ikinci ve üçüncü kez filtre uygulanır. Önceki tur tamamlanmadıysa bağımlı tur başlatılmaz. Gerekçesiz değişim ve anlam kayması incelenir; birebir eşitlik tek başarı ölçütü değildir.
- Yeni anlam örneklerinde hem kaynak düzenleme hem sırası terslenmiş A/B/ESIT seçimi yapılır. Doğru yeniden söyleyiş kontrolleri de bulunur. Etiketler ve kusur açıklamaları modele verilmez.
- Üç brif çiftinde olgular aynıdır; yalnız anlatım yapısı değişir. Taslak ve son düzenlemenin etkileri karıştırılmaz.
- Ticari dedektörler yalnız ek teşhis sinyalidir. Ürün sürümü, puan tanımı, metin hash'i, uzunluk ve görülen işaretler kaydedilir. Sentetik metinlerden insan yanlış-pozitif oranı hesaplanmaz. Skor azaltma yayın hedefi değildir.

## Uygulama

```sh
python corpus-lab/prepare-diagnostics-v10.py --out corpus-lab/work/v10/manifest.json
python corpus-lab/run-diagnostics-v10.py --manifest corpus-lab/work/v10/manifest.json --model MODEL --revision SHA --out corpus-lab/work/v10/outputs.jsonl
```

Koşucu vLLM ortamında çalışır; son kullanıcı skill'ine bağımlılık eklemez. Model sürümü SHA ile sabitlenir. Kaynak, talimat, gerçek render ve son çıktı hash'leri kaydedilir. Düşünme içeriği kamuya açık sonuçlara yazılmaz. Kesilme, biçim ve bağlam taşması editoryal anlam hatası diye sayılmaz; kayıp vakalar paydadan sessizce çıkarılmaz.

Her GPU işi sonlu süreyle ve yalnız Turkish Writer kimliğiyle açılır. Hesaptaki başka proje işleri yönetilmez. Tarifeler deney öncesi doğrulanır; tahmini süre bedeli gerçek fatura olarak sunulmaz.

## Gerçek ajan akışı ve sınırlar

Altı dosyalı `full` kolu **sabit kılavuz paketidir**, dinamik dosya seçen ve araç çağıran bir ajanın bütünü değildir. Salt okunur tarayıcılar ayrıca gerçek girdiler/çıktılar üzerinde çalıştırılır. Yerel Codex abonelik erişimi 25 Kasım'da doğrulandı, fakat yeni süreç `Read-only file system` hatasıyla başlatılamadı; yetki veya kimlik dosyası değiştirilmedi. Bu engel giderilmeden tam Codex ajan deneyinin çalıştığı söylenmez.

Proje üretimi örnekler geliştirme içindir. Yeni yazar/kaynaklardan izinli yayımlanmış metinler ayrıca kaydedilebilir; atıf veya yayın tarihi tek başına insan doğrulaması değildir. İnsan kör değerlendirmesi ve bağımsız yayın kapısı yerinde kalır; eksik olmaları diğer anlamlı geliştirme deneylerini durdurmaz.

## Kaynaklar

- [CheckList: davranış odaklı NLP değerlendirmesi](https://aclanthology.org/2020.acl-main.442/) — test tasarımı; kod alınmadı.
- [RAID](https://aclanthology.org/2024.acl-long.674/) — dedektör genellemesi ve kontrollü değerlendirme; kod/veri alınmadı.
- [Qwen3-32B model kartı](https://huggingface.co/Qwen/Qwen3-32B) — Apache 2.0; düşünme ve üretim ayarları.
- [gpt-oss-120b model kartı](https://huggingface.co/openai/gpt-oss-120b) — Apache 2.0; Harmony ve reasoning desteği.
- [vLLM](https://github.com/vllm-project/vllm) — Apache 2.0; araştırma çıkarım altyapısı.
- [Hugging Face Jobs tarifesi](https://huggingface.co/docs/hub/en/jobs-pricing) — 25 Kasım 2026'da kontrol edildi.

## Durum

Kod ve girdiler hazırlanıyor. Yalnız tamamlanan, model/kol/vaka kimlikleriyle doğrulanan çalışmalar sonuç raporuna alınır. Aktif skill ve master bu deney sonuçlarından önce değiştirilmez.
