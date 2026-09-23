# Kör test: turkish-writer becerisi işe yarıyor mu?

Soru: beceriyle yazılan Türkçe site ve blog metni insan yazısından ayırt edilemiyor mu, kulağa
Türkçe geliyor mu?

**Kısa cevap.** Beceri, hakemlerin "yapay zekâ" diye yakaladığı yüzey izlerini büyük ölçüde
siliyor. gpt-4.1, becerisiz Claude metnini eşli testte **%83** doğrulukla yakalarken becerili
Claude metnini yalnız **%20** doğrulukla yakaladı. Ama bu "ayırt edilemiyor" demek değil:
hakemler becerili metni %80-88 oranında **insan metninin yerine** insan diye seçti, yani
şans düzeyinin (%50) altına, ters yönde saptı. Hakemin "insan" ölçütü cilalı, hatasız,
akıcı metin; karşılaştırılan 2018 KOBİ ve blog metinleri ise yazım hatalı, tekrarlı,
dağınık. Ters çevrilmiş bir hakem becerili metni yine %80 yakalardı. Tekil hakem puanları
ise hiçbir grubu ayırmadı (hepsi 77-92 arası).

Betik: `tests/kalibrasyon/kalibre-beceri.mjs`. Ham veri (git dışı):
`tests/kalibrasyon/derlem-beceri/` (`olcum-trscan.json`, `hakem-*.json`, `esli-*.json`,
`anlam-gpt-4o.json`, `ozet.json`, `meta.json`).

---

## Düzen

| Grup | n | Kaynak |
|---|---|---|
| insan | 30 (15 site, 15 blog) | temiz-OSCAR oscar-2019 (2018 Common Crawl), bölgeler 0.55e9 + k·0.8e9, 20 MB; önceki derlemlerin metinleri ve bölgeleri (0-60 MB; 0.3e9 + k·0.8e9; eş dizimin 0.1e9 + k·0.8e9, 120 MB) hariç. Filtre `kalibre-site.mjs` ile aynı; 60 aday elle okunup SEO doldurma, haber, forum, dizin sayfası, karışık metin elendi. 100-400 kelime |
| claude-becerisiz | 30 | Claude, beceri dosyalarından **önce**, üslup talimatı olmadan; istem: "{sektör} alanında çalışan bir firma için yaklaşık N kelimelik '{sayfa}' sayfası metni" / "şu konuda yaklaşık N kelimelik blog yazısı" |
| claude-becerili | 30 | Claude, SKILL.md ve references okunduktan sonra "Yaz" kipi; olgu listesi yalnız konu; tr-scan çalıştırılmadı |
| gpt-ozgun | 20 (10/10) | `derlem-site/llm/` varsayılan istemli gpt-4o ve gpt-4.1-mini metinleri, tohumlu karıştırmayla seçildi |
| gpt-duzeltilmis | 20 | Aynı 20 metin, beceri "Düzelt" kipi; tr-scan çalıştırılmadı |

Konu (sektör + sayfa türü ya da blog konusu) gpt-4o-mini ile çıkarıldı, üçü elle düzeltildi.

**Hakem.** gpt-4o-2024-08-06 ve gpt-4.1, temperature 0, JSON. Her metin tek tek, karışık sırayla,
kaynağı söylenmeden. OSCAR insan metinleri tek satır ve biçimsiz olduğu için bütün gruplar
hakeme aynı biçimde gitti: markdown işaretleri silindi, satırlar birleştirildi. Eşli testte her
konu için (insan, becerili) ve (insan, becerisiz) çifti **iki sırayla da** soruldu (konum
etkisini dengelemek için); 30 konu × 2 sıra = 60 deneme.

---

## 1. Grup başına sonuçlar

### tr-scan (`denetle()`)

