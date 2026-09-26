# Hakem döngüsü: kalibrasyon ve kör test 2

Tarih: 2026-09-26. Betikler: `skills/turkish-writer/scripts/hakem-dongusu.mjs` (döngü),
`tests/kalibrasyon/kalibre-hakem.mjs` (eşik), `tests/kalibrasyon/kor-test/kur-set-2.mjs` (set-2),
`tests/kalibrasyon/kor-test/hakem-esli.mjs` (eşli ölçüm). Ham sonuçlar git dışı:
`derlem-nitelikli/hakem.json`, `kor-test/cevap-anahtari-2.json`.

## Kısa sonuç

- **Eşik 0,30** (döngü hakemi gpt-6-sol, tek metin). Nitelikli insan metninde yanlış "yapay"
  oranı tam metinde 0/62, kısa parçada 2/20 (%10).
- **Döngü tek metin hakemini geçiyor, eşli hakemi geçmiyor.** Yeni istemle yazılan taslakların
  16/20'si döngü hakeminin eşiğinin altında doğdu; 4'ü yeniden yazıldı. Ama eşli testte gpt-6-sol
  set-2'de döngüden önce %97,5, sonra **%100** doğru. v1.0 hedefi (≤ %70) karşılanmadı.
- **Saklı hakem aşırı uyumu gösteriyor.** Set-2'nin beceri metinlerinde tek metin ayırma gücü
  (AUC, insan ile beceri) döngü hakeminde 0,69'a düştü, saklı hakemde (gpt-6-astra, editör istemi)
  0,96'da kaldı. Döngü, döngüdeki hakemi kandırmayı öğreniyor; metni insanlaştırmıyor.
- Eşli testte bütün güçlü hakemler (gpt-6-sol, saklı) set-1'de de set-2'de de %97,5-100.
  gpt-4.1 iki sette de şans düzeyinde.

## 1. Hakemler

| Rol | Model | İstem | Nerede |
|---|---|---|---|
| Döngü hakemi | gpt-6-sol (yedek gpt-5.5) | "İnsan mı, yapay zekâ mı?"; p(yapay zekâ), ele veren en çok 5 cümle, gerekçe, biçim yönü | döngü, kalibrasyon |
| Saklı hakem | gpt-6-astra | "Yayın editörüsün; yayımlanmış yazı mı, dil modeli üretimi mi?" 0-100 puan, gerekçesiz. Eşli sürümü aynı çerçevede "hangisi yayımlanmış yazıdan alındı?" | yalnız ölçüm, döngüye girmez |

Farklı aileden bir hakem (Anthropic) denenemedi: hesapta kredi yok. İki hakem de OpenAI; üretici de
OpenAI (gpt-5.6-sol).

## 2. Kalibrasyon

İnsan: `derlem-nitelikli/insan/` 62 tam metin + set-1'in 20 insan parçası (80-150 kelime).
Beceri: eski istemle üretilmiş 36 tam metin (`beceri-once/`) + set-1'in 20 beceri parçası; ayrıca
yeni istemle (4beee8889dfb851b) üretilmiş 36 tam metin (`beceri/`, istem ajanının çıktısı).
"Yapay" = p > eşik.

| Grup | n insan / beceri | AUC | insan medyan p | beceri medyan p |
|---|---|---|---|---|
| gpt-6-sol, tam metin, eski istem | 62 / 36 | 1,00 | 0,06 | 0,99 |
| gpt-6-sol, set-1 parçaları | 20 / 20 | 0,85 | 0,12 | 0,57 |
| gpt-6-sol, tam metin, yeni istem | 62 / 36 | 0,96 | 0,06 | 0,34 |
| saklı, tam metin, eski istem | 62 / 36 | 1,00 | 0,02 | 0,98 |
| saklı, set-1 parçaları | 20 / 20 | 0,98 | 0,06 | 0,62 |
| saklı, tam metin, yeni istem | 62 / 36 | 1,00 | 0,02 | 0,68 |

