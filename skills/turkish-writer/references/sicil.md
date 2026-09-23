# Sayfa türüne göre ayar

Bu beceri iki tür metin için yazıldı: **site içeriği** ve **blog yazısı**. Aynı kurallar
ikisine de uygulanır, ama doz farklıdır. Site metni kısa ve satış odaklıdır; okur tarar.
Blog yazısı uzundur; okur bir sorunun cevabını arar ve yazanın kim olduğunu hisseder.
humanify'ın dört sicilinden site metni "kurumsal", blog "blog" hücresine oturur.

Her sayfa için üç soru:

1. **İlk cümlede ne var?** Okurun bu sayfaya gelme nedeni ilk cümlede karşılanmalı.
2. **Kim konuşuyor?** "Biz" mi "ben" mi? Sayfa boyunca değişmez.
3. **Okur ne yapacak?** Arayacak mı, form mu dolduracak, okumaya mı devam edecek?

**Biçim kapısı.** Sicilden önce bak: metnin ne kadarı düzyazı? İçerik zaten listede,
tabloda ya da adım adım talimatta duruyorsa iskelet kullanıcınındır; listeyi düzyazıya
çevirme, yalnız satırların dilini düzelt (humanify, `prose_pct`).

---

## Ortak kurallar

- **Hitap.** Site metninde "siz". Sayfa içinde "sen"e kaymaz. Blogda sicile göre "siz"
  ya da hitapsız anlatım; ikisi aynı yazıda karışmaz.
- **Konuşan.** Kurumsal sitede "biz". Serbest çalışan ya da kişisel markada "ben".
  Bir sayfada ikisi birden olmaz. "Firmamız", "şirketimiz", "tarafımızca" yerine
  kişi ekini kullan: "kuruyoruz", "teslim ediyoruz".
- **Sicil kayması yok.** Argo iki sicilde de yasak (abi, kanka, valla, efsane, resmen
  olay). Argo ile bürokratik dilin aynı metinde durması ayrı bir izdir: "Kanka bu
  uygulama resmen olay, kullanıcılara geniş olanaklar tanımaktadır." Samimi bir blogun
  bir paragrafta resmî yazışma diline geçmesi de aynı kusurdur (insanca §21).
  "Uygulama resmen efsane, kayıt işlemleri kolaylıkla gerçekleştirilebilmektedir." →
  "Uygulamaya iki dakikada kaydoldum." (Süre olgu listesinden.)
- **Olgu.** Fiyat, süre, garanti, iade, kapsam, müşteri sayısı, sonuç iddiası yalnız
  kullanıcının verdiği olgu listesinden gelir. Listede yoksa metinde de yok.
- **Olguyu açarak yaz, sıkıştırarak değil.** Hedef uzunluğu süs, ders ve yorum
  cümlesiyle değil, olgunun kendisiyle doldur: her olguya en az bir cümle, sayı, saat
  ve yer yerinde. Olgu yetmiyorsa uzunluğu doldurma, kullanıcıya sor. Fark derleminde
  (`tests/kalibrasyon/SONUC-FARK.md`) gpt-4o "yaklaşık N kelime" istemine rağmen insan
  uzunluğunun %68'ini yazdı (28/28 çift); aynı olgu insanda 18,2, GPT'de 14,6 kelimelik
  cümleyle verildi, kalan yeri süs doldurdu.
  "İlk durağım Santa Ana oldu." (ardından değerlendirme) → "Guatemala City'den otobüsle
  direk buraya 16 USD'ye geldim. Yol yaklaşık 4-5 saat sürüyor."
- **Dozlar tavandır, kota değil.** Sicil belirsizse tutucu olanı seç (humanify).
- **Kapsam dışı.** KVKK aydınlatma metni, mesafeli satış sözleşmesi, iade koşulları,
  kullanım şartları. Bunlar hukuki metindir; `-mektedir` ve edilgen orada kesinlik
  aracıdır. Bu becerinin geçişlerini onlara uygulama.

