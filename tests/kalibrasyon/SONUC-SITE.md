# tr-scan bağımsız sınaması: site içeriği ve blog yazısı

Tarih: 2026-09-23. Betik: `tests/kalibrasyon/kalibre-site.mjs` (`topla` → `yaz` → `uret` → `analiz` → `simule`). `tr-scan.mjs` değiştirilmedi. Ham tablolar `derlem-site/sonuc-ham.md` ve `derlem-site/simulasyon.md` içinde, metin başına ölçümler `derlem-site/olcumler.json` içinde.

**Neden bu sınama:** Tarayıcının 2. tur ağırlıkları haber + forum derlemine bakılarak seçildi ve aynı derlemle ölçüldü. O ölçüm örneklem içiydi, bu yüzden iyimser. Bu sınama farklı bir türde (şirket sitesi ve blog), farklı bir insan derlemiyle ve farklı bir modelle (gpt-4.1-mini) yapıldı. Bir de "doğal yaz" istemi eklendi. Ağırlıklar bu veriye bakılarak seçilmedi.

## Kısa sonuç

- **Skor hâlâ ayırıyor ama iyimser tahminin altında.** AUC 0,05'ten (örneklem içi) 0,18'e çıktı, yani güç 0,95'ten 0,82'ye düştü. Blogda güç 0,86, site metninde 0,75.
- **≤ 72 eşiği bu derlemde tutmuyor.** Duyarlılık 0,87'den 0,74'e, özgüllük 0,95'ten 0,68'e düştü. Site metninde ikisi de 0,63: insan site metinlerinin %38'i "LLM gibi" işaretleniyor.
- **"Doğal yaz" istemi tarayıcıyı atlatmadı.** AUC 0,14 (güç 0,86), varsayılan istemden bile biraz daha iyi yakalanıyor. İstem kapanış klişesini azalttı ama olumsuz koşutluğu ("X değil, Y") artırdı. Düz ritim de ortadan kalkmadı.
- **Örneklem dışında çöken kurallar:** `bir-enflasyonu` (site AUC 0,54, blog 0,43; insan blogunda LLM'den sık), `hafif-fiil` (site %57'ye %60) ve `giris-klisesi` (insan sitesinde %13, LLM'de %3; yönü ters).
- **Site metninde en çok yanlış pozitif üreten kurallar:** `duz-ritim` (insan sitesinin %43'ü, ağırlık 20), `ve-yogunlugu` (%75, ağırlık 6) ve `giris-klisesi` ("Günümüzde…" açılışı, 2018 SEO metninde yaygın).

## 1. Skor

AUC = P(LLM skoru > insan skoru); skor düşükse LLM demek olduğu için değer 0'a yaklaştıkça iyi. **Güç** = 1 − AUC. GA: 1000 örneklemli bootstrap, %95.

| grup | n insan | n LLM | insan medyan | LLM medyan | AUC [%95 GA] | güç | ≤72 duyarlılık | ≤72 özgüllük | en iyi eşik (Youden) | duy./özg. |
|---|---|---|---|---|---|---|---|---|---|---|
| site, varsayılan istem | 40 | 30 | 84 | 66,5 | 0,25 [0,14–0,38] | 0,75 | 0,63 | 0,63 | ≤ 83 | 0,90/0,50 |
| blog, varsayılan istem | 40 | 30 | 86 | 58 | 0,14 [0,05–0,22] | 0,86 | 0,80 | 0,72 | ≤ 61 | 0,70/0,93 |
| site + blog, varsayılan | 80 | 60 | 85,5 | 62 | 0,19 [0,13–0,26] | 0,81 | 0,72 | 0,68 | ≤ 75 | 0,78/0,66 |
| site, "doğal yaz" | 40 | 10 | 84 | 59,5 | 0,14 [0,04–0,28] | 0,86 | 0,80 | 0,63 | ≤ 68 | 0,80/0,75 |
| blog, "doğal yaz" | 40 | 10 | 86 | 62 | 0,14 [0,04–0,26] | 0,86 | 0,80 | 0,72 | ≤ 76 | 0,90/0,70 |
| site + blog, "doğal yaz" | 80 | 20 | 85,5 | 62 | 0,14 [0,07–0,24] | 0,86 | 0,80 | 0,68 | ≤ 68 | 0,80/0,75 |
| **tümü (varsayılan + doğal)** | 80 | 80 | 85,5 | 62 | **0,18 [0,11–0,25]** | **0,82** | **0,74** | **0,68** | ≤ 68 | 0,71/0,75 |
| gpt-4o (varsayılan) | 80 | 30 | 85,5 | 60 | 0,17 | 0,83 | 0,70 | 0,68 | ≤ 83 | 0,97/0,54 |
| gpt-4.1-mini (varsayılan) | 80 | 30 | 85,5 | 63 | 0,21 | 0,79 | 0,73 | 0,68 | ≤ 66 | 0,70/0,79 |

**Önceki derlemle karşılaştırma:**

| | önceki derlem (haber + forum, örneklem içi) | bu derlem (site + blog, örneklem dışı) |
|---|---|---|
| skor AUC | 0,05 (güç 0,95) | 0,18 (güç 0,82) |
| insan medyan skor | 94 | 85,5 (site 84) |
| en iyi eşik | ≤ 72 | ≤ 68 (tümü); site ≤ 83, blog ≤ 61 |
| ≤ 72'de duyarlılık / özgüllük | 0,87 / 0,94 | 0,74 / 0,68 |
| cumleCV AUC | 0,07 | site 0,24, blog 0,17 |
| cumleCV en iyi eşik | ≤ 0,37 | site ≤ 0,28, blog ≤ 0,34, tümü ≤ 0,34 |

Skor dağılımı (skoru eşiğin altında kalan metinlerin yüzdesi):

| skor ≤ | insan site | insan blog | LLM site | LLM blog | doğal site | doğal blog |
|---|---|---|---|---|---|---|
| 50 | 0 | 0 | 0 | 20 | 20 | 30 |
| 60 | 5 | 8 | 20 | 67 | 50 | 40 |
| 65 | 15 | 18 | 50 | 70 | 70 | 60 |
| 72 | 38 | 28 | 63 | 80 | 80 | 80 |
| 80 | 45 | 40 | 77 | 90 | 90 | 90 |
| 90 | 60 | 68 | 90 | 93 | 100 | 100 |

Site metninde insan ve LLM dağılımları çok örtüşüyor. 2018'in KOBİ site metni zaten kalıplı, tekdüze ve "ve" ile dolu. Yani site metninde tarayıcı ile insan kalıbı arasındaki mesafe küçük. Bu bir eşik sorunu değil: site için en iyi eşik (≤ 83) özgüllüğü 0,50'ye düşürüyor.

## 2. Ölçümler

AUC = P(LLM değeri > insan değeri). 0,5 ayırt etmiyor demek. "Doğal" sütunu, 20 doğal istemli metnin 80 insan metnine karşı AUC'si.

| ölçüm | insan site medyan | LLM site medyan | insan blog medyan | LLM blog medyan | AUC site | AUC blog | AUC doğal | önceki derlemde AUC |
|---|---|---|---|---|---|---|---|---|
| cumleCV | 0,38 | 0,24 | 0,41 | 0,31 | **0,24** | **0,17** | **0,21** | 0,07 |
| cumleSapma | 6,54 | 3,53 | 5,26 | 4,01 | **0,16** | **0,21** | **0,18** | 0,15 |
| uzunCumle (adet) | 1 | 0 | 1 | 0 | **0,16** | 0,26 | 0,30 | 0,24 |
| ve100 | 3,84 | 6,05 | 2,51 | 3,88 | **0,79** | **0,73** | 0,64 | 0,72 |
| heceOrt | 2,98 | 3,15 | 2,74 | 2,86 | **0,87** | 0,65 | 0,59 | 0,69 |
| bir100 | 1,47 | 1,47 | 3,03 | 2,81 | 0,54 | 0,43 | 0,57 | 0,70 |
| hafifFiil200 | 1,32 | 1,41 | 0,68 | 1,66 | 0,50 | 0,71 | 0,55 | 0,66 |
| gecis100 | 0 | 0 | 0 | 0,38 | 0,59 | 0,68 | 0,58 | 0,62 |
| ulacCumle | 0,37 | 0,40 | 0,28 | 0,41 | 0,51 | 0,67 | 0,43 | 0,50 |
| cumleOrt | 15,6 | 14,3 | 12,5 | 12,6 | 0,31 | 0,56 | 0,37 | 0,53 |
| maktadir (adet) | 3 | 2 | 0 | 0 | 0,36 | 0,45 | 0,23 | 0,52 |
| dirOran | 0,50 | 0,25 | 0,16 | 0,32 | 0,21 | 0,74 | 0,22 | 0,52 |
| edilgen (adet) | 1 | 1 | 0,5 | 2,5 | 0,67 | 0,72 | 0,63 | 0,55 |
| kelime (kontrol) | 206 | 159 | 283 | 273 | 0,28 | 0,41 | 0,32 | 0,32 |

Okuma:
- **İki derlemde de tutarlı güçlü ayırıcılar:** cumleSapma, cumleCV, uzunCumle, ve100. Bunlar tarayıcının iskeleti olarak kalmalı. cumleCV'nin gücü azaldı (0,93'ten 0,76–0,83'e), çünkü insan site metni de tekdüze (medyan 0,38; önceki insan medyanı 0,51'di).
- **Türe göre yön değiştirenler:** `dirOran` sitede insanda yüksek (0,21: "-dır" ile biten cümle KOBİ metninin kalıbı), blogda LLM'de yüksek (0,74). `maktadir` sitede insanda daha sık (medyan 3'e 2). Skordan çıkarılmaları doğruydu.
- **Örneklem dışında çöken:** `bir100` (önceki 0,70, şimdi 0,54 / 0,43). LLM'in "bir" enflasyonu haber/forum insan metnine göre vardı; blog yazan insan da çok "bir" kullanıyor.
- `heceOrt` sitede güçlü (0,87), ama yalnız orada.

