# Türkçe yasaklı kalıplar: birleşik liste

Kaynaklar: bu depodaki beş ayrı LLM'in (ChatGPT, DeepSeek, Gemini, z.ai, Qwen) Türkçe
doğallık raporları, lovefengis `TR-RULES.md`, `dogal-turkce-editor`, Wikipedia "Signs of
AI writing"in Türkçeye aktarılabilir maddeleri, **insanca** (tahiryildiz/insanca v1.12.0,
MIT) ve **humanify** (durmazoguzhan/turkish-humanify, MIT). MIT kaynaklardan gelen
kurallar yeniden yazıldı, örnekler uyarlandı; kaynakta olmayan olgu taşıyan örnekler
alınmadı.

**Bu bir yasak listesi değil, bir yoğunluk listesidir.** Buradaki ifadelerin çoğu
Türkçede yanlış değildir. Kusur olan, hepsinin aynı metinde ve her paragrafta
tekrarlanmasıdır. Kural: **bir kalıbı kullanmak için gerekçen olsun.** Tek bir
"kapsamlı" zayıf sinyaldir; kümelenme imzadır. Kelime listeleri model sürümüyle
eskir, yapısal kalıplar kalır (bkz. `denetleyici.md`).

**Kalibrasyon** (`tests/kalibrasyon/`, metinlerin yüzde kaçında çıktı, insan / LLM):
- **Olumsuz koşutluk** (§8): haber ve forumda 3 / 24; "doğal yaz" istemli metinlerde
  50-60. Klişe yasaklanan model kalıbı bununla değiştiriyor: en güvenilir kalıp izi.
- **Kapanış klişesi** (§2) 3 / 28, blogda 13 / 50; **boş vurgu** (§4) 1 / 18, blogda
  0 / 23. Site metninde ikisi de seyrek.
- **İçi boş sıfat** (§4) sitede 15 / 40; **yalancı aralık** (§17) sitede 5 / 30.
- **Ayırt etmeyen:** bürokratik kalıplar (§6, 29 / 28; sitede 83 / 80), giriş klişesi
  (§1, insan site metninde daha sık: 2018 SEO metninin "Günümüzde…" açılışı). İkisi
  yine düzeltilir, ama iz sayılmaz.
- **Fark derlemi** (`tests/kalibrasyon/SONUC-FARK.md`: 28 iyi insan metni ↔ aynı
  olgulardan gpt-4o, "doğal yaz" istemli gpt-4o, gpt-4.1): anons ya da çerçeveyle açılış
  insan 5 / 4o 18, kapanışa olgu taşımayan cümle 6 / 28, "adeta" 1 / 12 metin.
- Retorik soru, anons, koşaç kaçışı, kesik cümle yığını iki derlemde de neredeyse hiç
  çıkmadı; ölçülemedi. Öteki bölümler ölçülmedi.

Kalıbı başka bir kalıpla değiştirmek çözüm değildir. "Sonuç olarak"u silip yerine
"Netice itibarıyla" koymak aynı kusurdur (bkz. §8, yapı nakli).

---

## 1. Giriş klişeleri ve anons: hepsi silinir

Elbette! · Tabii ki, memnuniyetle · Kesinlikle! · Harika bir soru! ·
İşte sizin için hazırladığım… · İşte size… · Anladığım kadarıyla… ·
Bu noktada şunu belirtmek gerekir ki… · Günümüzün hızla değişen dünyasında… ·
Günümüz dünyasında… · Dijitalleşen dünyada… · Günümüzde (cümle başında) ·
Hepimizin bildiği gibi… · … hayatımızın vazgeçilmez parçası hâline geldi ·
Son yıllarda … giderek önem kazanmaktadır · Gelin, birlikte inceleyelim · Bu yazıda… ·
Aşağıda… ele alacağız · Değineceğiz · İnceleyeceğiz · Öncelikle belirtmek isterim ki… ·
Yakından bakalım · Derinliklerine dalalım ("delve"in Türkçe kılığı) · İşte bilmeniz
gereken her şey · Şimdi X'e geçelim · Lafı uzatmadan · Merhaba sevgili okurlar
(okuyucular, gezgin dostlar) · Bugün sizi … götüreceğim · Bugün … anlatacağım ·
Hazırsanız başlayalım · Gelin, … bir yolculuğa çıkalım · X deyince aklımıza … gelir ·
Hayatta bazen …

