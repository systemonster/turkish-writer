# İsteğe bağlı yerel dil araçları

Ana skill Node 18+ ve çalıştıran ajanla çalışır. Aşağıdaki araçlar seçime bağlıdır, yayın kapısı değildir. Hiçbiri otomatik olarak metni değiştirmez.

## Zemberek (Apache-2.0)

Kaynak: https://github.com/ahmetaa/zemberek-nlp, incelenen commit 657ec6eef9b2d9e4708c78e9dcbc8c38b0c47a7d. Belgede 0.19.0 ve Java API örnekleri var. Kullanıcı sürümü ve jar'ı kaynağından doğrular. Java 11+ ve uyumlu zemberek-full.jar ile:

```bash
java -cp /path/to/zemberek-full.jar scripts/nlp/ZemberekDenetle.java metin.txt
```

Salt okunur JSON Lines çıktısı: cümle, sözcük, lemma, kök, POS, biçimbirim, bilinmiyor bilgisi. Çıktı çözümleyicinin tahminidir; sözcük hatası veya köken sınıflandırması değildir. Bilinmeyen sözcükleri özellikle marka ve teknik terimlerde insan/ajan kontrol eder. API doğrulandı, gerçek jar ile uçtan uca henüz sınanmadı.

## VNLP (AGPL-3.0)

Kaynak: https://github.com/vngrs-ai/vnlp, commit 73265d820c0bda86517153327fd435e171afd75a. Paketin kaynak kodunu veya ağırlıklarını MIT depoya katma. Ayrı kullanıcı kurulumunda lisans şartlarını değerlendir; ticari dağıtım ve servis kullanımına ilişkin yükümlülükleri incele. Resmî paket TensorFlow bağımlılığı taşır; otomatik kurulum yapılmaz. Bazı modeller ilk yüklemede ağırlık indirir. Gerektiğinde ayrı ortamda kullanıcı açıkça kurabilir:

```bash
python -m pip install vngrs-nlp==0.2.4
python scripts/nlp/vnlp-denetle.py metin.txt
```

Sözcük türü, bağımlılık ilişkisi ve özel ad tahminleri verir. `--evaluate` kaynak projenin test verisiyle yeniden eğitilmemiş değerlendirme ağırlıklarını seçer. Varsayılan modelin bazı ağırlıkları test setini de görmüştür; bu yüzden onunla bağımsız başarı iddiası kurulmaz. Çıktı yalnız teşhis içindir. Model ve paket burada çalıştırılmadı.

## Yerel editör

Ollama, llama.cpp veya uyumlu bir yerel OpenAI API sunucusu çalışıyorsa, kullanıcının belirlediği modelle metne editoryal geri bildirim alınabilir:

```bash
node scripts/yerel-blog-editoru.mjs metin.md --model MODEL_ADI --port 11434
```

Sadece 127.0.0.1 adresine erişir; dış URL kabul etmez, yönlendirme izlemez. Port ve model adı kullanıcı seçer. Kaynağı değiştirmez; JSON notları döndürür. Çıktıdaki alıntı metinde birebir bulunmalıdır. Model değerlendirmesi olgu veya dil bilgisi doğrulaması değildir; editör kararı gerekir. Model indirme yoktur.

Önce denenecek adaylar:
- https://huggingface.co/ytu-ce-cosmos/Turkish-Gemma-9b-v0.1 (Gemma lisansı; Türkçe üretim)
- https://huggingface.co/Trendyol/Trendyol-LLM-Asure-12B (Gemma lisansı; kontrollü üretim)
- https://github.com/asimokby/Turkish-GEC (Türkçe dil bilgisi düzeltme, model/veri lisansları ayrıca kontrol)
- https://huggingface.co/ufakai/ufakzeka-1-base (küçük temel model, araştırma; talimat izleyici değildir)

Yerel modeli yazar olarak değil önce ikinci editör olarak kıyasla. En iyi modeli gerçek blog brifleri ve kör insan editörü değerlendirmesiyle seç. Ana modelin iyi yazdığı cümleye zorunlu olarak yerel model dokunmaz.