| Grup | Skor medyan (IQR) | Güçlü iz / gri / zayıf | TDK bulgusu (metin) | Ayıklanmış TDK* |
|---|---|---|---|---|
| insan | 91 (81-94) | 0 / 8 / 22 | 40 (22) | 38 |
| claude-becerisiz | 84 (77-89) | 1 / 13 / 16 | 18 (8) | 13 |
| **claude-becerili** | **94 (86-94)** | 0 / 5 / 25 | 9 (5) | **5** |
| gpt-ozgun | 70,5 (65-84) | 8 / 6 / 6 | 14 (7) | 13 |
| gpt-duzeltilmis | 87 (80-93) | 0 / 7 / 13 | 7 (4) | 6 |

\* Tarayıcının yanlış pozitifleri çıkarıldı (bkz. §6). Becerili metinlerde kalan beş gerçek
hata: "yurtdışı/yurtdışında" (3; doğrusu *yurt dışı*) ve "hammaddesi/hammaddenizle" (2;
doğrusu *ham madde*). İkisi de beceride bilinen, `tdk-yazim.md`'de yazılı kurallar.

Ritim ve yoğunluk (ortalama):

| Grup | Kelime | 25+ kelimelik cümlesi olmayan metin | Cümle uzunluğu CV | "ve" / 100 kelime |
|---|---|---|---|---|
| insan | 245 | 11/30 | 0,45 | 3,40 |
| claude-becerisiz | 179 | 27/30 | 0,38 | 4,33 |
| claude-becerili | 180 | **26/30** | 0,40 | **1,74** |
| gpt-ozgun | 185 | 19/20 | 0,29 | 4,81 |
| gpt-duzeltilmis | 149 | 20/20 | 0,39 | 3,89 |

### Tekil kör hakem (ortalama ± SS)

| Grup | gpt-4o insan_olasiligi | ceviri_gibi | dogallik | gpt-4.1 insan_olasiligi | ceviri_gibi | dogallik |
|---|---|---|---|---|---|---|
| insan | 84,7 ± 4,7 | 1,97 ± 0,18 | 4,03 ± 0,32 | 82,8 ± 10,1 | 2,07 ± 0,64 | 4,03 ± 0,67 |
| claude-becerisiz | 85,7 ± 2,2 | 1,97 ± 0,18 | 4,93 ± 0,25 | 82,0 ± 7,7 | 1,83 ± 0,38 | 4,73 ± 0,45 |
| **claude-becerili** | **86,5 ± 3,5** | 1,93 ± 0,25 | 4,97 ± 0,18 | **91,8 ± 3,1** | **1,17 ± 0,38** | **5,00 ± 0** |
| gpt-ozgun | 85,5 ± 1,5 | 1,95 ± 0,22 | 4,80 ± 0,41 | 76,8 ± 9,5 | 2,00 ± 0,32 | 4,45 ± 0,51 |
| gpt-duzeltilmis | 85,5 ± 2,2 | 1,95 ± 0,22 | 4,80 ± 0,41 | 83,8 ± 8,1 | 1,80 ± 0,41 | 4,85 ± 0,37 |

Hata bulunan metin: insan 23/30 (gpt-4o), 29/30 (gpt-4.1); becerili 1/30 ve 0/30.
Tekil puanlar ayırmıyor: 130 metnin hepsine iki hakem de %50'nin üstünde "insan" dedi.
İnsan metinleri **en düşük doğallık** puanını aldı (4,03). gpt-4.1'de becerili metin, insan
metninden de yüksek puan aldı (AUC insan > becerili = 0,17). gpt-4o bütün grupları neredeyse
aynı puanladı (84,7-86,5); bu hakemin tekil puanı bu testte bilgi taşımıyor.

---

## 2. Eşli kör karşılaştırma (asıl ölçüm)

Soru: "Bu iki metinden hangisini bir insan yazdı?" Doğru = insan metnini seçmek. Şans = %50.

| Hakem | Karşı grup | Doğru | Oran | %95 GA (Wilson) | Binom p (H0: 0,5) | Çift: ikisi doğru / ikisi yanlış / tutarsız | Site / blog |
|---|---|---|---|---|---|---|---|
| gpt-4.1 | becerisiz | 50/60 | **%83,3** | %72,0-90,7 | < 0,001 | 23 / 3 / 4 | 25/30, 25/30 |
| gpt-4.1 | **becerili** | 12/60 | **%20,0** | %11,8-31,8 | < 0,001 | 3 / 21 / 6 | 3/30, 9/30 |
| gpt-4o | becerisiz | 18/60 | %30,0 | %19,9-42,5 | 0,003 | 5 / 17 / 8 | 7/30, 11/30 |
| gpt-4o | **becerili** | 7/60 | **%11,7** | %5,8-22,2 | < 0,001 | 2 / 25 / 3 | 1/30, 6/30 |