Kaynak: insanca §28, §29; fark derlemi (K7).

**Üç açılış türü** (fark derlemi): anons ("Merhaba sevgili okurlar! Bugün …"), genel
çerçeve ("X deyince…", "…nadir işletmelerden biridir") ve **kaynakta olmayan sahne**
("uçaktan aşağıya, bulutların üzerinden bakarken"). İyi insan metinlerinin 23'ü olay,
iddia, alıntı ya da olguyla açılıyor. "Doğal yaz" istemi anonsu azaltıp uydurma sahneyi
artırdı (bkz. §14).
"Merhaba sevgili okuyucular! Bugün, Pride Ayı ve bu ayın altında yatan ticarileşme
meselesini mizahi bir dille sorgulayacağız." → "Her şey mayıs ayının son günlerinde, …
Aja'nın H&M'in pride kampanyasına katıldığını ilan ettiği bir görselle başladı."

**Kural:** doğrudan konuya gir. Metnin ne anlatacağını anons etme, anlat.
"Şimdi fiyatlandırmaya geçelim. Fiyatlar pakete göre değişiyor." → "Fiyat pakete göre
değişiyor."

---

## 2. Kapanış klişeleri: hepsi silinir

Sonuç olarak · Özetle · Kısacası · Netice itibarıyla · Görüldüğü üzere ·
Unutmayın ki · Unutmamak gerekir ki · Unutulmamalıdır ki · Özetlemek gerekirse ·
Umarım faydalı olmuştur · Umarım yardımcı olabilmişimdir ·
Başka bir konuda yardımcı olmamı ister misiniz? · Başarılar dileriz ·
Geleceğe birlikte yürüyoruz · Doğru adımlarla hedeflerinize ulaşabilirsiniz ·
Değerli görüşleriniz bizim için önemli · Her türlü soru ve görüşünüz için bizimle
iletişime geçmekten çekinmeyiniz · Peki ya siz? (okura yöneltilen etkileşim tuzağı)

**"Zorluklar ve gelecek" şablonu.** Blog sonunda kalıp paragraf: "Tüm bu gelişmelere
rağmen sektör çeşitli zorluklarla karşı karşıya. Ancak … büyümeye devam ediyor."
Yerine tek somut sorun, olgu listesinde varsa tek sayı (insanca §5).
"Tüm bu gelişmelere rağmen e-ticaret çeşitli zorluklarla karşı karşıya." → "Küçük
satıcıyı en çok iade oranı zorluyor." (Olgu listesinde varsa.)

**Kural:** metin söylemesi gerekeni söylediyse biter. Kapanış ancak yeni bilgi ya da
somut bir sonraki adım taşıyorsa kalır. Gerçekten merak edilen, cevabı okurda olan bir
soru blog kapanışı olabilir (humanify); "Peki ya siz?" olamaz. Liste yetmez: kalıpta
olmayan taşınabilir kapanışı işlevsel testle bul (`turkce-parmak-izi.md` §14).

---

## 3. Mekanik geçişler ve cümle başı bağlaç yığını

Bununla birlikte · Öte yandan · Bu bağlamda · Bu doğrultuda · Bu kapsamda ·
Dolayısıyla · Bu nedenle · Ayrıca · Ek olarak · Dahası · Buna ek olarak ·
Öncelikle · İkinci olarak · Son olarak · Bir diğer önemli nokta ise…

**Kural:** cümleler arasındaki bağ zaten açıksa bağlacı sil. Gerçek nedensellik varsa
bağlaç kalır; süs olarak konmuşsa gider: sahte bağlaç, mantık hatasının en sinsi
biçimidir. Gündelik karşılıklar ("ama", "ya da", "yani") daha doğaldır. Derlem olgusu:
"ama" Türkçe sıklık listelerinde ilk 25'te, "öte yandan" ve "bununla birlikte" ilk 50'de
bile yok (insanca, Vikisözlük ve ODTÜ derlemlerine dayanarak). Resmîlik gerekmiyorsa
"ama" yeter.

**Konuma da bak** (insanca §19, §42, Ak17). Geçiş yoğunluğu kalibrasyonda zayıf çıktı
(güç 0,62, yalnız bilgi); yoğunluktan çok şu dizilişler sırıtır:
- her cümlenin bağlaçla açılması;
- art arda üç cümlenin ya da paragrafın aynı kelimeyle açılması;
- cümlelerin dörtte birinden fazlasının aynı kelimeyle başlaması;
- "Her [ad] [fiil]…" biçimli paragraf açılışları.