ROC benzeri tablo, döngü hakemi (gpt-6-sol). Hücre: eşiği aşan / toplam.

| eşik | insan tam | insan parça | beceri tam (eski) | beceri parça | beceri tam (yeni istem) |
|---|---|---|---|---|---|
| 0,10 | 12/62 | 14/20 | 36/36 | 19/20 | 34/36 |
| 0,16 | 2/62 | 4/20 | 36/36 | 17/20 | – |
| 0,20 | 0/62 | 4/20 | 36/36 | 16/20 | 24/36 |
| **0,30** | **0/62** | **2/20** | **36/36** | **14/20** | **22/36** |
| 0,40 | 0/62 | 2/20 | 36/36 | 11/20 | 16/36 |
| 0,50 | 0/62 | 1/20 | 36/36 | 11/20 | 14/36 |
| 0,60 | 0/62 | 1/20 | 36/36 | 7/20 | 14/36 |
| 0,70 | 0/62 | 0/20 | 36/36 | 3/20 | 11/36 |
| 0,80 | 0/62 | 0/20 | 36/36 | 1/20 | 5/36 |
| 0,90 | 0/62 | 0/20 | 36/36 | 0/20 | 3/36 |

Saklı hakem (gpt-6-astra):

| eşik | insan tam | insan parça | beceri tam (eski) | beceri parça | beceri tam (yeni istem) |
|---|---|---|---|---|---|
| 0,07 | 0/62 | 2/20 | 36/36 | 20/20 | 35/36 |
| 0,10 | 0/62 | 2/20 | 36/36 | 18/20 | 35/36 |
| 0,20 | 0/62 | 0/20 | 36/36 | 14/20 | 29/36 |
| 0,50 | 0/62 | 0/20 | 36/36 | 14/20 | 26/36 |
| 0,80 | 0/62 | 0/20 | 36/36 | 1/20 | 12/36 |

**Eşik seçimi.** İnsan metinlerinin en fazla %10'unun "yapay" çıktığı en küçük eşik: havuzda (82
insan) 0,16, tam metinde 0,12, kısa parçada 0,28. Döngü hem blog uzunluğunda hem kısa bölümde
çalıştığı için iki grupta ayrı ayrı %10'u sağlayan büyük değer alındı ve yuvarlandı: **0,30**
(`ESIK`, `--esik` ile değişir). Saklı hakemde aynı kural 0,07 verir.

**Dikkat.** İnsan tarafı ≤ 2022 yayımlanmış metin; hakemler bu metinleri eğitimde görmüş olabilir.
Tam metinde insanın neredeyse hiç "yapay" çıkmaması kısmen tanımadan gelebilir. Kısa parçada
yanlış "yapay" oranı belirgin biçimde yüksek (parça bağlamsız ve kuru olabiliyor).

## 3. Döngü

1. Taslak `openai-taslak.mjs` ile (istem ve çıpa o dosyadan; bu betik dokunmaz).
2. Döngü hakemi metni okur. p ≤ eşik ise durur.
3. p > eşik ise yalnız işaretli cümleler, hakemin gerekçesi ve yönü biçim ipucu olarak verilerek
   aynı taslak modeline yeniden yazdırılır (olgu ve anlam korunur, dolgu yok, silme serbest).
   Metnin geri kalanı değişmez.
4. Olgu denetimi: yeni metin brifte ya da önceki metinde olmayan sayı/özel ad getirirse ya da
   önceki metnin sayı/adını düşürürse tur atılır (kayıtta `olgu-reddi`).
5. En fazla 3 yeniden yazma turu; sonra tr-scan ve söz dizimi kapısı.

Kayıt (`<out>.kayit.json`): her turda p, işaretli cümleler, işlem, değişen cümleler (eski/yeni),
olgu farkı; sonuç, kapı, token sayımı, istenirse saklı hakemin önce/sonra p'si.

## 4. Kör test 2