## 3. Bulgu türlerinin tetiklenme oranı

Metinlerin yüzde kaçında bulgu en az bir kez çıktı. Önceki derlemdeki oran (insan / LLM) karşılaştırma için verildi.

| bulgu | ağırlık | insan site | LLM site | doğal site | insan blog | LLM blog | doğal blog | önceki (insan/LLM) | site metninde ayırıyor mu? |
|---|---|---|---|---|---|---|---|---|---|
| duz-ritim | 20 | **43** | 73 | 90 | 30 | 77 | 70 | 13/86 | ayırıyor ama **insanda çok sık** (en büyük yanlış pozitif yükü) |
| uzun-cumle-yok | 6 | 28 | 70 | 80 | 43 | 80 | 60 | 32/74 | **ayırıyor** |
| ve-yogunlugu | 6 | **75** | 97 | 90 | 43 | 73 | 60 | 32/68 | AUC'de ayırıyor ama eşik (2,7) site için çok düşük: **insanda çok sık** |
| bir-enflasyonu | 6 | 13 | 10 | 40 | **63** | 53 | 80 | 23/58 | **hayır** (blogda ters yönde) |
| hafif-fiil | 2 | **57** | 60 | 50 | 35 | 70 | 70 | 22/50 | **hayır** (sitede); blogda ayırıyor |
| hype | 3 | 15 | 40 | 40 | 5 | 17 | 10 | 3/10 | **ayırıyor** ("sorunsuz", "son teknoloji") |
| yalanci-aralik | 1 | 5 | 30 | 20 | 8 | 0 | 0 | 3/4 | **sitede ayırıyor** ("tasarımdan montaja kadar"), blogda değil |
| olumsuz-kosutluk | 8 | 8 | 3 | **50** | 5 | 13 | **60** | 3/24 | varsayılan sitede hayır; **doğal istemde çok güçlü** |
| kapanis-klisesi | 8 | 3 | 3 | 0 | 13 | 50 | 20 | 3/28 | sitede tetiklenmiyor; blogda güçlü |
| bos-vurgu | 6 | 5 | 0 | 10 | 0 | 23 | 20 | 1/18 | sitede hayır (seyrek); blogda güçlü |
| giris-klisesi | 5 | **13** | 3 | 0 | 3 | 13 | 0 | 5/4 | **hayır, ters yönde** (insan sitesinde "Günümüzde…") |
| burokratik | 0 | 83 | 80 | 10 | 33 | 33 | 0 | 29/28 | hayır (ağırlığı zaten 0, doğru) |
| kesik-yigin | 0 | 0 | 0 | 0 | 5 | 0 | 0 | 5/0 | hayır; site hero'su derlemde yok |
| retorik-soru | 3 | 0 | 0 | 0 | 3 | 0 | 0 | – | tetiklenmiyor |
| kosac-kacisi | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0/3 | tetiklenmiyor |
| anons / anons-ikinokta | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 1/0 | tetiklenmiyor |
| kalin-yogun | 2 | 0 | 13 | 0 | 0 | 13 | 0 | – | ayırıyor (yalnız varsayılan istemde) |
| ceviri-kokusu | 3 | 13 | 17 | 10 | 5 | 17 | 10 | 6/9 | zayıf |

