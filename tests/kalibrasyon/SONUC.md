# tr-scan kalibrasyonu: LLM öncesi insan Türkçesi ile LLM Türkçesi

Tarih: 2026-09-22. Betik: `tests/kalibrasyon/kalibre.mjs` (`topla` → `uret` → `analiz`). `tr-scan.mjs` değiştirilmedi, yalnız `olc`/`denetle` çağrıldı.

**Örneklem:** 100 insan metni (50 haber, 50 serbest) ve 100 LLM metni (50 gpt-4o, 50 gpt-4o-mini). Her LLM metni bir insan metniyle eşli: aynı konu, istenen uzunluk aynı.

**AUC**, rastgele seçilen bir LLM metninin değerinin rastgele seçilen bir insan metninin değerinden büyük olma olasılığıdır; Mann-Whitney U / (n₁·n₂) ile hesaplandı. 0,5 ayırt etmiyor demek. 1'e ya da 0'a yaklaştıkça ayırma gücü artar. **Güç** = max(AUC, 1−AUC). **Eşik**, Youden J'yi (duyarlılık + özgüllük − 1) en büyük yapan değerdir ve yalnız gücü 0,65'in üstündeki ölçümler için önerilir. **Karar:** güç > 0,65 ise tut, 0,60–0,65 arasındaysa yalnız bilgi olarak kalsın, < 0,60 ise çıkar (ayırt etmiyor).

## Ana tablo

| ölçüm | insan medyan (IQR) | LLM medyan (IQR) | AUC [%95 GA] | önerilen eşik | yön | J (duy./özg.) | karar |
|---|---|---|---|---|---|---|---|
| **cumleCV** | 0,51 (0,41–0,60) | 0,29 (0,24–0,33) | 0,07 [0,04–0,11] | ≤ 0,37 | LLM daha düşük | 0,77 (0,92/0,85) | **tut** |
| **cumleSapma** | 7,22 (5,09–10,04) | 4,31 (3,56–4,73) | 0,15 [0,09–0,20] | ≤ 5,37 | LLM daha düşük | 0,62 (0,90/0,72) | **tut** |
| **uzunCumle** (adet) | 1 (0–3) | 0 (0–0) | 0,24 | ≤ 0 | LLM daha düşük | 0,45 (0,77/0,68) | **tut (yönü ters çevrilmeli)** |
| uzunCumleOran* | 0,08 (0,00–0,21) | 0,00 (0,00–0,00) | 0,25 [0,20–0,31] | ≤ 0 | LLM daha düşük | 0,45 (0,77/0,68) | tut |
| **ve100** | 2,09 (1,14–3,16) | 3,28 (2,14–4,35) | 0,72 [0,65–0,79] | ≥ 2,72 | LLM daha yüksek | 0,39 (0,68/0,71) | **tut** |
| **bir100** | 1,99 (1,10–2,71) | 3,15 (2,09–4,41) | 0,70 [0,63–0,77] | ≥ 2,76 | LLM daha yüksek | 0,35 (0,58/0,77) | **tut** |
| **heceOrt** | 2,79 (2,61–2,95) | 2,94 (2,79–3,08) | 0,69 [0,61–0,75] | ≥ 2,68 | LLM daha yüksek | 0,28 (0,96/0,32) | tut (eşik zayıf, bkz. not) |
| **hafifFiil200** | 0,00 (0,00–0,90) | 1,02 (0,00–1,86) | 0,66 [0,58–0,72] | ≥ 0,62 | LLM daha yüksek | 0,32 (0,62/0,70) | tut (sınırda) |
| gecis100 | 0,00 (0,00–0,27) | 0,00 (0,00–0,62) | 0,62 [0,56–0,70] | – | LLM daha yüksek | – | yalnız bilgi |
| ulac (adet) | 6 (3–9) | 4 (2–6) | 0,39 [0,31–0,45] | – | LLM daha düşük | – | yalnız bilgi (uzunluk etkisi) |
| ulacCumle | 0,29 (0,21–0,40) | 0,30 (0,18–0,45) | 0,50 [0,42–0,57] | – | – | – | **çıkar (ayırt etmiyor)** |
| maktadir (adet) | 0 (0–0) | 0 (0–0) | 0,52 | – | – | – | **çıkar (ayırt etmiyor)** |
| maktadir100* | 0 (0–0) | 0 (0–0) | 0,53 [0,47–0,57] | – | – | – | **çıkar (ayırt etmiyor)** |
| dirOran | 0,00 (0,00–0,08) | 0,00 (0,00–0,13) | 0,52 [0,44–0,57] | – | – | – | **çıkar (ayırt etmiyor)** |
| edilgen (adet) | 0 (0–1) | 0 (0–1) | 0,55 | – | – | – | **çıkar (ayırt etmiyor)** |
| edilgen100* | 0,00 (0,00–0,23) | 0,00 (0,00–0,55) | 0,57 [0,51–0,63] | – | – | – | **çıkar (ayırt etmiyor)** |
| cumleOrt | 14,33 (11,04–18,19) | 14,58 (13,17–16,40) | 0,53 [0,43–0,60] | – | – | – | **çıkar (ayırt etmiyor)** |
| **denetle().skor** | 93 (87,75–96) | 80,5 (71,75–87) | 0,17 [0,12–0,23] | ≤ 87 | LLM daha düşük | 0,53 (0,78/0,75) | tut |
| kelime (kontrol) | 249 (171–332) | 190 (140–250) | 0,32 | – | LLM daha kısa | – | kontrol değişkeni |