"Ayrıca kurulum ücretsiz. Ayrıca ilk ay destek veriyoruz. Ayrıca…" → "Kurulum
ücretsiz, ilk ay desteği de biz veriyoruz."

---

## 4. Boş vurgu, içi boş sıfat, broşür dili

büyük önem taşımaktadır · kritik rol oynamaktadır · hayati önem arz etmektedir ·
kritik öneme sahip · önemli bir rol oynar · önemli katkı sağlamaktadır ·
kapsamlı bir şekilde · etkili bir biçimde · mükemmel bir şekilde ·
son derece önemli · harika bir fırsat · benzersiz · eşsiz · kusursuz · sorunsuz ·
zahmetsizce · muhteşem · büyüleyici · devrim niteliğinde · çığır açan ·
oyun değiştiren · dünya standartlarında · son teknoloji · yeni nesil ·
geleceğe hazır · vizyoner · sihirli · umut verici · dönüm noktası · zemin hazırlamak ·
kalıcı iz bırakmak · köklü bir geçmişe sahip · sizi bekliyor · kaçırılmayacak fırsat ·
her damak tadına hitap eden · unutulmaz bir deneyim · kilit · bütüncül · dönüştürücü ·
ezber bozan · beraberinde getiriyor

**Kural:** sıfatı sil, ölçülebilir olguyu koy (olgu listesinden).
"Dijital varlığınızı güçlendirin" → "Açılış süresini 4 saniyeden 1 saniyeye indiriyoruz."
**Sitede tek başına ayırt edici değil:** iyi insan site metinleri de "eşsiz",
"efsanevi" kullanıyor (fark derlemi s04, s05). Kural kalır; iz kümelenmede, kapanışta ve
olgu azlığında.

**Kesinleştirme** (K2): şüphesiz · aşikâr · su götürmez (bir gerçek) · garantisini
verebilirim · … hak ediyor (kaynaksız hüküm). İnsan aynı bilgiyi kuşku ve kaynakla verir
("sanırım", "nerede okumuştum", "-mış"). Ayrıntı: `turkce-parmak-izi.md` §18.

**GPT sözlüğü** (K8): adeta · deneyim · macera / serüven · yelken açmak · zamanda
yolculuk / zaman tüneli · büyülü dünya · gizli bir cennet · kalbimi fethetti · paha
biçilmez · tanışma fırsatı. Fark derleminde insan metninde neredeyse yok, GPT metninin
yarısında ("adeta" 12 metin ↔ insan 1, "deneyim" 17 ↔ 6, "macera" 9 ↔ 2). Tek başına
kusur değil; kümelenince imza. "Doğal yaz" istemi yalnız "yelken açmak"ı sildi. Yerine
yaygın fiil ve olgu:
"Bu yolculuk cüzdanıma yalnızca 16 USD gibi cüzi bir yük bindirdi." → "Guatemala
City'den otobüsle direk buraya 16 USD'ye geldim."

---

## 5. Reklam emirleri

dönüştürün · güçlendirin · keşfedin · potansiyelinizi açığa çıkarın ·
bir üst seviyeye taşıyın · zirveye taşıyın · fark yaratın · hayal edin ·
keşfetmeye hazır mısınız · dijital yolculuğunuz · çözüm ortağınız ·
ihtiyacınız olan her şey · tek tıkla · başarıya giden yol · mükemmel uyum ·
ekosistem (mecazi)

---

## 6. Nominalizasyon, bürokratik yüklem ve aşırı kaçamak

gerçekleştirilmektedir · sağlanmaktadır · yapılması gerekmektedir · söz konusudur ·
mevcuttur · ele alınmaktadır · bulunmaktadır · yer almaktadır · ifade edilmektedir ·
değerlendirilmektedir · tarafımızca · firmamızca · tarafından · -e yönelik olarak ·
neticesinde · önemle belirtmek gerekir ki · … yapma imkânına sahiptir

**Kural:** etkene çevir, özneyi düşür.
"Rapor tarafımızca hazırlanmaktadır" → "Raporu hazırlıyoruz."