Site metninde insan tarafında bulguların yol açtığı toplam puan kaybı (40 metin, adet × ağırlık): duz-ritim 340, ve-yogunlugu 180, uzun-cumle-yok 66, hafif-fiil 46, bir-enflasyonu 30, olumsuz-kosutluk 32, giris-klisesi 25, hype 18. İlk ikisi insan site skorundaki düşüşün büyük kısmını açıklıyor.

**"Doğal yaz" istemi ne değiştirdi:** Kapanış klişesini azalttı (blogda %50'den %20'ye), kalın yazıyı ve listeyi kaldırdı. Ama modeller "klişe kullanma" talimatına olumsuz koşutlukla ("sadece X değil, Y") karşılık verdi: %3–13'ten %50–60'a çıktı. "Cümle uzunluklarını çeşitlendir" talimatı düz ritmi kaldırmadı: sitede %90, blogda %70. Bu yüzden tarayıcı "biraz uğraşılmış" metni varsayılan metin kadar, hatta biraz daha iyi yakalıyor. Tek bir cümlelik üslup istemi yeterli bir kaçış değil; daha ciddi düzeltme (elle düzeltme, çok turlu yeniden yazım) bu derlemde yok.

## 4. Öneriler

Aşağıdaki değişiklikler `simule` komutuyla sınandı: tarayıcı değiştirilmeden, her metnin bulgu listesi ve ölçümlerinden skor yeniden hesaplandı. Her öneri iki derlemde birden ölçüldü (eski: 100+100 haber/forum, yeni: 80+80 site/blog). Sağlama: mevcut ağırlıklarla yeniden hesaplanan skor 360 metnin hepsinde tarayıcının skoruyla aynı.

