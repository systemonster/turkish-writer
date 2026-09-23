# Eş dizim denetimi: "Türk böyle söyler mi?"

Tarih: 2026-09-23. Betikler: `skills/turkish-writer/scripts/esdizim-derle.mjs` (derlem → `data/esdizim.json`), `skills/turkish-writer/scripts/esdizim.mjs` (`esdizimDenetle`), sınama `tests/kalibrasyon/esdizim-sina.mjs` (ham çıktı `derlem-site/esdizim-ham.md`, eşik taraması dahil). `tr-scan.mjs` değiştirilmedi.

## Kısa sonuç

- **Derlem:** OSCAR 2019 (Common Crawl, Kasım 2018), **141,9 milyon kelime**, 534.599 belge (kopyalar atılmış). Veri dosyası **5,3 MB**.
- **Çeviri kalıpları:** 18 bilinen hatadan **15'i yakalandı**. Doğal eş dizimlerden (28) hiçbiri işaretlenmedi. Tartışmalı 12 kalıptan da hiçbiri işaretlenmedi: derlem bunların hepsinin 2018'de, LLM'lerden önce yerleşmiş olduğunu gösteriyor.
- **Yanlış pozitif:** 180 insan metninde **100 kelimede 0,076 işaret** (hedef < 0,2), metin başına 0,20. İşaretlerin çoğu (~16/20) yanlış pozitif ama seyrek.
- **LLM metinleri:** 100 kelimede 0,042. LLM metni insandan *daha az* işaret alıyor (AUC 0,45, yani ayırmıyor). Ama LLM'deki işaretlerin çoğu (~9/15) gerçek çeviri kokusu; bunların dörtte biri "sunmak" (offer) kalıbı.
- Denetim bu yüzden ayırıcı olarak değil, **düzeltme önerisi** olarak kullanılmalı.

## 1. Derlem

