# Nitelikli insan derlemi: beceri çıktısı editörden geçmiş Türkçeye ne kadar yakın?

Tarih: 2026-09-26. Betik: `tests/kalibrasyon/kalibre-nitelikli.mjs` (`brif` → `uret` → `olc`).
Ham metin, brif, üretim ve ölçüm dosyaları git dışında: `tests/kalibrasyon/derlem-nitelikli/`.

**Neden bu derlem.** Önceki kalibrasyonlar (SONUC.md, SONUC-SITE.md, SONUC-BECERI.md) insan
tarafında 2018 OSCAR metnini kullandı: yazım hatalı, tekrarlı KOBİ ve forum metni. Hakemler
cilalı beceri metnini bu insana tercih etti; yani "insan gibi" ölçütü düşük kaliteli referansa
göre ölçülüyordu. Bu derlem editörden geçmiş, yayımlanmış kurum ve dergi Türkçesidir.

## Kısa sonuç

- Beceri taslağı (Yaz kipi, gpt-5.6-sol, çıpasız) nitelikli insandan **ritimle ayrışıyor**:
  cümleler kısa ve birbirine benzer (cumleSapma AUC 0,05; cumleOrt 0,10), uzun cümle yok
  denecek kadar az (0,05), "ve" insanın üçte biri (1,39 / 3,89; AUC 0,16). Bunlar bugünkü
  kuralların doğrudan sonucu: "ve'yi azalt", kısa ve açık cümle.
- **tr-scan skoru ayırmıyor** (AUC 0,54). Tarayıcı varsayılan GPT'yi 2018 insanından ayırmak için
  ayarlandı; aşırı düzeltmeyi (kısa cümle, az "ve") iz saymıyor, hatta ödüllendiriyor.
- Nitelikli insan OSCAR insanından da farklı: ortalama cümle 19,5 kelime (OSCAR 14,5), 25+
  kelimelik cümle oranı %23 (OSCAR %4), "ve" 3,9 (OSCAR 3,0). OSCAR'a göre kurulan eşikler
  iyi Türkçeyi yanlış yere koyuyor.
- Uzunluk: taslaklar istenenin medyanda **%72**'sinde kaldı (26 metnin 24'ü %85'in altında).
- Olgu sadakati: brifte olmayan sayı 0 (tek aday "2016-2020"nin yıllara açılması).
- **Güncelleme (aynı gün, "İstem turu 2" ve "tr-scan kalibrasyonu" bölümleri):** yeni istemle
  ritim ölçümlerinin 5/8'i [0,35; 0,65] bandına girdi (önce 3/8), ama metinler hedefin %15'ine
  kısaldı; tr-scan nitelikli derleme göre yeniden kalibre edildi (sınama yarısında AUC 0,47 → 0,83).
- **Tur 3 (aynı gün, en alttaki bölüm):** ritim izleri bilgiye indi (sınama yanlış pozitifi %23 →
  %6,5; lovefengis site kapısı yeniden 26/26); dolgun brifle uzunluk bandı 1/36 → 32/36; bağımsız
  brifli tekli saklı hakem AUC 1,00 (hedef ≤ 0,70).

## Derlem (62 metin, hepsi ≤ 2022)

| Tür | Kaynak | Metin | Yayın | Lisans / dayanak |
|---|---|---|---|---|
| blog | Açık Bilim (acikbilim.com) | 7 | 2013–2014 | CC BY-NC-ND 4.0 |
| blog | Journo (journo.com.tr) | 6 | 2019–2020 | CC BY-SA |
| blog | Türkçe Vikipedi, seçkin maddeler (2022 Wayback) | 5 | 2022 | CC BY-SA 3.0 |
| blog | Heinrich Böll Stiftung Türkiye (tr.boell.org) | 4 | 2020 | CC BY-NC-ND 4.0 |
| duyuru | TÜBİTAK | 7 | 2020–2021 | kamu kurumu duyurusu |
| duyuru | Boğaziçi Üniversitesi Haberler | 5 | 2018–2019 | kamu üniversitesi |
| duyuru | TCMB basın duyuruları | 4 | 2021 | kamu; kullanım şartları kaynak gösterilerek yayına izin veriyor |
| duyuru | KOSGEB | 4 | 2020–2021 | kamu kurumu duyurusu |
| kurumsal | ODTÜ | 6 | 2017–2022 (Wayback) | kamu üniversitesi |
| kurumsal | Hacettepe Üniversitesi | 6 | 2021–2022 (Wayback) | kamu üniversitesi |
| kurumsal | Ankara Üniversitesi | 4 | 2021–2022 (Wayback) | kamu üniversitesi |
| kurumsal | TCMB | 2 | 2019 (Wayback) | kamu |
| kurumsal | Anadolu Üniversitesi | 2 | 2021–2022 (Wayback) | kamu üniversitesi |

Her kaynakta önce `robots.txt`, sonra kullanım koşulları okundu. Atlananlar: Kültür Portalı,
Kültür ve Turizm Bakanlığı (kopyalama yasağı), TÜBİTAK Bilim Genç (izinsiz kullanım yasağı),
Global Voices Türkçe (CC BY ama örneklenen yazıların hepsi çeviri), bianet, Yeşil Gazete, LKD
(lisans beyanı yok), Wikimedia Türkiye (2023 sonrası düzenlenmiş), JS ile yüklenen kurumsal
sayfalar. LLM riski: 59 metin ≤ 2022-11 (düşük); Hacettepe'nin 3 sayfası Aralık 2022 arşivi (orta).

**Kısıtlar.** Açık Bilim ve Böll (11 metin) CC BY-NC-ND: yalnız iç ölçüm, dağıtılmaz, ticari
eğitim verisine girmez; kör test setinde gösterilmedi. Journo metinlerinin bir kısmı alıntı
ağırlıklı; Vikipedi ansiklopedi üslubunda ve blog sayıldı. Kurumsal sayfaların tarihi arşiv
görüntüsünün tarihidir. Duyuru ve kurumsal taraf kamu kurumu dilidir: resmî ve kuru; lovefengis
müşterisinin site dili değildir. Ayrıntılı kaynak notları derlem dizinindeki `kaynaklar.md`'de.

## Beceri tarafı

36 metin için aynı konu, aynı olgu listesi (insan metninden çıkarıldı) ve aynı uzunlukla brif
kuruldu, `openai-taslak.mjs` (varsayılan gpt-5.6-sol, `--tur` yok = çıpasız) ile yazdırıldı.
İlk turda 26'sı üretildi (blog 12, duyuru 12, kurumsal 2): kurumsal 10 brif OpenAI hesabının
kredisi bittiği için (`credit_balance_exhausted`) yazılamadı. Aşağıdaki "Ölçüm" tablosu bu 26
metinle kuruldu; eksik 10 metin aynı gün tamamlandı ve 36 metinlik "önce" değeri "İstem turu 2"
bölümünde. Claude'un Düzelt geçişleri uygulanmadı; ölçülen, Yaz kipinin taslak adımıdır.

## Ölçüm