**Olguyu gömen boş yüklem** (K3): … ile tanışma fırsatı bulmak / … fırsatımız oldu ·
… deneyimi sunmak · … deneyimi edinmek · … cesaretini göstermek. Yeni bilgi sıfata
gömülür, vurgu kalıba düşer (`turkce-parmak-izi.md` §0). "tercih ettim" → ~~tatma
cesaretini gösterdim~~, "staj yaptı" → ~~Avrupa deneyimi edinmiştir~~.
"Çiftlikte, yaşı 40 olan fillerle tanışma fırsatımız oldu." → "Kılavuzumuza fillerin
yaşını sorduğumda aldığım cevap 40 olunca şaşırmamak elde değil."

**Aşırı kaçamak.** İddianın üstüne üst üste ihtimal katmanı (insanca §38): "bir miktar
etkili olabileceği düşünülebilir", "muhtemel görünmektedir". Tek bir yumuşatma yeter. Yerinde, kaynağıyla söylenen tek kuşku kaçamak değildir
(`turkce-parmak-izi.md` §18).
"Politikanın sonuçları bir miktar etkileyebileceği düşünülmektedir." → "Politika
sonuçları etkileyebilir."

---

## 7. Çeviri kokan edat kalıpları, metaforlar ve hitaplar

… adına · … noktasında · … açısından bakıldığında · … bazında · … nezdinde ·
… ile ilgili olarak · … konusunda (doldurucu) · …-e yönelik · …-e ilişkin ·
… bağlamında · … doğrultusunda · … kapsamında · bir … olarak ·
X, Y ve Z'yi içerir · Bu, … sağlar · … olduğu söylenebilir · Düşünüyorum ki … ·
Görülmektedir ki … · bir etki yaratmak · değer katmak · hayata geçirmek ·
bu çerçevede değerlendirildiğinde · İşte tam da bu yüzden

**Çeviri metaforu ve hitap** (insanca §16): X'in dinamik dünyasında · günün sonunda ·
karmaşık bir goblen · oyun değiştirici · konfor alanından çıkın · bir sonraki seviyeye ·
kendinize şu soruyu sorun · unutmayın: · bir düşünün · doğru duydunuz. insanca iyi insan
çevirisinde goblen türü metafor bulmamış; bu koku kötü çevirinin imzasıdır.
"Günün sonunda karar sizin." → "Kararı siz verirsiniz."

**Kural:** edat kalıplarının çoğunun karşılığı "-mek için" ya da hiçbir şeydir.
"Karar vermek adına" → "Karar vermek için". Ayrıntı: `turkce-parmak-izi.md` §9.

---

## 8. Olumsuz koşutluk ve yapı nakli

sadece X değil, Y · yalnızca X değil · X değil, aynı zamanda Y · X değil Y'dir ·
mesele X değil, Y · asıl olan X değil Y · X olmadı hiç. Y gerekir.

İngilizce kaynaklarda en çok işaretlenen ikinci iz; Türkçede de güçlü (insan %3, LLM
%24). Olumsuzlanan kısım çoğu zaman zayıf bir iddiayı şişirmek için oradadır.

**Kural:** ne olduğunu doğrudan söyle. Olumsuzlanan kısmı tamamen at.
"Bu sadece bir güncelleme değil, bir devrim" → "Güncelleme toplu işleme ekliyor."

**Yapı nakli: kalıbı kaldırmak yerine yeniden giydirmek** (insanca §47).
- "sadece X değil, Y"yi "X'le kalmıyor, Y" diye yazmak iki kanadı korur. İki kanattan
  önemli olanı seç.
- Dün / bugün / yarın üçlemesi hangi noktalamayla yazılırsa yazılsın retorik figürdür.
- "Kazandıran beceri, X" gibi tanım kurulumu iki nokta silinse de katafordur (§11);
  etiketi cümlenin içine göm.

"Hızlandırmakla kalmıyor, karara ortak oluyor." → "Üç senaryoyu toplantıdan önce kurup
hangisinin stoku bitirdiğini görebiliyorsunuz."

Son okumada sor: **kalıbı kaldırdım mı, yeniden mi giydirdim?**

---

## 9. Aşırı nezaket, sahte samimiyet, argo

**Aşırı nezaket:** Kıymetli vaktinizi ayırdığınız için sonsuz teşekkürlerimizi sunarız ·
Sizinle çalışma fırsatı yakalamaktan büyük mutluluk duyuyoruz · Size yardımcı olmaktan
mutluluk duyarım · Siz değerli müşterilerimiz · Memnuniyetle · Çekinmeyiniz

