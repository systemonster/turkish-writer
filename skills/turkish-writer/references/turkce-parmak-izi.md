# Türkçeye özgü yapay zekâ parmak izleri

İngilizce kaynaklardaki listeler (Wikipedia Signs of AI writing, no-ai-slop, humanizer)
kelime ve noktalama izleridir; Türkçede izlerin yarısı kaybolur, yerine Türkçenin kendi
izleri geçer. Her madde: **iz → nedeni → ölçüm → düzeltme.** Bir kısmı ölçülmüş, ayırt
edici izdir; bir kısmı ayırt etmediği görülen ama site ve blogda yine üslup kusuru olan
alışkanlıktır.

**Eşiklerin kaynağı** (depoda `tests/kalibrasyon/`). **SONUC.md:** LLM öncesi 100 insan
metni (50 haber, TR-News 2009-2020; 50 blog ve forum, OSCAR 2018) ile varsayılan
ayarlarda 100 gpt-4o / gpt-4o-mini metni. **SONUC-SITE.md:** bağımsız sınama; 40 site ve
40 blog insan metni (OSCAR 2018) ile 80 gpt-4o / gpt-4.1-mini metni, 20'si "doğal yaz"
istemli. **Güç** = max(AUC, 1-AUC): 0,5 ayırt etmiyor, 1 tam ayırıyor, 0,65'in altı iz
sayılmaz. **Sınırlar:** örneklemler küçük (±0,07-0,12), yalnız OpenAI modelleri; insan
site metni 2018 KOBİ ve SEO metni, yani özenli kurumsal yazı değil. "Ölçülmedi" yazan
eşikler kitaba ya da gözleme dayanır. `scripts/tr-scan.mjs` ölçülenleri sayar.

**Kalibrasyonun en önemli sonucu:** LLM Türkçesini en iyi ayıran şey kelime ya da ek
değil, **cümle uzunluğunun tekdüzeliğidir** (§15; güç haber ve forumda 0,93, site ve
blogda 0,76-0,83). Uzun cümle insan işaretidir. İki derlemde birden tutan öteki
ayırıcılar: "ve" yoğunluğu ve birkaç kalıp. "bir" yoğunluğu bağımsız derlemde çöktü.

Kaynaklar: **Oxford** = *The Oxford Turkish Grammar* (2020); **Lewis** = *Turkish
Grammar* (2. bs.); **Şimşek** = "Türkçe Eğitiminde Yaratıcı Yazma" (2021); **insanca**
= tahiryildiz/insanca v1.12.0 (MIT); **humanify** = durmazoguzhan/turkish-humanify
(MIT); ikisinin kuralları yeniden yazıldı.

---

## 0. Yanlış yere düşen vurgu (odak kayması): "çeviri gibi" hissinin kökü

**İz.** Cümle dil bilgisi olarak doğru ama sesli okununca yanlış kelime öne çıkıyor.
Okur "bir terslik var" diye hissediyor ama nedenini söyleyemiyor.

**Neden.** Türkçe cümle bilgiyi şu sırayla dizer (Oxford, §29.5 / s. 391-392):

`Konu · zaman · yer · diğer tümleçler · ODAK · Yüklem · (sonradan ekleme)`

- **Konu** (baş): okurun zaten bildiği, çoğu zaman belirli öğe. Cümle onun hakkındadır.
- **Odak** (yüklemden hemen önce): yeni bilgi, vurgulanan öğe ya da belirsiz öğe.
  Sesli okumada cümle vurgusu buraya düşer.
- **Yüklemden sonra**: bağlamdan bilinen, hatırlatma olsun diye anılan öğe. Vurgu almaz.

İngilizcede yeni bilgi cümlenin **sonuna** gider. Model İngilizce bilgi sırasıyla
düşünüp Türkçe kelime dizdiğinde, vurgulanması gereken öğe cümlenin başında kalır,
yüklemden önceki konuma sıradan bir ayrıntı oturur.

**Ölçüm.** Ölçülmedi; sesli okuyarak bulunur.

| Cümle | Vurgulanan (yüklemden hemen önce) |
|---|---|
| Biz projeyi **10 günde** bitiriyoruz. | süre |
| Projeyi 10 günde **biz** bitiriyoruz. | yapan |
| 10 günde **projeyi** bitiriyoruz. | ne bittiği |

Üçü de doğru Türkçe. Hangisinin doğru olduğu, **okurun o an neyi merak ettiğine** bağlı.
Süreyi satıyorsan süre yüklemin önüne gelir.

**Soru testi.** Her cümle görünmez bir soruya cevap verir; odak o sorunun cevabıdır
(Oxford, §29.5 / s. 392; Lewis, §XV.2 / s. 240-241). "Kurulumu **ekibimiz** yapıyor"
kim sorusunu, "Ekibimiz kurulumu **iki günde** yapıyor" ne kadar sürede sorusunu cevaplar.

**Odak konumunun kuralları:**

1. **Belirli öğe belirsizden önce gelir:** *çocuğa hikâyeyi anlattı* / *hikâyeyi bir
   çocuğa anlattı* (Lewis, §XV.2 / s. 240).
2. **Eksiz (çıplak) nesne yüklemle tek birimdir,** araya zarf girmez (Oxford, §29.5 /
   s. 392; §9.2.3): ~~Site hızlı kuruyoruz~~ → "Hızlı site kuruyoruz" / "Siteyi hızlı kuruyoruz".
3. **Zarflar genelden özele dizilir;** zaman yerden önce, tarz ve araç zarfı yükleme en
   yakın durur (Oxford, §29.5 / s. 393). Bu yüzden "bir şekilde", "detaylı olarak" gibi
   boş tarz zarfları kendiliğinden odağa düşüp vurguyu çalar.
4. **Zamir yazmak, onu odağa koymaktır.** Yazılan kişi zamiri çoğu zaman odaktadır ve
   sık sık *de* alır: *Bunu ben de gördüm* (Oxford, §29.5 / s. 391; Lewis, §V.2 / s. 68).
   Gerekçesiz "Biz" ile açılan cümle "başkaları değil, biz" iması taşır (§11).
5. **Yüklemden sonraya yalnız bilinen öğe gider:** *Dün akşam sinemaya gitti Ali*
   (Oxford, §29.5 / s. 392-393). Tamamlanmış cümleye sonradan niteleyici eklemek de
   doğaldır: *Kayseri'de bir damadı var, doktor* (Lewis, §XV.4 / s. 244-245). Bu artlama
   serbesttir ve devrik dozuna sayılmaz (insanca Ak18). Yeni bilgiyi sona atmak ise
   İngilizce sıradır: ~~Teslim ediyoruz sitenizi 10 günde.~~
6. **Cümle fiille başlamaz,** buyruk ve acil soru dışında (Lewis, §XV.3 / s. 243-244).
7. **Var/yok cümlesinde odak var/yok'un önüdür:** "Sitede **canlı destek** var"
   (Lewis, §XV.2 / s. 241).
8. **de ve bile, vurguladıkları kelimenin arkasına gelir;** vurgu önlerindeki heceye
   düşer: *Onu ben de gördüm* / *Ben onu da gördüm* (Oxford, §26.3.1-2 / s. 333-334;
   Lewis, §XIII.2a / s. 206).

**Fiilsiz amaç kuyruğu.** Yüklem ortada biter, arkasına fiilsiz bir "-mek için" öbeği
sarkar. Kuyruğa fiilini ver ya da öne al. Birinci tekil anlatıdaki kısa "yanmasın diye"
gibi kuyruklar sorun değildir (humanify layer-2 §8).
~~Formu tek yerde topladık, o da talepleri kaçırmamak için.~~ → "Talepleri kaçırmamak
için formu tek yerde topladık."