AUC = P(beceri > nitelikli insan); 0,50 ayırt edilemez. Eşli AUC yalnız aynı konulu insan
metinleriyle (tür karışımı farkını ayıklar). Hedef bandı [0,40; 0,60].

| ölçüm | nitelikli insan medyan (IQR) | OSCAR insan | beceri medyan (IQR) | AUC [%95 GA] | eşli AUC | durum |
|---|---|---|---|---|---|---|
| cumleCV | 0,50 (0,42–0,59) | 0,40 | 0,42 (0,36–0,46) | 0,30 [0,21–0,41] | 0,34 | ayrışıyor |
| cumleSapma | 9,04 (7,78–11,31) | 5,59 | 5,70 (4,83–6,48) | 0,05 [0,02–0,09] | 0,04 | ayrışıyor |
| cumleOrt | 19,47 (16,06–23,40) | 14,45 | 13,37 (12,80–14,57) | 0,10 [0,04–0,17] | 0,11 | ayrışıyor |
| uzunCumleOran (25+) | 0,23 (0,11–0,38) | 0,04 | 0,04 (0,00–0,06) | 0,05 [0,02–0,10] | 0,07 | ayrışıyor |
| ve100 | 3,89 (2,57–4,96) | 2,99 | 1,39 (0,86–2,69) | 0,16 [0,06–0,26] | 0,19 | ayrışıyor |
| veIz100 (sıralama dışı "ve") | 2,46 (1,59–3,03) | 2,29 | 0,63 (0,40–1,48) | 0,14 [0,05–0,24] | 0,16 | ayrışıyor |
| bir100 | 1,68 (0,78–2,20) | 2,03 | 1,62 (0,52–3,23) | 0,52 [0,37–0,67] | 0,49 | geçer |
| hafifFiil200 | 1,58 (0,65–2,84) | 0,89 | 1,95 (1,19–3,44) | 0,61 [0,49–0,74] | 0,75 | ayrışıyor (sınırda) |
| heceOrt | 2,97 (2,90–3,08) | 2,91 | 2,89 (2,79–2,95) | 0,31 [0,21–0,44] | 0,36 | ayrışıyor |
| gecis100 | 0,18 (0,00–0,38) | 0,00 | 0,00 (0,00–0,00) | 0,26 [0,19–0,34] | 0,20 | ayrışıyor |
| ulacCumle | 0,34 (0,24–0,50) | 0,33 | 0,33 (0,20–0,38) | 0,42 [0,29–0,54] | 0,49 | geçer |
| dirOran | 0,21 (0,00–0,86) | 0,27 | 0,06 (0,00–0,20) | 0,36 [0,26–0,47] | 0,41 | ayrışıyor |
| tr-scan skoru | 94 (91–100) | 92 | 95,5 (86–100) | 0,54 [0,41–0,67] | 0,53 | geçer (bilgi taşımıyor) |
| kelime (kontrol) | 458 | 254 | 334 | 0,32 | 0,25 | uzunluk %72 |

n: nitelikli insan 62, beceri 26, OSCAR insan 80 (`derlem-site/insan`).

Okuma: "geçer" diyen üç ölçümden ikisi (bir100, ulacCumle) önceki kalibrasyonda da ayırmayan
ölçümlerdi. Ayrışanların hepsi aynı yöne bakıyor: beceri kısa, eşit boylu, "ve"siz ve geçişsiz
cümle kuruyor. gecis100'de bile insan önde: editörlü metin "ayrıca, ancak" gibi bağlayıcıyı
kullanıyor, beceri hiç kullanmıyor. Bu, SONUC-BECERI.md §4 madde 10'daki "yeni parmak izi"nin
nitelikli referansta da doğrulanmasıdır ve güçlü LLM hakeminin (gpt-6-sol) kör testteki
gerekçeleriyle örtüşür (dolgu tekrarı, fazla düzgünlük, uzun cümle azlığı).

## Söz dizimi kuralları: nitelikli insan metninde bulgu oranı

Editörden geçmiş metinde çıkan her bulgu yanlış pozitif sayıldı (üst sınır; editör de hata
yapabilir). Oran = en az bir bulgu çıkan metin / metin sayısı. Parantezde cümle başına oran
(1.518 cümle).

| kural | önce (HEAD 395d4ee) | ara (18:14, kural ajanının çalışan kopyası) | OSCAR insan (ara) | beceri (ara) |
|---|---|---|---|---|
| liste-ve | **%31** (19/62; cümlede %2,2) | %10 (6/62; %0,5) | %5 | %0 |
| liste-iki (yeni) | – | %3 (2/62; %0,1) | %3 | %0 |
| ozne-virgul | **%34** (21/62; cümlede %2,7) | %13 (8/62; %0,5) | %5 | %23 |
| eksiltili-yuklem | %0 | %0 | %0 | %0 |
| tamlama-eki | %0 | %0 | %0 | %0 |

Türe göre (ara): liste-ve kurumsal %15, blog %14, duyuru %0; ozne-virgul kurumsal %10,
blog %18, duyuru %10. HEAD'de kalan bulguların tipi: özel ad + virgül ("Bakan Varank,",
"Sait Faik,", "ODTÜ,"), sayım ("basketbol, voleybol, hentbol …"), alıntı içi sayım, sıfat-fiil
zinciri. **Dikkat:** kural ayarı aynı derlemin cümleleriyle yapıldıysa ara değer örneklem içidir;
v1.0 ölçümü ayar sırasında görülmemiş ikinci bir nitelikli derlemde yapılmalı.

Beceri çıktısında ozne-virgul (%23, "Kurul,", "TCMB,", "Endeks,") insandakinden yüksek: kısa
cümlede özne + virgül, taslak modelin kendi alışkanlığı olabilir. Elle inceleme gerekiyor.

## İstem turu 2 (2026-09-26): önce / sonra

**Değişiklik** (`openai-taslak.mjs` sistem istemi, hash `23f878e8842e82b6` → `4beee8889dfb851b`):
"ve'yi azalt" ve "en az bir uzun cümle" yerine nitelikli ritim (ortalama 17-21 kelime, her
paragrafta en az bir 25+ kelimelik cümle ve örnek bir uzun cümle, "ve" 100 kelimede 3-5,
bağlayıcı serbest ama tekrarsız); dolgu yasağı (her olgu bir kez, özet ve olgusuz yorum
cümlesi yok, uydurma ayrıntı ve metin hakkında konuşma yok); esnek uzunluk (hedef üst sınır,
altında kalmak serbest); fazla düzgünlük (paragraflar aynı kalıpla açılmaz, soyut özetle
bitmez, olgu yargıdan önce gelir). Söz dizimi ve çıpa bölümleri aynı. Brifler aynı 36 brif.

İki ara istem pilotta (3-8 brif) elendi: "olgularla hedefe ulaş, bağlamıyla anlat" blogda
uydurma alıntı ve "burada … gerekir" türü metin hakkında yorum üretti; "olguyu tam anlat"
metni uzatmadı, olguları iki uzun cümleye sıkıştırdı. Ölçülen, pilotta elenmeyen üçüncü sürüm.

