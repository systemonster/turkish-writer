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
python3 corpus-lab/prepare-diagnostics-v10.py --out corpus-lab/work/v10/manifest-frozen.json
python3 corpus-lab/run-diagnostics-v10.py --manifest corpus-lab/work/v10/manifest-frozen.json --model MODEL --revision SHA --out corpus-lab/work/v10/outputs.jsonl
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

Kod ve girdiler `eeea2d17431016c2829c6d1fa19643b31529cedf` commit'inde donduruldu. Manifest SHA-256: `bde08b49f2fba7526708cf92c63575412131b041e465dc62d2ead92a271fbdc9`. Her model için 168 görev: 36 uzun metin, 16 çıkarma, 8 tekrar düzenleme, 48 anlam seçimi, 48 kısa kaynak düzenleme ve 12 brif üretimi.

İlk gpt-oss başlangıcı konteynerde `python` komutu bulunmadığından model çalışmadan durdu; `python3` ile düzeltilmiş `6b06af281460ffe1d5ea5b34` işi 25 Kasım 10:02 UTC'de 168/168 kayıtla tamamlandı. Ardından `6b06b26f1460ffe1d5ea6130` Qwen işi 10:21 UTC'de 168/168 kayıtla tamamlandı. Sabit çalışma ortamı `vllm/vllm-openai:v0.11.0`, H200, iş başına 60 dakika sınırı; gpt-oss revizyonu `b5c939de8f754692c1647ca79fbf85e8c1e70f8a`, Qwen3-32B revizyonu `9216db5781bf21249d130ec9da846c4624c16137`. [Tamamlanmış sonuçlar](RESULTS-V10.md) ve [maliyet/çalışma kaydı](results/compute-ledger-v10.json); süreye dayalı bedel fatura yerine geçmez.

Sonuçlar görülmeden yapılan [AI fikstür incelemesi](results/semantic-fixture-review-v10.json), 024'te eyleyenin değişmesi ve 021'de eş zamanlılık ayrıntısı hakkında belirsizlik kaydetti. Ana tablo dondurulmuş 24 örneği korur; ek duyarlılık tabloları yalnız 024 dışarıda 23 örneği ve 021+024 dışarıda 22 örneği gösterir. Bunlar insan hakem kararı değildir; etiketler sonuca bakarak değiştirilmez. 009'daki zaman ifadesi not edilir fakat 5 ml/5 L farkı nedeniyle bu tablolardan çıkarılmaz.

[Uzun metin verisi ve kaynaklar](LONGFORM-V10.md), [dedektör pilotu](DETECTOR-PILOT.md) ve [ölçüm sınırları](DIAGNOSTIC-METRICS.md) ayrıca kaydedildi. Yalnız tamamlanan, model/kol/vaka kimlikleriyle doğrulanan çalışmalar sonuç raporuna alınır. Aktif skill ve master bu deney sonuçlarından önce değiştirilmez.