**Vurguyu kalıpla değil, yapıyla kur.** "İşte bu yüzden", "asıl önemlisi" vurguyu
söyler ama taşımaz. Blogda anafor (aynı açılışın iki kez dönmesi) ya da yerinde bir
devrik iş görür (insanca Ak6).
"Asıl önemlisi, maliyet düştü." → "Hiç bu kadar ucuz, hiç bu kadar kolay olmamıştı."

**Sık görülen kayma örnekleri:**

| Çeviri kokan | Doğal | Neden |
|---|---|---|
| Size özel çözümler sunuyoruz işletmeniz için. | İşletmenize özel çözüm sunuyoruz. | Devrik cümle burada vurgu değil, İngilizce sıra (*for your business* sonda) |
| Sitenizi hızlı ve güvenli bir şekilde kuruyoruz. | Sitenizi hızlı kuruyoruz, güvenliğini de biz alıyoruz. | "bir şekilde" zarfı yüklemin önüne oturup asıl bilgiyi (hız) itiyor |
| Çiftlikte, yaşı 40 olan fillerle tanışma fırsatımız oldu. | Kılavuzumuza fillerin yaşını sorduğumda aldığım cevap 40 olunca şaşırmamak elde değil. | Yeni bilgi (40) sıfat öbeğine gömülmüş, yüklemi boş kalıp ("fırsatımız oldu") almış; vurgu kalıba düşüyor |

**Olayı sahne olarak anlat, sonucu kalıba gömme.** İnsan olguyu olay sırasıyla verir
(sordum → cevap → tepki); model onu sıfata çevirip yüklemi boş kalıba verir. Fark
derleminde (`tests/kalibrasyon/SONUC-FARK.md`: 28 insan metni, aynı olgulardan GPT
metinleri) 7 çiftte. Kalıplar: `yasakli-kaliplar-tr.md` §6. Olay sırası kaynakta yoksa
sahne uydurma; olguyu yüklemin önüne al.

**Düzeltme (her cümleye):** cümlenin cevap verdiği soruyu ve tek asıl bilgisini bul;
cevabı yüklemin hemen önüne, bilinen öğeyi başa koy. O konumu dolgu zarfı işgal
ediyorsa sil, gerekçesiz kişi zamirini sil, yüklemden sonra kalan yeni bilgiyi öne al,
"mi/de/bile"yi vurgulanan kelimenin arkasına taşı. Sonra sesli oku: vurgu, cümlenin
satmak istediği şeye mi düşüyor?

**Yazı vurgusu da aynı kurala uyar.** Kalın yazılan kelime, sesli okumada vurgulanan
kelimeyle **aynı** olmalı; model kalını anahtar kelimeye (SEO refleksi) koyar. Paragrafta
en fazla bir kalın, çoğunda sıfır.

**Soru eki "mi" de vurgu taşır** ve sorgulanan öğenin hemen arkasına gelir: "Siteyi
**siz mi** yapıyorsunuz?" (yapanı sorar) / "Siteyi siz **yapıyor musunuz**?" (eylemi
sorar). SSS'de tipik LLM hatasıdır. "mi" ayrı yazılır (`tdk-yazim.md`).

---

## 0b. Söylem parçacıkları: yokluğu da fazlası da iz

**İz.** Metin parçacıksız ve "kitap gibi"; bağı "ayrıca, bunun yanı sıra, ek olarak,
dolayısıyla" taşıyor. Ya da tersi: "doğal görünsün" diye her paragrafa "zaten, işte,
yani" serpiştirilmiş.

**Neden.** Bu kelimelerin İngilizcede tek karşılığı yoktur; model çeviri düzleminde
bağlaç arar. Türkçede tutum ve bağlantı çoğu zaman bu küçük kelimelerle kurulur.

**Ölçüm.** Kalibrasyonda ölçülmedi. humanify'ın 12 model metni ile 9 yayımlanmış metin
karşılaştırmasında parçacık yokluğu "çok yaygın" iz çıktı; kaynakta olmayan bir aracın
dört kez eklenmesini ise kör okurlar hemen yakaladı.

**Genel kural.** Parçacık yasak değildir ve argo değildir (argo: `yasakli-kaliplar-tr.md`
§9). Etkilediği kelimenin arkasına gelir (§0, kural 8); *de* cümle başına gelmez
(Lewis, §XIII.2). **Blogda doğal yerinde serbest, ama kota doldurur gibi eklenmez.**
Site metninde *de, bile, ise, yani, artık* yeter; *ya, hani, işte, meğer, zaten*
blog ve samimi tonun kelimeleridir.

| Parçacık | İşlevi ve kaynak | Yerinde kullanım | Dikkat |
|---|---|---|---|
| **de/da** | "de, bile"; yeri anlamı değiştirir. Bağlaç olarak sonuç ya da karşıtlık: *Bizi gördü de selam vermedi*; pekiştirme: *hiç de, daha da* (Oxford, §26.3.2, §27.1.1; Lewis, §XIII.2) | "Kurulumu da biz yapıyoruz." / "Hiç de zor değil." | "Ayrıca"nın yerini alır. Ayrı yazılır, kesme almaz: ~~Ayşe'de~~ |
| **bile** | Beklenenin ötesi; *hatta* öbeğin önüne gelir, *dahi* seyrekleşti (Oxford, §26.3.1; Lewis, §XIII.2g) | "Kod bilmeniz bile gerekmiyor." | Reklamda yığılırsa şişirme (§16) |
| **ise** | Konu değiştirir, karşıtlık kurar (Oxford, §26.3.3; Lewis, §XIII.27) | "Başlangıç paketi tek sayfa, kurumsal paket ise beş sayfa." | Her "ama"nın yerine konmaz |
| **ki** | Sonuç (*öyle yavaşladı ki*), fark etme (*baktık ki*), endişeli soru (*Yetişir mi ki?*), *-dır ki*, *belli ki, demek ki, ne var ki* (Lewis, §XIII.15; Oxford, §33.1) | "Sayfa öyle yavaş açılıyordu ki ziyaretçi bekleyemiyordu." | *that / which* karşılığı değildir (§10) |
| **ya** | Sonda onay ("biliyorsun ya"), başta "peki ya", arada "ama" (Oxford, §26.3.4; Lewis, §XIII.32) | "İlk ay ücretsiz demiştik ya." / "Ya sunucu çökerse?" | Hizmet sayfasında seyrek |
| **işte** | Gösterir, tam onu işaret eder; *hani … ya, işte o* (Lewis, §XIII.28, §XIII.24c) | "İşte bu yüzden önce hızı ölçüyoruz." | "İşte X'in 5 yolu" başlık klişesi |
| **hani** | Ortak bilgiyi çağırır; tutulmayan sözü sorar (Lewis, §XIII.24) | "Hani sitede başvuru formu var ya, talepler oraya düşüyor." | Yalnız samimi blog |
| **yani** | Açıklama ve sonuç (Oxford, §27.1.1); benzeri *demek ki* (Lewis, §XIII.20) | "Sunucu yurt içinde, yani veriler Türkiye'de kalıyor." | Dolgu "yani" silinir |
| **meğer** | Sonradan fark edilen; *-mış* ile (Lewis, §XIII.14) | "Meğer sorun eklentideymiş." | Blog anlatısı |
| **zaten** | Önceden var olan ya da beklenen durumu hatırlatır, gerekçeyi pekiştirir | "Siteniz zaten hazırsa yalnız taşıma yapıyoruz." | Savunmacı ton taşıyabilir. Kitaplarda işlenmiyor, gözleme dayanır |
| **artık** | "Nihayet", "bundan sonra", "yeter" (Lewis, §XII.19) | "Faturaları artık panelden indirebilirsiniz." | "Artık daha hızlı!" reklam klişesi |

