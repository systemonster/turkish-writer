# Evrensel izler: İngilizce kaynaklardaki izlerin Türkçe karşılıkları

Bu dosya beş İngilizce kaynağın yapay zekâ izi listelerini tek yerde toplar ve her izin
Türkçe site ve blog metnine geçince nasıl göründüğünü gösterir. Türkçeye özgü söz dizimi
izleri `turkce-parmak-izi.md`, Türkçe kalıp listesi `yasakli-kaliplar-tr.md`, yapısal
denetimler `mudahale-defteri.md` dosyasındadır. Orada olan bir kalıp için yalnız eksik
kalan biçimi yazdım, gerisini "bkz." ile gönderdim.

**Kısaltmalar.** **blader** = blader/humanizer 3.0.0 (§ = kalıp numarası) · **nas** =
petergyang/no-ai-slop (K = "Patterns to cut" maddesi) · **aaw** =
conorbronsdon/avoid-ai-writing 3.35.0 (kalıp kataloğundaki başlık) · **WP** =
Wikipedia: Signs of AI writing (kısayol adıyla) · **copy** = `copy-tells.md` ·
**kalibrasyon** = `tests/kalibrasyon/SONUC.md` (100 insan, 100 GPT Türkçe metin) ·
**yk** = `yasakli-kaliplar-tr.md` · **pi** = `turkce-parmak-izi.md`.

**İki not.** (1) Her iz bir **belirtidir**, sorunun kendisi değil; yalnız işaretleri
silmek metni tespit edilmesi zor hâle getirir, kaynaksız iddiayı ve boş içeriği
düzeltmez (bkz. 2.4). (2) Düzeltme örneklerindeki sayı, ad ve süreler örnektir. Gerçek
metinde olgu yalnız kullanıcının olgu listesinden gelir; olgu yoksa cümle sadeleşir.

---

## 1. İzler ve Türkçe karşılıkları

Gruplar blader'ın beş varsayılan seçimini izler (bkz. 2.1). **EN** İngilizcedeki
görünüş, **TR** Türkçeye geçmiş hâli, **Düzelt** önce → sonra.

### A. Sahneleme: söylemek yerine sahnelemek

**1. Olumsuz koşutluk: bölünmüş, kırpık, ters biçimler**
- EN: "This does not mean X. It means Y." · "…, no guessing." · "Y rather than X."
- TR: "Bu, her paketin aynı olduğu anlamına gelmiyor. Asıl mesele doğru paketi
  seçmek." · "Fiyat paketten gelir, sürpriz yok." · "Tahmin yerine veriyle karar verin."
- Düzelt: "Bu bir güncelleme değil. Bu, çalışma biçiminizin baştan yazılması." →
  "Güncellemeyle toplu fatura kesebiliyorsunuz."
- Bölünmüş biçim tek tek masum göründüğü için kaçar. Olumsuz yarı okurun gerçek bir
  yanlışını düzeltiyorsa kalır.
- Kaynak: blader §1 · nas K1 · aaw "It's not X" · WP:AIPARALLEL · copy 2. Temel
  biçimler: bkz. yk §8.

**2. Olumsuzlama zinciri**
- EN: "No fluff, no filler, no jargon." · "Not a tool. Not a service. A partner."
- TR: "Gizli ücret yok, taahhüt yok, sürpriz yok." · "Bir ajans değil. Bir yazılım
  değil. Bir iş ortağı."
- Düzelt: → "Aylık ödüyorsunuz, istediğiniz ay iptal edebilirsiniz."
- Kaynak: nas K11 · aaw "Negation chains" · WP:AIPARALLEL ("no …, no …, just …").

**3. Tek satırlık kapanış ve dramatik parça**
- EN: "That is the real win." · "Let that sink in." · "Every. Single. Day."
- TR: paragraf sonunda tek başına "Asıl kazanç da bu." · "Bir düşünün." · "Her. Gün."
- Düzelt: "Önbellek tekrar eden işi azaltır. Asıl kazanç da bu." → ilk cümle yeter.
  Aynı kapanış her bölümün sonunda dönüyorsa iz paragraf ölçeğine çıkmıştır.
- Kaynak: blader §2 · nas K12 · aaw "Manufactured punchlines and staccato drama".

**4. Derin görünen söz (aforizma kalıbı)**
- EN: "X is the language of Y." · "At its core, what really matters is…"
- TR: "Hız, güvenin dilidir." · "Veri, yeni petrol." · "Özünde asıl önemli olan…"
- Düzelt: "Tasarım, markanızın sessiz elçisidir." → "Ziyaretçi ilk ekranda fiyatı
  göremezse sayfadan çıkıyor." Kapanıştaki "derin" cümle daha iyi bir metafora
  çevrilmez, silinir; metin taslakta zaten olan en somut cümleyle biter.
- Kaynak: blader §3 · aaw "Aphorism formulas" · nas K15.

**5. Sahnelenmiş giriş ve sahte içtenlik**
- EN: "Here's the thing." · "Honestly?" · "Let's be honest."
- TR: "İşin aslı şu:" · "Açık konuşalım:" · "Dürüst olmak gerekirse?"
- Düzelt: "Değer mi? Açıkçası? Ne sıklıkla kullanacağınıza bağlı." → "Değip
  değmeyeceği ne sıklıkla kullanacağınıza bağlı." Cümle içindeki sıradan "açıkçası"
  iz değildir; iz, sıradan iddianın önüne tek başına konan açılıştır.
- Kaynak: blader §4 · nas K2 · aaw "Infomercial engagement hooks". "Gelin,
  inceleyelim" için bkz. yk §1.

**6. Sahte içgörü ve yenilik şişirmesi**
- EN: "What nobody tells you is…" · "the failure mode nobody's naming"
- TR: "Kimsenin size söylemediği şey…" · "Çoğu kişinin atladığı kısım…"
- Düzelt: "SEO'da kimsenin konuşmadığı gerçek: içerik değil, hız." → "Sayfa 3
  saniyede açılmıyorsa içeriğin iyi olması sıralamayı kurtarmıyor." Cümle ortasında
  uydurulup tanımlanmayan etiketler de buraya girer ("görünürlük paradoksu"); kavrama
  ad koymak onu açıklamak değildir.
- Kaynak: nas K3 · aaw "Novelty inflation", "Performed-insight phrases".

**7. İki noktalı ifşa ve kanca soru**
- EN: "The best part: it learns." · "The catch?" · "The result?"
- TR: "İşin en güzel yanı: kendi kendine öğreniyor." · "Püf noktası mı?" · "Sonuç?"
- Düzelt: "Asıl sürpriz: kurulum ücretsiz." → "Kurulum ücretsiz." İki nokta liste,
  etiket ve alıntı içindir. Uzun tireyi iki noktaya çevirmek aynı refleksi başka
  kılıkta tekrarlar (bkz. yk §11).
- Kaynak: nas K4 · aaw "Infomercial engagement hooks" · copy 1.

**8. Kimseyle tartışmak ve sahte taviz**
- EN: "This isn't about X." · "Don't get me wrong." · "While X is impressive, Y
  remains a challenge."
- TR: "Burada mesele fiyat değil." · "Yanlış anlaşılmasın." · "X etkileyici olsa da Y
  hâlâ soru işareti."