**Sahte samimi açılış** (insanca §40): sıradan bir tespitten önce teatral kanca.
Dürüst olmak gerekirse… · Açık konuşalım: · İşin aslı şu: · Gerçek şu ki…
"Dürüst olmak gerekirse, kurulum biraz uzun sürüyor." → "Kurulum yarım gün sürüyor."
(Süre olgu listesinden.) Tek başına "Açıkçası" bu listede değil; duyguyu adıyla söyleyen
cümlede yerindedir (`mudahale-defteri.md` §3).

**Terapist modu** (insanca §35): duygusal olmayan metne istenmemiş teselli. Yalnız
değilsiniz · Bunu hissetmeniz çok normal · Kendinize karşı nazik olun · Kendinizi
suçlamayın · Hepimiz bu yollardan geçtik.
"Gelen kutunuz taştıysa yalnız değilsiniz." → "Gelen kutusu taştıysa önce filtreleri
kurun."

**Argo iki sicilde de yasaktır:** abi · dostum · kanka · valla · moruk · süper · efsane ·
resmen olay. Argo ile bürokratik dilin aynı metinde durması ayrıca bir izdir (sicil
kayması, bkz. `sicil.md`).

**Söylem parçacıkları argo değildir.** "zaten, ise, bir de, yani, artık, bile, işte"
blogda doğal yerinde serbesttir. Yasak olan onları kota doldurur gibi serpiştirmektir:
yazı boyunca üç dört kez beliren, silinince hiçbir şey kaybettirmeyen parçacık.
Ayrıntı ve doz: `turkce-parmak-izi.md` §0b, `sicil.md`.

---

## 10. Meta anlatım

Bir yapay zekâ dili modeli olarak… · Ben bir yapay zekâyım… ·
Eğitim verilerime göre… · Mevcut bilgilere dayanarak… ·
Bu konuda kesin bilgiye sahip değilim ancak… · Elimdeki kaynaklarda ayrıntı sınırlı
olmakla birlikte… · kamuya açık kaynaklarda yer almamaktadır · Dilerseniz …
açıklayabilirim · Devam edeyim mi?

**Kural:** sohbet artığı metne girmez. Bilinmeyeni tahminle doldurma; ya sor ya cümleyi
sadeleştir. Bu, bütün listenin en kesin kanıtıdır.

---

## 11. Biçim ve noktalama izleri

- **Uzun tire (—)** görünen metinde: Türkçe kaynaklarda da İngilizcedeki gibi en güçlü
  tek iz. Virgül, nokta ya da parantezle değiştir. **İki nokta üst üste ile ve noktalı
  virgülle değiştirme;** okur onları da aynı refleks olarak görür. Uzun tire kalkınca
  yerine boşluklu kısa çizgi (" - ") ya da " -- " koymak da aynı izdir (insanca §22).
- **Aralıkta kısa çizgi.** TDK sayı ve yer aralığında kısa çizgi ister: "5-8 gün",
  "1914-1918", "Ankara-İstanbul". En tire (–) Türkçe noktalamada yoktur; kısa çizgiye
  çevir (humanify layer-3 §5).
- **Katafor iki nokta ve "asıl" enflasyonu** (insanca §46, Ak3). Önce etiket, sonra iki
  nokta, sonra tek cümlelik vuruş: "Sorun şu: …", "Cevap basit: …", "Asıl mesele …".
  İnsan önce söyler, sonra adlandırır: "…değişecek mi? Asıl soru bu." İki noktanın
  meşru işi liste, alıntı, uzun açılım ve tanımın arkasından örnek dizmektir. Eşik
  (ölçülmedi): bin kelimede ikiden fazla "iki nokta + tek cümle"; metinde üçten fazla "asıl".
  "Sorun şu: çalışanlar kullanmıyor." → "Çalışanlar kullanmıyor, lisanslar rafta duruyor."
- **Noktalı virgül bolluğu.** Çoğu zaman kaldırılan tirenin kılık değiştirmiş hâli.
  humanify'ın ölçümünde yayımlanmış blog ve teknik Türkçede 100 kelimede 0,2-0,5;
  kendi çıktısı 1,39 yazınca kör okurlar üç kez eleştirmiş. Listeyi tek cümlede noktalı
  virgülle zincirleme; madde yap ya da cümlelere böl. Doz: `sicil.md`.