**Düzeltme.** "Ayrıca …" yerine *de* dene: "Bakımı da biz yapıyoruz." "Bu nedenle"
yerine *yani*, ulaç ya da *-diği için*. Kaynakta olmayan bir aracı (parçacık, cümle
sonu "ama", devrik) yazı boyunca üç dört kez eklediysen biri dışında hepsini sil.

---

## 1. "bir" enflasyonu

**İz.** 100 kelimeye düşen "bir" sayısı yüksek.

**Neden.** İngilizce *a/an* zorunlu belirsiz tanımlıktır. Model İngilizce düşünüp Türkçe
yazdığında bunu birebir taşır. Türkçede "bir" çoğu yerde düşer ve düştüğünde cümle
doğallaşır.

**Ölçüm.** **İz değil, üslup.** Haber ve forumda ayırdı (100 kelimede insan 1,99, LLM
3,15, güç 0,70), ama bağımsız derlemde çöktü: sitede 1,47'ye 1,47 (0,54), blogda insan
3,03, LLM 2,81 (ters yön). Blog yazan insan da çok "bir" kullanıyor. Tarayıcı skora
katmaz. Yine de *a/an* kalkı olan "bir" cümleyi çeviri gibi okutur; düzeltmeye değer.

**Düzeltme.** Sayı anlamı ("bir kişi geldi, iki kişi geldi") ya da vurgu ("bir sen
eksiktin") taşımayan her "bir"i sil, cümleyi yüksek sesle oku. Silmek anlamı
daraltıyorsa ("herhangi bir çözüm" → "tek çözüm") silme.

| LLM | Düzgün |
|---|---|
| Kurulumu hızlı bir şekilde yapıyoruz. | Kurulumu hızla yapıyoruz. |
| Bir sorunuz olursa yazın. | Sorunuz olursa yazın. |
| Bu bir testtir. | Bu bir test. (Sınıflandırma: "bir" kalır, yalnız "-dir" düşer.) |
| Ahmet bir yazılım geliştiricidir. | Ahmet yazılım geliştirici. |

**Kitap kuralları:**
- **Kimlik ya da meslek yükleminde "bir" yazılmaz:** *Bir zamanlar ben de çocuktum*
  (Lewis, §III.3 / s. 54). **Sınıflandırma** ("ne?" sorusunun cevabı) ise alır:
  *Gergedan bir hayvandır* (Oxford, §24.7.1 / s. 292).
- **Yeri sıfattan sonradır ve sıfatlı adda çoğu zaman kalır:** "hızlı bir site",
  "iyi çalışan bir platform"; *bir yeni araba* "bir tane" vurgusu taşır (Oxford, §8.2.1 /
  s. 87; Lewis, §III.3 / s. 54; insanca §16).
- **"a"nın karşılığı çoğu zaman çıplak addır:** "blog yazısı yazıyoruz" (etkinlik) /
  "bir blog yazısı" (tek, somut) / "blog yazısını" (bilinen) (Oxford, §9.2.3).

Dikkat: "bir" tamamen yasak değil. "Bir gün", "bir bakıma", "bir de" gibi kalıplarda
kalır. Silmek için gerekçe, silmemek için de gerekçe olmalı.

---

## 2. "ve" zinciri ve ulaç

**İz.** Cümleler "ve" ile bağlanmış art arda çekimli fiillerden oluşur.

**Neden.** Türkçe yan cümleyi **ulaçla** bağlar; zaman, neden, tarz, karşıtlık ve
benzetmenin her birinin kendi eki vardır (Oxford, §29.4 / s. 389-390). *ve* konuşmada
az kullanılır, yazıda da yerine *ile, -ip, de* geçer (Lewis, §XIII.1 / s. 206). Model
İngilizce "and" kalıbını taşır; sonuç doğru ama yavan bir metindir.

**Ölçüm.**
- **"ve" yoğunluğu izdir, iki derlemde de:** 100 kelimede haber ve forumda insan 2,09,
  LLM 3,28 (güç 0,72); sitede 3,84'e 6,05 (0,79); blogda 2,51'e 3,88 (0,73). Eşik türe
  bağlı: blog ve serbest metinde 2,7; site ve haber dili zaten "ve" ile dolu, orada
  yaklaşık 3,9.
- **Ulaç sayısı iz değildir.** Cümle başına ulaç haber ve forumda 0,29'a 0,30 (güç
  0,50), sitede 0,51; blogda LLM biraz **fazla** kullanıyor (0,67).

Yani ulaç eklemek metni "insan" yapmaz, denetleyiciyi de yanıltmaz. Ulaç, **"ve"
zincirini çözmenin ve cümleyi Türkçe bağlamanın aracıdır**; değeri doğallıkta, ölçümde değil.

**Hangi ulaç, ne zaman:**

| Ek | "ve" yerine ne zaman | Örnek |
|---|---|---|
| **-(y)Ip** | Aynı özne, art arda iki eşit eylem. Zaman, kişi, olumsuzluk ikinci fiilde (Oxford, §27.1.2; Lewis, §XI.5) | "Formu doldurup gönderin." |
| **-(y)ArAk** | İkinci eylem **nasıl, hangi yolla** yapıldı; eş zamanlı (Lewis, §XI.3; Oxford, §27.3.2) | "Görselleri sıkıştırarak açılışı hızlandırdık." |
| **-(y)IncA** | Biri bitince öteki; olumsuzla neden (Lewis, §XI.6; Oxford, §27.4.2) | "Ödeme onaylanınca kurulum başlar." / "Yanıt gelmeyince tekrar yazdık." |
| **-DIkçA** | Orantı: biri arttıkça öteki (Lewis, §XI.14; Oxford, §27.5.7) | "Sayfa ağırlaştıkça ziyaretçi kaçar." |
| **-mAdAn** | Beklenen eylem olmadan; "önce" ile öncelik (Oxford, §27.4.6; Lewis, §XI.12) | "Test etmeden yayına almıyoruz." |
| **-(y)ken** | Süregiden durum sırasında; karşıtlık da. Özneler farklıysa özne yazılır (Lewis, §XI.34; Oxford, §27.3.1) | "Siz içeriği hazırlarken biz tasarımı bitiriyoruz." |
| **-DIğIndA** | Tek seferlik anı; süregiden durum için *-ken* (Oxford, §27.4.5) | "Sipariş geldiğinde bildirim düşer." |

Ayrıca *-(y)AlI* ("geleli"), *-mAktAnsA* (tercih), *-r -mAz* ("gelir gelmez"), *-DIğI
halde* (karşıtlık) (Lewis, §XI.10, §XI.13, §XI.22, §XI.30).

**Kitaplardan sınırlar:**
- **Bir cümlede tek -ip;** kalıplaşmış ikilemeler dışında çağdaş yazar birden çok -ip
  kullanmaz (Lewis, §XI.5 / s. 179). Tek cümlede üç ulaç okunmaz (humanify §2).
- **-ip de** kopukluk ya da karşıtlık koyar: "Siteyi kurup da içeriği boş bırakmak işe
  yaramaz" (Lewis, §XI.5; Oxford, §26.3.2).
