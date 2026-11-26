# Model bağımsız filtre: editör seçimi

## Ürün kararı

Türkçe metin filtresi standart Agent Skill olarak dağıtılır. Varsayılan editör skill'i çalıştıran modeldir. Herkesten yerel model veya API anahtarı istemek dağıtımın amacına aykırıdır. İleri NLP araçları ve alternatif editör isteğe bağlıdır. Bu dalda mevcut yazma, düzenleme ve denetleme kipleri korunur; çekirdek görev mevcut metni veya taslağı anlam kaydırmadan iyileştirmektir.

## Araştırma kaynakları

- Cetvel, https://aclanthology.org/2026.eacl-long.46/ — 33 açık ağırlıklı model, Türkçe anlama/üretim ve kültürel yeterlik. Türkçeye özgü eğitimin tek başına üstünlük sağlamadığı raporlanmış. Blog editörlüğü sıralaması değildir.
- TurBLiMP, https://aclanthology.org/2025.emnlp-main.834/ — dilsel kabul edilebilirlik, 16 olgu. Anlatım kalitesi ölçmez.
- TurkBench, https://aclanthology.org/2026.sigturk-1.12/ — 21 alt görev, genel Türkçe yetenekleri. Blog düzeltme kalitesi ölçmez.
- Turkish-GEC, https://github.com/asimokby/Turkish-GEC — dil bilgisi düzeltmesi; tek başına editör değildir.
- Agent Skills, https://github.com/agentskills/agentskills — taşınabilir skill biçimi ve isteğe bağlı kaynaklar.

## Editoryal zekâyı geliştirme

Gerçek, izinli editör düzeltmeleri topla: kaynak taslak, yayıma hazır metin, düzeltmenin gerekçesi, yazarın/türün tercihleri, değişmemesi gereken içerik. İyi metni değiştirmeme örnekleri de bulunmalı. Çalışmayı kişi veya marka kimliği taklidine değil; sözdizimi, akış, olgu sadakati, özgün anlatım ve işlevsel üslup kararlarına dayandır.

İlk tur 40 Türkçe blog taslağı; her birini aynı metin ve brifle 4 kolda değerlendir:
A) yalnız "doğal Türkçe düzenle" komutu
B) mevcut model + Turkish Writer v1.1
C) aynı model + yeni filtre
D) yeni filtre + isteğe bağlı ikinci editör
İnsan editörün bağımsız düzeltmesi kalite referansıdır. İkinci editör olarak erişilebilir güçlü GPT/Claude/Gemini modelleri ve uygun açık ağırlıklı modeller test edilebilir. En iyi aday ölçümle belirlenir; belirli model ailesini varsayılan bağımlılık yapma.

Ayrı bir test: aynı filtreyi farklı uyumlu ajanlarda çalıştır; araçsız ve anahtarsız tamamlanabiliyor mu? Ajanların yerel araç erişimi ve davranışları aynı olmayabilir. Ürün bunu gizlemez.

## Kör değerlendirme

En az iki Türkçe editör, kolu/modeli bilmeden rastgele sıradaki çıktıları inceler. 1-5 ölçüler:
- anlam ve kaynak sadakati
- doğal Türkiye Türkçesi ve anlatım
- editoryal isabet (sorunlu ifadeyi onar, iyi ifadeyi koru)
- bilgi akışı ve okunabilirlik
- yazım ve biçim
- yayın için gerekli ek düzeltme süresi (ayrıca dakika olarak kaydet)

Kritik olgu, ad, miktar, koşul, kaynak, açıklama veya anlam kaybı ayrı kusurdur; yüksek üslup puanı bunu telafi etmez. Başarılı dokunmama örneği, yanlış pozitif düzeltme ve gereksiz değişiklik oranı ayrı kaydedilir. Yazarlık tahmini/detector skoru optimize edilmez.

Önerilen sürüm kapısı: görülmemiş test setinde A ve B'ye göre daha iyi kör editör tercihi ve ciddi anlam kayması olmaması. Ölçüm örneklem büyüklüğü ve güven aralığıyla raporlanır. Önce editör geri bildirimiyle skill kuralı ve örnekleri geliştirilir. Ancak doğrulanmış bir açık model açıkça daha iyi sonuç verirse veya çevrimdışı kullanım gerekiyorsa isteğe bağlı yerel model paketi düşünülür.

Bu bir plan ve kılavuzdur; yerel model indirme veya gerçek insan/model değerlendirmesi bu commit'te yapılmamıştır.