- **İngilizce virgül.** Özneden ya da "sayesinde"den sonra gereksiz virgül:
  "Bu özellikler sayesinde, kullanıcılar…" → "Bu özellikler sayesinde kullanıcılar…"
- **Parantez içi açıklama takıntısı** (insanca §31). Her terimin yanında açılım ya da
  İngilizce karşılık: "halka arz (IPO)", "temettü (kâr payı)". İlk geçişte bir kez yeter.
- **Kalın yazı yığılması.** Kısa metinde her önemli kelimeyi kalınlaştırma. humanify'ın
  ölçümünde insan metinlerinde 0-1 kalın, bir landing sayfasında 20.
- **Satır içi başlıklı liste.** "**Teslimat Süresi:** Projeniz 10 iş günü içerisinde
  tamamlanacaktır" → "Projeyi 10 iş günü içinde tamamlıyoruz." Düzyazıya dönen yalnız
  bu "**Etiket:** metin" biçimi ve bilgi taşımayan maddelerdir. Site sayfasında taranan
  liste (fiyat, özellik, koşul) kalır; kalın etiketi ve telgraf dilini düzelt.
  **Blogda da ipucu, öneri, adım ve kazanım listesi liste kalır;** madde emir + tek cümle
  gerekçe olur. Fark derleminde listeli 8 insan metninin 8'inde de GPT listeyi her biri
  espri ya da değerlendirme taşıyan paragrafa çevirdi.
  "Döviz bozdurmaya gelirsek; havaalanları yerine şehir merkezinde döviz bozdurmanız her
  zaman daha avantajlıdır." → "5- Havaalanlarında döviz bozdurmayın, ciddi zarar
  edersiniz. İlla ki ihtiyaç varsa 10-20 usd bozdurun, gerisini şehir merkezine bırakın."
  (bkz. `sicil.md`)
- **Emoji.** Başlıkta ve buton metninde piktografik emoji (🚀 💡 ✅ 💬 📄 ⚡ 💰) çıkar.
  Arayüz işareti olan ✓ ve ✗ kalır.
- **Başlıkta Her Kelimeyi Büyük Yazma.** Türkçede başlıkta yalnızca ilk kelime ve özel
  adlar büyük yazılır. (Bu hem bir yapay zekâ izi hem de bir TDK kuralıdır.)