- **"ve" yasak değil:** *geldi oturdu*, *gelip oturdu*, *geldi ve oturdu* üçü de olur
  (Oxford, §27.1.6 / s. 344-345). Özneleri farklı iki bilgide virgül ya da ayrı cümle
  çoğu zaman ulaçtan iyidir.
- **-meksizin** yerine *-madan*, **-dığı nispette** yerine *-dıkça*, farklı özneli
  **-makla** yerine *-dığı için* (Lewis, §XI.25, §XI.29, §XI.31; takdirde için §9).
- **Her ulaç bir ilişki iddiasıdır.** *-ince* zaman ya da neden, *-dikçe* orantı kurar.
  Düzelt kipinde kaynakta olmayan bir ilişkiyi ulaçla ekleme (bkz. `mantik-kapisi.md` Kapı 6).

**Sahte derinlik: cümle sonuna asılan "-arak" kuyruğu.** Bilgi taşımayan ulaç öbeği
cümleye derinlik süsü verir: *katkıda bulunarak, gözler önüne sererek, altını çizerek,
ışık tutarak, pekiştirerek, yansıtarak*. Kuyruğu sil, yerine olgu listesinde varsa
somut sonucu koy. insanca bu kuyrukla biten cümlelerin payı %15'i geçerse kusur sayıyor
(ölçülmedi). Kaynak: insanca §3; tarayıcıda `yuzeysel-ulac`.
"Proje, bölge ekonomisine katkıda bulunarak istihdamı artırıyor." → "Proje bölgede yeni
iş açıyor." (Kaç iş açtığı ancak olgu listesinde varsa yazılır.)

**Düzeltme.**

| LLM | Düzgün |
|---|---|
| Formu doldurdunuz ve gönderdiniz. | Formu doldurup gönderdiniz. |
| Sayfayı açtık ve ayarları kontrol ettik. | Sayfayı açıp ayarları kontrol ettik. |
| Zaman geçiyor ve maliyet artıyor. | Zaman geçtikçe maliyet artıyor. |
| Raporu hazırladım ve onu size gönderdim. | Raporu hazırlayıp size gönderdim. |
| Siz uğraşmıyorsunuz, biz kuruyoruz. | Siz uğraşmadan biz kuruyoruz. |

---

## 3. `-maktadır / -mektedir` ve `-dır / -dir` yığılması

**İz.** Yüklemlerin çoğu bildirme kipinde: "sunmaktadır", "sağlanmaktadır", "süre 10
iş günüdür".

**Neden.** Model "kurumsal Türkçe" ile gazete ve makale dilini karıştırır. Orada
*-mektedir, -mıştır* anlama bir şey katmaz, yalnız resmî üslup belirtir (Oxford,
§24.7.1 / s. 291). Vurgu için -dır nutuk dilidir (Oxford, §24.7.2 / s. 296).

**Ölçüm.** İz değil. Haber ve forumda *-maktadır* iki grupta da medyan 0, -DIr oranı
ayırt etmedi (güç 0,52). Site metninde ikisi de **insanda daha sık** (2018 KOBİ dili:
"hizmet vermektedir"); -DIr yalnız blogda LLM'de sık (0,74). Yine de site metninde ağır
durur: **üslup kusuru** olarak düzeltilir. Üslup eşiği (ölçülmedi): sayfada 2'den fazla
*-maktadır*; cümlelerin %15'inden fazlası -DIr ile bitiyor.

**Düzeltme.** Neyi anlattığına bak:
- **Tanım, özellik, alışkanlık, genel doğru → geniş zaman.** Hizmet ve ürün sayfasındaki
  tanımlar çoğunlukla bunu ister. Özelliği *-yor* ile anlatmak metni canlı yayın gibi
  okutur (humanify §5).
- **Şu anki, süregelen durum → -yor.** Blogda süregelen durum için sıcak durur.

| LLM | Düzgün |
|---|---|
| Sistem otomatik çalışmaktadır. | Sistem otomatik çalışır. (özellik) |
| Raporlar aylık olarak tarafımızca iletilmektedir. | Raporu her ay göndeririz. |
| Şu anda yeni sürüm üzerinde çalışılmaktadır. | Şu anda yeni sürüm üzerinde çalışıyoruz. |
| Süre 10 iş günüdür. | Süre 10 iş günü. |

**-dır tahmin bildirir.** Konuşmaya yakın metinde *Belge kasadadır* "kasada olmalı"
diye anlaşılır; *biliyorsunuzdur* = "biliyorsunuz herhâlde" (Lewis, §VIII.4 / s. 98;
§VIII.42 / s. 139). Kesin bilgiyi -dır ile verme; tahmini bilinçli yaz: "Formunuz
bize ulaşmıştır."

**-dır'ın kaldığı yerler:**
- genel geçer yargı ve **tanım cümlesi**: *Kavak ağaçları büyüktür*; blogdaki "X nedir?"
  sorusunun cevabı: "Temettü, şirketin kârından ortağa ödenen paydır" (Oxford, §24.7.1 /
  s. 291-292; humanify §6; insanca Ak13);
- standart, şartname, teknik koşul;
- atılınca yanlış anlaşılacak ad yüklemi ("En çok sorulan soru fiyattır");
- *-dır ki* kalıbı (Lewis, §VIII.4 / s. 97).

İstisna: sözleşme, KVKK metni, yasal uyarı. Orada bildirme kipi **bilinçli** bir
kesinlik aracıdır, dokunma.

**Koşaç kaçışı.** Düz "X, Y" ya da "X'te Y var" yerine tören fiili: *işlevi
görmektedir, konumundadır, olarak öne çıkmaktadır, niteliği taşımaktadır, özelliğine
sahiptir, barındırmaktadır*. İngilizce *serves as* kalıbının karşılığı. -DIr kuralı ekin
kendisine bakar, bu dolambaçlı yükleme bakmaz (insanca §48; tarayıcıda `kosac-kacisi`).
"Galeri, derneğin sergi alanı işlevi görmektedir." → "Galeri, derneğin sergi alanı."
"Uygulama çevrim dışı çalışma özelliğine sahiptir." → "Uygulama çevrim dışı da çalışır."

---

## 4. Edilgen çatı ve "tarafından"

**İz.** Sorumlu öznesi silinmiş cümleler: "hazırlanır", "gerçekleştirilmektedir",
"tarafımızca sağlanmaktadır".

**Neden.** Türkçe edilgeni yalnız yapan önemsiz ya da bilinmiyorsa kullanır (Lewis,
§VIII.54 / s. 150; Oxford, §30.4 / s. 408). Özne düşürmek varken edilgenleştirmek iki
kat yapaydır.

**Ölçüm.** İz olarak zayıf: haber ve forumda güç 0,57; bağımsız derlemde edilgen adedi
LLM'de biraz fazla (0,67-0,72, uzunluğa oranlanmadı). Site metninde kimin yaptığını saklayan cümle olduğu için **üslup kusuru** olarak
kalır. Üslup eşiği (ölçülmedi): bir bölümde 3'ten fazla edilgen yüklem;
`tarafımızca|firmamızca` her geçtiği yerde.

**Düzeltme.** Etkene çevir, özneyi düşür.
"Rapor tarafımızca hazırlanır" → "Raporu hazırlarız".
"Karar yönetim kurulu tarafından alındı" → "Kararı yönetim kurulu aldı."

**Doğal edilgenler (dokunma):**
- **Kişisiz edilgen** Türkçeye özgüdür, "insanlar …" yerine geçer: *Buradan girilmez*
  (Lewis, §VIII.54 / s. 150-151; Oxford, §30.4.4). "Kargo ücreti alınmaz."