20 eşli çift, set-1 ile aynı kurgu (80-150 kelimelik insan parçası + aynı olgularla brif +
beceri). İnsan tarafı set-1'de kullanılmamış metinlerden, yalnız sayfada gösterilebilir lisanslı:

| Tür | Çift | Kaynak | Lisans |
|---|---|---|---|
| blog | 10 | Journo (journo.com.tr): 2 derlemden (jo05, jo06), 8 yeni çekilen yazı (2018-2021, 8 farklı yazar, çeviri değil, alıntı ağırlıklı değil) | CC BY-SA |
| kurumsal | 8 | ODTÜ 3, Hacettepe 3, Anadolu 1, Ankara 1 (tanıtım sayfaları) | kamu kurumu metni |
| duyuru | 2 | TÜBİTAK, TCMB | kamu kurumu metni |

Set-1'e göre duyuru 7 → 2, blog 11 → 10, kurumsal 2 → 8. Anadolu Üniversitesi'nin "Hakkında"
metni (ad01) seçilmedi: istem ajanı onu sistem istemine örnek cümle olarak almış.
Kamu kurumu metinlerinin çoğunda açık lisans yok ("Her hakkı saklıdır"); görevdeki "kamu kurumu
metni" kategorisine göre alındı. TCMB kaynak göstererek yayına açıkça izin veriyor.

Beceri tarafı: `hakem-dongusu.mjs`, gpt-5.6-sol, istem 4beee8889dfb851b, `--tur blog` ya da
`--tur site`, çıpa açık, eşik 0,30. 20 metnin hepsi uzunlukta ilk denemede tuttu (oran 0,88-0,96).
Döngü: 16 metin eşiğin altında doğdu; 4'ü yeniden yazıldı (od02 0,62 → 0,24; tb05 0,38 → 0,18;
ha06 0,38 → 0,28; hb04 0,61 → 0,62, tur sınırı). Olgu reddi yok. Söz dizimi bulgusu yok; tr-scan
iki metinde düştü (od02 78, hb04 58): yeniden yazma cümleleri böldü, eşit boylu kısa cümle geri geldi.

### Eşli hakem, iki sıra (40 deneme)

| Hakem | Set-1 (eski istem, döngüsüz) | Set-2 döngü öncesi | Set-2 döngü sonrası |
|---|---|---|---|
| gpt-4.1 | %57,5 (23/40) | %40,0 (16/40) | %42,5 (17/40); A seçimi 31/40 |
| gpt-6-sol | %97,5 (39/40) | %97,5 (39/40) | **%100 (40/40)** |
| saklı (gpt-6-astra, editör) | %100 (40/40) | %100 (40/40) | %100 (40/40) |

gpt-4.1 set-2'de sıra etkisine düştü ("A" seçimi 31/40), yorum taşımaz. gpt-6-sol'un gerekçeleri
set-1'dekinin aynısı: insan metni "yer yer pürüzlü, kendine özgü deyimler, alışılmadık benzetmeler";
beceri "daha akıcı, düzenli bir yeniden yazım".

### Tek metin hakemi, set-2 parçaları (insan 20, beceri 20)

| Hakem | AUC | insan > eşik | beceri > eşik | medyan p insan / beceri |
|---|---|---|---|---|
| döngü hakemi gpt-6-sol (eşik 0,30) | 0,69 | 1/20 | 4/20 | 0,09 / 0,12 |
| saklı gpt-6-astra (eşik 0,07) | **0,96** | 2/20 | 17/20 | 0,06 / 0,22 |