Konum etkisi yok: "A" seçimi 26-31/60. Ortalama "emin" 84-89.

**Okuma.**
- **Güçlü hakemde (gpt-4.1) beceri, yakalanma oranını %83'ten %20'ye indirdi.** Becerisiz Claude'u
  "şablonsal, madde madde, yapay zekâya özgü düzenli" diye tanıyan hakem, becerili metinde bu
  izleri bulamayıp insan metnini yapay zekâ sandı.
- **%50'ye yaklaşmadı, öte yanına geçti.** Şanstan uzaklık becerisizde 0,33, becerilide 0,30: hakem
  gözünde iki grup insan metninden aşağı yukarı aynı ölçüde ayrılıyor, yalnız yönü ters. Hakemin
  "insan" imgesi akıcı, hatasız metin; karşılaştırılan insan metinleri 2018 SEO ve KOBİ metni.
  Yani sonuç "becerili metin insan metninden ayırt edilemiyor" değil, "LLM hakem becerili metni
  bu insan metinlerinden daha insan buluyor".
- gpt-4o bu görev için zayıf bir hakem: becerisiz Claude'da bile şansın altında (%30).
- Site metninde beceri neredeyse hiç yakalanmadı (1-3/30); becerili metnin yakalandığı yer blog
  (6-9/30).

### Hakemler arası uyum

- Eşli testte aynı karar: %67,5 (120 deneme), Cohen κ = 0,36 (orta-zayıf).
- Tekil insan_olasiligi: Spearman 0,47; dogallik: 0,50. İkili karar (≥ 50) uyumu %100, ama
  anlamsız: ikisi de her metne "insan" dedi.

---

## 3. GPT düzeltmede anlam koruma (gpt-4o hakem, 20 çift)

| | Hakemin saydığı | Elle denetim sonrası |
|---|---|---|
| Düşen olgu | 33 (10 metinde) | **7 gerçek iddia kaybı**; 14 kuralın silmesini istediği boş sıfat ya da klişe; 12 yanlış alarm (anlam başka kelimeyle korunmuş) |
| Eklenen olgu | 6 (5 metinde) | **3 desteksiz ekleme**; 3 yeniden ifade |
| Kesinlik değişimi | 0 | 1 (hakem kaçırdı) |
| Anlam değişti | 1/20 (s003) | 1/20 |

Gerçek kayıplar:
- **s003** (fotoğraf/video): "sektördeki deneyimi", "yaratıcılığı", "müşteri memnuniyetini ön planda tutarak" düştü. Metin 83 kelimeden 67'ye indi.
- **s008** (inşaat): "geleceğe yatırım yaparken" düştü.
- **s015** (araç kiralama): "müşteri memnuniyeti", "güvenli ve konforlu bir deneyim" düştü.
- **s028** (otomatik kapı): "müşteri memnuniyetini esas alarak" düştü.

Desteksiz eklemeler:
- **s003:** "işin tamamı tek elden yürüyor" (özgünde "tam destek sağlıyoruz" vardı; çıkarım).
- **s015:** "şehre inip ofis aramakla vakit kaybetmiyorsunuz" (özgünde yalnız "zamandan tasarruf").
- **b022:** "renk düzenleme ... görsel kaliteyi **en çok** belirleyen aşamalardan biri" (özgünde "kritik bir rol oynar"; iddia güçlendi).

Hakemin kaçırdıkları: s025'te "sektörde örnek teşkil etmekteyiz" iddiası "örnek olduğumuzu
düşünüyoruz" diye yumuşadı (kesinlik değişimi). b005'in son iki cümlelik övgü paragrafı ("web
sayfalarınız daha etkileşimli, kullanıcı dostu ve profesyonel hâle gelir") silindi. Hakem
bunları saymadı.