- **"tarafından"** karşıtlık ya da vurgu gerektiğinde, çoğunlukla kurumla kalabilir:
  *Dünya Sağlık Örgütü tarafından yapılan açıklama* (Oxford, §30.4.8 / s. 414-415).
  "tarafımızca, firmamızca" için bu gerekçe yoktur.

---

## 5. Evrensel hafif fiiller

**İz.** `gerçekleştirmek, sağlamak, oluşturmak, bulunmak, yer almak, ifade etmek,
söz konusu olmak` fiilleri her yerde.

**Neden.** Bunlar yüksek olasılıklı, düşük anlamlı fiillerdir. Model somut fiil seçmek
yerine hafif fiil + ad kalıbına kaçar.

**Ölçüm.** Türe bağlı: 200 kelimede haber ve forumda güç 0,66, blogda 0,71, sitede 0,50
(insan site metninin %57'sinde de var). Tarayıcı skora katmaz; üslup notudur.

**Düzeltme.**

| LLM | Düzgün |
|---|---|
| Kurulumu gerçekleştiriyoruz. | Kuruyoruz. |
| Size kolaylık sağlıyor. | İşinizi kolaylaştırıyor. |
| Bir ekip oluşturduk. | Ekip kurduk. |
| Listede yer almaktadır. | Listede var. |
| Bu durum söz konusu değildir. | Böyle bir şey yok. |

---

## 6. Ad tamlaması zinciri ve tamlama türü

**İz.** Art arda üç ve daha fazla ad tamlaması: "müşteri memnuniyeti artırma süreci
yönetimi", "kurumsal kapsam için yazılı plan hazırlama hizmeti".

**Neden.** İngilizce *noun stacking* Türkçeye iyelik zinciri olarak geçer; üç halkadan
sonra okur zinciri çözemez.

**Ölçüm.** Ölçülmedi. Gözle: aralarında fiil olmadan art arda 3+ iyelik ya da tamlama eki.

**Düzeltme.** Zinciri fiille kır.
"Müşteri memnuniyeti artırma süreci yönetimi" → "Müşteri memnuniyetini nasıl
artıracağımızı biz yönetiyoruz."

**İlgili tamlama hataları:**
- **Eksiz ad + ad Türkçe dışıdır** (malzeme ve özellik dışında: *taş köprü, kadın
  doktor*) (Oxford, §31.4.1 / s. 470): ~~veri güvenlik politikası~~ → "veri güvenliği politikası".
- **Belirtili** tamlama belirli bir şeye aitliği, **belirtisiz** tamlama türü anlatır
  (Lewis, §II.17 / s. 42-43): "sitenin hızı" (bu site) / "site hızı" (genel kavram).
- **Zincirde iyelik eki tekrarlanmaz:** *Ankara Kız Lisesi* (Lewis, §II.19 / s. 45).
  Sık yanlış: ~~web sitenin~~ → "web sitesinin".

---

## 6b. Sıfat-fiil, sağa dallanma ve adlaştırma

**İz.** Niteleyen adın arkasına asılmış: önce ad söyleniyor, niteleme virgülle,
*ki* ile ya da "bu sistem…" diye ikinci cümlede geliyor. İstek bildiren yerde olgu eki
ya da tersi.

**Neden.** İngilizcede niteleyen öbek adın arkasına gelir (sağa dallanır), Türkçede
önüne. Türkçede ilgi zamiri yoktur; ilgi cümlesi yalnız sıfat-fiille kurulur ve adın
**önüne** gelir (Oxford, bl. 32 giriş / s. 495; Lewis, §XV.3 / s. 242). *that* gibi
bağlaçlar Türkçeye yabancıdır (Oxford, bl. 33 giriş / s. 553).

**Ölçüm.** Kalibrasyonda ölçülmedi. humanify 12 metin üzerindeki ölçümünde sağa dallanmayı
"çok yaygın" iz sayıyor (layer-2 §1). Tarayıcıda `saga-dallanma` kısmen yakalar.

**Sağa dallanmayı düzelt.** Niteleyeni sıfat-fiille adın önüne al.
"Bir sistem kurduk, bu sistem her gece verileri tarıyor." → "Her gece verileri tarayan
bir sistem kurduk."
Sınır: öne alınan öbek 10-12 kelimeyi aşıyorsa iki cümle kur; sıfat-fiilin içine ikinci
bir sıfat-fiil yerleştirme (humanify layer-2 §1).

**Ekin seçimi.**
- **-(y)An:** nitelenen ad yan cümlenin öznesiyse: "sipariş veren müşteri". Genel özne
  için de bu seçilir: "Formu dolduran herkes indirim alır" (Oxford, §32.1; Lewis, §XVIII.3b).
- **-DIK / -AcAK + iyelik:** nitelenen ad nesne ya da tümleçse: "kurduğumuz siteler",
  "logosunu tasarladığımız marka" (Oxford, §32.4 / s. 516; Lewis, §XVIII.2 / s. 260-262).
- **Olgu -DIK / -AcAK, istek -mA:** "Formu gönderdiğinizi bildiriyoruz" (olgu) / "Formu
  göndermenizi rica ederiz" (istek). *istemek, yasaklamak* yalnız -mA, *sanmak* yalnız
  -DIK alır; *söylemek* ikisini de alır, anlam değişir: "beklediğini söyledim" ≠
  "beklemesini söyledim" (Lewis, §XVII.1 / s. 254-255; Oxford, §33.5.3-5 / s. 584-591).
- **Dolaylı soru** da -DIK / -AcAK ile: "Hangi paketi seçeceğinizi bilmiyorsanız yazın"
  (Lewis, §XVII.1 / s. 255).

---

## 7. Telgraf dili (fiilsiz satır)

**İz.** Kullanıcıya görünen satır cümle değil, anahtar kelime dizisi:
"Form-kayıt-bildirim talep akışı", "Ölçüm panosu ve kanal kaydı".

**Neden.** Dar karakter sınırı verildiğinde model fiili atar, adları yığar.

**Ölçüm.** Ölçülmedi. Gözle: yüklemsiz, 4+ kelimelik, kullanıcıya görünen satır.

**Düzeltme.** Alanı genişlet, metni bozma. "Hangi kanaldan kaç talep geldiğini tek
ekranda görürsünüz."

---

## 8. Devrik cümle: sıfır ya da fazla

**İz.** Model SOV kuralını hiç esnetmez. Doğallaştırılmış metinde ise tersi görülür:
"doğal görünsün" diye art arda devrik (~~Geldi sonunda bahar. Açtı çiçekler.~~).
Taklitçinin hatası devriği **norm olarak** kullanmaktır (Lewis, §XV.3 / s. 241-242);
humanify'ın kör okurları bunu "sonradan uygulanmış devrik dokunuşlar" diye yakaladı.

**Ölçüm.** Kalibrasyonda ölçülmedi; regexle güvenilir sayılamaz. Doz (tavan, kota
değil) humanify'ın 9 yayımlanmış metin üzerindeki ölçümünden: blogda yazı başına 2-3, kurumsal
metinde hemen hiç. Site ve blog için doz: `sicil.md` doz tablosu.

**Düzeltme.**
- Her devrik bir iş görmeli: vurgu ya da geri plan bilgisi. İşi yoksa düz sıraya çevir.
- Yüklemden sonraya yalnız bilinen öğe gider (§0, kural 5). Bu artlama serbesttir ve
  doza sayılmaz.
- Sıfır devrik tek başına kusur değildir. Devrik eklemek için gerekçe arama.
- **Blogda artlama iyi yazının işaretidir.** Yüklemden sonra kısa bir hüküm ya da
  bilinen öğe: "Ye, iç, gez, görlük çok keyifli bir şehir Lviv.", "…kişi başına en çok
  kafe düşen şehirlerin başında geliyormuş Lviv, haklı.", "…bir polis okulunda buldum
  kendimi." Fark derleminde yüklemle bitmeyen cümle oranı insanda 0,25, gpt-4o'da 0,17
  (17 çiftte; ölçüm kaba). Artlanan öğe bilinen öğe ya da hüküm olur, yeni bilgi
  değil (§0, kural 5).

"İşin zor tarafı burası." → "Burası işin zor tarafı." / "Bunu da mı yapacaktık?": doğal.

---

## 9. İngilizce edat kalıpları ve bürokratik bağlar (çeviri kokusu)

**İz.** `adına, noktasında, açısından, bazında, nezdinde, ile ilgili olarak, konusunda,
-e yönelik, -e ilişkin, bağlamında, doğrultusunda, kapsamında` doldurucu olarak.
Ayrıca `-dığı takdirde, -mesi nedeniyle, -makla birlikte, diğer taraftan`.

**Neden.** İngilizce *in terms of / with regard to / in order to* kalıplarının
birebir karşılığı aranıyor. Türkçede bunların çoğunun yerine **-mek için**, bir ek
ya da hiçbir şey gelir. *-dığı takdirde* yenilikçi yazarlarca beğenilmez (Lewis,
§XI.23 / s. 186). *diğer taraftan / öte yandan* İngilizce *on the other hand* değildir;
karşıtlığı zayıftır, "ayrıca"ya yakındır (Lewis, §XIII.21 / s. 216).

**Ölçüm.** Bürokratik kalıp listesi insan metinlerinin %29'unda, LLM metinlerinin
%28'inde çıktı: **ayırt etmiyor.** İz değil, üslup kusuru; site ve blog metninde yine
düzeltilir. Çeviri metaforları ve hitap kalıpları: `yasakli-kaliplar-tr.md` §7.

**Düzeltme.**

| LLM | Düzgün |
|---|---|
| Karar vermek adına | Karar vermek için |
| Maliyet açısından bakıldığında | Maliyet tarafında |
| Bu konu ile ilgili olarak | Bu konuda → (çoğu zaman sil) |
| Proje bazında fiyatlandırma | Her projeye ayrı fiyat |
| Başvurunuz onaylandığı takdirde | Başvurunuz onaylanırsa |
| Talebin artması nedeniyle | Talep arttığı için |
| Ücretli olmakla birlikte | Ücretli olsa da |
| Diğer taraftan fiyatı yüksek. (karşıtlık kastıyla) | Ama fiyatı yüksek. / Fiyatı ise yüksek. |

---

## 10. "Düşünüyorum ki" kalıbı ve *ki*'li ilgi cümlesi

**İz.** `Düşünüyorum ki X`, `Görülmektedir ki X`, `Şunu belirtmek isterim ki X`,
`bir araç ki …`, `Bir özellik ekledik ki kullanıcılar …`.

**Neden.** İngilizce *that / which* kalıbı. Yerli düzende yan cümle **önce** gelir:
*eminim ki yarın gelecek* yerine *yarın geleceğine eminim* (Lewis, §XIII.15 / s. 211-212).
*ki*'li ilgi cümlesi yabancı sayılır (Lewis, §XVIII.2 / s. 260).

**Ölçüm.** Ölçülmedi. Tarayıcıda `relatif-ki` görece *ki*'yi yakalar (humanify layer-2 §12).

**Düzeltme.** "Düşünüyorum ki bu iş uzar" → "Bence bu iş uzar." "Şunu belirtmek
isterim ki bu yöntem etkili" → "Bu yöntem etkili." "Bir özellik ekledik ki kullanıcılar
şablon kaydedebiliyor" → "Şablon kaydetmeyi sağlayan bir özellik ekledik." (§6b)

Not: *ki*'nin doğal kullanımları korunur: *öyle yorulduk ki, belli ki, demek ki, ne var
ki* (bkz. §0b). Bağlaç olan "ki" **ayrı** yazılır (bkz. `tdk-yazim.md`); "oysaki,
mademki, hâlbuki, sanki, belki, çünkü" kalıplaşmış birleşiklerdir, bitişik yazılır.

---

## 11. Özne düşürmeme (pro-drop ihlali)

**İz.** "Ben düşünüyorum ki…", "Biz size yardımcı oluruz", "Siz formu doldurun",
"Raporu hazırladım ve onu size gönderdim", "bizim ekibimiz".

**Neden.** İngilizcede özne zorunludur. Türkçede kişi eki zaten öznedir; zamiri ayrıca
yazmak onu odağa koymaktır (Lewis, §V.2 / s. 68; §0, kural 4).

**Ölçüm.** Ölçülmedi.

**Düzeltme.** Özneyi yalnız karşıtlık ya da vurgu varsa yaz: "Siz uğraşmayın, biz
kuralım" doğru, çünkü karşıtlık var. **Vurgu için yazılan zamir odak konumuna, yüklemin
hemen önüne gelir, cümle başına değil.** Model zamiri yalnız özne olarak başa koyar
(fark derleminde elle 5 çift).
"İlk iki bölümü izlerken nefesim daraldı ve sık sık kendimi karakterlerin yerine koyarken
buldum." → "Nefesim daraldı; sanki o koridorlarda ben yürüyorum, stadyuma zorla ben
sürükleniyorum." ("kendimi … buldum": *found myself*.) Aynı kural
(Lewis, §V.2 / s. 68-69):
- **Nesne zamiri de düşer:** *Kitabı dün aldım, daha okumadım*. "Raporu hazırlayıp size gönderdim."
- **Tamlayan zamiri:** "ekibimiz" yeter; "bizim ekibimiz" yalnız pekiştirme içindir.
- **Yan cümlede özne çoğu zaman yazılmaz:** "Gelince haber verin" (Oxford, §27.4.1).
  İstisna: *-ken* ile özneler farklıysa (§2).

---

## 12. Kelime uzunluğu: LLM Türkçesi daha uzun kelimeyle yazıyor

**Eski varsayım yanlış çıktı.** Bu bölüm önce "LLM derin ekli kelimeden kaçınır, hece
ortalaması düşüktür" diyordu. Kalibrasyon tersini gösterdi.

**Ölçüm.** Kelime başına hece LLM'de **yüksek**: haber ve forumda 2,79'a 2,94 (güç
0,69), sitede 2,98'e 3,15 (0,87), blogda 0,65. Dağılımlar çok örtüşüyor, tek başına eşik
olarak zayıf. Yazılı Türkçenin ortalaması 2,6 civarı (Bezirci & Yılmaz; insanca aktarımı).

**Olası neden (ölçülmedi).** Model soyut ada ve türev yığınına yaslanıyor
(*optimizasyonu, sürdürülebilirliğini, değerlendirilmesi*); hafif fiil (§5) ve edat
kalıbı (§9) da kelimeyi uzatır.

**Düzeltme.** Hece sayısı hedef değil. Soyut türev yığınını somut fiille çöz:
"Sitenin performansının optimizasyonunun sağlanması" → "Siteyi hızlandırmak".

---

## 13. Gönderim: eş anlamlı kovalama, ad tekrarı, açılış tekrarı

**İz.** Üç biçimi var:
- **Eş anlamlı kovalama:** aynı kavram üç kelimeyle anılıyor: "müşteri… danışan… iş
  ortağı… kullanıcı". Zayıf iz, tek başına yetmez: humanizer 3.0 listeden çıkardı,
  Wikipedia "tarihsel göstergeler"e taşıdı. Asıl sorun terim tutarsızlığıdır.
- **Ad öbeği tekrarı:** model aynı adı her cümlede yeniden kuruyor: "Şirket… Şirket
  ayrıca… Bu şirketin…" (insanca Ak17).
- **Açılış tekrarı:** art arda üç cümle ya da paragraf aynı kelimeyle ya da bağlaçla
  açılıyor (insanca §19, §42; ayrıntı `yasakli-kaliplar-tr.md` §3).

**Ölçüm.** Ölçülmedi; `acilis-tekrari` derlemde ayırt etmedi (%2 / %1).

**Düzeltme.**
- **Bir kavram, bir terim.** Gerekiyorsa aynı kelimeyi tekrar et; tekrardan kaçınma
  refleksi, tekrarın kendisinden daha yapaydır.
- **Gönderim merdiveni:** konu bir kez tam adıyla anılır, sonra zamirle ya da "bu"yla,
  sonra kişi ekinin içindeki gizli özneyle.
  "Ajans 2019'da kuruldu. Ajans ayrıca e-ticaret sitesi yapıyor. Ajansın ekibi…" →
  "Ajans 2019'da kuruldu. E-ticaret sitesi de yapıyor, ekibi…"

---

## 14. Hafif iyimser kapanış

**İz.** Son paragraf metni özetler ve olumlu bir dilekle biter.

**Ölçüm.** Haber ve forumda insan %3, LLM %28; blogda %13'e %50. Site metninde
tetiklenmiyor. Kalıp listesi: `yasakli-kaliplar-tr.md` §2.

Fark derleminde (`tests/kalibrasyon/SONUC-FARK.md`) kapanışa olgu taşımayan cümle eklenmiş metin: insan 6/28,
gpt-4o 28/28 ("doğal yaz" istemiyle de 28/28), gpt-4.1 26/28. Kalıp listesi çoğunu
yakalamadı (2-4 metin): kapanış kalıp değil, içerikten üretilmiş **taşınabilir
değerlendirme cümlesiydi** (ders, dilek, çağrı, genel övgü).

**Düzeltme: işlevsel test.** Son cümleyi sil; bir olgu kayboluyor mu? Kaybolmuyorsa
silinmiş kalsın ve aynı testi yeni son cümleye uygula. Kalıp listesinde olup olmaması
ölçüt değildir; ölçüt taşınabilirliktir (`mantik-kapisi.md` Kapı 4). Metin son olguda,
son sahnede, somut bir sonraki adımda ya da kısa, özgül bir hükümde biter.
"Luang Prabang, sadece bir gezi değil, ruhunuza dokunan derin bir deneyimdi. Bu huzur ve
güzellik dolu şehirde bir gün geçirmiş olmak, hafızamda daima özel bir yer edinecek." →
"Aktivitelerle dolu dolu geçen bir günün ardında Luang Prabang'a dönüp, elimde Laos
birası Mekong nehri kenarındaki masamdan gün batımını izliyordum."

---

## 15. Ritim: cümle uzunluğunun tekdüzeliği (en güçlü ölçülmüş iz)

**İz.** Cümlelerin hepsi aşağı yukarı aynı boyda; kısa da yok, uzun da. Maddeler aynı
uzunlukta, her paragraf üç cümle.

**Ölçüm.** İki derlemde de en güçlü ayırıcı (insan / LLM, güç):

| Ölçüm | Haber + forum | Site | Blog |
|---|---|---|---|
| Değişim katsayısı (sapma / ortalama) | 0,51 / 0,29, **0,93** | 0,38 / 0,24, 0,76 | 0,41 / 0,31, 0,83 |
| Standart sapma (kelime) | 7,2 / 4,3, 0,85 | 6,5 / 3,5, 0,84 | 5,3 / 4,0, 0,79 |
| Hiç 25+ kelimelik cümle yok (metin %) | %32 / %74 | %28 / %70 | %43 / %80 |
| Ortalama cümle uzunluğu | 14,3 / 14,6, ayırt etmiyor | 15,6 / 14,3 | 12,5 / 12,6 |

Eşik (tarayıcıda `duz-ritim`, kademeli): değişim katsayısı 0,30'un altı güçlü iz,
0,30-0,37 gri bölge. İnsan site metni de tekdüzedir (medyan 0,38): 0,37 eşiği insan
site metinlerinin %43'ünü yakalıyor, yani sitede bu ölçüm tek başına hüküm değildir.
"Cümle uzunluklarını çeşitlendir" istemi düz ritmi gidermedi ("doğal yaz" istemli
metinlerin %70-90'ı yine düz). Tarayıcıda ayrıca `uzun-cumle-yok`.

**Buradan çıkan iki sonuç:**
1. **Uzun cümle insan işaretidir, iz değil.** "25 kelimeyi geçen cümleyi böl" öğüdü
   yanlıştı. Cümleyi uzunluğu yüzünden değil, okur takıldığı için bölersin (ölçüt:
   `mantik-kapisi.md` Kapı 4).
2. **Ortalama uzunluk önemsiz, dağılım önemli.** Hedef ortalama tutturmak değil, kısa
   ve uzun cümleyi karıştırmak.

**Düzeltme.**
- **Anlamın gerektirdiği uzunluğu kullan.** Tek bir olguyu söyleyen cümle kısa kalır;
  bir süreci anlatan cümle uzar.
- **Ardışık eylemleri virgülle zincirle.** Virgülle bağlanmış cümle Türkçede hata
  değil, ana ritim aracıdır (insanca Ak1). "Başvurduk. İzin aldık. Şehre gittik." →
  "Başvurduk, izin aldık, şehre gittik."
- **Kısa cümleyi tek başına, vurgu için bırak.** Art arda üç çok kısa cümle ("Hızlı.
  Güvenli. Basit." / "X değildi. Y değildi. Z'ydi.") slogan ritmidir (insanca §15,
  §45; humanify layer-2 §16). İki derlemde de LLM metninde neredeyse hiç çıkmadı (hero
  metni ölçülmedi). Asıl tehlikesi, doğallaştırırken "varyans olsun" diye kısa cümle yığmaktır.
  "Kurallar yıkıldı. Ezberler bozuldu. Yeni dönem başladı." → "Maliyet düşünce küçük
  ekipler de aynı araçları kullanmaya başladı."
- **Uzunluğu yapay olarak çeşitlendirme.** Varyans, farklı büyüklükte fikirleri
  yazmanın yan ürünüdür; cümleyi rastgele uzatmak ya da bölmek ayrı bir izdir.
- **Madde ve paragraf da aynı kurala uyar.** Hepsi aynı boydaysa (maddeler ±%20
  içinde) bak (ölçülmedi).

---

## 16. Duygu abartısı, içi boş sıfat ve ilk akla gelen çağrışım

**İz.** "muhteşem, çığır açan, benzersiz, kusursuz, son teknoloji, potansiyelinizi
açığa çıkarın, bir üst seviyeye taşıyın". Tam liste: `yasakli-kaliplar-tr.md` §4 ve §5.

**Ölçüm.** Boş vurgu: haber ve forumda %1'e %18, blogda %0'a %23, sitede seyrek. İçi
boş sıfat (`hype`) iki derlemde de LLM'de sık: sitede %15'e %40. Tek bir sıfat zayıf
sinyaldir; kümelenmesi imzadır. **Sitede tek başına ayırt edici değil:** fark
derleminde iyi insan site metinleri de "eşsiz", "efsanevi" kullanıyor (s04, s05).
Kural geçerli; ama insandan ayıran şey sıfat değil, kapanış (§14) ve olgu yoğunluğu.

**Neden.** Model ilk akla gelen çağrışımı ve okura ne hissedeceğini söyleyen cümleyi
kurar. Yaratıcı yazma tersini ister: kalıbı kırmak, somut ayrıntı, gereksizi silmek
(Şimşek, §2 / s. 533; §2.2.7 / s. 539-540).

**Düzeltme.** Sıfatı sil, ölçülebilir bir olgu koy.
"Dijital varlığınızı güçlendirin" → "Açılış süresini 4 saniyeden 1 saniyeye indiriyoruz."
(Sayılar olgu listesinden gelir.)

---

## 17. Kaynaksız iddia

"Müşterilerimizin %90'ı…", "Sektörde lideriz", hayali vaka. Ölçülmedi; kalıplar ve
kural `yasakli-kaliplar-tr.md` §14'te. Olgu listesinde yoksa metinde de yok.

---

## 18. Kanıtsallık: -DI, -mIş, kuşku ve kaynak

**İz.** Tanık olunmayan, duyulan ya da kayıttan okunan olay da -DI ile anlatılıyor;
metin tutanak gibi okunur. İngilizce geçmiş zaman bu ayrımı yapmaz, Türkçede tanık
olunmayan olay -mIş ister (humanify layer-2 §4; insanca Ak12). **Ölçüm:** ölçülmedi.

**Düzeltme.**
- **Blog:** aktarılan olay ya da sonradan fark edilen durum -mIş alır. "Sabah baktık,
  sunucu gece yeniden başlamış." / "Meğer sorun eklentideymiş."
- **Site:** marka kendi geçmişini -mIş ile anlatmaz; anlatırsa kendi iddiasından uzaklaşır.
  "2019'da kurulmuşuz" değil, "2019'da kurduk".
- Tanık olunmuş olay -DI ile kalır. -mIş'i "doğal dursun" diye serpiştirme.

**Kuşku ve kaynak (blog).** İyi insan yazısı neyi gördüğünü, neyi duyduğunu ayırır:
"sanırım", "belki", "nerede okumuştum bilmiyorum ama", "-mış", parantez içi çekince
("(Yanlışım, eksiğim varsa lütfen yoruma ekleyin)"). Model aynı bilgiyi "şüphesiz",
"aşikâr", "hak ediyor", "garantisini verebilirim" ile kesinleştirir (fark derleminde
6 çift; parantez içi çekince 12 çiftte yalnız insanda).
"Lviv, kişi başına düşen kafe sayısıyla dünya sıralamasına girmeyi hak ediyor." →
"Nerede okumuştum bilmiyorum ama gidince doğru olabileceğini düşündüm, kişi başına en
çok kafe düşen şehirlerin başında geliyormuş Lviv, haklı."
- Kaynakta kuşkulu ya da aktarılmış bilgiyi kesinleştirme; kaynak yoksa uydurma.
- Kuşku bir kez, yerinde söylenir; her cümleye "belki" aşırı kaçamaktır
  (`yasakli-kaliplar-tr.md` §6; kesinleştiriciler §4; parantez takıntısı §11).

**Zaman ve kip gözlemleri (fark derlemi; 5 çifte ulaşmadı, kural değil):**
- Site tarihçesinde insan tarihsel şimdiki ya da geniş zaman kullanıyor ("Fakat bakıyor
  ki, işler az…", "açılır, taşınır"); GPT -DI ya da -mIştIr'a çeviriyor. Kaynakta varsa koru.
- "doğdu" → "dünyaya gelmiştir" (s08, üç model). Yaygın fiil kalır (§5).
- "Doğal yaz" istemi tarihsel olguyu masal -mIş'ına çevirdi ("gelirmiş, önemliymiş"; b03).

---

## 19. Öğüt kipi: "-meli" yığını

**İz.** Nasıl yapılır yazısında ya da hizmet adımlarında her cümle *-malı/-meli*
ile bitiyor. Türkçede adım anlatımı emir kipiyle ve kısa gerekçeyle yapılır (insanca
Ak15). **Ölçüm:** ölçülmedi; insanca'nın eşiği 200 kelimede 3'ten fazla *-malı/-meli*.

**Düzeltme.** Kısa emir, arkasından tek cümle gerekçe. "Güncellemeden önce yedek
alınmalıdır, aksi hâlde veri kaybı yaşanabilir." → "Güncellemeden önce yedek alın.
Bir şey ters giderse geri dönmenin tek yolu bu."

---

## 20. İkileme ve çeviri kokan zarf

**İz.** "tamamen, defalarca, dikkatlice" gibi zarflar ikilemenin yerini almış.
İkilemenin İngilizcede karşılığı yoktur, çeviride ilk kaybolan katmandır (insanca
Ak10). **Ölçüm:** ölçülmedi.

**Düzeltme.** Blogda, yerindeyse: "Sözleşmeyi dikkatlice inceledik" → "Sözleşmeyi
didik didik ettik." "Defalarca denedik" → "Tekrar tekrar denedik." Site metninde
seyrek. İkilemenin kasıtlı tekrarını kelime tekrarı kusuruyla karıştırma.

---

## Özet: Türkçe tarama sırası

İki derlemde kalibre edilmiş güce göre, en güçlüden başla:

1. **Ritim** (§15): değişim katsayısı < 0,30 güçlü, 0,30-0,37 gri (güç 0,76-0,93);
   sapma; 8+ cümlede hiç uzun cümle yok
2. **Kalıplar** (`yasakli-kaliplar-tr.md`): olumsuz koşutluk (§8; "doğal yaz" istemli
   metinlerin yarısından çoğunda), kapanış klişesi ve boş vurgu (§2, §4; blogda güçlü,
   sitede seyrek), içi boş sıfat (§4) ve yalancı aralık (§17; sitede güçlü)
3. **"ve"** (§2; güç 0,72-0,79; eşik blogda 2,7, sitede yaklaşık 3,9)
4. **Kelime uzunluğu** (§12; LLM'de yüksek, sitede 0,87, eşik zayıf)
5. Yalnız bilgi: hafif fiil (§5; blogda 0,71, sitede ayırt etmiyor), geçiş yoğunluğu
   (`yasakli-kaliplar-tr.md` §3; 0,58-0,68)

Ölçülmemiş, gözle bakılanlar: 6. odak ve vurgu, **sesli okuyarak** (§0) · 7. sağa
dallanma, görece *ki*, sıfat-fiil (§6b, §10) · 8. parçacık yokluğu ya da kotası (§0b)
· 9. devrik normu (§8) · 10. tamlama zinciri, telgraf, gönderim tekrarı (§6, §7, §13)
· 11. özne zamiri, kanıtsallık, öğüt kipi, ikileme (§11, §18-20) · 12. kaynaksız iddia (§17).

Ölçüldü, **ayırt etmedi** ya da türe göre yön değiştirdi; iz sayılmaz, üslup kusuru
olarak düzeltilir: "bir" yoğunluğu (§1), *-maktadır* ve -DIr oranı (§3), edilgen (§4),
cümle başına ulaç (§2), ortalama cümle uzunluğu (§15), bürokratik edat kalıpları (§9),
giriş klişesi (insan site metninde daha sık).