| | |
|---|---|
| kaynak | `turkish-nlp-suite/temiz-OSCAR`, `data/train/oscar2019.jsonl` (8,2 GB), HF üzerinden HTTP Range ile |
| okunan | 10 bölge × 120 MB = 1,2 GB, dosyaya yayılmış (0,1 GB + k × 0,8 GB) |
| hariç | kalibrasyon insan metinlerinin alındığı bölgeler (ilk 60 MB; 0,3 GB + k × 0,8 GB başlangıçlı 20 MB'lık dilimler). Betik çakışmayı denetler, çakışırsa durur |
| boyut | 141.899.765 kelime, 534.599 belge; 12,6 M fiil geçişi, 11,5 M (isim, fiil) çifti |
| lisans | OSCAR derlemi CC0; metinler kaynak sitelere ait, telifli olabilir. Depo veriyi taşımaz, betik yerelde indirip sayar (`.gitignore`'da) |
| süre | indirme ~1,5 dk, iki geçiş ~2 + 1 dk. Parçalar `data/esdizim-onbellek/` altına yazılır, betik yarıda kalırsa kaldığı yerden sürer |

Vikipedi eklenemedi: Wikimedia'nın düz metinli cirrussearch dökümleri kaldırılmış (DEPRECATED), HF'deki Türkçe Vikipedi kopyaları ise parquet biçiminde ve parquet bağımlılıksız okunamıyor. OSCAR'dan okunan 142 M kelime hedefi (50-100 M) zaten aşıyor.

## 2. Yöntem

**Kelimeler.** `toLocaleLowerCase('tr')`. Noktalama, virgül, tırnak, tire, rakam ve kesme işaretli kelimeler ("Türkiye'nin") sınır sayılır. Çift yalnız aynı yan cümledeki iki komşu kelimeden kurulur.

**Fiil (60 fiil).** Sonek soyucu yerine **üretici** kullanıldı. Her fiil için olumlu, olumsuz, yeterlik ve edilgen gövdeler ~150 çekim şablonundan geçirildi. Ses uyumu, ünlü daralması (sağlıyor), t→d (ediyor) ve k→ğ (yapacağım) kuralları uygulandı. Çıkan 62 bin biçim köke bağlandı. Bu yolla "yapı, yapım, yapısı, veri, verim, altı" hiçbir şablondan çıkmıyor, fiil sayılmıyor. Birden çok okunuşu olan biçimler ayrıca dışarıda bırakıldı: alan, sorun, koyun, bakan, yazar, tutar, düşünce, olarak, oldukça… Yalın emir ("karar ver") yalnız isimle karışmayan köklerde eşleşiyor. At, kat, aç, kur ve kazan bu yüzden hariç.

**İsim.** Fiilden hemen önceki kelime alınıyor. Adaylar için çoğul, belirtme, yönelme ve iyelik ekleri soyuluyor, ünsüz yumuşaması geri alınıyor (kararını → kararı, karar; kitabı → kitap; farkındalığı → farkındalık). Derlemde en sık geçen aday seçiliyor: "kapı" kapı kalıyor, "kap"a inmiyor. Yönelme hâli ayrı tutuluyor (`çözüm+A`); yoksa "sınava alınmak" "sınav almak" sayılırdı. Doğruluk: insan metinlerinden rastgele 40 soyma örneğinin 37'si doğru. Yanlışlar: yüreğimi → yüreğim (1. tekil iyelik soyulmuyor), sağlamanızı → sağlamanız. g→k dönüşümü yalnız -ng sonunda geri alınıyor; ilk sürüm "ilgi"yi "ilk"e indiriyordu, düzeltildi.

**Ölçü.** O = c(isim, fiil). İsim toplamı N = c(isim, ·), yani ismin listedeki fiillerin önünde görülme sayısı. Fiilin genel payı P(fiil) = c(·, fiil) / c(·, ·). Beklenen E = N × P(fiil). O/E = 2^PMI. Öneri, ismin dağılımında payı en yüksek fiillerdir (pay ≥ %3, en çok 3 fiil).

**İşaret koşulu.** İsim derlemde ≥ 200 kez geçmeli ve N ≥ 50 olmalı. Bunun üstüne iki koşuldan biri aranıyor: (O/E < 0,2 **ve** E ≥ 30) **ya da** (pay < ‰1 **ve** N ≥ 3000). Ayrıca:
- `olmak` ve `bulunmak` işaretlenmiyor. "sunumu olacak", "eylemi bulunduğunu" gibi yapılar eş dizim değil, varlık ya da iyelik bildiriyor. İlk turdaki insan yanlış pozitiflerinin dörtte biri bunlardı.
- Fiilin önündeki kelime edat, zamir ya da zarfsa çift atlanıyor ("ne alsam", "için ulaşmanız", "gibi koyuyordu"). Bulunma ya da ayrılma hâlindeki isimler de atlanıyor ("bölgesinde verdiği").

**Eşik seçimi** (`--tara`, 64 bileşim). ORAN 0,1'den 0,2'ye çıkınca yakalanan hata 12'den 15'e çıkıyor. Doğal eş dizimler yine işaretlenmiyor. İnsan metnindeki oran ise ~0,05'ten ~0,1'e çıkıyor. E ≥ 30 koşulu, kanıtı zayıf çiftlerden gelen yanlış pozitifleri kesiyor. Eşik bu 180 insan metnine bakılarak seçildi, yani insan oranı örneklem içi bir ölçüm. Yine de hedefin (0,2) yarısının altında kaldı.

## 3. Pozitif ve denetim listesi

Beklenti derlem görülmeden yazıldı. `hata`: Türkçede yerleşik olmayan çeviri kalıbı. `dogal`: yerleşik kalıp. `?`: tartışmalı. Sütunlar: isim toplamı N, çift sıklığı O, beklenen E, pay = O/N. "ismin ilk fiilleri" sütunu öneriyi gösterir.

| çift | beklenti | isim toplamı | çift sıklığı | beklenen | O/E | pay | karar | ismin ilk fiilleri |
|---|---|---|---|---|---|---|---|---|
| karar yapmak | hata | 56892 | 26 | 4997 | 0,01 | %0,05 | **İŞARET** | ver %71, al %23, ol %2 |
| aksiyon almak | hata | 368 | 233 | 22 | 10,48 | %63,3 | geçti | al %63, ol %13, sun %3 |
| dikkat ödemek | hata | 63879 | 4 | 356 | 0,01 | %0,01 | **İŞARET** | çek %60, et %39, göster %0 |
| fotoğraf almak | hata | 8252 | 105 | 499 | 0,21 | %1,3 | geçti | çek %64, gör %6, ol %3 |
| para yapmak | hata | 22122 | 55 | 1943 | 0,03 | %0,25 | **İŞARET** | kazan %35, ver %13, al %10 |
| arkadaş yapmak | hata | 3003 | 31 | 264 | 0,12 | %1,0 | **İŞARET** | ol %70, edin %8, bul %7 |
| sınav almak | hata | 3039 | 19 | 184 | 0,10 | %0,63 | **İŞARET** | yap %29, kazan %21, ol %12 |
| kahvaltı almak | hata | 1621 | 28 | 98 | 0,29 | %1,7 | geçti | yap %62, et %21, ver %5 |
| anlam yapmak | hata | 3937 | 0 | 346 | 0,00 | %0,00 | **İŞARET** | ver %33, taşı %28, kazan %13 |
| ilerleme yapmak | hata | 1792 | 29 | 157 | 0,18 | %1,6 | **İŞARET** | kaydet %43, sağla %30, göster %9 |
| söz yapmak | hata | 17450 | 13 | 1533 | 0,01 | %0,07 | **İŞARET** | et %46, ver %27, al %6 |
| toplantı tutmak | hata | 7812 | 0 | 57 | 0,00 | %0,00 | **İŞARET** | yap %42, düzenle %37, gerçekleştir %15 |
| ilgi ödemek | hata | 19761 | 2 | 110 | 0,02 | %0,01 | **İŞARET** | gör %30, çek %25, göster %22 |
| adım almak | hata | 15681 | 10 | 947 | 0,01 | %0,06 | **İŞARET** | at %79, ol %12, izle %2 |
| ilişki yapmak | hata | 6730 | 10 | 591 | 0,02 | %0,15 | **İŞARET** | kur %41, ol %23, yaşa %12 |
| rüya yapmak | hata | 1613 | 3 | 142 | 0,02 | %0,19 | **İŞARET** | gör %73, ol %21, gerçekleştir %3 |
| kontrol almak | hata | 26988 | 63 | 1630 | 0,04 | %0,23 | **İŞARET** | et %82, yap %7, sağla %5 |
| başarı yapmak | hata | 5495 | 12 | 483 | 0,02 | %0,22 | **İŞARET** | göster %29, sağla %17, yakala %16 |
| çözüm sağlamak | ? | 11841 | 733 | 203 | 3,61 | %6,2 | geçti | sun %33, bul %21, ol %16 |
| etki yaratmak | ? | 14182 | 1906 | 66 | 28,97 | %13,4 | geçti | et %23, göster %16, yarat %13 |
| fark yaratmak | ? | 24864 | 2708 | 115 | 23,48 | %10,9 | geçti | et %72, yarat %11, ol %6 |
| değer katmak | ? | 15458 | 1813 | 33 | 54,96 | %11,7 | geçti | ver %21, ol %12, kat %12 |
| farkındalık yaratmak | ? | 2587 | 1134 | 12 | 94,49 | %43,8 | geçti | yarat %44, oluştur %31, artır %13 |
| şans vermek | ? | 3121 | 1135 | 165 | 6,89 | %36,4 | geçti | ver %36, yakala %14, bul %10 |
| duş yapmak | ? | 903 | 59 | 79 | 0,74 | %6,5 | geçti | al %87, yap %7, bulun %3 |
| izlenim yaratmak | ? | 1392 | 239 | 6 | 37,01 | %17,2 | geçti | ver %42, yarat %17, bırak %16 |
| hizmet sağlamak | ? | 66569 | 1897 | 1140 | 1,66 | %2,8 | geçti | ver %55, sun %17, et %12 |
| çözüm sunmak | ? | 11841 | 3930 | 151 | 26,05 | %33,2 | geçti | sun %33, bul %21, ol %16 |
| deneyim yaşamak | ? | 3236 | 774 | 56 | 13,73 | %23,9 | geçti | yaşa %24, sun %22, ol %18 |
| yardım yapmak | ? | 17273 | 1693 | 1517 | 1,12 | %9,8 | geçti | et %58, al %22, yap %10 |
| zaman harcamak | dogal | 22248 | 856 | 35 | 24,51 | %3,8 | geçti | ol %17, geçir %16, al %10 |
| ders vermek | dogal | 9531 | 4388 | 503 | 8,72 | %46,0 | geçti | ver %46, al %30, çıkar %7 |
| rol oynamak | dogal | 15586 | 7907 | 99 | 80,15 | %50,7 | geçti | oyna %51, al %30, üstlen %8 |
| soru sormak | dogal | 8358 | 5912 | 26 | 224,88 | %70,7 | geçti | sor %71, ol %7, çöz %6 |
| hata yapmak | dogal | 6684 | 3521 | 587 | 6,00 | %52,7 | geçti | yap %53, ol %18, ver %11 |
| karar vermek | dogal | 56892 | 40120 | 3002 | 13,36 | %70,5 | geçti | ver %71, al %23, ol %2 |
| karar almak | dogal | 56892 | 13145 | 3437 | 3,82 | %23,1 | geçti | ver %71, al %23, ol %2 |
| önlem almak | dogal | 7387 | 6870 | 446 | 15,39 | %93,0 | geçti | al %93, ol %2, artır %2 |
| risk almak | dogal | 5604 | 1211 | 339 | 3,58 | %21,6 | geçti | taşı %22, al %22, artır %14 |
| katkı sağlamak | dogal | 18499 | 11316 | 317 | 35,71 | %61,2 | geçti | sağla %61, ol %10, sun %10 |
| yorum yapmak | dogal | 8979 | 5794 | 789 | 7,35 | %64,5 | geçti | yap %65, yaz %14, al %4 |
| destek vermek | dogal | 38807 | 16990 | 2048 | 8,30 | %43,8 | geçti | ver %44, ol %23, al %13 |
| iletişim kurmak | dogal | 5386 | 4412 | 56 | 78,72 | %81,9 | geçti | kur %82, sağla %10, ol %2 |
| performans göstermek | dogal | 4398 | 1445 | 59 | 24,54 | %32,9 | geçti | göster %33, sun %16, sağla %13 |
| zaman almak | dogal | 22248 | 2311 | 1344 | 1,72 | %10,4 | geçti | ol %17, geçir %16, al %10 |
| ders almak | dogal | 9531 | 2887 | 576 | 5,01 | %30,3 | geçti | ver %46, al %30, çıkar %7 |
| sorumluluk almak | dogal | 3815 | 1255 | 230 | 5,45 | %32,9 | geçti | al %33, üstlen %21, ol %11 |
| dikkat etmek | dogal | 63879 | 25107 | 7988 | 3,14 | %39,3 | geçti | çek %60, et %39, göster %0 |
| fotoğraf çekmek | dogal | 8252 | 5289 | 96 | 54,90 | %64,1 | geçti | çek %64, gör %6, ol %3 |
| plan yapmak | dogal | 3608 | 2338 | 317 | 7,38 | %64,8 | geçti | yap %65, oluştur %6, uygula %6 |
| fark etmek | dogal | 24864 | 17806 | 3109 | 5,73 | %71,6 | geçti | et %72, yarat %11, ol %6 |
| fayda sağlamak | dogal | 8534 | 3497 | 146 | 23,92 | %41,0 | geçti | sağla %41, ol %31, gör %13 |
| ödül kazanmak | dogal | 9245 | 2690 | 68 | 39,42 | %29,1 | geçti | al %37, kazan %29, ver %23 |
| duş almak | dogal | 903 | 784 | 55 | 14,37 | %86,8 | geçti | al %87, yap %7, bulun %3 |
| önem vermek | dogal | 20759 | 9664 | 1096 | 8,82 | %46,6 | geçti | ver %47, taşı %35, kazan %10 |
| araştırma yapmak | dogal | 7739 | 6442 | 680 | 9,48 | %83,2 | geçti | yap %83, göster %3, yürüt %3 |
| mücadele vermek | dogal | 21021 | 4044 | 1109 | 3,65 | %19,2 | geçti | et %71, ver %19, sürdür %2 |
| fırsat sunmak | dogal | 13652 | 2795 | 174 | 16,07 | %20,5 | geçti | bul %30, sun %20, ver %15 |

**Yakalanan: çeviri kalıplarında 15/18.** Tartışmalılarda derlem 12 kalıbın hepsini yerleşik saydı. Doğal kalıplarda yanlış işaret 0/28.

Kaçanlar:
- **aksiyon almak.** Beklentimiz yanlış çıktı. 2018 web Türkçesinde "aksiyon" kelimesinin %63'ü "almak"la geçiyor (O/E 10,5); kalıp LLM'lerden önce yerleşmiş. Derlem bunu yakalatmaz.
- **fotoğraf almak** (O/E 0,21, pay %1,3) ve **kahvaltı almak** (0,29). İkisinin de gerçek bir Türkçe okunuşu var: "fotoğrafı almak" fotoğrafı teslim almaktır, "kahvaltı almak" paket kahvaltı satın almaktır. Bu yüzden eşiğin hemen üstünde kalıyorlar. ORAN 0,3'e çıkarılırsa ikisi de yakalanır ama insan metnindeki işaret oranı ~%50 artar.

Tartışmalı kalıpların hepsini derlem yerleşik sayıyor. "Farkındalık yaratmak", "farkındalık"ın %44'ünü oluşturuyor (O/E 94). Öbür O/E değerleri: değer katmak 55, etki yaratmak 29, çözüm sunmak 26, fark yaratmak 23. Bu kalıplar İngilizceden gelmiş ama Türkçeye yerleşmiş. Bunları istatistik yakalayamaz; üslup kuralıyla (klişe listesi) ele almak gerekir.

## 4. İnsan ve LLM metinleri

| grup | metin | kelime | işaret | 100 kelimede | metin başına | işaretli metin |
|---|---|---|---|---|---|---|
| insan (derlem + derlem-site) | 180 | 47.619 | 36 | **0,076** | 0,20 | 32 |
| LLM (llm + site llm + llm-dogal) | 180 | 36.137 | 15 | 0,042 | 0,08 | 14 |

AUC (LLM metninin işaret oranının insanınkini geçme olasılığı) = **0,45**. Denetim LLM'i insandan ayırmıyor; LLM metni biraz daha az işaret alıyor. Bu beklenen bir sonuç. Dil modeli sıklığa göre seçtiği için tipik eş dizimi kurar. İnsan ise deyim, konuşma dili, yazım hatası ve seyrek ama doğru birleşimlerle derlemin seyrek ucuna daha sık düşer.

## 5. En sık işaretler, elle değerlendirme

**İnsan (ilk 20; her biri 1-2 kez):**

| işaret | değerlendirme |
|---|---|
| zorluk geçmedim | **gerçek hata** ("zorluk çekmedim"); öneri doğru: çekmek %47 |
| dizaynlar yapmak | gerçek sayılabilir ("dizayn etmek" %95) |
| yüksek yapmıyorsunuz | gerçek sayılabilir (bozuk anlatım) |
| problem edilmiyor | sınırda (konuşma dili "sorun etmek") |
| aşıyı almıştır (×2), imzası alındıktan, eseri alacak, kiloyu bulduğunu, yayınını yakalayamadığını | yanlış pozitif: fiil başka anlamda ("almak" = teslim almak, "bulmak" = ulaşmak) |
| yer eden, komşu etsin, imza eder, kilo yapsa, yara yapıyor | yanlış pozitif: deyim ya da konuşma dili; derlemde seyrek ama doğru |
| gözlerini bakıyor, gün bırakın, ağır görünce, video kalmamış, hizmetler yapma, fark taşır | yanlış pozitif: komşu iki kelime aynı öbekte değil (virgülsüz yan cümle, sıfat, özne) |

Özet: ~4/20 gerçek, ~16/20 yanlış pozitif. İşaretler seyrek olduğu için (5 metinden 1'inde tek işaret) bu oran kabul edilebilir.

**LLM (tümü, 15):**

| işaret | değerlendirme |
|---|---|
| önlemler sunuyoruz | **gerçek**: "önlem almak" %93 |
| açıklamalar sunmaz | **gerçek çeviri** (offer explanations); "açıklama yapmak" %90 |
| inceleme sunan | **gerçek çeviri** (offers an in-depth look); "inceleme yapmak" %87 |
| ilham sağlar | **gerçek çeviri** (provides inspiration); "ilham vermek/almak" |
| mutlu yapar | **gerçek çeviri** (makes happy); "mutlu etmek" %43 |
| tedaviler sunmaktayız | sınırda (site dili) |
| hazırlıklarını artırdığını, toplantılarını artırmak | gerçek sayılabilir: tuhaf fiil seçimi |
| karmaşık yap(-boz) | gerçek: bozuk üretim ("yapboz" bölünmüş) |
| farkını yaşamak | sınırda (reklam dili) |
| sistemini duydum, ortağı kazanır, hazır almak, farklar doğurur | yanlış pozitif |
| düşünce yapınız | yanlış pozitif: "yapı" (isim) + iyelik, "yapın" emriyle karışıyor |

Özet: ~9/15 gerçek. LLM metnindeki en belirgin iz **"X sunmak"** (offer X) kalıbı: 15 işaretin 4'ü bu (önlem, açıklama, inceleme, tedavi sunmak). Tarayıcıya ayrı bir kural olarak eklenebilir.

## 6. Sınırlar

- **Yalnız komşu çift.** Araya kelime giren kullanımlar ("karar hızlı bir şekilde yapıldı") görülmüyor. Öte yandan komşu olup aynı öbekte olmayan kelimeler (özne + yüklem, sıfat + fiil) yanlış pozitiflerin ana kaynağı.
- **Morfoloji yaklaşık.** İsim kökü sıklığa dayalı bir tahmin (40 örnekte 37 doğru). 1. ve 2. kişi iyelik ekleri soyulmuyor. Fiil listesi 60 fiille sınırlı; listede olmayan fiillerle kurulan kalıplar görülmüyor.
- **Anlam ayrımı yok.** "almak" hem "take" hem "teslim almak" anlamına geliyor. Bu yüzden "fotoğrafı almak" gibi gerçek bir okunuşu da olan kalıplar eşiğin üstünde kalıyor. Öneri de anlamı bilmiyor. "Dikkat ödemek" için ilk öneri "çekmek" (%60) çıkıyor, doğrusu ikinci sıradaki "etmek" (%39).
- **Derlem türü.** 2018 web metninde SEO ve pazarlama dili bol. "Değer katmak", "fark yaratmak" gibi reklam kalıpları bu yüzden yerleşik görünüyor. Edebî ve resmî dilde denge farklı olabilir.
- **Eşik örneklem içi.** Eşik aynı 180 insan metnine bakılarak seçildi. Başka bir insan derleminde yanlış pozitif oranı biraz daha yüksek çıkabilir. Ölçülen oran hedefin yarısının altında olduğu için pay var.
- **Yerleşmiş çeviriler.** İstatistik yalnız Türkçede karşılığı olmayan birleşimi yakalar. 2018'e kadar yaygınlaşmış çeviri kalıpları (aksiyon almak, farkındalık yaratmak) için üslup kuralı gerekir.