- Düzelt: "Yanlış anlaşılmasın, hazır temalar kötü değil. Ama size özel yapı gerekiyor."
  → "Hazır tema sipariş formunuzu desteklemiyor, formu ayrıca kodluyoruz." Metinde
  hiçbir yerde geçmeyen itiraza verilen cevap silinir.
- Kaynak: blader §5 · aaw "False concession structure".

**9. Retorik soru açılışı ve soru-cevap voleybolu**
- EN: "So why should you care?" · "Is it fast? Yes. Is it cheap? Also yes."
- TR: "Peki bu sizin için ne anlama geliyor?" · "Hızlı mı? Evet. Ucuz mu? O da evet."
- Düzelt: "Peki e-fatura size ne kazandırır? Zaman!" → "E-faturada kâğıt, zarf ve
  kargo masrafı kalkıyor." SSS'de soru yığmak meşrudur; iz, bölüm geçişi yerine
  konan sorudur.
- Kaynak: nas K14 · aaw "Rhetorical question openers", "Stacked rhetorical questions".

**10. Önemi ya da içtenliği ilan etmek**
- EN: "That last part matters." · "Notably," · "I want to be upfront:" · "the line I
  keep coming back to"
- TR: "Bu nokta çok önemli." · "Dikkat çekici olan şu ki…" · "Son madde asıl can
  alıcı olanı." · "Şeffaf olmak adına baştan söyleyelim:" · "Aklımdan çıkmayan cümle:"
- Düzelt: "Şeffaf olmak adına söyleyelim: iade süresi 14 gün." → "İade süresi 14 gün."
  İtirafın kendisi kalır ("Windows'ta test etmedik"), itiraf hakkındaki yan cümle gider.
- Kaynak: nas K7 · aaw "Confidence calibration phrases", "Self-labeling significance",
  "Narrated candor", "Lingering-attention claims".

**11. "Hayal edin" senaryo açılışı**
- EN: "Imagine a world where every deploy is instant."
- TR: "Her siparişin kendiliğinden faturalandığı bir dünya hayal edin."
- Düzelt: → "Sipariş onaylanınca fatura kendiliğinden kesiliyor."
- Kaynak: aaw "Speculative scenario openers". Bkz. yk §5.

### B. Kurala bağlı ritim

**12. Zorlama üçlü: cümle, örnek ve paragraf ölçeğinde**
- EN: "innovation, inspiration, and insights" · üç paralel örnek, ardından ders.
- TR: "Hız, güven ve kalite." · üç kısa olgu, arkasından "Bu da gösteriyor ki…" · "Üç
  şey sunuyoruz: tasarım, geliştirme ve destek."
- Düzelt: "Hızlı kurulum, kolay kullanım ve güçlü destek sunuyoruz." → "Kurulum bir iş
  günü sürüyor. Takıldığınızda aynı gün dönüyoruz." İki nokta + tam üç öge en sık
  biçimdir. "A, B ve C" Türkçenin doğal sıralamasıdır, regexle taranmaz (bkz. yk §12).
- Kaynak: blader §6 · WP:RO3 · aaw "Colon into a triple" · rephrasy tell 3.