| varyant | eski AUC | eski ≤72 duy./özg. | eski ≤80 duy./özg. | yeni AUC | yeni site AUC | yeni ≤72 duy./özg. | yeni ≤80 duy./özg. | yeni en iyi eşik |
|---|---|---|---|---|---|---|---|---|
| V0 mevcut | 0,05 | 0,87/0,95 | 0,91/0,83 | 0,18 | 0,25 | 0,74/0,68 | 0,85/0,57 | ≤ 68 |
| V1: bir-enflasyonu, giris-klisesi, hafif-fiil → 0 | 0,06 | 0,67/0,99 | 0,90/0,85 | 0,17 | 0,23 | 0,69/0,80 | 0,81/0,64 | ≤ 71 |
| **V2: V1 + duz-ritim kademeli** (CV < 0,30 → 20; 0,30–0,37 → 8) | 0,06 | 0,58/1,00 | **0,75/0,92** | **0,15** | **0,20** | 0,61/0,88 | **0,79/0,78** | ≤ 77 |
| V3: V2 + ve-yogunlugu 6 → 3 | 0,06 | 0,51/1,00 | 0,70/0,93 | 0,15 | 0,20 | 0,51/0,89 | 0,76/0,82 | ≤ 80 |
| V4: V3 + yalanci-aralik 1 → 3, uzun-cumle-yok 6 → 8 | 0,07 | 0,57/0,99 | 0,71/0,93 | 0,15 | 0,19 | 0,54/0,89 | 0,76/0,82 | ≤ 78 |

Öneriler, önem sırasıyla:

1. **`bir-enflasyonu`, `giris-klisesi` ve `hafif-fiil`i skordan çıkar** (üslup notu olarak kalsın). Kanıt: bir100 AUC sitede 0,54, blogda 0,43; insan blogunda kural %63, LLM blogunda %53 tetikleniyor. `giris-klisesi` insan sitesinde %13, LLM'de %3; eşleşen kalıp hep "Günümüzde…" (2018 SEO metninin tipik açılışı). Önceki derlemde de ayırmıyordu (%5'e %4). `hafif-fiil` sitede %57'ye %60. Üçü çıkarılınca yeni derlemde özgüllük ≤72'de 0,68'den 0,80'e çıkıyor, eski derlemde AUC 0,05'ten 0,06'ya iniyor, yani kayıp önemsiz.
2. **`duz-ritim`i kademeli yap:** cumleCV < 0,30 → 20, 0,30–0,37 → 8. Kanıt: 0,37 eşiği insan site metninin %43'ünü ve insan blogunun %30'unu yakalıyor. Site metninde Youden eşiği 0,28, blogda 0,34. İnsan site metninin cumleCV medyanı 0,38, yani mevcut eşiğin tam üstünde. Kademe, CV'si çok düşük olan asıl LLM metnini tam cezalandırıyor, gri bölgeyi hafifletiyor. V2 yeni derlemde AUC'yi 0,18'den 0,15'e, sitede 0,25'ten 0,20'ye iyileştiriyor.
3. **Eşiği tek bir sayı olarak değil, bant olarak sun; V2 ile ≤ 72 yerine ≤ 80 kullan.** V2'de ≤ 80 eşiği eski derlemde 0,75/0,92, yenide 0,79/0,78 veriyor. Mevcut ağırlıklar ve ≤ 72 eşiği yeni derlemde 0,74/0,68 veriyor. Hiçbir tek eşik iki türde birden 0,85/0,85'e yaklaşmıyor. Beceri skoru "≤ 65 güçlü iz, 66–80 gri bölge, > 80 zayıf iz" gibi bantlarla raporlamalı ve gri bölgede karar vermemeli.

