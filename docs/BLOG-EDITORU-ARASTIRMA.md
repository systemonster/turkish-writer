# Blog editörlüğü: kaynak incelemesi ve doğrulama

Bu dalda yapılan araştırma 2026-11-25. İncelenen commit'ler:

| Kaynak | Commit | Karar |
|---|---|---|
| https://github.com/yucezerey/turkish-anti-ai-skill | 2abf2ffbba4392109dac78d510265859febd2c4e | Ulaç öznesi, grup çekimi, kanıtsallık; zorunlu ritim eşiği alınmadı. |
| https://github.com/myylogic/cevahir-ai | 5f21f1c0e630491d8aae01fa8cfd929578b52af3 | Tokenizer ve kaynak kaydı araştırması; blog üretim üstünlüğü doğrulanmadı, motor olarak eklenmedi. |
| https://github.com/agmmnn/turkish-nlp-resources | 8156d1f448b5b131de52a365f1fcf41e3f248414 | Derlem ve treebank araştırması; kaynakların ayrı lisansları var. |
| https://github.com/vngrs-ai/vnlp | 73265d820c0bda86517153327fd435e171afd75a | Ayrı, isteğe bağlı adapter; AGPL-3.0, test seti görmüş varsayılan ağırlıklar değerlendirme için kullanılmaz. |
| https://github.com/durmazoguzhan/turkish-humanify | debe15f8bc824386d94761e526f87a9a8505b50e | İki yönlü anlam sadakati, yapı ve kesinlik; yeni bağımsız kılavuz. |
| https://github.com/ahmetaa/zemberek-nlp | 657ec6eef9b2d9e4708c78e9dcbc8c38b0c47a7d | Java API üzerinden ayrı biçimbirim analizi; Apache-2.0. |
| https://github.com/bushrabeg/turkce-humanizer | 65a1a4107029ed5b5a72bc226f4937d236214484 | Ses kartı ve yapıyı koruma; mutlak noktalama yasakları ve telifli örnekler alınmadı. |

## Ölçüm ve veri

- https://aclanthology.org/2025.emnlp-main.834/ — TurBLiMP, 16 dil olgusu ve her biri için 1000 asgari çift. Dilsel kabul edilebilirlik testi; blog kalitesi testi değil.
- https://aclanthology.org/2026.sigturk-1.12/ — TurkBench, genel Türkçe model yeterliği. Tek başına editör seçemez.
- https://universaldependencies.org/treebanks/tr_boun/ — UD Turkish BOUN, 9761 elle işaretlenmiş cümle; CC BY-SA 4.0. Ayrı lisanslı veri olarak incele, MIT derleme gibi dağıtma.
- https://github.com/asimokby/Turkish-GEC — Türkçe dil bilgisi düzeltmesi; veri ve model koşulları ayrı incelenmeli.
- https://huggingface.co/ytu-ce-cosmos/Turkish-Gemma-9b-v0.1 ve https://huggingface.co/Trendyol/Trendyol-LLM-Asure-12B — ilk yerel editör adayları. Hiçbiri blogda ölçülmedi.

## Blog özelinde deney

1. 40 farklı brif: açıklayıcı yazı, karşılaştırma, sektör analizi, teknik rehber; her grupta on, kaynak ve amaç belli. Aynı kaynak ve brifle A: modelin basit “doğal Türkçe yaz” istemi, B: v1.1, C: v2, D: v2 + yerel editör önerisi. İnsan editörün bağımsız yazdığı metinler ayrı referans. Yerel modelleri aynı metne aynı editör talimatıyla kıyasla.
2. Editörler kolu ve model adını bilmez. Ölçütler: doğruluk, özgün katkı, mantık, doğal Türkçe, anlatım gücü, yayın için gerekli düzenleme süresi. İddia/olgu kaymaları ayrı kaydedilir. Tespit araçlarının çıktısı yayın hedefi değildir.
3. İlk deneyde kazananı seçtikten sonra yeni, görülmemiş briflerde doğrula. Veri setini kaynak, konu ve yazar bazında ayır. Model sürümü, istem, tohum, quantization, bağlam, çağrı süresi ve donanımı kaydet.
4. İzinli gerçek blog metinleri ve insan editörün yaptığı önce/sonra düzeltme çiftleriyle ses kartını geliştir. Örnekler kopyalanmaz, kişisel veri ayıklanır. Lisans ve kaynak izlenebilir olmalı. 100-200 yüksek nitelikli çiftle tercih değerlendirmesi başlatılabilir; fine-tuning ancak yeterli veri, donanım, lisans ve temel karşılaştırma olduğunda ayrı deney.
5. Seri yayın testi: 20 aynı konu kümesindeki yazıyı birlikte oku. Özgün soru/katkı, bilgi çelişkisi, kaynak ve gereksiz tekrar. Yeni bilgi sunmayan yazıyı yayıma alma. SEO amacı bilgi sadakatini değiştirmez.

## Durum

Kılavuzlar, isteğe bağlı adapter kodları ve mock testler eklendi. Yerel modeller indirilmedi, Java/Python NLP bağımlılıkları kurulmadı. Canlı model ve kör editör değerlendirmesi yapılmadı. Bu bir geliştirme dalıdır, sonuç veya yayın garantisi değil.