AUC = P(beceri > nitelikli insan), n: insan 62, beceri 36 / 36. Görev hedefi: 8 ölçümün en az
6'sında AUC ∈ [0,35; 0,65] (V1 ölçütü (b) bandı [0,40; 0,60]).

| ölçüm | nitelikli insan medyan | önce: beceri medyan | önce AUC | sonra: beceri medyan | sonra AUC [%95 GA] | sonra, ≥ 6 cümleli metinler (n 8) |
|---|---|---|---|---|---|---|
| cumleCV | 0,50 | 0,42 | 0,32 | 0,42 | **0,36** [0,24–0,48] | 0,23 |
| cumleSapma | 9,04 | 5,69 | 0,05 | 7,15 | 0,25 [0,15–0,36] | 0,14 |
| cumleOrt | 19,47 | 13,28 | 0,09 | 16,86 | **0,38** [0,28–0,50] | 0,37 |
| uzunCumleOran | 0,23 | 0,03 | 0,05 | 0,25 | **0,43** [0,30–0,56] | 0,30 |
| ve100 | 3,89 | 1,82 | 0,18 | 3,81 | **0,47** [0,36–0,60] | 0,14 |
| bir100 | 1,68 | 0,73 | **0,41** | 0,00 | 0,22 [0,12–0,34] | 0,70 |
| hafifFiil200 | 1,58 | 2,11 | **0,61** | 0,00 | **0,36** [0,23–0,49] | 0,36 |
| heceOrt | 2,97 | 2,92 | **0,40** | 2,81 | 0,31 [0,20–0,43] | 0,43 |
| [0,35; 0,65] içinde | | | **3/8** | | **5/8** | 2/8 |
| [0,40; 0,60] içinde | | | 2/8 | | 2/8 | 1/8 |
| kelime (kontrol) | 458 | 287,5 | 0,28 | **55** | 0,03 | |
| cümle sayısı medyanı | 21,5 | 22,5 | | **3** | | |
| uzunluk / hedef (medyan; %85-115 içinde) | | 0,71; 2/36 | | **0,15; 0/36** | | |
| tr-scan skoru (yeni kalibrasyonla) | 96 | 76 | | 100 | 0,74 | |
| brifte olmayan sayı | | 0 | | 0/36 | | |

**Okuma.**
- **Hedef tutmadı: 5/8** (gereken 6). Ritmin kendisi insan dağılımına yaklaştı: ortalama cümle
  13,3 → 16,9, uzun cümle oranı %3 → %25 (insan %23), "ve" 1,8 → 3,8 (insan 3,9). Dört ölçüm
  bandın dışından içine girdi.
- **Asıl yan etki uzunluk.** Metinler hedefin medyanda %15'inde (duyuru 52, kurumsal 46, blog
  150 kelime), medyan 3 cümle. Neden brif: bu 36 brifte 3-7 olgu var, hedef ise insan metninin
  uzunluğu (170-770 kelime). Eski istem aradaki farkı dolguyla kapatıyordu (güçlü hakemin
  "tekrarlı, gereksiz açıklama" gerekçesi); yeni istem dolguyu bıraktı, olguları iki üç
  uzun cümlede verip bitiriyor. Uydurma yok (brifte olmayan sayı 0/36).
- **Bandın içine girenlerin bir kısmı kısalıktan.** 2-3 cümlelik metinde sapma ve oranlar
  gürültülü. Yalnız ≥ 6 cümleli 8 metne (çoğu blog) bakınca "ve" (0,14), sapma (0,14) ve CV
  (0,23) hâlâ ayrışıyor; cümle ortalaması (0,37) ve hafif fiil (0,36) bantta. bir100 ve
  hafifFiil200'nün 0'a inmesi de kısa metinden: üç cümlede "bir" geçmemesi olağan.
- Söz dizimi: beceride `ozne-virgul` bulgusu olan metin %19'dan (7/36) %3'e (1/36) indi; uzun
  cümlede özne virgülü TDK 8.2/3 gereği serbest. `liste-ve` ve `liste-iki` 0'dan 1/36'ya çıktı.