Düzeltme metni ortalama %19 kısalttı (185 → 149 kelime). Kayıpların hepsi site metninde ve hepsi
"müşteri memnuniyeti", "deneyim", "güvenli ve konforlu" gibi **olgu değil, iddia** türünden.
Beceri bu cümleleri boş sıfat sayıp siliyor; oysa müşterinin kendi iddiasıdır. Sayı, ad, tarih,
koşul hiçbir metinde düşmedi ya da eklenmedi.

---

## 4. Hakem becerili metinde neyi yakaladı: sonraki sürümde düzeltilecekler

Kaynak: eşli testte hakemin becerili metni doğru olarak yapay zekâ dediği 19 denemenin gerekçesi
(gpt-4o 7, gpt-4.1 12), tekil hakemin becerili hata listesi (1 madde) ve tr-scan ölçümleri.
Tekil hakem becerili metinlerde neredeyse hiç hata bulmadı; asıl bilgi eşli gerekçelerde.

| # | Tema | Sıklık | Nerede | Becerinin bugünkü durumu | Öneri |
|---|---|---|---|---|---|
| 1 | **Kişisel deneyim ve anekdot yok** | 15/19 gerekçe | blog (b03, b08, b10, b11, b12) | "Uydurma deneyim yok" kuralı doğru, ama blogda yerine bir şey koymuyor | Blog kipinde olgu listesine **deneyim alanı** ekle ve ilk soruyu buna ayır ("Bunu siz denediniz mi, ne oldu?"). Deneyim yoksa gözlem ve görüşle kişisel ses kur ("bence", "bizde işe yarayan"), olay uydurma |
| 2 | **Duygu dile getirilmiyor** | 11/19 | blog | `mudahale-defteri.md` §3 "duyguyu adıyla söyle" var, uygulanmadı | Blogda yazı başına bir adı konmuş tutum ya da duygu cümlesi (tavan, kota değil) |
| 3 | **Fazla düzenli, şablonsal, "derli toplu" yapı** | 8/19 | blog, teknik rehber (b08, b11, b12, b14) | "Her geçiş tek konu" ve "her paragraf tek soru" yöntemi, düzenli paragraf dizisi üretiyor | Yapısal müdahaleyi blogda zorunlu tut (yan kol, açık uç); her paragrafın bir soruyu kapatması gerekmez |
| 4 | **Kusursuzluk** (insan metnindeki yazım hatası, tekrar, dağınıklık hakemce insan işareti) | 7/19; becerisizde de ana gerekçe | her yer | "Kasıtlı hata yok" kuralı | Kural kalmalı. Ama hedef "2018 SEO metninden ayırt edilemez" değil, "iyi insan yazısından ayırt edilemez" olmalı; bunu ölçmek için özenli insan metni derlemi gerek |
| 5 | **Somut ad yok** (marka, ürün, etiket, yer) | 5/19 | blog (b10) | Uydurma yasağı yüzünden ad girmiyor | Olgu listesinde ad yoksa sor; `sicil.md` "blogun inandırıcılığı adlandırılmış şeylerden gelir" diyor, Yaz kipi bunu istemiyor |
| 6 | **Tanıtım, bilgi ya da tarif metni tonu** | 4/19 | blog (b10, b12) | Blog sicili "görüş serbest" diyor ama becerili blog yine ansiklopedik | Blog ilk paragrafında yazanın kim olduğu ve neden yazdığı |
| 7 | **Konuşma dili, mizah yok** | 4/19 | blog (b14) | Argo yasağı doğru; mizah için yönerge yok | Blogda hafif espriye izin veren tek satır, kota değil |
| 8 | **Okurla etkileşim yok** (soru, teşekkür, "siz de yazın") | 3/19 | blog (b08) | "Peki ya siz?" yasak; gerçek soru serbest ama hiç kullanılmadı | Gerçekten merak edilen tek bir soru ya da okura dönük bir cümle |
| 9 | **Uzunluk tutmuyor** | 3/19 (ölçüm: 180'e 245 kelime, %27 kısa) | her yer | "Yaklaşık N kelime" isteğinde uzunluk denetimi yok | Son okumaya uzunluk kontrolü: hedefin %85'inin altındaysa olgu ekleme değil, eksik soru var mı diye bak |
| 10 | **Yeni parmak izi: "ve" kaçınması, uzun cümle yok** | tr-scan | her yer | "ve" becerilide 1,74/100, insanın **yarısı** (3,40); 25+ kelimelik cümlesi olmayan metin 26/30 (insan 11/30) | "ve" kuralını tavana çevir ("bir kısmını ulaçla"), sıfıra indirme. Uzun cümle kuralı yazarken işe yaramadı; son okumaya "en az bir uzun cümle var mı" sorusu ekle |

**Ek.** GPT düzeltmede müşterinin kendi iddiaları ("müşteri memnuniyetini ön planda tutarak",
"deneyimli") boş sıfat sayılıp silindi (§3). Düzelt kipine şunu ekle: boş sıfat silinir, iddia
silinmez, sadeleşir ("müşteri memnuniyetini önde tutuyoruz").

**Beceri neyi düzeltti.** gpt-4.1'in becerisiz Claude'u yakaladığı gerekçeler "şablonsal",
"madde madde", "ansiklopedik", "reklam metni gibi", "kurumsal ve jenerik". Bu izler becerili
metinlerde gerekçe olarak **hiç** geçmedi. Site metninde (ana sayfa, hizmet, hakkımızda)
beceri hakemi neredeyse her seferinde geçti.

---

## 5. tr-scan ile hakem kararı ne kadar uyumlu?

| | gpt-4o | gpt-4.1 |
|---|---|---|
| Spearman (tr-scan skoru, insan_olasiligi; 130 metin) | 0,17 | 0,47 |
| İkili karar uyumu (skor > 80 ⇔ olasılık ≥ 50) | %63 | %63 |

İnsan metnini ayırma gücü (AUC, insan > grup):

| Grup | tr-scan | gpt-4o | gpt-4.1 |
|---|---|---|---|
| claude-becerisiz | 0,64 | 0,46 | 0,58 |
| claude-becerili | **0,40** | 0,42 | **0,17** |
| gpt-ozgun | **0,78** | 0,46 | 0,70 |
| gpt-duzeltilmis | 0,57 | 0,48 | 0,50 |

tr-scan varsayılan GPT metnini bu yeni derlemde de ayırıyor (0,78; SONUC-SITE.md'deki
kalibrasyonla tutarlı). Becerili Claude metni tr-scan'de insandan **daha yüksek** skor aldı
(0,40). Bu beklenen bir sonuç, ama iki anlamı var: (a) beceri tarayıcının ölçtüğü izleri
gerçekten siliyor, tr-scan çalıştırılmadan; (b) tr-scan becerili metin için artık bilgi
vermiyor, "zayıf iz" bandı "insan yazdı" demek değil. gpt-4.1 ile tr-scan aynı yöne bakıyor
(0,47): ikisi de düz ritmi, geçişleri, kapanış klişesini cezalandırıyor.

---

## 6. Yan bulgu: tr-scan'de yanlış pozitifler

Ayıklanmış TDK sayısını bunlar değiştirdi. Düzeltilmedi (bu görevin kapsamı dışında):

| Bulgu | Örnek | Neden |
|---|---|---|
| `yanlis-yazim` doğru yazımı işaretliyor | "sürpriz", "egzersiz" (ayrıca "kirpik", "süveter") | `tr-scan.mjs` satır 203: `sürpriz(?=)`, `egzersiz(?=)` boş ileri bakış her zaman eşleşiyor |
| Fiil çekimi birleşik kelime sanılıyor | "boşalan" → "boş alan" | dizin öneki denetimi |
| Kısaltmaya gelen ek | "GB'lık" → "yapım eki kesmeyle ayrılmaz" | kısaltma istisnası yok (TDK: kısaltmaya ek kesmeyle ayrılır) |
| Kod içindeki yüzde | `lvextend -l +100%FREE` | kod satırı ayıklanmıyor |
| Şüpheli | "halsizliğiniz" → "hâlsizlik" | TDK madde başıyla doğrulanmalı |

---

## 7. Sınırlar

- **Hakem bir LLM, insan değil.** Eşli testte iki hakem de "insan" ile "akıcı" arasında ayrım
  yapamıyor; gpt-4o becerisiz Claude'da bile şansın altında. Asıl soru ("insan okur ayırt edebilir
  mi") yalnız insan hakemlerle cevaplanır. Bir sonraki adım: 5-10 Türkçe okurla aynı eşli test.
- **Karşılaştırılan insan metni özenli yazı değil.** OSCAR 2018 site ve blog metinleri çoğunlukla
  KOBİ ve SEO metni: yazım hatalı (hakeme göre 23-29/30), tekrarlı. Beceri iyi insan yazısını
  hedefliyor; bu derlem o hedefi ölçmüyor.
- **Becerili metinleri yazan da Claude,** becerisiz metinleri yazan da. İki grubu aynı model,
  aynı oturumda yazdı; becerisiz metinler beceri okunmadan yazıldı, ama yazar insan metinlerinin
  ilk satırlarını aday seçerken görmüştü. Bazı konularda (s05 ahşap jaluzi, s11 öğütme yardımcısı,
  b08 CentOS bölümleri) iki Claude grubu da konunun ötesinde insan metninden gelen bir ayrıntı
  kullandı; becerisiz b03'te insan metnindeki yazar adları da var. Becerili metinler olgu listesi
  olarak konuya bağlı kaldı, ama site metinlerinde hizmetin doğasından gelen süreç cümleleri
  ("keşfe geliyoruz") yine var.
- **Örneklem küçük.** 30 konu, 60 eşli deneme; iki sıra aynı çiftin tekrarı olduğu için denemeler
  bağımsız değil. Güven aralıkları bunu hesaba katmıyor; çift düzeyinde de (ikisi doğru / ikisi
  yanlış) sonuç aynı yönde.
- **Uzunluk eşleşmedi.** Claude grupları hedef uzunluğun ~%73'ünde kaldı (180'e 245 kelime).
  Hakem bir kez uzunluğu gerekçe gösterdi.