\* Tarayıcıda olmayan, adet ölçümlerinin 100 kelimeye ya da cümle sayısına bölünmüş hâli. Uzunluk etkisini ayırmak için eklendi.
GA: 1000 örneklemli bootstrap güven aralığı.

## İddiaların sınaması

| iddia | sonuç | kanıt |
|---|---|---|
| (a) LLM'de "bir" yoğunluğu daha yüksek | **Doğrulandı** | Medyan 3,15 ve 1,99; AUC 0,70. Haberde 0,76, serbestte 0,71, iki modelde de aynı yönde. |
| (b) LLM daha az ulaç kullanıyor | **Cümle başına bakınca çürüdü** | Ham adet LLM'de düşük (AUC 0,39), ama LLM metinleri %24 daha kısa. Cümle başına ulaç (`ulacCumle`) aynı: 0,30 ve 0,29, AUC 0,50. Mevcut `ulac-yok` bulgusu insan metinlerinin %16'sında, LLM metinlerinin %15'inde çıkıyor. |
| (c) "ve" yoğunluğu daha yüksek | **Doğrulandı, ama türe bağlı** | Genelde AUC 0,72. Serbestte 0,84, haberde yalnız 0,59: haber dili zaten "ve" ile dolu. |
| (d) Cümle uzunluğu daha tekdüze (CV daha düşük) | **Güçlü biçimde doğrulandı** | En iyi ayırıcı bu: AUC 0,07, yani 0,93 güç. Haberde ve serbestte aynı, iki modelde aynı. Uzunluk eşli 52 çiftte de 0,10. |
| (e) -maktadır / -DIr daha sık | **Çürüdü** | `maktadir` iki grupta da medyan 0 (AUC 0,52). `dirOran` AUC 0,52. gpt-4o bu kalıplara varsayılan olarak yönelmiyor. |
| (f) Hece ortalaması farklı mı? | **Evet, LLM'de daha uzun kelime** | 2,94 ve 2,79, AUC 0,69 (serbestte 0,79). Ama dağılımlar çok örtüşüyor, tek başına eşik olarak zayıf (J 0,28). |

## Tarayıcıya somut öneriler