**13. Aynı açılışlı cümle dizisi**
- EN: "She noted the door. She noted the lock. She filed both away."
- TR: özne düştüğü için iz başka yere kayar: aynı yüklem kalıbı ("Tasarlıyoruz.
  Geliştiriyoruz. Yayınlıyoruz.") ya da aynı ad öbeği ("Ekibimiz… Ekibimiz…").
- Düzelt: → "Tasarımı, kodu ve yayını aynı ekip yapıyor." Kasıtlı yineleme
  retoriktir; iş yapmayan dizi izdir.
- Kaynak: blader §7 · aaw "Same-opener sentence runs".

**14. Metronom ritim: tekdüze cümle ve paragraf**
- EN: "AI writing marches in even 15-20 word lines."
- TR: her cümle 12-16 kelime, her paragraf üç cümle; sesli okununca tek tonda akar.
- Türkçe kalibrasyonda **en güçlü ayırıcı** bu: cümle uzunluğu değişkenlik katsayısı
  (cumleCV) insanda medyan 0,51, GPT'de 0,29, AUC 0,07 (güç 0,93). Hiç 25 kelimeyi aşan
  cümle olmaması da LLM işareti.
- Düzelt: uzunluğu anlam belirlesin. Türkçede uzun cümleyi ulaç ve yan cümle doğal
  kurar ("Ödeme onaylanınca kurulum başlar, siz içeriği hazırlarken biz tasarımı
  bitiriyoruz."); kısa cümle yeni bilgi taşıdığında yerini hak eder. Sırf ritim için
  cümle doğramak yasak (bkz. 3.3).
- Kaynak: blader adım 4 · aaw "Rhythm and uniformity" · rephrasy tell 1 ve 6 · lynote
  · kalibrasyon. Ölçüm: pi §15.

**15. Yığılmış çekince**
- EN: "could potentially", "may eventually unlock"
- TR: "potansiyel olarak … olabilir" · "bir ölçüde … denebilir" · "muhtemelen …
  olabileceği düşünülmektedir"
- Düzelt: "Bu yöntem satışlarınızı potansiyel olarak artırabilir." → "Bu yöntem
  satışları artırabilir." Tek çekince insan alışkanlığıdır ("belki", "genelde"), yığın
  izdir. Yasal ve güvenlik uyarısı korunur.
- Kaynak: blader §9 (tek başına zayıf) · aaw "Hedge-stacked predictions".

### C. Şişirme ve ödünç otorite

**16. Önem ve miras şişirmesi**
- EN: "marking a pivotal moment", "setting the stage for", "indelible mark"
- TR: "…alanında bir dönüm noktası oldu" · "sektörde silinmez bir iz bıraktı" ·
  "geleceğe ışık tutuyor" · "yeni bir sayfa açtı"
- Düzelt: "2019'da kurulan şirketimiz, bölgede dijital dönüşümün mihenk taşı oldu." →
  "Şirket 2019'da kuruldu." Şişirme yan cümlesi silinince cümle hâlâ işliyorsa silinir.
  Model kuruluş yılı gibi rutin ayrıntıya bile önem biçer. Bkz. yk §4.
- Kaynak: blader §13 · nas K6 · WP:AILEGACY · aaw "Significance inflation".

**17. Sığ yorum eklentisi (-ing ortacı Türkçede "-arak" ve "bu da" olur)**
- EN: "…, highlighting the team's commitment to better workflows."
- TR: "…, müşteri memnuniyetine verdiğimiz önemi yansıtarak." · "…, bu da markanın
  yenilikçi yaklaşımını gözler önüne seriyor."
- Düzelt: "Yeni sürüm dosya aramayı ekliyor, bu da ekibin verimliliğe bağlılığını
  gösteriyor." → "Yeni sürümde eski taslakları editörden çıkmadan bulabiliyorsunuz."
- İz ulacın kendisi değil, ulaçla eklenen **yorumdur**. Kalibrasyonda cümle başına ulaç
  insanla GPT'de aynı (AUC 0,50).
- Kaynak: blader §15 · nas K5 · WP:SUPERFICIAL · aaw "Superficial -ing analyses".

**18. Broşür dili**
- EN: "Nestled in the heart of…", "boasts a vibrant…", "rich cultural heritage"
- TR: "…nın kalbinde yer alan" · "eşsiz manzarasıyla büyüleyen" · "zengin kültürel
  mirasıyla"
- Düzelt: "Kadıköy'ün kalbinde yer alan otelimiz eşsiz atmosferiyle sizi bekliyor." →
  "Otel, Kadıköy iskelesine beş dakika yürüme mesafesinde." Yeni modeller "en iyisi"
  demeden örtük över; iz, her konuda aynı övgü setine dönülmesidir. Bkz. yk §4.
- Kaynak: blader §16 · WP:AIPUFFERY · aaw "Promotional language".

**19. Belirsiz atıf ve yüzsüz doğrulama**
- EN: "Experts argue", "industry reports", "independent testing confirms"
- TR: "Uzmanlara göre…" · "Sektör raporları gösteriyor ki…" · "Bağımsız testler
  kanıtlıyor"
- Düzelt: kaynağı adlandır ya da iddiayı kes. Atıflı iddiayı, atfı silip yazarın kendi
  iddiasına çevirmek de uydurmadır. Tek kaynaklı görüşü "yaygın kabul gören" diye
  sunmak ve kapalı listeyi "gibi" ile uçsuz göstermek de bu izdir.
- Kaynak: blader §17 · nas K8 · WP:AIWEASEL · aaw "Vague third-party validation". Bkz.
  yk §14.

**20. Prestij listesi ve görünürlük vurgusu**
- EN: "featured in NYT, BBC, and other outlets" · "active social media presence"
- TR: "Hürriyet, NTV, Webrazzi ve birçok yayında yer aldık." · "Sosyal medyada güçlü
  bir varlık sürdürüyoruz."
- Düzelt: dört isim yerine bağlantısıyla tek haber: "Webrazzi, Mart 2025'teki yatırım
  turumuzu haberleştirdi."
- Kaynak: blader §17 · WP:AIATTR · aaw "Notability name-dropping".

**21. Belirsiz ilişki**
- EN: "associated with", "in connection with"
- TR: "…ile ilişkilendirilen" · "…ile bağlantılı olarak" · "…kapsamında adı geçen"
- Düzelt: "Ahmet Bey, X Yazılım'ın yönetimiyle ilişkilendirilmektedir." → "Ahmet Bey X
  Yazılım'ın genel müdürü." Kaynak rolü söylemiyorsa muğlak ifade kalır, rol uydurulmaz.
- Kaynak: blader §14 · WP:AICONNECT.

**22. "Zorluklara rağmen" ve gelecek kapanışı**
- EN: "Despite these challenges, X continues to thrive." · "The future looks bright."
- TR: "Tüm zorluklara rağmen büyümeye devam ediyoruz." · "Önümüzdeki yıllarda daha da
  önem kazanacak." · "Zaman gösterecek."
- Düzelt: paragrafı sil, son somut olguda bitir. Gerçek plan varsa onu yaz: "Ocak'ta
  İzmir şubesini açıyoruz."
- Kaynak: blader §13 · WP:FACESCHALLENGES · aaw "Generic future-narrative closers".
  Bkz. pi §14.

**23. "Gerçek/asıl" sıfatı, ahlaki sıfat, evrensel niceleyici**
- EN: "real utility", "an honest shape", "taught in every course"
- TR: "gerçek değer", "asıl çözüm", "dürüst bir tasarım", "her işletmenin ihtiyacı",
  "tüm sektörlerde"
- Düzelt: "Size gerçek bir fark sunuyoruz." → farkı adlandır ya da sıfatı at.
  Karşıtlık açıkça adlandırılmışsa kalır: "gerçek müşteri yorumu, satın alınmış değil".
- Kaynak: aaw "Real/actual adjective inflation", "Moral-adjective category errors".

### D. Kurala bağlı biçim

**24. Süs kalın ve etiketli liste**
- EN: "**Performance:** Performance has been enhanced…" · "**Intros.** Years of…"
- TR: "**Hız:** Siteniz hızlı açılır." · "**Güvenlik.** Verileriniz güvende."
- Düzelt: etiket bilgi taşımıyorsa düzyazıya çevir; etiketten sonra nokta koyan
  biçim de aynı izdir. Bkz. yk §11.
- Kaynak: blader §19 · WP:AIBOLD, WP:AILIST · aaw "Inline-header lists", "List-label
  periods".

**25. Başlık süsü**
- EN: başlığı tekrar eden ilk cümle ("## Performance" + "Speed matters."), her bölüm
  arasında yatay çizgi, sayfa adını tekrar eden en üst başlık.
- TR: "## Hız" + "Hız her şeydir." · her bölümün altında `---`.
- Düzelt: ısınma cümlesini ve ayraçları sil, başlık bir kez dursun. Büyük harf ve
  emoji: bkz. yk §11.
- Kaynak: blader §20, §24 · WP 5.1, 5.12 · aaw "Excessive structure".

**26. Fazla yapı: numaralı liste, kısa metinde başlık, gereksiz tablo**
- EN: "Three key takeaways" · 300 kelimenin altında 3'ten fazla başlık · "Metric /
  Figure" tablosu.
- TR: "Bilmeniz gereken 5 şey" · iki paragraflık konuya "Giriş / Önemli Noktalar /
  Sonuç" · hakkımızda sayfasında "Kuruluş / Çalışan / Şehir" tablosu.
- Düzelt: liste ancak kaynakta o kadar ayrı öge varsa numaralanır; iki üç olgu
  cümleyle yazılır, tablo gerçek karşılaştırma içindir. Fiilsiz isim öbeği listesi:
  bkz. pi §7.
- Kaynak: aaw "Numbered list inflation", "Excessive structure" · nas K17 · WP:AITABLE.

### E. Sohbet ve taslak artıkları

**27. Sohbet artığı ve dalkavukluk**
- EN: "Great question!" · "You're absolutely right!" · "Would you like me to…?"
- TR: "Harika bir soru!" · "Kesinlikle haklısınız." · "İsterseniz bir de sosyal medya
  metni hazırlayabilirim."
- blader'a göre listenin **en kesin izi** ve gerçek içeriği sardığında en kolay kaçanı.
  Sarmalayıcı silinir, içerik kalır. Bkz. yk §1, §2, §10.
- Kaynak: blader §22 · WP:COLLABCOMM · aaw "Chatbot artifacts", "Sycophantic tone".

**28. Soruyu cevapta tekrar etmek**
- EN: "You're asking about retries. Retries are how…"
- TR: SSS'de sık: "E-fatura zorunlu mu? E-faturanın zorunlu olup olmadığı,
  işletmenin cirosuna bağlıdır."
- Düzelt: → "Ciro sınırını aşıyorsanız evet." Bkz. `sicil.md` SSS.
- Kaynak: aaw "Acknowledgment loops".

**29. Bilgi sınırı ve tahminle boşluk doldurma**
- EN: "While specific details are limited, it likely began in the 1990s."
- TR: "Kesin bilgi sınırlı olmakla birlikte firmanın 1990'larda kurulduğu
  düşünülmektedir." · "Büyük olasılıkla aile işletmesi olarak başlamıştır."
- Düzelt: kullanıcıya sor ya da cümleyi sil; tahmin olgu gibi yazılmaz. Boşluğu itiraf
  eden cümleden kötüsü, boşluğu makul görünen dolguyla örtendir. Bkz. yk §10.
- Kaynak: blader §23 · WP:AICUTOFF · aaw "Speculative gap-filling".

**30. Didaktik uyarı ve bölüm özeti**
- EN: "It's important to note…", "may vary" · "In summary,"
- TR: "Önemle belirtmek gerekir ki…" · "Koşullar bölgeye göre değişiklik gösterebilir."
  · her bölüm sonunda "Kısacası…" paragrafı.
- Wikipedia bunları 2022-2024 modellerine ait "tarihsel" iz sayar; Türkçe GPT
  çıktısında kapanış klişesi hâlâ güçlü ayırıcı (kalibrasyon: insan %3, LLM %28).
- Kaynak: WP:DIDACTIC, WP:CONCLUSION · nas K16. Bkz. yk §2.

**31. Akıl yürütme artığı ve önceki sürümü anlatmak**
- EN: "Let me think step by step." · "This function was added to replace…"
- TR: "Adım adım ele alalım." · "Yenilenen sitemizde artık eskisinden farklı olarak…"
- Düzelt: iskeleyi sil, akıl yürütmenin kendisini koru; şimdiki durumu anlat.
  Değişiklik yalnız sürüm notunda ve duyuruda anlatılır.
- Kaynak: aaw "Reasoning chain artifacts", "Diff-anchored writing" · blader §25.

**32. Doldurulmamış yer tutucu**
- EN: "[Your Name]", "2025-XX-XX" · TR: "[Firma Adı]", "[buraya telefon]", "XX TL".
- Tek görülmesi yeter; yalnız kullanıcının verdiği bilgiyle doldurulur.
- Kaynak: WP:AIPLACEHOLDER · aaw "Unfilled placeholders".

**33. Mekanik parmak izi**
- `utm_source=chatgpt.com`, `contentReference[oaicite:0]`, `turn0search0`, `[cite: 1]`,
  `grok_card`. Kalıp değil kanıttır, tek görülmesi yeter. İşareti ve izleme
  parametresini çıkar, işlevsel parametreye (`?sayfa=2`) dokunma; atıf boşsa kaynak
  uydurma, boşluğu bildir.
- Kaynak: WP:OAICITE, WP 8.6 · aaw "Chatbot citation markup leaks".

---

## 1b. Türkçeye geçmeyenler ve dönüşerek geçenler

**Tek kelime listeleri** ("delve, tapestry, testament, pivotal") Türkçeye aynen geçmez.
Wikipedia'nın uyarısı belirleyici: bir kelimenin aşırı kullanılması eş anlamlılarının da
aşırı kullanıldığını göstermez. Türkçe karşılıklar varsayılamaz, ölçülmelidir. Çeviride
beliren biçimler yasak değil, **yoğunluk** işaretidir:

| İngilizce | Türkçede dönüştüğü biçim |
|---|---|
| delve, deep dive | derinlemesine incelemek, detaylı bir bakış |
| tapestry, landscape (mecaz) | zengin doku, mozaik, dijital dünya |
| testament to, stands as | …nın kanıtı niteliğinde, …nın simgesi olarak |
| underscore, highlight (fiil) | altını çizmek, ön plana çıkarmak, gözler önüne sermek |
| foster, enhance, bolster | desteklemek, geliştirmek, güçlendirmek (nesnesiz, mecazi) |
| Additionally (cümle başı) | Ayrıca, Bunun yanı sıra (bkz. yk §3) |

Kelime alışkanlığı sürümle değişir ("delve" 2024'te düştü; WP:AIVOCAB). Kelime listesi
bu becerinin en zayıf katmanıdır.

**Kopula kaçınması** Türkçede yüklem şişmesine döner. "serves as, features, boasts,
represents" → "hizmet vermektedir", "yer almaktadır", "olarak karşımıza çıkmaktadır",
"konumundadır", "niteliğindedir", "özelliğine sahiptir", "bünyesinde barındırmaktadır",
"ev sahipliği yapmaktadır".
- "Galeri 825, derneğin çağdaş sanat sergi alanı olarak hizmet vermektedir." →
  "Galeri 825, derneğin çağdaş sanat sergi salonu."
- "Otelimiz 40 odaya ev sahipliği yapmaktadır." → "Otelde 40 oda var."

Kalibrasyonda `-maktadır` sayısı tek başına ayırt etmiyor (AUC 0,52). İz ekin kendisi
değil, "var", "-dır" ya da ek fiilin yerine süslü fiil konmasıdır. (blader §18 ·
WP:AINOCOPULA · aaw "Copula avoidance" · nas K9.)

**"refers to" ile açılan tanım** "…ifade etmektedir" olur: "E-arşiv fatura, faturanın
elektronik düzenlenmesini ifade eder." → "E-arşiv fatura, elektronik düzenlenen
faturadır." Tanımda "-dır" yerindedir (bkz. pi §3).

**Tireli çiftler** Türkçede tire almaz, yerine kalıp yığılır: "veri odaklı, müşteri
odaklı", "kullanıcı dostu", "uçtan uca", "geleceğe hazır". Tek tek doğrudur, iz
yoğunluktur. (blader §10 · aaw "Hyphenated modifier stacking".)

**Başlıkta her kelimeyi büyük yazmak** aynen geçer ve TDK kuralıyla örtüşür. Bkz. yk §11.

**Uzun tire** aynen geçer (copy: en sık şikâyet edilen tek iz). Ama modele bağlıdır: The
Economist'in Temmuz 2026 ölçümünde güncel modellerden yalnız Claude profesyonel
yazarlardan fazla uzun tire kullanıyor, ChatGPT daha az. GPT çıktısında uzun tire
olmaması temiz olduğunu göstermez. Kural: bkz. yk §11.

**Kıvrık tırnak** zayıf bir "sohbetten yapıştırıldı" işaretidir; Word ve telefonlar
tırnağı kendiliğinden kıvırır. Türkçede de iz sayılmaz, yalnız tutarlılığa bakılır.
(blader §21 · WP:AICURLY.)

**Edilgen ve öznesiz cümle** aynı yükle geçmez. Türkçede özne düşürmek normdur (bkz. pi
§11); edilgen oranı kalibrasyonda ayırt etmiyor (AUC 0,55). Yalnız "tarafından" ile
sorumlunun gizlenmesi ve fiilsiz telgraf satırı kalır (bkz. pi §4, §7). (blader §11 ·
aaw "Subjectless fragments".)

**Eş anlamlı kovalama** zayıflamış bir izdir: blader 3.0 listeden çıkardı, Wikipedia
"tarihsel göstergeler"e taşıdı (tekrar kaçınma okullarda da öğretilir). Tek başına hüküm
verdirmez. Bkz. yk §13.

**İnsan izi olarak korunacaklar** (WP 10.3): basit "var", "-dır" cümleleri; sade fiil
("yazdı", "taşındı", "kullandı"; "kaleme aldı", "gerçekleştirdi" değil); kaynaklıysa
kesin ve üstünlük bildiren ifade ("tek", "ilk"); "çok", "belki", "genelde" gibi tek
çekince ve pekiştirme.

---

## 2. Kaynakların ilkeleri

### 2.1 Kök mekanizma: en olası, en geniş kitleye uyan seçim

Wikipedia ve blader aynı açıklamayı verir. Dil modeli sıradaki en olası kelimeyi seçer
ve ortalamaya geriler: en çok duruma, en çok okura uyan seçimi yapar. İnsan tek okur ve
tek konu için seçer; seçimleri düzensiz ve özgüldür. Özgül olgu istatistikte seyrek
olduğu için silinir, yerine sık görülen genel ve olumlu tanım gelir. Wikipedia'nın
örneğinde "ilk vagon bağlama aygıtını geliştiren kişi", "sanayinin devrimci öncüsü"
olur: portre silikleşirken önemli olduğu daha yüksek sesle söylenir. Türkçe site
metninde karşılığı, "Kartal'da 12 yıldır kombi tamiri yapan usta" yerine "alanında
uzman, deneyimli ekip" yazmaktır.

blader bu varsayılan seçimin beş biçimini sayar (bölüm 1'in A-E grupları):
**sahneleme** (cümle olgu yerine önem sinyali verir), **kurala bağlı ritim** (üçlü ve
tire her yerde), **şişirme** (sıradan olgu dönüm noktası ya da uzman onaylı diye
giydirilir), **kurala bağlı biçim** (kalın ve büyük harf her maddeye), **artıklar** (okur
için yazılmamış sohbet ve taslak kalıntısı). Kelime alışkanlıkları her sürümle değişir,
yapısal alışkanlıklar kalır. İki kural buradan çıkar: tuttuğun her cümle okura bilmediği
bir şey vermeli; bir izin ağırlığı, dikkatli bir yazarın onu **bilerek** yapma
olasılığıyla ters orantılıdır.

### 2.2 İz gücü kademesi

- **Tek görülmesi yeter** (blader §1-§5 ve artıklar): olumsuz koşutluk, tek satırlık
  kapanış, derin görünen söz, sahnelenmiş giriş, kimseyle tartışma, sohbet artığı (en
  kesini), yer tutucu, mekanik parmak izi.
- **Tek başına zayıf, eşlik ister** (blader "weak alone"): uzun tire, yığılmış çekince,
  tireli çiftler, edilgen, kıvrık tırnak. Türkçe kalibrasyonun ayırt etmeyen ölçümleri
  de buraya: `-maktadır`, cümle sonu `-DIr` oranı, edilgen oranı, cümle başına ulaç,
  bürokratik kalıp (insan %29, LLM %28), geçiş kelimesi yoğunluğu.
- **Türkçede güçlü ayırıcı** (kalibrasyon): düz ritim, kapanış klişesi (insan %3, LLM
  %28), olumsuz koşutluk (%3, %24), boş vurgu (%1, %18); "ve" ve "bir" yoğunluğu orta
  güçte.

İzlerin birlikte görülmesi insan yazısı olasılığını hızla düşürür. Wikipedia temizlik rehberinin örneği: uzun
tirenin insan metninde görülme olasılığı %20, "pivotal" ve "interplay" %15, aşırı atıf
%25 ise üçünü birden taşıyan metnin insan yazısı olma olasılığı %0,75'e iner. Tek zayıf
iz ise hiçbir şey söylemez.

### 2.3 Yeniden yazımdan en sık sağ çıkan beş iz

blader'ın taslak denetimi: olumsuz koşutluk, tek satırlık kapanış, uzun tire, üçlü,
kalın etiket (SKILL.md son okumada ayrıca aranır). Aynı adımda sorulur: yeniden yazım bir
olgu, ad, sayı, tarih, alıntı, sıralama ya da "aynı anda oluyor" iddiası **ekledi mi,
düşürdü mü?**

### 2.4 Wikipedia: işaret sorun değil, sorunun belirtisi

- **İşaretleri silmek sorunu çözmez.** Asıl sorun kaynaksız ya da yanlış iddia, uydurma
  kaynak, genel geçer içeriktir. Uzun tireyi ve "vibrant"ı temizleyip içeriği bırakmak
  metni yalnız daha zor tespit edilir kılar. Bu beceride karşılığı, yüzey temizliğinden
  önce mantık kapısındaki kaynak ve silme testleridir (bkz. `mantik-kapisi.md`). copy'nin
  deyişiyle her tarayıcıdan geçip yine bir şey söylemeyen metin temizlenmemiş,
  zımparalanmıştır.
- **Sezgiye güvenme.** İnsanların ayırt etme başarısı şansa yakın; yoğun LLM
  kullananlar %90 civarında. Denetleyicilerin hata oranı da küçük değil.
- **Etkisiz göstergeler.** Kusursuz dil bilgisi, resmî ya da süslü dil, "yavan" anlatım,
  tek başına geçiş kelimesi ve kaynaksız içerik yapay zekâ kanıtı değildir. 30 Kasım
  2022'den önce yazılmış metin yapay zekâ ürünü değildir.

### 2.5 no-ai-slop

- **Taşınabilirlik testi.** Değiştirilmeden başka kişiye, şirkete, ülkeye ya da ürüne
  taşınabilen cümle dolgudur; silinir ya da bu konuya özgü bir olgu, örnek, mekanizma,
  sonuç veya yargıyla değiştirilir (bkz. `mantik-kapisi.md`).
- **En küçük etkili düzenleme.** Kalıbı, hatayı, tekrarı ve anlaşılmayan yeri düzelt;
  güçlü insan cümlesine dokunma. Ham ama sesi olan taslak düzenlemeden sonra da aynı
  kişi gibi okunmalı; kesme oranı gerçek kusurla orantılı olmalı.
- **Denetle kipinde hüküm yok.** Kalıbı adlandır, satırı alıntıla, birkaç kelimelik
  düzeltme ver; puan, yeniden yazım, "yapay zekâ yazmış" tahmini yok. Denetleyiciler
  tahmin eder, adı konmuş iz ise kullanıcının doğrulayabileceği kanıttır.

### 2.6 avoid-ai-writing

- **Aday, bulgu, düzenleme.** Kalıp eşleşmesi adaydır; bağlam istisnaları ve anlam
  okununca bulgu olur; bulgu ancak kullanıcının istediği kip ve kapsam izin verirse
  düzenlenir. Tespit tek başına yeniden yazma yetkisi vermez.
- **Ciddiyet katmanları.** P0 güvenilirliği öldürür (bilgi sınırı cümlesi, sohbet
  artığı, kaynaksız atıf, önem şişirmesi); P1 yayından önce, P2 vakit varsa düzeltilir.
- **1A ve 1B ayrımı.** 1A kelimeleri sıklık işaretidir. 1B ("utilize", "in order to")
  söz kalabalığıdır, insanlar da yazar; düzeltilir ama yazarlık kanıtı sayılmaz ve
  denetimde ayrı raporlanır. Türkçe karşılığı: "gerçekleştirmek", "-mek amacıyla" gibi
  bürokratik kalıplar üslup notudur, iz skoru değildir (kalibrasyon da bunu buldu).
- **Yanlış pozitif incelemesi.** Denetleyici çıktısı gürültülü kanıttır; ana dili
  İngilizce olmayan yazarlarda ticari denetleyicilerin yanlış pozitif oranı %60'ı
  aşıyor. Puan ya da kalıp listesi kopya veya sahtecilik hükmüne çevrilmez.
- **Koruma denetimi.** Önce ve sonra karşılaştırılır: miktar, birim, olumsuzlama, koşul,
  nedensellik, kesinlik derecesi, atıf ve korunan alan (kod, URL, alıntı) aynı mı?
  Sonuç GEÇTİ, İNCELE ya da KALDI. KALDI ise yalnız bozulan aralık bir kez onarılır;
  ikinci başarısızlıkta durulur ve bildirilir. Yeniden yazım en fazla iki geçiştir.
- **Gerekçe yoksa değişiklik yok.** Bulgu yoksa metin olduğu gibi döner. Aşırı cilalama
  tersine çalışır: her pürüzü zımparalamak metni yapay zekâ profiline iter.
- **Asla eklenmeyecekler.** Uydurma konuşan deneyimi ("yüzlerce kez gördüm"), yapay
  aciliyet ("hiç olmadığı kadar önemli"), zorlama aykırılık ("herkes yanılıyor"),
  sahnelenmiş içtenlik, tire gösterisi, cümle doğramak, uydurma somutluk. Somutluk en
  cazip düzeltmedir; uydurulmuş özgüllük, yerini aldığı belirsiz ifadeden **daha
  kötüdür**. blader üzerinde yapılan bir sınamada genel yapay zekâ dili
  kırpık, kesik bir "insanlaştırıcı sesiyle" yer değiştirdi: yeni bir iz doğdu.
- **Yazar tarafı iki test.** Her paragrafa "burada yeni olan ne?" diye sor; metnin
  %40-60'ı bilgi kaybı olmadan kesilebiliyorsa iz budur. İki gövde paragrafının yeri
  değişince metin bozulmuyorsa yazılan şey argüman değil, madde listesidir.

---

## 3. lynote-ai/humanize-text tekniklerinin değerlendirmesi

lynote'un tezi, işin asıl kısmının çeviri zinciri olduğudur. Ölçütümüz SKILL.md'deki
sıradır: doğruluk (TDK, uydurma yok) > anlam > doğallık > denetleyici skoru.

| Teknik | Uyum | Neden |
|---|---|---|
| Çeviri zinciri (EN → ZH → JA → FI → EN, iki LLM adımı 1,3 sıcaklıkta) | **Uyumsuz** | 3.1 |
| Karma motor çevirisi (2-3 motordan en "doğal" parçayı seçmek) | **Uyumsuz** | Aynı çeviri kokusu, parça sınırlarında kopukluk |
| Çok turlu yeniden yazım (paraphrase) | **Kısmen** | 3.2 |
| Burstiness hedefleme | **Hedef doğru, yöntem yanlış** | 3.3 |
| Perplexity, TTR ve hapax eşikleri | **Ölçüm olarak uyumsuz** | 3.3 |
| Son işlemde kelime değiştirme (30 kelime, ilk geçtiği yerde rastgele eş anlamlı) | **Uyumsuz** | Rastgele eş anlamlı değiştirme; bağlama bakmaz, eş dizimi bozar |
| Ritim bozma (kısa iki cümleyi uzun tireyle birleştirmek) | **Uyumsuz** | Uzun tire üretir; blader §8 ve yk §11 ile çatışır |
| Denetleyici geri besleme döngüsü | **Hedef olarak uyumsuz** | 3.4 |

### 3.1 Çeviri zinciri Türkçe için neden özellikle tehlikeli

- **Şikâyet edilen kusuru üretir.** Kullanıcının şikâyeti, metnin sesli okununca yanlış
  yerde vurgulu ve çeviri gibi durmasıdır. Makine çevirisinin Türkçe çıktısı bu kokunun
  kaynağıdır: İngilizce bilgi sırası (yeni bilgi sonda, vurgu kayar; pi §0), edat
  kalıpları (pi §9), düşürülmemiş özne (pi §11), "ve"li bağlar. Zincir yapay zekâ
  kokusunu çeviri kokusuyla değiştirir; bu beceri için ikisi aynı kusurdur.
- **Sondan eklemelilik gerekçesi tersine işler.** lynote Fince'yi, biçimbilimi kelime
  biçimlerini ve yan cümle sınırlarını zorla yeniden kurduğu için seçmiş. Türkçe de
  sondan eklemelidir; hedef dil Türkçe olunca aynı zorlama ek dizilişini, hâl eki
  uyumunu ve eş dizimi bozar (bkz. `mantik-kapisi.md`).
- **Anlam kayar, uydurma sızar.** Deponun kendi örneğinde "quantum readiness" "quantum
  response"a dönüşüyor, donanımın sınırladığı şey algoritmaya yükleniyor, özgünde
  olmayan "stratejik plan geliştirme" ekleniyor. Depo yine de "bilgi korunumu %100"
  diyor.
- **TDK garantisi yok.** Motor "de/da"yı, kesmeyi, düzeltme işaretini denetlemez.
- **Yapıya dokunmaz.** StoryScope: stil yıkama stil denetleyicisini yener, anlatı yapısı
  sınıflandırıcısı aynı metinleri %93,9 oranında yakalar (bkz. `mudahale-defteri.md`).

### 3.2 Çok turlu yeniden yazımdan alınan ve alınmayan

Alınan: yeniden yazımın olgu korumayla sınırlanması, her turun tek konuya bakması
(SKILL.md'deki geçişlerle aynı mantık), soyut iddia yerine somut örnek. Alınmayan:
1,1-1,3 sıcaklık (tutarsızlık, anlam kayması), turlar boyunca biriken sapma (en fazla iki
geçiş sınırı geçerli), "gündelik ifade ve retorik soru ekle" talimatı (zorlama samimiyet
ve iz 9; bkz. yk §9).

### 3.3 Burstiness ve perplexity

Hedef doğru: kalibrasyonda cümle uzunluğu değişkenliği (cumleCV) en güçlü ayırıcı çıktı;
insan medyanı 0,51, GPT 0,29, AUC 0,07. Haberde ve serbest metinde, iki modelde de aynı.
lynote'un kodundaki "CV ≥ 0,50 temiz" eşiği Türkçe insan medyanıyla örtüşüyor. Yöntem
yanlış: "3-8 ve 25-40 kelimelik cümleleri dönüşümlü yaz", "art arda üç benzer boyda
cümle olmasın" gibi kurallar blader'ın "kurala bağlı ritim" dediği şeyin ta kendisidir
ve yeni, tanınabilir bir ritim üretir. Uzunluğu anlam belirler; Türkçede ulaç, "-dıkça",
"-ken" uzun cümleyi doğal kurar, kısa cümle yeni bilgi taşıdığında kalır.

Perplexity ölçümü Türkçede kullanılamaz: kod İngilizce GPT-2 ile ölçüyor. TTR ve hapax
eşikleri İngilizce yüzey biçimine göre; Türkçede her çekimli biçim ayrı kelime sayıldığı
için TTR şişer ve metin yanlışlıkla "temiz" görünür.

### 3.4 Denetleyici geri beslemesi

Döngü skoru hedef yapar; bu beceride skor dördüncü sıradadır ve ancak ilk üçünün sonucu
olarak düşer (bkz. `denetleyici.md`). lynote'un kendi notuna göre açık kaynak
denetleyiciler ticari olanlarla korele olmayabilir; kullandığı RoBERTa ve GPT-2
İngilizce modellerdir, Türkçede gürültü üretir. Kabul edilebilir biçimi: `tr-scan.mjs`
çıktısını adı konmuş iz listesi olarak okumak, bulguları tek tek gerekçelendirip
düzeltmek, en fazla iki geçişte durmak. Skoru düşürmek için cümle yeniden yazılmaz.

---

## 4. rephrasy'nin "bypass" becerileri neden alınmadı

rephrasy'nin 12 "bypass-X" becerisi (GPTZero, Turnitin, Pangram, Originality.ai vb.)
aynı şablondur; yalnız dört alan (kimin kullandığı, denetleyicinin nasıl çalıştığı, zayıf
yeri, ürün bağlantısı) değişir. Hepsi aynı dört adımı (yapıyı değiştir, izleri sil, somut
ayrıntı ekle, kendini denetle) önerip ücretli "Undetectable Model v3" API'sine yönlendirir.
Alınmadı: amaçları metni iyileştirmek değil denetleyiciyi atlatmak; "somutluk
öngörülemezliği artırır" gerekçesi uydurma somutluğun kapısını açıyor; denetleyiciye özel
iddialar ölçülmemiş; metin üçüncü taraf bir API'ye gidiyor; Türkçe hiç ele alınmıyor.
Kalan tek ders: denetleyici değişse de doğru yaklaşım değişmiyor, tek iyi kural seti yeter.

---

## 5. Site ve blog metnine özel izler

copy çalışmasına göre sayfa metninde en çok şikâyet edilen izler uzun tire, "X değil, Y",
reklam kelimeleri ve dalkavukluk/tabela cümleleridir; yarısı regexle yakalanamaz
(tekdüze ritim, kalıp iskelet, cilalı ama boş metin). Tek kural: şeyin ne yaptığını, bir
insanın gerçekten söyleyeceği kelimelerle ve bir gerekçeyle yaz. "Yerine" sütunu bir
**olgu** önerir; olgu yoksa cümle sadeleşir ya da silinir.

### 5.1 Hero başlığı ve alt başlık

| # | Çeviri kokan | Kökü (kaynak) | Yerine |
|---|---|---|---|
| 1 | "Muhasebeniz, yeniden tasarlandı." | "Your X, reimagined" (copy 3) | Neyin değiştiği: "Fatura, stok ve KDV aynı ekranda." |
| 2 | "Ön muhasebeyi yeniden tanımlıyoruz." | reimagine (aaw Katman 2) | Farkınız: "Kurulumu uzaktan, bir iş gününde yapıyoruz." |
| 3 | "Randevunun geleceği burada." | "The future isn't coming. It's already here." (nas) | Ürün ne: "Randevu, ödeme ve hatırlatma tek panelde." |
| 4 | "Tanışın: Kasa Pro, yeni favori muhasebe aracınız." | "Meet X, your new favorite…" (aaw "Launch-copy") | "Kasa Pro, küçük işletmeler için ön muhasebe programı." |
| 5 | "Excel ile Notion'ın buluştuğu yer." | "Think X meets Y" (aaw "Launch-copy") | "Tablo gibi çalışan, not da tutabileceğiniz bir planlayıcı." |
| 6 | "Hızlı. Güvenli. Basit." | kesik üçlü (aaw, blader §6) | Tek iddia, tek ölçü: "Sayfalar bir saniyenin altında açılıyor." Bkz. yk §12. |
| 7 | "Verinizin kilidini açın." | unlock (copy 3, aaw) | "Satış verinizi her pazartesi tek sayfalık rapora çeviriyoruz." |
| 8 | "Ekibinizi güçlendirin." | empower (nas, aaw Katman 2) | Bkz. yk §5. "Ekip izin talebini telefondan onaylıyor." |
| 9 | "İş akışınıza süper güç katın." | supercharge (nas, copy 3) | "Dışa aktarma dört tıktan bire iniyor." |
| 10 | "Satışlarınızın gücünü serbest bırakın." | unleash (aaw Katman 2, copy 3) | "Terk edilen sepete bir saat sonra hatırlatma e-postası gidiyor." |
| 11 | "Dijital dönüşüm yolculuğunuz burada başlıyor." | journey (WP:AIPUFFERY) | Bkz. yk §5. Süreç: "İlk görüşmeden yayına dört hafta." |
| 12 | "Sorunsuz entegrasyon", "kesintisiz deneyim" | seamless (aaw Katman 1A) | Bkz. yk §4. "Trendyol siparişleri panele kendiliğinden düşüyor." |
| 13 | "Zahmetsizce yönetin.", "Hiç olmadığı kadar kolay" | effortlessly (copy 3) | Bkz. yk §4. "Kurulum için kod bilgisi gerekmiyor." |
| 14 | "Kutudan çıktığı gibi çalışır", "sıfır kurulum" | "it just works", "zero config" (aaw "Dev-blog boilerplate") | Gösterilebilir davranış: "Yapılandırma dosyası olmadan kuruluyor." |
| 15 | "Uçtan uca, veri odaklı, ölçeklenebilir çözümler" | end-to-end, data-driven, scalable (blader §10, aaw) | "Tasarımı, kodu ve barındırmayı aynı ekip yapıyor." |
| 16 | "Yenilikçi çözümler", "akıllı çözümler" | innovative (aaw Katman 3, lynote) | Yeni olanı adlandır ya da sil. |
| 17 | "Dünya standartlarında", "son teknoloji" | world-class, cutting-edge (aaw, copy 3) | Bkz. yk §4. Ölçüt: "ISO 27001 belgeli veri merkezi." |
| 18 | "Göz alıcı tasarım, güçlü performans" | sıfat + isim yığını (aaw "Bullet lists of bare noun phrases") | "Tema 40 KB, görseller WebP." Bkz. pi §7. |

### 5.2 Kitle, kapsam ve gövde

| # | Çeviri kokan | Kökü (kaynak) | Yerine |
|---|---|---|---|
| 19 | "İster küçük bir işletme olun ister büyük bir kurum, …" | "Whether you're X or Y" (aaw "Template phrases", rephrasy) | Kitleyi seç: "10 kişiye kadar ekipler için." Kalıp "herkes" demenin uzun yoludur. |
| 20 | "Girişimden kurumsala, e-ticaretten üretime kadar" | "from X to Y" sahte aralık (aaw "False ranges", WP:AIPUFFERY) | Gerçek liste ya da tek örnek: "Müşterilerimizin çoğu e-ticaret sitesi." |
| 21 | "Günümüzün hızla değişen dijital dünyasında" | "In today's fast-paced world" (rephrasy, copy 3) | Bkz. yk §1. Okurun sorunuyla başla. |
| 22 | "Size özel çözümler sunuyoruz." | tailored solutions, taşınabilirlik (nas) | Bkz. `sicil.md`. Neye göre özel: "Menüyü her şubeye ayrı yüklüyoruz." |
| 23 | "Siz işinize odaklanın, gerisini biz halledelim." | taşınabilirlik testinden kalan cümle (nas) | "Alan adı, sunucu ve yedekleme bizde; siz yalnız içeriği onaylıyorsunuz." |
| 24 | "Kadıköy'ün kalbinde yer alan", "eşsiz manzarasıyla" | "nestled in the heart of" (blader §16, WP) | "Kadıköy iskelesine beş dakika yürüme mesafesinde." |
| 25 | "Oyunun kurallarını değiştiren", "çığır açan" | game-changer (nas, aaw 1A) | Bkz. yk §4. Neyin değiştiğini yaz. |
| 26 | "Güvenilir çözüm ortağınız", "yeni nesil ekosistem" | partner, ecosystem (aaw Katman 2) | Bkz. yk §5. Ne yaptığınızı yaz. |
| 27 | "Müjde!", "İşin en güzel yanı ne mi?" | "The best part?" (aaw "Infomercial engagement hooks") | Haberin kendisi: "1.000 TL üzeri siparişte kargo ücretsiz." |

### 5.3 Güven ve kanıt

| # | Çeviri kokan | Kökü (kaynak) | Yerine |
|---|---|---|---|
| 28 | "Binlerce mutlu müşteri bize güveniyor." | "trusted by thousands" (aaw "Vague third-party validation") | Bkz. yk §14. Sayı olgu listesindeyse sayı ve kim; yoksa sil. |
| 29 | "Bağımsız testler kanıtlıyor", "uzmanlar öneriyor" | "independent testing confirms" (aaw) | Testi, tarihi ve sonucu adlandır; yoksa sil. |
| 30 | "Hürriyet, NTV ve birçok yayında yer aldık." | "featured in…" (blader §17, WP:AIATTR) | Bağlantısıyla tek haber. |
| 31 | "Hikâyemiz tutkuyla başladı.", "vizyon, misyon, değerler" | puffery ve üçlü (WP:AIPUFFERY, WP:RO3) | Bkz. `sicil.md` hakkımızda. Kim olduğunuzu ve ne yaptığınızı düz yazın. |
| 32 | "Neden biz?" altında üç eşit kart | "Key Points" iskeleti (aaw "Excessive structure", blader §6) | Kanıt yoksa bölüm yok; kaç gerçek neden varsa o kadar kart. |

### 5.4 CTA ve kapanış

| # | Çeviri kokan | Kökü (kaynak) | Yerine |
|---|---|---|---|
| 33 | "Hemen başlayın", "Keşfedin", "Daha fazlasını öğrenin" | jenerik CTA (rephrasy: "one clear action, not a menu of five") | Ne olacağını söyleyen fiil: "Fiyat alın", "Demo saati seçin". Bkz. `sicil.md`. |
| 34 | "Keşfetmeye hazır mısınız?" | "Ready to…?" (aaw "Rhetorical question openers") | Bkz. yk §5. Koşul: "14 gün ücretsiz; kart bilgisi istemiyoruz." |
| 35 | "Bir mesaj uzağınızdayız.", "Bir tık uzağınızda" | "just a message away", "Feel free to reach out" (aaw "Chatbot artifacts") | Kanal ve süre: "WhatsApp'tan yazın, iş günlerinde iki saat içinde döneriz." |
| 36 | "Sorularınız mı var? Bize ulaşın!", "Sizin için buradayız." | "let me know" (blader §22, WP:COLLABCOMM) | İletişim bilgisi ve saat: "Hafta içi 09.00-18.00, 0212 …" |
| 37 | "Göz atmaya değer", "Kaçırmayın!", "Mutlaka okuyun" | "worth your time", "must-read" (aaw "Social endorsement closers") | Neden okunmalı: "Bu yazı KDV iadesi başvurusunun adımlarını anlatıyor." |
| 38 | "Unutmayın: doğru adım başarıyı getirir." | fake-profound kicker (nas K15) | Bkz. yk §2. Son somut adımda bitir. |

### 5.5 Blog iskeleti

| # | Çeviri kokan | Kökü (kaynak) | Yerine |
|---|---|---|---|
| 39 | "Bu yazıda X'i derinlemesine inceleyeceğiz." | "In this article, we will explore…" (aaw, WP) | Bkz. yk §1. İlk paragraf okurun sorusunu cevaplasın. |
| 40 | "X Nedir? / X'in Önemi / X'in Avantajları / Sonuç" | "Overview / Key Points / Conclusion" (aaw "Excessive structure") | Ara başlık okurun sorusu: "E-fatura zorunlu mu?" Bkz. `sicil.md`. |
| 41 | "İşte X'in 7 yolu", "Bilmeniz gereken 5 şey" | "Here are the top seven" (aaw "Numbered list inflation") | Liste yalnız o kadar ayrı öge varsa. "İşte" başlık klişesi: bkz. pi §0b. |
| 42 | "Zorluklar ve gelecek" bölümüyle biten yazı | "Challenges and Future Outlook" (WP:FACESCHALLENGES) | Son somut olguda bitir; plan varsa planı yaz. |

---

## Kaynaklar ve lisans

- blader/humanizer 3.0.0, MIT. https://github.com/blader/humanizer
- petergyang/no-ai-slop, MIT. https://github.com/petergyang/no-ai-slop
- conorbronsdon/avoid-ai-writing 3.35.0, MIT (içinde uyarlanan brandonwise/humanizer,
  isatimur/de-slop, Aboudjem/humanizer-skill, tropes.fyi).
  https://github.com/conorbronsdon/avoid-ai-writing
- lynote-ai/humanize-text 1.5.1, MIT. https://github.com/lynote-ai/humanize-text
- rephrasyai/rephrasy-skills, MIT. https://github.com/rephrasyai/rephrasy-skills
- jcarterjohnson/vibecoded-design-tells, unslop-text çalışması (`copy-tells.md`
  üzerinden), MIT.
- Russell ve ark., "StoryScope", COLM 2026, arXiv:2604.03136.
- Wikipedia katkıcıları, "Wikipedia:Signs of AI writing" ve "Wikipedia:WikiProject AI
  Cleanup" (Guide and resources dâhil), İngilizce Vikipedi, Eylül 2026'da erişildi.
  https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing ·
  https://en.wikipedia.org/wiki/Wikipedia:WikiProject_AI_Cleanup
- Türkçe kalibrasyon: `tests/kalibrasyon/SONUC.md`.

**Lisans notu.** Bu dosyanın Wikipedia'dan uyarlanan bölümleri (iz tanımları, kök
mekanizma, uyarılar, insan izi ve etkisiz gösterge listeleri, kısa İngilizce örnekler)
Creative Commons Atıf-AynıLisanslaPaylaş 4.0 (CC BY-SA 4.0) lisansı altındadır ve özgün
sayfaların katkıcılarına aittir. Bu bölümler Türkçeye özetlenerek, yeniden yazılarak ve
Türkçe örnekler eklenerek değiştirilmiştir; değiştirilmiş hâlleri de aynı lisansla
paylaşılır: https://creativecommons.org/licenses/by-sa/4.0/deed.tr. MIT lisanslı
depolardan yalnız kısa alıntı ve özet kullanıldı; telif bildirimleri ilgili depolardadır.
Türkçe örneklerin tümü bu dosya için yazıldı.