- **Biçim düzleştirildi.** Hakeme giden bütün metinler tek satıra indirildi; gerçek sayfada
  başlık ve liste okura başka ipucu verir.
- **Beceri tam uygulanmadı.** Toplu yazımda "bir soru sor" adımı yapılamadı (olgu listesi yalnız
  konu), `references/ornekler/` boştu (örnek okuma adımı atlandı), tr-scan protokol gereği
  çalıştırılmadı (iş akışının 0. ve 6.6. adımları).
- **Düzelt kipinde anlam hakemi** 33 düşen olgudan 12'sinde yanılıp korunmuş anlamı kayıp saydı,
  bir kesinlik değişimini kaçırdı; §3'teki elle denetim tek kişinin (yazarın) denetimi.
- Hakem istemi Türkçe, temperature 0; modeller: gpt-4o-2024-08-06, gpt-4.1. Başka model ailesi
  (Gemini, Claude hakem) denenmedi.

---

## 8. Ses örnekleri

Hakemin en yüksek puanladığı, TDK'ya uygun ve olgusu uydurulmamış becerili metinlerden beşi
`skills/turkish-writer/references/ornekler/` altına yazıldı: `hizmet-endustri-4-egitimi.md`,
`hakkimizda-yazilim-gelistirme.md`, `blog-cocuga-harclik.md`, `blog-tohumlu-kalem.md`,
`blog-konut-kredisi.md`. Hakemin en yüksek puan verdiği iki blog (b03 kişisel deneme, b04 Antalya)
alınmadı: b03 uydurma bir sabah anlatıyor, b04 olgu listesinde olmayan yerel bilgiler taşıyor.
Üç önce/sonra çifti (anlam hakemi kayıp ya da ekleme bulmadı): `once-sonra-elektrikli-el-aletleri.md`,
`once-sonra-kimyasal-hammadde.md`, `once-sonra-iphone-alarm.md`.