1. **`duz-ritim` (cumleCV)**: eşiği 0,30'dan **0,37'ye** yükselt. 0,30'da LLM'lerin %57'sini, insanların %6'sını yakalıyor. 0,37'de LLM'lerin yaklaşık %92'si, insanların %15'i yakalanıyor. Ağırlığı en yüksek ölçüm olarak kalmalı.
2. **`uzun-cumle` yönü yanlış.** Şu an 25 kelimeyi aşan cümle "yapay zekâ izi" sayılıyor (ağırlık 1). Veride durum tersine: insan metinlerinin %68'inde, LLM metinlerinin %23'ünde uzun cümle var. Ya kaldırılmalı ya da yönü çevrilmeli (hiç uzun cümle olmaması + düşük CV birlikte LLM işareti).
3. **`ve-yogunlugu`**: 3'ten **2,7'ye** çek. **`bir-enflasyonu`**: 2,5'ten **2,75'e** çek. Tek başına ikisi de orta güçte (J 0,35–0,39); ağırlıklarını cumleCV'nin üstüne çıkarma.
4. **`ulac-yok`** (cümle başına ulaç) ayırt etmiyor: **çıkar** ya da yalnız bilgi olarak göster. Ağırlığı şu an 8, skoru en çok bozan iki kuraldan biri. Bu ağırlığı taşıyacak kanıt yok.
5. **`maktadir`, `dir-orani`, `edilgen`** ayırt etmiyor: skordan çıkar, istenirse üslup uyarısı olarak kalsın. `dir-orani` insanların %12'sinde, LLM'lerin %22'sinde tetikleniyor; AUC 0,52 olduğu için bu fark eşik seçiminden geliyor, dağılım farkından değil.
6. **`hafif-fiil`**: AUC 0,66, sınırda. Mevcut eşik (200 kelimede 3) neredeyse hiç tetiklenmiyor (insan %2, LLM %7). Youden eşiği 0,62, yani "200 kelimede en az 1". Düşük ağırlıkla tutulabilir.
7. **`gecis-yogunlugu`**: 0,62, yalnız bilgi. Mevcut eşik (1,5) neredeyse hiç tetiklenmiyor.
8. **Skor**: bu veride mevcut ağırlıklarla AUC 0,17 (güç 0,83), ≤ 87 eşiği J 0,53 veriyor. Tek başına cumleCV (0,93) skordan daha iyi ayırıyor. Yani ayırt etmeyen kurallar skoru bozuyor. 2, 4 ve 5 uygulanırsa skorun yeniden ölçülmesi gerekir.
9. Metin düzeyindeki kalıplardan `kapanis-klisesi` (insan %3, LLM %28), `olumsuz-kosutluk` (%3, %24) ve `bos-vurgu` (%1, %18) güçlü ayırıcılar. `burokratik` (%29, %28) ayırt etmiyor.

## Veri ve yöntem

**İnsan derlemi (LLM öncesi):**
- **Haber, 50 metin:** `batubayk/TR-News`, test bölümü. Kaynaklar Anadolu Ajansı, NTV, Cumhuriyet ve Habertürk; yayın yılları 2009–2020 (her metnin yılı `derlem/meta.json` içinde). Seçim şu yolla yapıldı: 15.000 satırlık bölümden 10 noktada 100'er satır çekildi, 120–500 kelime aralığında ve en az 5 cümleli olanlar süzüldü, tohumlu rastgele seçimle 50 metin alındı.
- **Serbest metin, 50 metin:** `turkish-nlp-suite/temiz-OSCAR`, `oscar-2019` yapılandırması. Common Crawl'ın Kasım 2018 taramasından geliyor, dolayısıyla LLM öncesi. Dosyanın ilk ~40 MB'ı alındı. Seçim ölçütleri: 120–500 kelime, en az 6 cümle, birinci tekil şahıs işareti (en az 2 "ben/bana/bence…" zamiri ve toplamda en az 6 birinci şahıs işareti), URL/fiyat/bahis içermeyen, az rakamlı metin. Sonuç çoğunlukla blog, forum yazısı, kitap/ürün yorumu ve kişisel denemeler. **Filtre kusursuz değil:** 50 metnin yaklaşık 6–8'i hâlâ haber ya da tanıtım kopyası, bir kısmı da yazım hatalı ve ş/ı harfleri olmadan yazılmış forum metni.

**LLM derlemi:**
- Modeller `gpt-4o-2024-08-06` (50 metin) ve `gpt-4o-mini-2024-07-18` (50 metin). Her türün içinde sırayla dönüşümlü atandı. Sıcaklık varsayılan, sistem mesajı yok.
- İstem: `Bu konuda yaklaşık N kelimelik Türkçe bir {haber|yazı} yaz: {konu}`. N, insan metninin kelime sayısının 10'a yuvarlanmış hâli. Konu haberde başlık, serbest metinde ilk cümlenin ilk 25 kelimesi.
- Metinler üretildiği gibi kaydedildi. 16 metinde `**kalın**` var, başlık (`#`) hiçbirinde yok.

**Ölçüm:** Her metne `denetle(metin)` uygulandı, `olcum` alanı ve `skor` alındı. Bulgu oranlarında TDK bulguları dışarıda tutuldu.

## Sınırlar