- **Sonuç:** istem ritim yönünde doğru çalışıyor, ama bu brif setiyle "insan gibi" iddiası
  ölçülemez. Uzunluğu adil ölçmek için olgu listesi hedef uzunluğu taşıyan brif gerekir
  (kör test set-1'deki gibi paragraf başına olgu, ±%8 hedef). Kör test set-2 bunu ölçecek.
- **tr-scan kapısı kısa metni ölçmüyor**: 60 kelimenin altında ritim bulgusu çıkmaz ve skor 100
  olur. Yeni taslakların medyanı 55 kelime olduğu için yeni kalibrasyonun beceri üzerindeki
  etkisi bu sette görünmüyor (skor AUC beceri > insan 0,74).

## tr-scan kalibrasyonu (2026-09-26)

**Neden.** Eski eşikler 2018 OSCAR insanı ile varsayılan gpt-4o'yu ayırmak için kuruldu. Aşırı
düzeltmiş taslağı (kısa, eşit boylu cümle, "ve"siz) iz saymıyor, hatta ödüllendiriyordu:
nitelikli insan / eski beceri ayrımında skor AUC 0,47-0,49.

**Yöntem.** Nitelikli derlem tür içinde id sırasıyla dönüşümlü ikiye bölündü: **ayar** yarısı
(31 insan, 18 eski beceri) ve **sınama** yarısı (31 + 18). Beceri metni, karşılığı olan insan
metniyle aynı yarıda. Eşikler yalnız ayar yarısında seçildi (Youden J; ve100'de insan yanlış
pozitifi ≤ %10 şartıyla, çünkü Youden 4,2'de insanın %58'ini işaretliyordu). Ağırlıklar dört
aday arasından ayar yarısında seçildi: ölçüt, insanı ≤ 80'e düşüren sayıyı en az artırırken
beceriyi en çok yakalamak. Sınama yarısı seçimden sonra bir kez ölçüldü (`kalibre-nitelikli.mjs kapi`).

| kural | eşik | ağırlık | ayar yarısında J | not |
|---|---|---|---|---|
| `dar-sapma` (yeni) | cümle boyu sapması < 6,8 (≥ 6 cümle) | 12 | 0,88 | insan medyanı 9,0 |
| `kisa-cumle` (yeni) | ortalama cümle < 13,5 kelime (≥ 6 cümle) | 4 | (Youden 14,8; FP'yi düşürmek için 13,5) | sapmayla ilişkili, düşük ağırlık |
| `uzun-cumle-yok` | 25+ kelimelik cümle oranı < %8 (≥ 8 cümle); eskiden "hiç yok" | 6 | 0,85 | ad geriye uyum için korundu |
| `ve-seyrek` | 100 kelimede "ve" < 2,0 (≥ 150 kelime); eskiden < 1,2 ve ağırlık 0 | 4 | – | insan FP ≤ %10 şartı |
| `ve-yogunlugu` | sıralama dışı "ve" > 4,5; eskiden 2,7 | 6 | – | eski eşik nitelikli insanın ~%40'ını işaretliyordu |
| `duz-ritim` | değişmedi (CV < 0,37 / < 0,30) | 8 / 20 | | |

**Sınama yarısı sonuçları** (AUC = P(insan skoru > karşı taraf skoru)):

| karşılaştırma | eski tr-scan | yeni tr-scan |
|---|---|---|
| nitelikli insan / eski beceri, **sınama** AUC | 0,47 | **0,83** |
| sınama: nitelikli insan skor medyanı; ≤ 80 olan | 94; 2/31 | 97; **7/31 (%23)** |
| sınama: eski beceri skor medyanı; ≤ 80 olan | 94; 1/18 | 78; 13/18 |
| (ayar yarısı, bilgi için) AUC; insan ≤ 80; beceri ≤ 80 | 0,49; 3/31; 1/18 | 0,89; 4/31; 16/18 |

**Yanlış pozitif ve aşırı uyum.** Ayar yarısında nitelikli insanın 4/31'i 80'in altına düştü,
sınamada 7/31: ayar değeri iyimserdi, gerçek yanlış pozitif oranı yaklaşık %20. Sınamada düşen
7 insan metninin 4'ü kısa cümleli dergi yazısı (Journo 2, Açık Bilim 1, Böll 1) ve 1'i Vikipedi
(`dar-sapma`, `uzun-cumle-yok`); 2'si (ko01, od09) eski kurallarla (`duz-ritim`, `ve-yogunlugu`)
düşüyor, yeni kalibrasyon onları değiştirmedi. Skor hâlâ karar değil, bant.
Sınama yarısı küçük (31 + 18); aralık geniş.

**Geriye uyum (2018 derlemleri ve eski eşikler).**

| derlem | eski AUC | yeni AUC | insan skor medyanı (eski → yeni) | insan ≤ 80 (eski → yeni) |
|---|---|---|---|---|
| `derlem/` OSCAR insan / gpt-4o(-mini) | 0,93 | 0,90 | 94 → 84,5 | 8 → 46 / 100 |
| `derlem-site/` insan / gpt-4o | 0,84 | 0,82 | 92 → 78 | 17 → 51 / 80 |
| `derlem-beceri/` insan / Claude becerili | 0,45 | 0,60 | 93 → 79,5 | 6 → 15 / 30 |
| `derlem-fark/` insan / gpt-4o | 0,88 | 0,89 | 94 → 78,5 | 2 → 15 / 28 |

- Varsayılan GPT'yi ayırma gücü korunuyor (AUC en çok 0,03 düştü); becerili Claude metnini
  ayırma 0,45'ten 0,60'a çıktı.
- 2018 insan metinleri yeni referansa göre kısa cümlelidir (OSCAR ortalama cümle 14,5) ve artık
  sık sık 80'in altına düşer. SONUC.md ve SONUC-SITE.md'deki bantlar (≤ 65 güçlü iz, 66-80 gri
  bölge; duyarlılık 0,79 / özgüllük 0,78) eski eşiklere aittir, yeni tarayıcıda geçerli değildir.
- Ölçütler: `uzun-cumle-yok` bulgu adı aynı kaldı; skor kayıtlarını (`model-anahtar-1.json` gibi)
  eski tarayıcı üretti, yeniden taranmadan karşılaştırılmaz.

**Site kapısına etkisi** (lovefengis `scripts/tr-scan-site.mjs`, her dosya 100/0 ister; site
metnine ve istisna dosyasına dokunulmadı):

- Önce: 26/26 dosya 100/0. Sonra: **1/26** (yalnız 42 kelimelik `meta-copy.json`).
- Düşen 25 dosya: 18'i 78, 5'i 74 (`bucks-home`, `city-price-copy`, `lead-triyaj`, `ornek`,
  `services`), `sector-city` 84, `legal-commerce` 90. Bulgular: `uzun-cumle-yok` 24,
  `dar-sapma` 24, `kisa-cumle` 25, `ve-seyrek` 5 dosyada.
- Kapı skoru, dosyadaki bütün alanların (başlık ve düğme dahil) art arda okunmasıyla ölçülür.
  Yalnız noktayla biten gövde alanları sayılsa da 26 dosyanın 24'ü 100'ün altında kalıyor
  (ortalama cümle 5,6-14,1 kelime): düşüş etiket birleştirmesinden değil, site metninin kendi
  ritminden.
- lovefengis `npm test` ilk kapıda (`tr-scan-site`) çıkış 1 ile duruyor; birim testleri ayrıca
  koşunca 256/256 geçiyor.

## Yeniden üretme

```bash
node tests/kalibrasyon/kalibre-nitelikli.mjs brif            # tür başına 12 brif
node tests/kalibrasyon/kalibre-nitelikli.mjs uret --env <.env>
node tests/kalibrasyon/kalibre-nitelikli.mjs olc             # tablo: derlem-nitelikli/olcum.md
node tests/kalibrasyon/kalibre-nitelikli.mjs kapi            # tr-scan skoru, ayar/sınama yarısı: kapi.md
```

Önce/sonra dosyaları git dışında: `derlem-nitelikli/beceri-once/` (eski istem, 36),
`beceri/` (yeni istem, 36), `olcum-once.{md,json}`, `olcum-sonra.{md,json}`.

## Tur 3 (2026-09-26): site kapısı, uzunluk, bağımsız tekli hakem

### 1. tr-scan: ritim izleri bilgiye indi, site kapısı geri geldi

Tur 2'nin izleri (`dar-sapma`, `kisa-cumle`, `uzun-cumle-yok`'un %8 oran eşiği, `ve-seyrek`,
`ve-yogunlugu` 2,7 → 4,5) önce ağırlık 0'a çekildi: `RITIM_BILGI` kümesindeki izler raporda
"bilgi" bölümünde, JSON'da ayrı `bilgi` alanında durur; skoru, çıkış kodunu ve `bulgular`/
`butunBulgular` listesini etkilemez. `uzun-cumle-yok` yalnız 0.1.0 anlamıyla (hiç 25+ kelimelik
cümle yok, ≥ 8 cümle) puanlı kaldı.

Eşik araması yalnız ayar yarısında yapıldı (31 insan, 18 eski beceri; kurallar × eşik × ağırlık,
açgözlü ekleme). Seçim ölçütü: ayar AUC'si en yüksek; ayarda insan ≤ 80 en çok 3/31; her kural
ayarda en çok 1 insan metnini işaretler; lovefengis site kapısında yeni bulgu yok; 2018 OSCAR/gpt-4o
ayrımında AUC en çok 0,03 düşer (tur 2'nin geriye uyum ölçütü). Sınama yarısı seçimden sonra ölçüldü.

| aday (ayar yarısında seçildi) | ayar AUC / insan ≤80 | sınama AUC / insan ≤80 | lovefengis <100 |
|---|---|---|---|
| hiçbiri (taban) | 0,57 / 3 | 0,51 / 2 | 0/26 |
| site şartı olmadan açgözlü: dar-sapma < 6,5 (12) + uzun oran < %10 (12) + kısa < 12 (6) | 0,90 / 3 | 0,81 / **7** | 25/26 |
| aynı, kural başına ≤ 1 insan şartıyla: dar < 6,5 (20) + kısa < 12 (16) + ve < 1 (20) | 0,86 / 3 | 0,82 / **6** | 25/26 |
| dar-sapma < 5,5 (20): ayarda ve sınamada 0 insan işaretliyor | 0,68 / 3 | 0,60 / 2 | **19/26** |
| **seçilen: ve-seyrek < 1,0 (≥ 150 kelime), ağırlık 8** | 0,60 / 3 | **0,65 / 2** | **0/26** |
| ve-seyrek < 1,0, ağırlık 20 (ayar AUC'sinde en iyisi) | 0,61 / 3 | 0,69 / 2 | 0/26; OSCAR AUC 0,93 → 0,87 |

- **Sınama yarısında yanlış pozitif 2/31 (%6,5)**; tur 2'de 7/31 (%23). Hedef ≤ %10 tuttu.
- `dar-sapma`, `kisa-cumle`, `uzun-cumle-yok` oran eşiği ve `ve-yogunlugu` **bilgi olarak kaldı.**
  Gerekçe: (1) beceriyi yakalayan her eşik ayar yarısında ≤ 1 insanı işaretlerken sınamada 4-6
  insanı işaretliyor (`dar-sapma` < 6,5: ayar 1, sınama 4); ayar değeri genellenmiyor, 31 metinlik
  yarı bu ince ayarı taşımıyor. (2) Sınamada temiz kalan tek eşik (`dar-sapma` < 5,5) lovefengis
  site metninin 19/26 dosyasını düşürüyor: site metni kısa, eşit boylu cümleyle yazılmış ve bu kural
  tam onu ölçüyor. Kuralı açmak site metnine dokunmayı gerektirir; bu tur kapsam dışı.
- `ve-yogunlugu` puansız kaldı: 4,5 eşiğinde sınamada 4 insanı işaretliyor, beceriyi hiç
  yakalamıyor; varsayılan GPT ayrımı puansız hâlde daha iyi (OSCAR/gpt-4o AUC 0,90 → 0,93).
- `kalibre-nitelikli.mjs kapi` sonucu: sınama nitelikli / eski beceri AUC 0,65 (tur 2: 0,83;
  tur 1: 0,47); 2018 OSCAR/gpt-4o 0,91; OSCAR site/gpt-4o 0,84; derlem-fark 0,88.
- lovefengis: `node scripts/tr-scan-site.mjs` **26/26 dosya 100/0**; `npm test` 256/256.
  Site metnine ve istisna dosyasına dokunulmadı.
- **Dikkat:** tr-scan tur 3 taslaklarını ayırmıyor (sınama AUC 0,54, beceri medyanı 97; bağımsız
  set medyanı 100). Kapı varsayılan GPT'yi yakalar; iyi istemle yazılmış taslak için bilgi taşımıyor.

### 2. Uzunluk: brif yeniden kuruldu, istem olguyu açtırıyor

**Brif.** Tur 1-2 brifinde 3-7 olgu 170-770 kelimelik hedefle eşleşiyordu (~100 kelimeye bir
olgu). `kalibre-nitelikli.mjs olgu --surum t3` olgu listesini aynı insan metinlerinden yeniden
çıkardı (gpt-5.5, taslak modelinden ayrı; ~30 kelimeye bir madde, görüşler "Yazara göre"): 36
brifte 7-67 madde, olgu maddelerinin toplam kelimesi hedefin %63-107'si. Uzunluk artık aralık
(insan uzunluğunun %90-105'i, örn. "Uzunluk: 540-630 kelime").

**İstem** (hash `4beee8889dfb851b` → `0a1c94dc7545a80d`): uzunluk hedef aralıktır; metin olguyu
açarak uzar (okur için ne demek, nasıl işliyor, hangi adımda ne oluyor, önceki olguyla bağı);
olgunun söylemediği sonuç, sayı, ad, örnek ya da iddia eklenmez; olgular açıldıktan sonra da
yetmiyorsa metin kısa kalır. Ritim, söz dizimi ve dolgu kuralları aynı. `openai-taslak.mjs` metin
hedef aralığın alt ucunun %70'inin altında kalırsa stderr'e `UYARI: brifte olgu az: …` basar.

**Sonuç, türetilmiş set** (36 brif, hepsi ≤ 35 kelimeye bir madde, yani "yeterli olgulu"):
uzunluk / insan uzunluğu medyanı **0,81**; **32/36 (%89) %70-110 bandında** (hedef ≥ %70).
Uyarı çıkan metin 0. Medyan 355 kelime, 18 cümle (tur 2: 55 kelime, 3 cümle).

**Bağımsız set (§4) başka bir şey gösterdi:** olgu maddeleri kısa ve atomik olunca ("Hizmet
İzmir'de sunulur.") kurum, hizmet ve duyuru taslakları olgu kelimesinin yalnız ~1-1,3 katına
çıkıyor; blog taslakları ~2,5 katına. Bağımsız 36 metnin 15'i bantta, medyan 0,53; 19 metinde
"brifte olgu az" uyarısı çıktı (hepsi kurumsal ya da duyuru, 54-95 kelime). Uzunluğu brifteki
bilgi miktarı belirliyor; istem kurum dilinde olguyu açmıyor, dolgu yasağı ise çalışıyor.
Türetilmiş setteki %89'un kaynağı büyük ölçüde dolgun brif (taslak / olgu kelimesi 0,81-1,18).

### 3. Ritim ve olgu sadakati (tur 1 → 2 → 3)

AUC = P(beceri > nitelikli insan), n: insan 62, beceri 36. Bant [0,35; 0,65] (V1 (b) bandı [0,40; 0,60]).

| ölçüm | insan medyanı | tur 1 | tur 2 | tur 3 [%95 GA] | tur 3 beceri medyanı |
|---|---|---|---|---|---|
| cumleCV | 0,50 | 0,32 | 0,36 | 0,27 [0,18–0,38] | 0,41 |
| cumleSapma | 9,04 | 0,05 | 0,25 | 0,24 [0,15–0,34] | 7,22 |
| cumleOrt | 19,47 | 0,09 | 0,38 | **0,42** [0,30–0,53] | 18,20 |
| uzunCumleOran | 0,23 | 0,05 | 0,43 | **0,37** [0,26–0,48] | 0,16 |
| ve100 | 3,89 | 0,18 | 0,47 | **0,64** [0,52–0,75] | 4,65 |
| bir100 | 1,68 | 0,41 | 0,22 | 0,28 [0,18–0,38] | 0,65 |
| hafifFiil200 | 1,58 | 0,61 | 0,36 | **0,37** [0,26–0,49] | 0,93 |
| heceOrt | 2,97 | 0,40 | 0,31 | **0,48** [0,37–0,61] | 2,98 |
| [0,35; 0,65] içinde | | 3/8 | 5/8 | **5/8** | |
| [0,40; 0,60] içinde | | 2/8 | 2/8 | 2/8 | |
| medyan kelime / cümle | 458 / 21,5 | 288 / 22,5 | 55 / 3 | 355 / 18 | |

- **Hedef (≥ 6/8) tutmadı.** Sayı tur 2 ile aynı, ama tur 2'nin 5/8'i 3 cümlelik metinlerden
  geliyordu (≥ 6 cümleli alt kümede 2/8). Tur 3 metinleri tam boy; cümle ortalaması, uzun cümle
  oranı, hece ve hafif fiil insan bandında.
- Kalan iz: cümle boyu **çeşitliliği** (CV 0,41 / insan 0,50; sapma 7,2 / 9,0) ve "bir" azlığı
  (0,65 / 1,68). "ve" bu kez biraz fazla (4,65 / 3,89; istem 3-5 diyor).
- Söz dizimi: beceride `ozne-virgul` 5/36 metin (%14), diğer kurallar 0.
- **Olgu sadakati:** brifte olmayan rakamlı sayı üç turda da 0/36, bağımsız sette de 0/36.
  Özel ad denetimi (`olguDenetle`) bağımsız sette bir yazım hatası buldu: "Kanuni Sultan
  **Süyman**" (bl02; brifte "Süleyman"). Diğer adaylar yazıyla sayı ("iki", "üç") ya da cümle içi
  büyük harf (yanlış alarm).

### 4. Bağımsız tekli hakem (V1 (a2), yeni tanım)

Betik: `tests/kalibrasyon/kalibre-tekli.mjs` (dosyalar git dışı, `derlem-tekli/`). Derlemle
örtüşmeyen 36 konu: blog 12 (Rize çayı, Mimar Sinan, Türk kahvesi, Göbeklitepe, Core Web Vitals,
KVKK m.10 …), kurumsal 12 (6'sı lovefengis tarzı hizmet sayfası, karar defterindeki gerçek fiyat ve
koşullarla; 6'sı kurgusal kurum), duyuru 12 (kurgusal kurum haberleri). Olgu listesini gpt-5.5
yazdı; taslak tur 3 istemiyle, gpt-5.6-sol, çıpasız. Saklı hakem gpt-6-astra (editör istemi,
döngüde hiç kullanılmadı) her metne tek başına puan verdi; insan havuzu nitelikli derlemin 62 tam
metni (puanlar `derlem-nitelikli/hakem.json`).

| beceri havuzu | n | AUC [%95 GA] | medyan p(yapay) beceri / insan |
|---|---|---|---|
| **bağımsız (tur 3)** | 36 | **1,00** [1,00–1,00] | 0,97 / 0,02 |
| — blog / kurumsal / duyuru | 12 / 12 / 12 | 1,00 / 1,00 / 1,00 | |
| türetilmiş tur 3 (bilgi) | 36 | 1,00 | 0,77 / 0,02 |
| tur 1 / tur 2 (türetilmiş, SONUC-HAKEM.md) | 36 / 36 | 1,00 / 1,00 | 0,98 / 0,68 |

**Hedef ≤ 0,70 tutmadı; hakem iki havuzu tam ayırıyor.** Bağımsız brif eşli tasarımın "yeniden
yazım" şüphesini kaldırdı ama sonucu değiştirmedi: ayrım içerikten değil metnin kendisinden
geliyor. Sınırlar: (1) insan metinleri ≤ 2022 yayımlanmış; hakem onları eğitimde görmüş olabilir
(insan medyanı 0,02 çok düşük). Tanımadan gelen payı ayırmak için 2025 sonrası yayımlanmış insan
metinleriyle kontrol seti gerekir. (2) Kurgusal kurum metinleri içerikten yakalanmış olabilir; ama
gerçek konulu blog alt kümesi de 1,00. (3) Bağımsız kurum ve duyuru taslakları kısa kaldı (§2).

### 5. Plato değerlendirmesi

| ana ölçüm | tur 1 | tur 2 | tur 3 | tur 3'te anlamlı iyileşme |
|---|---|---|---|---|
| ritim, [0,35; 0,65] bandında | 3/8 | 5/8 (≥ 6 cümlede 2/8) | 5/8 | sayıca yok; tam boy metinde 2/8 → 5/8 |
| uzunluk: medyan oran; %70-110 bandında | 0,72; 22/36 | 0,15; 1/36 | **0,81; 32/36** | **var** (brif kaynaklı; bağımsız sette 15/36) |
| tekli saklı hakem AUC | 1,00 (türetilmiş) | 1,00 (türetilmiş) | **1,00 (bağımsız)** | yok |
| nitelikli insan yanlış pozitifi (tr-scan, sınama ≤ 80) | 2/31 | 7/31 | **2/31** | **var** (tur 2'nin gerilemesi geri alındı) |
| olgu sadakati (brifte olmayan sayı) | 0 | 0 | 0 | tavanda |

**Karar: durulmaz, ama istem ayarı platoda.** Tur 3 iki ana ölçümde (uzunluk, yanlış pozitif)
anlamlı iyileşti; durma ölçütü (iki ardışık turda hiçbir ana ölçümde anlamlı iyileşme yok)
tetiklenmedi. Ancak v1.0'ın asıl ölçütü (a2) üç turdur 1,00'da: istem cümlesi ve hakem döngüsü
hakemin gördüğü dağılımı değiştirmiyor. Tur 4 yine istem kaldıracıyla yapılırsa a2'de durma
ölçütü büyük olasılıkla tetiklenir. Tur 4 kaldıraçları ve maliyetleri `docs/V1-OLCUTLER.md`'de.

### Yeniden üretme (tur 3)

```bash
# lovefengis klasöründen
TW=C:/Users/pc/Documents/turkish-writer
node $TW/tests/kalibrasyon/kalibre-nitelikli.mjs olgu --surum t3 --env .env
node $TW/tests/kalibrasyon/kalibre-nitelikli.mjs brif --surum t3
node $TW/tests/kalibrasyon/kalibre-nitelikli.mjs uret --surum t3 --env .env
node $TW/tests/kalibrasyon/kalibre-nitelikli.mjs olc --surum t3      # olcum-t3.{md,json}
node $TW/tests/kalibrasyon/kalibre-nitelikli.mjs kapi
node $TW/tests/kalibrasyon/kalibre-tekli.mjs olgu
node $TW/tests/kalibrasyon/kalibre-tekli.mjs brif
node $TW/tests/kalibrasyon/kalibre-tekli.mjs uret
node $TW/tests/kalibrasyon/kalibre-tekli.mjs hakem                    # derlem-tekli/sonuc.json
```

## Tur 4 (2026-09-26): tanıma kontrolü, olgu açılımı, özel ad sadakati

Kurucu kararı: model eğitimi (ince ayar) yok; iyileştirme yalnız beceri katmanında (istem, brif
şablonu, çıpa, kural, ölçüm).

### 1. Tanıma kontrolü: 2025+ yayımlanmış insan metinleri

**Derlem** (`derlem-yeni-insan/`, git dışı, kaynak notları `kaynaklar.md`): 30 metin, yayın
2025-02 → 2026-07. Blog 12 (Journo CC BY-SA 4; Böll 4, 3'ü CC BY-NC-ND, 1'i CC BY; TCMB
"Merkezin Güncesi" imzalı ekonomist yazıları 4), duyuru 12 (TÜBİTAK, Boğaziçi, Gazete
Hacettepe, 4'er), kurumsal 6 (5 kamu kurumu ya da üniversite, 1 Wikimedia Commons). Her kaynakta
robots.txt ve kullanım koşulları okundu; kopyalama yasağı olan (İZKA, cop31.tr), lisansı belirsiz
(bianet, T24 …), çeviri ağırlıklı ya da belirgin YZ kalıplı sayfalar atıldı. LLM riski: 15 düşük,
15 orta; yüksek riskli metin alınmadı. Kurumsal hedefi (12) tutmadı: 2025+ kurumsal sayfaların
çoğu eski metnin taşınmış hâli, yönetmelik kopyası ya da liste.

**Saklı hakem** (gpt-6-astra, tur 3 ile aynı istem; `kalibre-tekli.mjs hakem --surum <s>`):

| havuz | n | medyan p(yapay) | p > 0,5 |
|---|---|---|---|
| eski insan (nitelikli derlem, ≤ 2022) | 62 | 0,02 | |
| **yeni insan (2025+)** | 30 | **0,14** | 10/30 |
| yeni insan: blog / kurumsal / duyuru | 12 / 6 / 12 | 0,05 / 0,135 / **0,65** | |
| AUC (yeni insan > eski insan) | | **0,94** | |

| beceri havuzu | n | medyan p | AUC, eski insanla | AUC, yeni insanla [%95 GA] |
|---|---|---|---|---|
| bağımsız, tur 3 | 36 | 0,965 | 1,00 | **0,98** [0,95–1,00] (blog 1,00, kurumsal 0,94, duyuru 0,99) |
| bağımsız, tur 4 (son istem + tekrarsız açılım, t4d) | 36 | 0,98 | 1,00 | **1,00** |
| türetilmiş, tur 3 | 36 | 0,765 | 1,00 | **0,87** [0,78–0,96] |
| türetilmiş, tur 4 (son istem, t4a) | 36 | 0,78 | 1,00 | **0,87** [0,77–0,96] |

**Yorum: iki senaryo da kısmen doğru.**
- *Tanıma ya da yaş etkisi var.* 2025+ insan metinleri eski insan metinlerinden belirgin yüksek p
  alıyor (medyan 0,02 → 0,14, AUC 0,94). Eski havuzun 0,02'lik medyanı kısmen hakemin o metinleri
  (ya da o dönemin dilini) tanımasından geliyor; eski havuzla ölçülen 1,00 ayrımı büyütüyordu.
- *Hakem yine de gerçekten ayırıyor.* Yeni insanla da bağımsız beceri metinleri 0,98-1,00,
  türetilmiş metinler 0,87. Tanıma payı çıkınca da ≤ 0,70 hedefinin çok üstünde.
- *Ayrılamayan belirsizlik:* 2025 kurum duyurularının p'si yüksek (medyan 0,65; "düşük riskli"
  işaretlenen Boğaziçi duyuruları 0,65-0,77). Bu ya kurum metinlerinde yapay zekâ desteğinin
  yayılması ya da hakemin kurum dilini yapay saymasıdır; bu derlemle ayrılamaz. Blogda yeni insan
  hâlâ düşük (0,05): blogdaki ayrım tanımadan bağımsız.
- **(a2) yeniden kalibrasyonu:** yalnız ≤ 2022 insan havuzu ayrımı şişirir. Bundan sonra a2 iki
  havuzla birlikte raporlanır; karar havuzu 2025+ insan metnidir, eski havuz ek bilgi. Hedef
  (≤ 0,70) değişmez. Yeni havuz küçük (30; kurumsal 6) ve bir kısmı YZ destekli olabilir; her
  turda yenilenmeli.

### 2. Kurum ve duyuru metninde olguyu açma

**Brif şablonu.** Her olgunun altına girintili alt maddeler: "Okur için anlamı", "Nasıl işler",
"Ne yapması gerekir". Bunları brifi kuran taraf yazar (ölçümde betik, gpt-5.5; `kalibre-tekli.mjs
acilim`). Olgu listesinde olmayan rakam ya da özel ad taşıyan açılım atılır (`acilimSuz`; 2 açılım
atıldı). **İstem** (hash `0a1c94dc7545a80d` → `e09e6d4d16538e61`): alt maddeler varsa kurum,
hizmet ve duyuru metninde olguyu bunlarla aç; etiketi yazma; alt maddede olmayan açılım ekleme.

İki açılım sürümü denendi (bağımsız set, 12 kurumsal + 12 duyuru; blog brifi değişmedi):

| sürüm | açılım | kurum+duyuru %70-110 bandında | tüm set bantta; medyan oran | brifte olmayan rakam / özel ad |
|---|---|---|---|---|
| tur 3 (açılımsız) | – | 4/24 (%17) | 15/36; 0,53 | 0 / 1 ("Süyman") |
| t4a: ham açılım | 682 (olgu başına ~2,7) | **21/24 (%88)** | 29/36; 0,76 | 0 / 0 |
| t4d: tekrarsız açılım (son) | 386 | 14/24 (%58) | 22/36; 0,74 | 0 / 0 |

- **Hedef (≥ %70) yalnız ham açılımla tuttu, ama o metin dolgulu.** Ham açılımların yaklaşık
  üçte biri olguyu başka sözle tekrar ediyordu ("Keşif ücreti peşin tahsil edilir" → "Tahsilat
  peşin yapılır") ve taslak bunu metne taşıdı: "Hafta içi 09.00-20.00 saatleri arasında hizmet
  veririz; hizmete 09.00'da başlayıp hizmeti 20.00'de bitirdiğimiz için siz de ziyaretinizi bu
  aralığa göre planlayabilir…" Bu, istemin "her olgu bir kez" kuralını çiğneyen dolgudur.
- **Tekrarsız açılım** (açılım isteminde "olguyu başka sözle yeniden söyleme" kuralı + süzgeç:
  açılımın 4+ harfli kelimelerinin %60'ı olguda geçiyorsa atılır) dolguyu kesti; kurum+duyuru
  4/24 → 14/24, medyan oran duyuruda 0,31 → 0,68, kurumsalda 0,31 → 0,80. Kalan fark brifteki bilgi
  eksiği; istem onu dolgu olmadan kapatamaz.
- Aynı brifle ritim ayarlı istem B (§4) kurum+duyuruda 17/24 verdi; istem geri alındığı için
  sayılmadı. Tek üretimde tür başına 12 metin; ±2-3 metinlik oynama olağan.
- Saklı hakem iki açılım sürümünde de aynı (bağımsız medyan p 0,98).
- **Karar:** şablon tekrarsız açılımla kalır (SKILL.md). Bağımsız sette kurum/duyuru için
  "≥ %70" **tutmadı**; uzunluk brif malzemesine bağlı kalır.

### 3. Özel ad sadakati

`adDenetle(brif, metin)` (`openai-taslak.mjs`): çıktıdaki büyük harfli kelimeler (cümle
ortasında ya da kesmeli; cümle başındaysa yalnız bozuk yazım için) brifle karşılaştırılır.
**bozuk**: brifte yok ama brifteki bir ada çok benziyor (ikisi de ≥ 5 harf, ilk harf aynı,
düzeltme mesafesi ≤ uzunluğun dörtte biri); **yeni**: brifte hiç yok. Ek değişimi
(Fakültesi/Fakültenin, Üniversitesinde/Üniversitemizde), I/ı (COVID/Covid) ve kesmesiz kurum adı
eki bilinen sayılır. `openai-taslak.mjs` ve `hakem-dongusu.mjs` stderr'e `UYARI` yazar; `--katı`
ile çıkış kodu 4.

| set | metin | bozuk | yeni | not |
|---|---|---|---|---|
| bağımsız tur 3 | 36 | 1 ("Süyman" ≠ "Süleyman") | 0 | ilk sürümün 1 yanlış alarmı susturuldu |
| türetilmiş tur 3 | 36 | 0 | 1 ("DNA", brifte yok) | ilk sürümün 4 yanlış alarmı (ek değişimi, "Bana"/"Banu", "Araç"/"Aras") susturuldu |
| tur 4 (bağımsız t4a, t4d; türetilmiş t4a) | 108 | 0 | 1 ("DNA") | |
| nitelikli insan (bilgi) | 36 | insan metnindeki gerçek yazım hataları ("Yuıurtanın", "Ünviersitesi") | çok | insan metni brifte olmayan ad taşır; ölçüt değil |

Testler: `cipa.test.mjs` (9 birim + 2 uçtan uca: sahte fetch ile gerçek süreç, çıkış kodu 4),
`hakem-dongusu.test.mjs` (bayrak + uçtan uca, kayıtta `ad` alanı).

### 4. Ritim: cümle boyu çeşitliliği ve "bir" (istem B, geri alındı)

Denenen: "cümle boyları geniş aralığa yayılsın (30+ ve 4-8 kelimelik cümleler)", "ve" 3-5 → 3-4,
belgisiz "bir" 100 kelimede 1-2. Türetilmiş set (t3 brifleri); A = son istem, B = A + ritim ayarı.
AUC, parantezde beceri medyanı:

| ölçüm | insan | tur 3 | A (t4a) | B (t4b) |
|---|---|---|---|---|
| cumleCV | 0,50 | 0,27 | 0,24 | 0,27 |
| cumleSapma | 9,04 | 0,24 | 0,22 | 0,22 |
| cumleOrt | 19,47 | 0,42 | 0,44 | 0,44 |
| uzunCumleOran | 0,23 | 0,37 | 0,38 | 0,41 |
| ve100 | 3,89 | 0,64 (4,65) | 0,62 (4,32) | 0,63 (4,72) |
| bir100 | 1,68 | 0,28 (0,65) | 0,28 (0,67) | 0,30 (0,77) |
| hafifFiil200 | 1,58 | 0,37 | 0,41 | 0,36 |
| heceOrt | 2,97 | 0,48 | 0,50 | 0,49 |
| [0,35; 0,65] / [0,40; 0,60] | | 5/8 / 2/8 | 5/8 / 3/8 | 5/8 / 3/8 |
| ozne-virgul bulgulu metin | | 5/36 | 2/36 | 4/36 |
| uzunluk bandı (gerçek insan uzunluğuna göre) | | 32/36 | 33/36 | 31/36 |

B hiçbir ölçümü gürültünün ötesinde oynatmadı, "ve" hedeften uzaklaştı, `ozne-virgul` arttı →
**geri alındı**. A (açılım talimatı) türetilmiş sette ritmi ve uzunluğu bozmadı.

### 5. Tur karşılaştırması (1 → 4)

| ölçüt | tur 1 | tur 2 | tur 3 | tur 4 |
|---|---|---|---|---|
| ritim, [0,35; 0,65] (V1 b bandı [0,40; 0,60]) | 3/8 (2/8) | 5/8 (2/8; ≥ 6 cümlede 2/8) | 5/8 (2/8) | 5/8 (3/8) |
| uzunluk, türetilmiş set: bantta; medyan | 22/36; 0,72 | 1/36; 0,15 | 32/36; 0,81 | 33/36; 0,81 |
| uzunluk, bağımsız set: bantta (kurum+duyuru) | – | – | 15/36 (4/24) | 22/36 (14/24); ham açılımla 29/36 (21/24, dolgulu) |
| tekli saklı hakem AUC, eski insan (≤ 2022) | 1,00 (türetilmiş) | 1,00 (türetilmiş) | 1,00 bağımsız / 1,00 türetilmiş | 1,00 / 1,00 |
| tekli saklı hakem AUC, yeni insan (2025+) | ölçülmedi | ölçülmedi | **0,98** bağımsız / **0,87** türetilmiş | **1,00** / **0,87** |
| yanlış pozitif (tr-scan sınama, nitelikli insan ≤ 80) | 2/31 | 7/31 | 2/31 | 2/31 (tr-scan değişmedi) |
| brifte olmayan rakam | 0 | 0 | 0 | 0 |
| özel ad hatası (bozuk) | denetim yok | denetim yok | 1/36 (sonradan bulundu) | 0/108; artık otomatik UYARI |
| lovefengis site kapısı | 26/26 | 1/26 | 26/26 | 26/26 (`npm test` 269/269) |

**Plato.** a2 dört turdur ayrımı kıramadı; tanıma payı çıkınca da 0,87-1,00. Tur 4 bağımsız
setin kurum/duyuru uzunluğunda ve ad denetiminde ilerledi, ritimde yerinde saydı. İstem cümlesi
hakemin gördüğü dağılımı değiştirmiyor; sonraki kaldıraçlar yalnız beceri katmanında
(`docs/V1-OLCUTLER.md`).

### Yeniden üretme (tur 4)

```bash
# lovefengis klasöründen; TW=C:/Users/pc/Documents/turkish-writer
node $TW/tests/kalibrasyon/kalibre-tekli.mjs acilim --surum t4c      # tekrarsız açılım (t4: ham)
node $TW/tests/kalibrasyon/kalibre-tekli.mjs brif --surum t4c
node $TW/tests/kalibrasyon/kalibre-tekli.mjs uret --surum t4d --brif-surum t4c
node $TW/tests/kalibrasyon/kalibre-nitelikli.mjs uret --surum t4a --brif-surum t3 --env .env
node $TW/tests/kalibrasyon/kalibre-nitelikli.mjs olc --surum t4a
node $TW/tests/kalibrasyon/kalibre-tekli.mjs hakem --surum t4d        # derlem-tekli/sonuc-t4d.json
```
t4d'nin blog metinleri t4a'nınkidir (aynı istem, aynı brif). Ölçümde üretim 6 paralel süreçle
(`openai-taslak.mjs` doğrudan) yapıldı; betiklerin `uret` adımı aynı çıktıyı yazar.