---

## Ana sayfa

**İlk cümle:** ne yaptığın ve kimin için yaptığın. Slogan değil, iş tanımı.

**Yapay zekânın tipik ana sayfası:** "Dijital dünyada fark yaratın", "Geleceği birlikte
inşa edelim", "İşinizi bir üst seviyeye taşıyın". Bu cümlelerin hepsi taşınabilirlik
testinden kalır: her şirketin ana sayfasına aynen konabilir.

**Kural:**
- Başlık, sayfanın ne sattığını söyler. Okur üç saniyede anlamazsa başlık yanlıştır.
- Alt başlık, başlığın **nasıl** ya da **kimin için** sorusunu cevaplar; başlığı başka
  kelimelerle tekrar etmez.
- Buton metni fiildir ve ne olacağını söyler: "Fiyat alın", "Randevu seçin".
  "Keşfedin", "Hemen başlayın" gibi hiçbir şey söylemeyen emirler kullanılmaz.
- **Buton ve etiket kendi başına anlaşılmalı.** Anlamını önceki cümleden alan kelime
  (sonra, önce, orada, tekrar, buradan) kısa arayüz metninde boşa düşer: "Sonra izle"
  → "Daha sonra izle", "Buradan devam et" → "Kaldığın yerden devam et" (humanify
  layer-3 §8). Model bu hatayı İngilizce tek kelimeye Türkçe tek kelime karşılık
  verirken yapıyor.
- Üçlü özellik kartları ("Hız · Güven · Kalite") zorlama simetridir. Kaç özellik
  gerçekten varsa o kadar kart.
- Hero başlığında slogan ritmi ("Hızlı. Güvenli. Basit.") ve aforizma
  (`yasakli-kaliplar-tr.md` §16) yok.

---

## Hizmet ya da ürün sayfası

**İlk cümle:** bu hizmet hangi sorunu çözüyor. Hizmetin adı değil, okurun sorunu.

**Yapay zekânın tipik hizmet sayfası:** "Profesyonel ekibimizle size özel çözümler
sunuyoruz." Sorun yok, olgu yok, kimse yok.

**Kural:**
- Sırayla: sorun → ne yapıyorsun → nasıl yapıyorsun → ne kadar sürer/ne tutar → sonraki
  adım. Her adım en az bir somut olgu taşır (süre, adım sayısı, teslim edilen şey).
- Özellik ve tanım cümlesi geniş zamanla kurulur: "Sistem her gece yedek alır",
  "Raporu her ay göndeririz" (`turkce-parmak-izi.md` §3).
- "Neden biz?" bölümü kaynaksız üstünlük iddiasına dönüşmesin. Kanıt yoksa bölüm yok.
- **Taranan liste kalır.** Fiyat, özellik, koşul listesini düzyazıya eritme; okur tek
  bir maddeyi ötekileri okumadan bulmak ister. humanify'ın kör karşılaştırmasında liste
  eritildiğinde metin "düzleştirilmiş" diye okundu. Yalnız her maddeyi fiilli yaz ve
  kalın etiketi kaldır: "**Hızlı Kurulum:** Kurulum hızlıdır" → "Kurulum iki iş günü
  sürer." (Süre olgu listesinden.) Telgraf dili olmaz: "Form-kayıt-bildirim akışı".

---

## Hakkımızda

**İlk cümle:** kim olduğun ve ne yaptığın, düz.

**Yapay zekânın tipik hakkımızda sayfası:** kuruluş destanı, "tutku", "vizyon",
"misyon", "değerlerimiz" üçlüsü, "yolculuğumuz". Hepsi uydurma derinlik.

**Kural:**
- Kullanıcı hikâye vermediyse hikâye yazılmaz. Kuruluş yılı, ekip sayısı, müşteri
  sayısı verilmediyse yoktur.