- **Örneklem küçük.** 100'e 100 metin, AUC için yaklaşık ±0,07 güven aralığı demek (tabloda). 0,60–0,70 arasındaki ölçümlerin (hafifFiil200, heceOrt, gecis100) kararı başka bir örneklemde değişebilir. cumleCV, cumleSapma ve skor gibi güçlü ayırıcılar aralıkları içinde bile açıkça ayırıyor.
- **Uzunluk farkı.** LLM metinleri istenenin altında kaldı (medyan oran %76). Adet ölçümleri (`ulac`, `maktadir`, `edilgen`, `uzunCumle`) bu yüzden LLM aleyhine düşük çıkıyor, oran sürümlerine bakılmalı. Uzunlukları ±%25 içinde eşleşen 52 çiftle tekrarlandığında sıralama değişmedi (cumleCV 0,10, bir100 0,73, ve100 0,73, ulacCumle 0,47).
- **Tür etkisi gerçek.** `ve100` haberde zayıf (0,59), serbestte güçlü (0,84). `cumleOrt` yön değiştiriyor: haberde LLM cümleleri daha kısa (0,33), serbestte daha uzun (0,73). Toplamda birbirini götürüp 0,53 çıkıyor. Tek bir eşik bu iki türe birden uymuyor.
- **İnsan serbest metni gürültülü.** Forum ve blog metinlerinde noktalama düzensiz, bu da cümle bölmeyi etkiliyor ve insan tarafında CV'yi şişirebilir. Buna karşın düzgün noktalanmış haberde de cumleCV'nin AUC'si 0,10, yani bulgu noktalama artefaktına bağlı değil.
- **Yalnız iki model ölçüldü**, ikisi de OpenAI ve varsayılan ayarlarda. Claude, Gemini ya da yerel Türkçe modeller ve "doğal yaz" gibi üslup istemleri farklı sonuç verebilir. Sonuçlar "varsayılan gpt-4o Türkçesi" için geçerli.
- **Yayın yılı karşılaştırması:** insan haberleri 2009–2020, LLM metinleri 2026'da güncel konular hakkında üretildi. Konu aynı olsa da LLM bazen sonraki olaylara göndermede bulunuyor (ör. 2024 seçimleri). Bu dil ölçümlerini etkilemez.

Ham tablo (tür ve model kırılımı, bulgu oranları): `derlem/sonuc-ham.md`. Metin başına ölçümler: `derlem/olcumler.json`. Derlem dizini telif nedeniyle yayına girmez.

---

## 2. tur: öneriler uygulandıktan sonra (2026-09-23)

Yukarıdaki öneriler `tr-scan.mjs`'e işlendi:

- `duz-ritim` eşiği 0,30 → 0,37, ağırlığı 20 (en yüksek).
- `uzun-cumle` kaldırıldı; yerine `uzun-cumle-yok` geldi: 8+ cümlelik metinde 25 kelimeyi aşan hiç cümle yoksa (ağırlık 6).
- `ve-yogunlugu` 3 → 2,7; `bir-enflasyonu` 2,5 → 2,75; `hafif-fiil` 3 → 1 (200 kelimede), ağırlığı 2.
- `ulac-yok`, `maktadir`, `dir-orani`, `edilgen`, `gecis-yogunlugu` skordan çıkarıldı.
- `burokratik` kalıbı "üslup" notuna indirildi: raporlanır ama skoru etkilemez.
- `kapanis-klisesi` ve `olumsuz-kosutluk` ağırlığı 8'e, `bos-vurgu` 6'ya çıkarıldı.

Aynı 200 metinle yeniden ölçüldü:

| | 1. tur | 2. tur |
|---|---|---|
| skor AUC | 0,17 (güç 0,83) | **0,05 (güç 0,95)** |
| insan medyan | 93 | 94 |
| LLM medyan | 80,5 | 62 |
| en iyi eşik (Youden) | ≤ 87 | **≤ 72** |
| eşikte duyarlılık / özgüllük | 0,78 / 0,75 | **0,87 / 0,94** |

| skor ≤ | LLM % | insan % |
|---|---|---|
| 50 | 24 | 0 |
| 60 | 45 | 0 |
| 70 | 76 | 1 |
| 75 | 91 | 13 |
| 85 | 93 | 22 |

**Dikkat: bu sonuç iyimserdir.** Ağırlıklar bu derlemin 1. tur tablosuna bakılarak seçildi ve aynı derlemle ölçüldü (örneklem içi). Bağımsız bir derlemde güç büyük olasılıkla daha düşük çıkar. Doğru sınama: başka bir tarihte, başka modellerle (Claude, Gemini, "doğal yaz" istemli GPT) üretilmiş yeni bir LLM derlemi ve başka bir insan derlemi. `kalibre.mjs` bunun için yeniden çalıştırılabilir.

**Skor ne değildir.** Bu skor "yapay zekâ yazdı" kararı değil. Metnin, varsayılan ayarlardaki bir LLM'in Türkçesine ne kadar benzediğinin kaba bir ölçüsüdür. Beceri, skoru yükseltmeyi hedef olarak değil, metni düzelttikten sonraki bir yan sonuç olarak ele alır.