Diğer bulgular:
- **Site için ayrı eşik gerekmiyor.** Mevcut ağırlıklarla site için en iyi eşik ≤ 83, özgüllük 0,50: eşik kaydırmak işe yaramıyor. Sorun eşikte değil, sitede insanda da sık çıkan kurallarda. V2 uygulanınca sitenin en iyi eşiği ≤ 76'ya, genelinki ≤ 77'ye yaklaşıyor. Tek eşik yetiyor.
- **`ve-yogunlugu`:** AUC'de ayırıyor (site 0,79, blog 0,73), ama 2,7 eşiği site metninin doğal "ve" yoğunluğunun altında kalıyor (insan site medyanı 3,84). Ağırlığı düşürmek (V3) AUC'yi değiştirmedi. Uzun vadede eşik tür başına verilmeli (serbest/blog 2,7; site/haber ~3,9). Tarayıcı türü bilmediği için şimdilik dokunma.
- **Güçlendirmeye aday:** `hype` iki derlemde de tutarlı biçimde LLM'de sık (site %15'e %40). `yalanci-aralik` sitede güçlü (%5'e %30) ama blogda ve haberde tetiklenmiyor. Ağırlığını 3'e çıkarmak (V4) sitede AUC'yi 0,20'den 0,19'a iyileştiriyor, başka yerde etkisi yok.
- **`olumsuz-kosutluk` (ağırlık 8) doğru yerde:** "doğal yaz" istemli metinlerin yarısından çoğunda çıkıyor. Üslup istemiyle kaçan metni yakalayan asıl kural bu.
- `kesik-yigin`, `anons`, `kosac-kacisi`, `retorik-soru` bu derlemde hiç ya da neredeyse hiç tetiklenmiyor. Ölçülemiyorlar; ağırlıkları kanıtsız.

**Uyarı:** V1–V4 bu derlemin sonuçlarına bakılarak kuruldu. Yani yeni derlem için bunlar da artık örneklem içi. Eski derlemde de sınandıkları için tek derleme uydurulmuş sayılmazlar, ama gerçek sınama için üçüncü bir derlem gerekir (başka model ailesi: Claude, Gemini, yerel Türkçe model; başka tür: ürün açıklaması, e-posta).

## Veri ve yöntem

**İnsan derlemi (LLM öncesi, Common Crawl Kasım 2018):** `turkish-nlp-suite/temiz-OSCAR`, `oscar-2019` yapılandırması. Önceki derlem dosyanın ilk 60 MB'ını kullandı. Bu derlem için 8,2 GB'lık dosyanın içine yayılmış 10 ayrı noktadan 20'şer MB okundu (0,3–7,5 GB). Önceki derlemdeki 100 metinle ilk 80 karakteri aynı olan metin olmadı.

- **Aday seçimi:** 100–500 kelime. **Site:** "hizmetlerimiz, hakkımızda, firmamız, şirketimiz, müşterilerimiz, ürünlerimiz, kurumsal, iletişime geçin, teklif al, uzman kadromuz, ekibimiz, referanslarımız, kaliteli hizmet, müşteri memnuniyeti" işaretlerinden en az 2'si. **Blog:** site işareti yok; "nasıl, nedir, ipucu, öneri, dikkat edilmesi, yapmanız gereken, adım adım, faydaları, yöntem, tavsiye, deneyim" işaretlerinden en az 2'si ve en az 3 okura hitap ya da birinci şahıs işareti.
- **Otomatik eleme** (aday türüne göre, ilk tutan neden sayıldı):

| neden | site | blog |
|---|---|---|
| anahtar kelime doldurma (aynı üçlü ≥ 4 kez ya da kelime çeşitliliği < 0,45) | 291 | 152 |
| forum işareti | 80 | 154 |
| e-ticaret (₺/TL/sipariş/kargo; yalnız blog) | – | 231 |
| URL / e-posta | 77 | 65 |
| haber işareti (dedi, açıkladı, AA, İHA…) | 44 | 66 |
| büyük harfli başlık yığını | 39 | 22 |
| az cümle (< 5) ya da noktalamasız (cümle başına > 40 kelime) | 27 | 5 |
| kopya | 15 | 1 |
| bahis / yetişkin / korsan / medyum | 9 | 54 |
| ASCII'ye dökülmüş (Türkçe harfli kelime oranı < %25) | 4 | 16 |
| rakam/fiyat yoğun | 5 | 1 |
| **toplam otomatik eleme** | **591** | **767** |
| geçen havuz | 1028 | 1428 |

- **Elle eleme:** Havuz tohumlu karıştırıldı, sırayla okundu, uymayanlar gerekçesiyle `derlem-site/ret.json` içine yazıldı. Site için 53 aday okundu, 13'ü elendi: haber/basın bülteni 6, e-ticaret ürün sayfası, firma rehberi listesi, özgeçmiş, ödeme politikası, makale, çalışma saatleri listesi, anahtar kelime doldurma (2). Blog için 60 aday okundu, 20'si elendi: haber/basın bülteni 4, şirket sitesi 2, toplayıcı özet parçası 2, forum sorusu, ASCII forum (2), iş ilanı, ürün/uygulama tanıtımı 3, yorum dizisi, siyasi görüş, soru mektubu, özgeçmiş, şiir, kopuk parça, numaralı liste, video açıklaması.
- **Sonuç:** 40 site metni (sayfa türü: hizmetlerimiz 15, hizmet tanıtımı 14, hakkımızda 11; halı yıkama, nakliyat, klima, ilaçlama, reklam, kimya, danışmanlık, sağlık, güvenlik sistemleri…) ve 40 blog yazısı (tarif, sağlık, teknoloji rehberi, makyaj/moda, kişisel deneyim, ürün incelemesi).

**LLM derlemi:** OpenAI Chat Completions, sıcaklık varsayılan. Anahtar `.env`'den process içinde okundu, hiçbir dosyaya yazılmadı.

- **Konu çıkarımı:** `gpt-4o-mini` (sıcaklık 0, JSON). Site metninden `{sektör, sayfa türü}`, blogdan en çok 12 kelimelik bir başlık alındı. İnsan metni istemlere kopyalanmadı.
- **İstemler:** Site için `{sektör} alanında çalışan bir Türk firması için yaklaşık N kelimelik '{sayfa türü}' sayfası metni yaz.`, blog için `Şu konuda yaklaşık N kelimelik Türkçe bir blog yazısı yaz: {konu}`. N, eşlenik insan metninin kelime sayısının 10'a yuvarlanmış hâli.
- **Modeller:** `gpt-4o-2024-08-06` 40 metin, `gpt-4.1-mini-2025-04-14` 40 metin, sırayla dönüşümlü.
- **"Doğal yaz" koşulu:** Her türün son 10 metni (5 gpt-4o, 5 gpt-4.1-mini) şu sistem mesajıyla üretildi: "Türkçe yaz; yapay zekâ gibi değil, Türkçe düşünen bir insan gibi. Klişe, abartı, 'sonuç olarak' kapanışı kullanma. Cümle uzunluklarını çeşitlendir."
- **Dağılım:** varsayılan istemle 60 metin (30 site, 30 blog), doğal istemle 20 metin (10 site, 10 blog). Her LLM metni bir insan metniyle eşli.

**Ölçüm:** Her metne `denetle(metin)` uygulandı. `skor`, `olcum` alanları ve TDK dışı bulgu türleri alındı. AUC Mann-Whitney U / (n₁·n₂), güven aralığı 1000 örneklemli bootstrap, eşik Youden J.

## Sınırlar

- **Örneklem küçük.** Hücre başına 30 LLM metni (doğalda 10). Site skor AUC'sinin %95 aralığı 0,14–0,38, doğalınki 0,04–0,28. Doğal koşulu için yön açık, büyüklük belirsiz.
- **İnsan site metni kendine özgü bir tür.** 2018 KOBİ site metninin önemli kısmı SEO ajanslarınca kalıpla yazılmış ("Günümüzde…", "firmamız … hizmeti vermektedir"). Bu insan metni ama "özenli insan yazısı" değil. Tarayıcının burada zorlanması, LLM Türkçesinin bu kalıba zaten benzediğini de gösteriyor. Özenli bir kurumsal metin derleminde sonuç farklı olabilir.
- **Elle eleme tek kişinin yargısı.** Ölçütler `ret.json`'da gerekçesiyle kayıtlı. İnsan metinlerinin skoruna bakılmadan, yalnız ilk 240–260 karaktere bakılarak elendi.
- **Uzunluk farkı.** LLM site metinleri istenenden kısa kaldı (medyan 159'a karşı 206 kelime), blogda fark yok (273'e 283). Adet ölçümleri (`uzunCumle`, `maktadir`, `edilgen`) bundan etkilenir. Oran ölçümleri ve skor daha az etkilenir.
- **Yalnız OpenAI modelleri ölçüldü.** "Doğal yaz" tek cümlelik bir sistem istemi. Çok turlu düzeltme, insan eliyle rötuş ya da başka model aileleri ölçülmedi.
- **Öneri simülasyonu da sınırlı.** V1–V4 bu derleme bakılarak kuruldu (bkz. Öneriler'deki uyarı). Kuralların ağırlığı değiştirildi ama kural tanımları (regex'ler) değiştirilmedi.

Derlem (`derlem-site/`) Common Crawl metni ve üretilmiş metin içerir, `.gitignore` ile yayın dışında tutulur. `kalibre-site.mjs topla && yaz && uret && analiz && simule` ile yeniden üretilebilir. `ret.json` elle hazırlandığı için `aday.json` sırası aynı kalmalı: dilimler ve tohum sabit.

---

## Uygulama (2026-09-23)

Yukarıdaki üç öneri `tr-scan.mjs`'e işlendi: `bir-enflasyonu`, `giris-klisesi`, `hafif-fiil` ağırlığı 0 (üslup notu); `duz-ritim` kademeli (CV < 0,30 → 20 puan, 0,30-0,37 → 8 puan); rapor bantlı (≤65 güçlü iz, 66-80 gri, >80 zayıf). İki derlemde yeniden ölçüldü:

| derlem | n (insan/LLM) | güç (1−AUC) | ≤80 duyarlılık | ≤80 özgüllük |
|---|---|---|---|---|
| haber + forum (SONUC.md) | 100/100 | 0,94 | 0,75 | 0,92 |
| site + blog, tümü | 80/80 | 0,85 | 0,79 | 0,78 |
| site + blog, varsayılan istem | 80/60 | 0,85 | 0,78 | 0,78 |
| site + blog, "doğal yaz" istemi | 80/20 | 0,87 | 0,80 | 0,78 |

İki derlem de artık ayar için kullanıldı. Gerçek doğrulama üçüncü bir derlem ister (başka model ailesi, başka insan metinleri).