- **Kesme işareti.** TDK düz (') ve tipografik (’) kesmeyi birlikte kabul eder; hangisi
  seçileceği yayın tercihidir, yapay zekâ izi değil (İngilizce kaynaklar kıvrık işareti
  zayıf iz sayar). Önemli olan tutarlılık: bir metinde ikisini karışık kullanma.
  Tarayıcı düz kesmeyi yalnız `--tipografi` bayrağıyla işaretler.
- **Şapka tutarsızlığı.** Bu beceri TDK'yı izler: zekâ, dâhil, hâlâ, resmî. Aynı kelimenin
  metinde hem şapkalı hem şapkasız geçmesi (zekâ / zeka) iz sayılır. Kullanıcı şapkasız
  yazım isterse şapkasız ama tutarlı yaz.
- **Gereksiz ünlem.** Site metninde ünlem neredeyse hiç gerekmez. Blogda ses örneğinde
  varsa bir tane kalabilir (`sicil.md`).
- **Zorlama başlık-liste yapısı.** "Giriş / Önemli Noktalar / Avantajlarımız /
  Sonuç ve Değerlendirme": iki paragrafta anlatılacak konuyu altı başlığa bölme.
  Teknik doküman ve rapor bu kuralın dışındadır.

---

## 12. Yapay üçlü ritim

"Hız, güven ve kalite" · "yenilik, ilham ve sektör içgörüleri" ·
"kaliteli hizmet sunmak, müşteri memnuniyetini artırmak ve sürdürülebilir başarı
sağlamak"

Model kapsamlı görünmek için her şeyi üçe böler. İki madde yetiyorsa iki yaz, dört
gerekiyorsa dört yaz.

**Uyarı:** "A, B ve C" Türkçenin en doğal sıralama biçimidir. Bu iz **regexle
taranmaz**; denendiğinde bulguların neredeyse tamamı yanlış pozitif çıkıyor. Yalnızca
gözle, ritim tekrarı olarak değerlendirilir.

---

## 13. Eş anlamlı kovalama

Zayıf iz, tek başına yetmez; asıl sorun terim tutarsızlığıdır. Ayrıntı:
`turkce-parmak-izi.md` §13.

---

## 14. Sahte somutluk, hayali vaka, kaynaksız iddia

Müşterilerimizin %90'ı… · Sektörde lideriz · Uzmanlar öneriyor · Araştırmalar
gösteriyor ki… · Yıllardır… · Yüzlerce projede… · Ben de benzer bir süreçten geçtim ·
Müşterilerimizden sürekli olumlu dönüş alıyoruz

**Hayali vaka ve yuvarlak sonuç** (insanca §7): "Ayşe Hanım bu yöntemle cirosunu 90
günde üç katına çıkardı", kaynaksız "%40 arttı", "… adında bir girişimci". Üç seçenek:
doğrulanabilir örnek ver, "varsayalım ki" diye açıkça kur ya da sil.
"Mehmet Bey bu yöntemle satışlarını iki katına çıkardı." → "Diyelim ki haftada 20
sipariş alan bir dükkânsınız…" (açıkça varsayım)

Doğallık uğruna sahte deneyim, sahte müşteri, sahte istatistik üretilmez. Bu hem
yalandır hem de, asıl ironi, LLM'lerin en tipik davranışıdır: genel ve doğrulanamaz
güven cümlesi. Doğrusu, eksik bilgiyi tahminle kapatmak yerine belirsizliği korumaktır.

**"Doğal yaz" istemi uydurma sahne üretir.** Fark derleminde "Türkçe düşünen bir insan
gibi yaz; klişe kullanma" istemi kalıp kelimeyi azalttı, uydurma canlılığı artırdı: ad
("Yusuf, henüz altı yaşındaki"), replik ("Et tu, Brute?"), duyu ("denizin tuzlu kokusu
burnuma doluyor"), sahne ("uçaktan aşağıya, bulutların üzerinden bakarken"); olgu hatası
9 → 14 metin. Canlılık olgudan gelir; olgu listesinde olmayan ad, söz, koku ve sahne yazılmaz.

---

## 15. Retorik soru-cevap

Yazar kendine soru sorup hemen cevaplıyor (insanca §27, Ak4; humanify layer-2 §16):
"Peki bu ne anlama geliyor? Cevap basit: …" · "Sonuç mu?" · "Peki buna değer mi?
Kesinlikle."

Tek bir retorik soru doğaldır, ritim tikine dönüşmüşü değildir. İnsan ya soruyu okura
bırakır ya da cevabı geciktirip sahneler. SSS bu kuralın dışındadır.
"Peki buna değer mi? Kesinlikle." → "Kurulum zahmetli, ama iki ayda kendini çıkarıyor."
(Süre olgu listesinden.)

---

## 16. Aforizma ve slogan

insanca §39, §30; humanify layer-2 §16. Biçimleri: "Tasarım, güvenin dilidir" ·
"bir yaşam biçimi" · "her şey X ile başlar" · "en büyük X en derin Y'de saklı" ·
simetrik karşıtlık ("bazı kapılar kapanır…") · "Belki de asıl mesele…" kapanışı ·
iki simetrik cümleli slogan ("Metrikler neyi, kayıtlar nedenini söyler").

Hero başlıkları için kritik. Gündelik "belki de" serbesttir.
"Sadelik bir tercih değil, bir yaşam biçimidir." → "Ödeme sayfasındaki alanları azaltınca
terk oranı düştü." (Olgu varsa.)

---

## 17. Yalancı aralık

insanca §11. Aralarında gerçek bir ölçek olmayan iki uç yan yana konup kapsam yanılsaması
kuruluyor. Hizmet sayfasının en tipik cümlesi: "küçük işletmelerden büyük kurumlara kadar".
Gün ve ay aralıkları gerçek aralıktır, bu kurala girmez.
"Günlük rutinlerden hayat değiştiren kararlara kadar yanınızdayız." → "Uygulamada
alışkanlık takibi, günlük not ve haftalık plan var."

---

## Tarama

Bu listenin regexle yakalanabilen alt kümesi `scripts/tr-scan.mjs` içindedir.
Yakalanamayan kısmı (ritim, üçlü, biçim tekrarı, boş cümle, yapı nakli) gözle bakılır.