Beceri metinleri gpt-6-sol'un eşiğinin altında kalacak şekilde seçildi; bu yüzden birinci satır
iyimserdir (yeniden sorulunca 4'ü eşiği aştı: hakem kararı tekrar çalıştırmada değişiyor).
Saklı hakem ayırmayı sürdürüyor.

## 5. Maliyet (set-2, metin başına ortalama)

| Model | Rol | Çağrı | Girdi token | Çıktı token |
|---|---|---|---|---|
| gpt-5.6-sol | taslak + yeniden yazma | 1,35 | 3.897 | 2.704 |
| gpt-6-sol | döngü hakemi | 1,35 | 606 | 456 |
| gpt-6-astra | saklı hakem (yalnız ölçüm, `--sakli`) | 2 | 674 | 165 |

Çıktı token'ının çoğu akıl yürütme token'ı. Döngü, taslağa göre metin başına yaklaşık %15-20 ek
token getiriyor (hakem tek çağrı); eşik aşılırsa her tur bir hakem + bir yeniden yazma daha.
Kalibrasyon (141 metin × 2 hakem): gpt-6-sol 131 bin girdi / 47 bin çıktı, gpt-6-astra 116 bin / 6 bin.

## 6. Okuma ve öneri

- Tek metin hakemini hedef almak yetmiyor: eşli testteki gerekçe (pürüzsüzlük, özgül deyim ve
  benzetme yokluğu) cümle yerinde yeniden yazmayla kapanmıyor, yeniden yazma aksine düzgünlüğü
  artırabiliyor (hb04, od02).
- Döngü şimdilik **ucuz bir güvenlik ağı**: yeni istemde eşiği aşan metin az (set-2'de 4/20),
  aşanı düzeltiyor, olgu bozmuyor. Ama a2 ölçütüne katkısı ölçülemeyecek kadar küçük.
- a2 için sıradaki adımlar: (1) saklı hakemi ya da eşli hakemi döngü hakemi yapmadan önce yeni bir
  saklı hakem ayrılmalı (aşırı uyum); (2) brif malzemesi: insan parçalarını ayıran şey kişisel
  anlatım ve özgül deyim, brifte yoksa üretilemez; (3) farklı aileden hakem (Anthropic kredisi).
- Eşli tasarımın sınırı sürüyor: iki metin aynı olguları taşıdığı için hakem "hangisi yeniden
  yazım" sorusunu cevaplıyor.

## 7. Tur 3 sonrası durum (2026-09-26)

- SKILL.md'de hakem döngüsü artık **deneysel**, varsayılan yol taslak + Düzelt (bu belgedeki aşırı
  uyum bulgusu gerekçe).
- V1 (a2) eşli test yerine **bağımsız tekli hakemle** ölçülür: derlemle örtüşmeyen konularda,
  bağımsız brifle yazılmış 36 beceri metni + nitelikli derlemin 62 insan metni, saklı hakem tek
  metin puanı. İlk ölçüm AUC **1,00** (SONUC-NITELIKLI.md "Tur 3" §4). Eşli test yalnız ek bilgi.
- **Tur 4 tanıma kontrolü** (SONUC-NITELIKLI.md "Tur 4" §1): 2025+ yayımlanmış 30 nitelikli insan
  metni saklı hakemden medyan p 0,14 aldı (≤ 2022 havuzu 0,02). Eski havuz ayrımı şişiriyordu,
  ama yeni havuzla da AUC bağımsız 0,98-1,00, türetilmiş 0,87. a2'nin karar havuzu artık 2025+.
- Hakem döngüsü de son metinde özel ad denetimi yapar (`ad` kayıt alanı, `--katı` → çıkış kodu 4).

## Yeniden üretme

```bash
# lovefengis klasöründen (anahtar .env'de)
node <tw>/tests/kalibrasyon/kalibre-hakem.mjs                 # ölç (önbellekli) + tablo
node <tw>/tests/kalibrasyon/kor-test/kur-set-2.mjs --secim <a.json> --secim <b.json> --journo <klasör> --is <klasör> [--yeniden]
node <tw>/tests/kalibrasyon/kor-test/hakem-esli.mjs --set 2 gpt-4.1 gpt-6-sol sakli
node <tw>/tests/kalibrasyon/kor-test/hakem-esli.mjs --set 2 --once gpt-4.1 gpt-6-sol sakli
```