- "Misyonumuz / Vizyonumuz / Değerlerimiz" başlıkları ancak kullanıcı istediyse.
- Duyguyu adıyla söyle, bedenle oynama: "Bu işi seviyoruz" bile "içimizde yanan
  tutku"dan iyidir, ama en iyisi duygu cümlesi yerine yaptığın bir şeyi anlatmaktır.
- Marka kendi geçmişini -mIş ile anlatmaz: "2019'da kurulmuşuz" değil, "2019'da kurduk".
- **Kaynakta söz varsa söz olarak kalır; kaynakta yoksa söz yazılmaz.** Kurucunun ya da
  ustanın sözü dolaylı özete çevrilmez; söz, fiyatı, yeri ve ağzı taşır. Uydurma replik
  ("Allah razı olsun") de yazılmaz.
  "Mustafa Güllü, müşteri bulmakta zorlandığını sıkça anlatırdı." → "“Birkaç yıl bedava
  baklava ikram ettik. [...] Baklavanın kilosu 5 lira idi.”"
- Tarihçede kaynaktaki tarihsel şimdiki ya da geniş zaman korunur ("Fakat bakıyor ki,
  işler az…"); -mIştIr/-mAktAdIr'a çevrilmez (fark derlemi gözlemi, 3 çift).

---

## SSS

**İlk cümle:** her cevabın ilk cümlesi sorunun cevabıdır. "Evet", "Hayır", bir sayı,
bir süre, ya da tek cümlelik tanım. Açıklama ikinci cümlede.

**Kural:**
- Soru, bir müşterinin gerçekten soracağı biçimde yazılır. "Kapsam yazılı mı hazır?"
  gibi iki kalıbın karıştığı soru olmaz. Sesli oku: biri bunu böyle sorar mı?
- Soru eki "mi" sorgulanan öğenin hemen arkasında ve ayrı yazılır: "Siteyi siz mi
  yapıyorsunuz?", "Kurulum ücretli mi?"
- **Tanım tek cümlede verilir,** -DIr alabilir; soyut kuralın arkasından gerçek örnek
  gelir (insanca Ak13). "Alan adı, sitenizin internetteki adresidir, örneğin
  ornek.com.tr."
- Her cevap gerçekten kendi sorusunu cevaplıyor mu? Model komşu maddenin cevabını
  tekrar edebiliyor.
- İki cevap aynı şeyi söylüyorsa soruları birleştir.
- Retorik soru-cevap yasağı (`yasakli-kaliplar-tr.md` §15) SSS'ye uygulanmaz.

---

## İletişim

**İlk cümle:** nasıl ulaşılacağı ve ne zaman dönüleceği.

**Kural:** "Her türlü soru ve görüşünüz için bizimle iletişime geçmekten çekinmeyiniz"
yazılmaz. Dönüş süresi olgu listesinde varsa yazılır: "İş günlerinde aynı gün döneriz."

---

## Blog yazısı

Blog, site metninden farklı bir sicildir: okur arama motorundan bir soruyla gelir,
cevabı alırsa kalır, yazanın bir görüşü varsa güvenir.

**İlk paragraf:** okurun sorusunun cevabı ya da cevaba giden en kısa yol; anlatı
yazısında olay, iddia, alıntı ya da olgu. "Bu yazıda … ele alacağız", "Merhaba sevgili
okurlar", "Günümüzde … giderek önem kazanmaktadır" ile açılmaz. **Kaynakta olmayan
sahneyle de açılmaz** ("uçaktan aşağıya, bulutların üzerinden bakarken"); "doğal yaz"
istemi en çok bunu üretir (`yasakli-kaliplar-tr.md` §1, §14).

**Kural:**
- **Görüş serbest.** "Bence", "bizim gördüğümüz", "emin değiliz" blogda doğaldır.
  Tereddüt dürüstlüktür; her cümleyi kesin kurmak yapay zekâ işaretidir. Ama her
  cümleyi "belki", "genellikle" ile yumuşatmak da işarettir. Kesin olduğun yerde kesin,
  olmadığın yerde tereddütlü ol.
- **Somutluk.** Blogun inandırıcılığı adlandırılmış şeylerden gelir: araç adı, sürüm,
  fiyat, tarih, şehir, adım sayısı. Bilgi yoksa uydurulmaz; cümle sadeleşir.
- **Başlıklar.** Ara başlık okurun taradığı soruları taşır: "E-fatura zorunlu mu?",
  "Kurulum ne kadar sürer?" Aranan bir kavramı açıklayan yazıda tek başına "X nedir?"
  başlığı doğrudur; bulunabilirlik sesten önce gelir (humanify layer-1 §4). Yasak olan
  "X Nedir? / X'in Önemi / X'in Avantajları / Sonuç" iskeletinin bütünü, bir de "Bilmeniz
  Gereken Her Şey", "Kapsamlı Rehber" gibi başlıklardır.
- **Tanım ve örnek.** "X nedir?" sorusunun cevabı tek cümlelik tanımdır, -DIr alabilir.
  Soyut kuralın arkasından iki noktayla gerçek örnek dizilir; iki noktanın meşru işi
  budur (insanca Ak13). "Anlam kayması olan birleşik kelimeler bitişik yazılır:
  dedikodu, gökdelen."
- **Paragrafı dönüşte böl.** "Ama", "ancak", "oysa", "buna karşılık" ile gelen karşıtlık
  cümlesinde yeni paragraf aç; sayfayı kaydıran okur vurguyu böyle görür. Tek cümlelik
  paragraf serbest. Adım adım rehberde ve SSS cevabında bu kural uygulanmaz (humanify
  layer-1 §2).
- **Aktarılan olay -mIş alır.** "Sabah baktık, sunucu gece yeniden başlamış."
  Kuşku ve kaynak söylenir: "sanırım", "nerede okumuştum" (`turkce-parmak-izi.md` §18)
- **Söz.** Kaynakta söz ya da iç ses varsa doğrudan kalır ("Hadi öğretmen, çabuk çabuk
  gel!"); kaynakta yoksa söz yazılmaz. Fark derleminde doğrudan söz iyi insan
  metinlerinin 24'ünde var, gpt-4o'nun 10'unda; GPT sözü "… anlatırdı", "… istedi" diye
  özetliyor, gpt-4.1 ve "doğal yaz" ise replik uyduruyor.
- **Liste.** İpucu, öneri, adım ve kazanım listesi blogda da liste kalır; madde emir +
  tek cümle gerekçe olur ve maddeler aynı uzunlukta olmak zorunda değil. Düzyazıya
  dönen yalnız "**Etiket:** metin" biçimi ve bilgi taşımayan maddelerdir
  (`yasakli-kaliplar-tr.md` §11). Fark derleminde listeli 8 insan metninin 8'inde de GPT
  listeyi süslü paragraflara çevirdi.
- **Kapanış.** Metin söyleyeceğini söylediyse biter. "Sonuç olarak" paragrafı, özet,
  "umarız faydalı olmuştur" yok. Kapanış ancak son olgu, son sahne, somut bir sonraki
  adım, kısa özgül bir hüküm ya da gerçekten merak edilen bir soru taşıyorsa kalır;
  "Peki ya siz?" gibi etkileşim tuzağı olmaz. Test: son cümleyi sil, olgu kayboluyor mu?
  (`turkce-parmak-izi.md` §14)
- **Mizah durumdan doğar.** Sicilde "mizah var" yazınca model her paragrafa espri
  ekliyor ("balığın Disneyland'ı"); insanda mizah olayın kendisinden çıkıyor. Espri kotası
  yok (fark derlemi gözlemi).
- **Yapısal müdahale.** Blog, `mudahale-defteri.md`'deki yapısal müdahalelerin asıl
  yeridir. Yazı başına bir iki tane, bir önceki yazıdan farklı.
- **Okura hitap.** Ara sıra okuru ya da yazının kendisini kabul etmek doğaldır:
  "Reklam yönetiyorsanız bu bölümü atlayabilirsiniz." Baharattır, her paragrafa konmaz.

**SEO ile doğallık çatışırsa:** anahtar kelime başlıkta ve ilk paragrafta bir kez
doğal biçimde geçer. Aynı ifadeyi her paragrafa sıkıştırmak hem okuru hem arama
motorunu rahatsız eder. Eş anlamlı kovalamak yerine konu kelimesini doğal yerlerinde
tekrar et.

---

## Doz tablosu

Kaynak: **K** = kalibrasyon (`tests/kalibrasyon/SONUC-SITE.md`: 40 site + 40 blog insan
metni, 80 gpt-4o / gpt-4.1-mini metni; haber ve forum için `SONUC.md`); **H** = humanify `evals/human-reference` (9 yayımlanmış metin, 12 model metni);
**İ** = insanca; işaretsiz satırlar bu becerinin kararıdır, ölçülmedi. Hepsi tavandır,
kota değil.

| | Site metni | Blog |
|---|---|---|
| Cümle uzunluğu | Tavan yok. Kısa ve uzun karışık; okur takılıyorsa böl (`mantik-kapisi.md` Kapı 4). Değişim katsayısı: insan site metni 0,38, LLM 0,24 (K); insan site metni de tekdüzeye yatar, yine de hepsi aynı boyda olmasın | Tavan yok. Kısa ve uzun karışık; uzun cümle insan işaretidir. Değişim katsayısı: insan 0,41, LLM 0,31 (K); 0,30 altı güçlü iz, 0,30-0,37 gri |
| "ve" / 100 kelime | İnsan site metni 3,84, LLM 6,05 (K); yaklaşık 3,9 üstü yoğun | İnsan 2,51, LLM 3,88 (K); 2,7 üstü yoğun |
| Devrik cümle | Yok ya da sayfada bir (H: kurumsalda yok) | Yazı başına 2-3, her biri vurgu ya da geri plan taşır (H). Artlama sayılmaz |
| Söylem parçacığı | *de, bile, ise, yani, artık*; seyrek | Doğal yerinde serbest (zaten, ise, bir de, yani, artık, bile, işte); kota gibi eklenmez (H) |
| Argo | Yok | Yok |
| -mIş | Marka kendi geçmişini anlatırken yok | Tanık olunmayan, aktarılan olayda (H) |
| -DIr | Tanım ve koşul dışında yok | Tanım cümlesinde serbest (H) |
| Noktalı virgül / 100 kelime | Neredeyse hiç | En çok 0,5 (H: yayımlanmış blog 0,2-0,5) |
| İki nokta | Liste ve alıntı girişi dışında seyrek | Bin kelimede en çok 2 "iki nokta + tek cümle" (İ) |
| Ünlem, üç nokta | Yok | Ses örneğinde varsa bir tane kalabilir |
| Görüş, "bence" | Yok | Serbest, ölçülü |
| Öz-düzeltme | Yok | Yazı başına en çok 1 (H: 1-2) |
| Okura doğrudan hitap | "Siz" hitabı | Ara sıra, baharat kadar |
| Kalın vurgu | Bölümde en fazla bir (H: insan metninde 0-1) | Paragrafta en fazla bir, çoğunda sıfır |
| Liste | Taranan liste (fiyat, özellik, koşul) kalır; kalın etiket gider (H) | İpucu, öneri, adım, kazanım listesi kalır: emir + tek cümle gerekçe; "**Etiket:** metin" ve bilgisiz madde düzyazıya döner |
| Yapısal müdahale | Gerekmez | Yazı başına 1-2 |

Ortalama cümle uzunluğu hedef değildir: haber ve forumda insan ve LLM ortalaması aynı
çıktı (14,3 / 14,6 kelime), blogda da (12,5 / 12,6). Ayırt eden, uzunlukların dağılımıdır.
Her cümleyi aynı uzunluğa getirmek düz ritim izini üretir; uzunluğu yapay olarak
çeşitlendirmek de ayrı bir izdir. Anlamın gerektirdiği uzunluğu kullan.
