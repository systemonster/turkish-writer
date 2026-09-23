# İnsan ↔ GPT fark derlemi: aynı olgulardan iki metin

Soru: iyi yazılmış, LLM öncesi Türkçe ile GPT'nin **aynı içerikle** yazdığı Türkçe arasında
sistematik fark nerede? Amaç, becerinin "kötüyü ayıklayan" kurallarına "iyi cümle nasıl
kurulur" kuralları eklemek. Betik: `tests/kalibrasyon/kalibre-fark.mjs`. Derlem (yayına
girmez, telifli): `tests/kalibrasyon/derlem-fark/`.

## 1. Veri

**28 insan metni: 20 blog + 8 site.**

| Kaynak | Blog | Site | Tarih |
|---|---|---|---|
| OSCAR 2019 (Common Crawl Kasım 2018, `turkish-nlp-suite/temiz-OSCAR`, bölgeler 0.7e9 + k·0.8e9, +30 MB) | 6 | 0 | 2018 |
| Wayback Machine (CDX ile 2021 öncesi ilk anlık görüntü) | 14 | 8 | 2012-2020 |

- Blog kaynakları (Wayback): suskumru.com (2), yoldaolmak.com, esrageziyor.com (3),
  gezentianne.com, rotasizseyyah.com (3), 5harfliler.com, manifold.press (2),
  birhayalinpesinde.com. Site: Karaköy Güllüoğlu, Pandeli, Hacı Abdullah, Hacı Bekir,
  Saray Muhallebicisi, Kronotrop, Kumbaracı50 (eğitim programı sayfası), Tarihi
  Sultanahmet Köftecisi (kurucu biyografisi). URL, anlık görüntü tarihi, seçim gerekçesi ve
  GPT-4o kalite puanı her metin için `derlem-fark/meta.json`'da.
- **Aday havuzu 254:** OSCAR 170 (60 site, 110 blog; 300-1000 kelime, Türkçe karakter,
  noktalama, haber/forum/SEO/yasak süzgeci) + Wayback 84 (alan başına CDX listesinden
  gönderi URL'leri, firma ve kurum "hakkımızda/tarihçe" sayfaları). 207'si GPT-4o ile 1-5
  puanlandı (akıcılık, özgün ses, somutluk, doğal Türkçe, TDK; `puan.json`).
- **Seçim elle:** puana bakıp metni okudum; ölçüt "sesli okununca bir insan yazmış, iyi de
  yazmış". Reddedilenler: yazım hatası yoğun bloglar (ob013, ob019, ob021), anahtar kelime
  satırı olan gezi yazısı (wb007), OSCAR site adaylarının hemen hepsi (KOBİ SEO metni),
  kurumsal kalıp (Metiş İnşaat), bozuk kodlamalı ve düşük kaliteli sayfalar. Uzun metinler
  paragraf sınırında 650-950 kelimeye kesildi; paylaşım düğmesi, resim altı, adres satırı
  silindi.
- **Olgu listesi** (GPT-4o, sıcaklık 0): metin başına 18-44 olgu, ana hat, sicil. İlk
  denemede liste yoksuldu (anekdotlar, adlar, saatler düşüyordu); istem "özel ad, sayı,
  saat, liste öğesi aynen" diye sıkılaştırılıp yeniden çıkarıldı. İnsan metnindeki
  sayıların %85-100'ü, özel adların çoğu listede.
- **Üretim:** her insan metni için üç metin (84): `gpt-4o` varsayılan istem, `gpt-4o`
  "doğal yaz" sistem mesajıyla ("Türkçe düşünen bir insan gibi yaz; çeviri gibi, yapay
  zekâ gibi durmasın; klişe ve abartı kullanma."), `gpt-4.1` varsayılan istem. İstem:
  "Aşağıdaki olgular ve ana hatla yaklaşık N kelimelik Türkçe bir blog yazısı / {sayfa
  türü} metni yaz. Sicil: …" (N = insan metninin kelime sayısı).
- **İnceleme:** (a) `olc`: tr-scan `denetle()` ve kendi ölçümlerim; (b) `desen`: okurken
  bulunan desenlerin düzenli ifadeyle sayımı; (c) `esle`: olgu başına insan cümlesi ↔ GPT
  cümlesi (GPT-4o, birebir alıntı denetimli; 1.976 eşli olgu); (d) `yargi`: GPT-4o ile
  metin başına işaretleme (uydurma, olgu hatası, doğrudan söz…); (e) **elle okuma**: 28
  insan metninin tamamı, 28 gpt-4o metninin tamamı, doğal ve 4.1 metinlerinin açılış ve
  kapanışı tamamen, gövdesi 20 çiftte. Açılış ve kapanış sınıflandırması elle yapıldı.

## 2. Nicel tablo

Ortalama; sağdaki sütunlar eşli karşılaştırma: kaç çiftte GPT > insan / GPT < insan (n=28).

| ölçüm | insan | gpt4o | 4o-doğal | gpt41 | 4o >/< | doğal >/< | 41 >/< |
|---|---|---|---|---|---|---|---|
| kelime | 541 | 367 | 356 | 479 | 0/28 | 0/28 | 2/26 |
| cümle uzunluğu değişim katsayısı | 0,50 | 0,36 | 0,35 | 0,39 | 1/27 | 1/27 | 2/26 |
| en uzun cümle (kelime) | 35,4 | 23,8 | 22,9 | 28,5 | 4/23 | 4/24 | 7/19 |
| ≤7 kelimelik cümle oranı | 0,20 | 0,11 | 0,14 | 0,11 | 8/20 | 7/20 | 7/21 |
| ≥25 kelimelik cümle oranı | 0,11 | 0,03 | 0,02 | 0,04 | 3/23 | 2/24 | 8/20 |
| art arda 3 benzer boy cümle (±4) | 0,15 | 0,24 | 0,25 | 0,21 | 22/5 | 23/5 | 21/7 |
| yüklemle bitmeyen cümle (devrik/eksiltili, kaba) | 0,25 | 0,17 | 0,18 | 0,22 | 10/17 | 7/20 | 12/15 |
| söylem parçacığı /100 kelime | 4,41 | 3,67 | 3,94 | 3,86 | 9/19 | 12/16 | 11/17 |
| de/da /100 | 2,74 | 2,10 | 2,26 | 2,02 | 8/20 | 10/18 | 5/23 |
| yüksek sicil (gerçekleştir, sağla, sun, deneyim, süreç…) /100 | 0,49 | 1,33 | 1,25 | 0,73 | 24/2 | 21/6 | 20/6 |
| duygu sözü (büyülü, huzur, unutulmaz, paha biçilmez…) /100 | 0,23 | 0,53 | 0,41 | 0,30 | 19/3 | 12/7 | 14/7 |
| ünlem /100 | 0,17 | 0,51 | 0,56 | 0,81 | 15/4 | 15/4 | 16/3 |
| noktalı virgül /100 | 0,17 | 0,32 | 0,45 | 0,88 | 16/4 | 19/5 | 26/2 |
| parantez /100 | 0,18 | 0,03 | 0,05 | 0,08 | 1/14 | 3/13 | 6/11 |
| rakam /100 | 1,79 | 1,38 | 1,35 | 1,31 | 8/17 | 8/17 | 7/18 |
| 1. tekil kişi /100 | 2,09 | 1,46 | 1,45 | 1,56 | 10/15 | 5/19 | 10/16 |
| "bir" /100 | 2,62 | 3,14 | 3,56 | 3,26 | 20/8 | 23/5 | 18/10 |
| "ve" /100 | 2,50 | 2,72 | 2,45 | 2,15 | 17/11 | 12/16 | 9/19 |
| tr-scan iz skoru | 91 | 79 | 77 | 81 | 5/23 | 5/22 | 6/22 |

Paragraf (yalnız Wayback, n=22; OSCAR metinlerinde satır sonu yok): paragraf sayısı
insan 10,3 / 4o 7,0 / doğal 7,5 / 4.1 8,1; paragraf uzunluğunun değişim katsayısı
**0,42 / 0,22 / 0,19 / 0,22**. Listeli metin: insan 8, GPT 0 (üç modelde de).

tr-scan izleri (metin sayısı, insan / 4o / doğal / 4.1): düz ritim 1/16/17/13, uzun cümle
yok 5/21/22/14, hype 4/13/6/11, ünlem 1/11/8/14, olumsuz koşutluk 4/7/7/9, kapanış klişesi
2/2/4/4.

Desen sayımı (kaç metinde; `derlem-fark/desen.md`):

| desen | insan | 4o | doğal | 4.1 |
|---|---|---|---|---|
| "adeta" | 1 | 12 | 6 | 6 |
| "deneyim" | 6 | 17 | 13 | 10 |
| "macera" | 2 | 9 | 9 | 9 |
| "Unutmayın/Unutmayalım" | 1 | 5 | 3 | 7 |
| selam/hitap ile açılış ("Merhaba sevgili okurlar!") | 2 | 4 | 1 | 2 |
| cümle başı Ancak/Ayrıca/Bununla birlikte/Öte yandan/Dolayısıyla | 9 | 18 | 14 | 5 |
| "sadece X değil, (aynı zamanda) Y" | 4 | 7 | 7 | 9 |
| başlık ya da kalın satır eklenmiş | 4 | 19 | 15 | 28 |
| parantez içi ek bilgi / çekince | 14 | 2 | 4 | 9 |
| "zaten" | 8 | 5 | 3 | 2 |

Eşleme (olgu başına cümle): aynı olguyu veren cümle insanda ortalama 18,2 kelime, gpt-4o'da
14,6 (doğal 14,0; 4.1 14,8). Sayı içeren 162 insan cümlesinin karşılığında gpt-4o sayıyı
yalnız 90'ında aynen koruyor (%56; doğal %50, 4.1 %62).

Elle sınıflandırma (28 çift):

| | insan | 4o | doğal | 4.1 |
|---|---|---|---|---|
| Kapanışa, son olgudan sonra olgu taşımayan cümle eklenmiş (ders, dilek, çağrı, genel övgü, espri) | 6 | **28** | **28** | 26 |
| Açılış genel çerçeve, tanım, selam/anons ya da olgu listesinde olmayan sahneyle | 5 | 18 | 20 | 18 |
| Doğrudan söz (tırnaklı/tırnaksız konuşma ya da iç ses) var | 24 | 10 | 10 | 15 |
| Olgu listesinde olmayan somut ayrıntı (ad, replik, duyu, olay) — yargıç işaretledi | 0 | 27 | 27 | 24 |
| Olgu hatası (listeyle çelişen) — yargıç | 0 | 9 | 14 | 13 |

Uydurma ve olgu hatası sayıları GPT-4o yargıcından; yargıç fazla işaretliyor (çıkarımı da
"uydurma" sayıyor). Elle okuduğum 20 çiftte gpt-4o metinlerinin en az 13'ünde açık uydurma
doğruladım (ör. "Pandeli Karayol" soyadı, "Et tu, Brute?" repliği, havalimanı pasaport
kontrolü, "ailesine olan bağlılığıyla dikkat çekmektedir").

## 3. Desenler, kategori kategori

Her desen en az 5 çiftte görüldü; çift sayısı gpt-4o içindir, aksi yazılmadıkça. Örnekler
kısa alıntıdır; kaynaklar `meta.json`'da, sekizi `references/ornekler/fark-*.md`'de.

### 3.1 Sözcük sırası ve vurgu

- **İnsan yeni bilgiyi yüklemin önüne koyuyor, GPT onu bir sıfat öbeğine gömüp yüklemi bir
  kalıba veriyor** (b05, b09, b12, b13, b15, b17, s01; 7 çift).
  İ: "Kılavuzumuza fillerin yaşını sorduğumda aldığım cevap **40** olunca şaşırmamak elde
  değil." ↔ 4o: "Çiftlikte, yaşı 40 olan fillerle tanışma fırsatımız oldu."
  İ: "sanki o koridorlarda **ben** yürüyorum, stadyuma zorla **ben** sürükleniyorum" ↔ 4o:
  "sık sık kendimi karakterlerin yerine koyarken buldum."
- **İnsan artlama (yüklemden sonra bilinen öğe ya da kısa hüküm) kullanıyor, GPT
  kullanmıyor.** "Kendisi Eskişehirin en eski fotoğrafçısıdır yaşayan." "Ye, iç, gez,
  görlük çok keyifli bir şehir Lviv." "…geliyormuş Lviv, haklı." "…bir polis okulunda buldum
  kendimi." Kaba ölçüm: yüklemle bitmeyen cümle oranı insan 0,25, 4o 0,17 (17 çiftte insan
  daha fazla).

### 3.2 Cümle sınırları

- **İnsan aynı olguyu daha uzun cümleyle veriyor** (olgu başına 18,2 ↔ 14,6 kelime) ve
  **cümle boyunu çok daha fazla değiştiriyor** (değişim katsayısı 27/28 çiftte insanda
  yüksek; en uzun cümle 35 ↔ 24). Uzun cümlesi ardışık eylemleri virgülle ve ulaçla
  diziyor: "Ocak soğuğunda yanımıza giyeriz diye içlik almışken o kadar sık mekana girip
  çıktık ki ilk günden sonra giymekten vazgeçtik, çünkü mekanlar sıcak çünkü mekanlar
  ucuz."
- **İnsan çok kısa cümleyi de kullanıyor** (≤7 kelime oranı 0,20 ↔ 0,11; 20 çiftte): "Kafamı
  yardım." "Evet, yarılmıştı hem de ciddi anlamda." "Erasmus, maceradır."
- **GPT paragrafları eşit boyda kuruyor** (Wayback'te paragraf boyu değişim katsayısı 0,42
  ↔ 0,22) ve daha az paragraf açıyor.

### 3.3 Bağ

- **GPT nedeni ada çevirip "neden oldu / yol açtı" ile bağlıyor; insan olayı sırayla
  anlatıp bağı "ki", "çünkü", ulaç ve "-mışken" ile kuruyor** (b17, b18, b09, b12, s01).
  İ: "…5 kişi öneri için yazmışsa 50 kişi sonuçları bizimle de paylaşır mısın diye yazınca
  ben de iyisi mi hızlıca bir yazı yazayım … istedim." ↔ 4o: "Yalnızca beş kişi öneride
  bulunurken, tam elli kişi … paylaşmamı istedi. … bir yazı yazmaya karar verdim."
- **Cümle başı geçiş kelimesi** (Ancak, Ayrıca, Öte yandan, Dolayısıyla, Öncelikle, Son
  olarak): 4o'da 18 metin, insanda 9; 12 çiftte yalnız GPT'de. Mevcut kuralı doğruluyor.
- **Parçacık:** de/da 20 çiftte, "zaten" 7 çiftte, "hani/yani/işte" 7 çiftte insanda var
  GPT'de yok. İnsana özgü küçük bağlar: "Gerçi", "Hoş", "Neyse", "E …", "Misal", "Hatta
  şöyle diyeyim", "Olur ya", "yalan yok", "Evet".

### 3.4 Kelime seçimi

- **GPT yaygın fiilin yerine yüksek sicilli ya da mecazlı karşılığı seçiyor** (yüksek sicil
  24/28 çiftte GPT'de fazla). "doğdu" → "dünyaya gelmiştir" (s08, üç modelin üçü de);
  "otobüsle 16 USD’ye geldim" → "cüzdanıma yalnızca 16 USD gibi cüzi bir yük bindirdi"
  (b12); "tercih ettim" → "tatma cesaretini gösterdim" (b09); "staj yaptı" → "Avrupa
  deneyimi edinmiştir" (s08).
- **GPT'nin kendine özgü sözlüğü:** "adeta" (12 metin ↔ insan 1), "deneyim" (17 ↔ 6),
  "macera/serüven" (9 ↔ 2), "yelken açmak", "zamanda yolculuk / zaman tüneli", "büyülü
  dünya", "gizli bir cennet", "kalbimi fethetti", "paha biçilmez", "tanışma fırsatı".
  "yelken açmak" gpt-4o'nun üç metninde (b02, b06, b08) çıktı; insanda hiç yok.
- **Çeviri kalıbı:** "kendimi … buldum" (*found myself*), "özel bir anlama sahipti" (*had
  a special meaning*), "Evet, lütfen!" (*Yes, please!*), "Bu, sadece bir kahvaltı değil;"
  İnsan metinlerinde bu kalıplar yok.

### 3.5 Somutluk

- **GPT olgudaki sayıyı, saati, adı düşürüp genelliyor** (sayı içeren insan cümlelerinin
  %44'ünde sayı GPT cümlesinde yok; yargıç 18 metinde genelleme işaretledi). İ: "Saat 21:00
  de … Dizi 23:00 de bitti. 5 dakika sonra aynı dizinin, aynı bölümünün tekrarını
  yayınladılar." ↔ 4o: "Cumartesi akşamı aynı dizinin aynı bölümünü art arda izlemek bana
  biraz fazla geldi." İ: "Bir mail atıyorsunuz size on gün sonra cevap veriyorlar mesela."
  ↔ 4o: "Bazen günler hatta haftalar sürebilir."
- **İnsan olayı sahne olarak veriyor (soru → cevap → tepki), GPT sonucu söylüyor** (b04,
  b07, b09, b12, b13, b19, s01; 7 çift).
- **Canlılığı olgudan değil uydurmadan alıyor:** ad (Yusuf, Mustafa, Dr. Hikmet, Lorella
  Teyze), replik ("Allah razı olsun", "Et tu, Brute?"), koku ve duyu ("denizin tuzlu
  kokusu", "loş karanlık odalardaki kimyasal kokular"), sahne ("uçaktan aşağıya, bulutların
  üzerinden bakarken"). En çok gpt-4.1 ve "doğal yaz" istemi.
- **İnsan doğrudan sözü koruyor, GPT dolaylıya çeviriyor** (14 çiftte insanda var, 4o'da
  yok). s01: kurucunun "Baklavanın kilosu 5 lira idi." diyen uzun alıntısı 4o'da "müşteri
  bulmakta zorlandığını sıkça anlatırdı"ya dönüyor. b04: ninenin "Acele et emme!" sözü
  "Öğretmen, torunum sıkıntıda!"ya.

### 3.6 Ses ve kişi

- **GPT yazarın olumsuz ya da çekinceli yargısını yumuşatıyor, olumluya çeviriyor** (b06,
  b07, b09, b12, b13; 5 çift). b12: İ "bu ülkeyi es geçin derim. Boş yere zaman ve
  paranızdan olmayın." ↔ 4o "bu güzel ülkeyi keşfetmek, beklentilerimi fazlasıyla
  karşıladı." b09: İ "fiyatlar ise saçmalık derecesinde yüksekti" ↔ 4o "oldukça makul".
  b06: İ "ödediğimiz hesaba değdi mi emin değilim" ↔ 4o "tattığım lezzetler bu düşünceleri
  unutturuyor".
- **İnsan kuşkusunu ve kaynağını söylüyor, GPT kesinleştiriyor** (b05, b12, b13, b17,
  b18; s01). İnsan: "sanırım", "belki", "Nerede okumuştum bilmiyorum ama", "(Yanlışım,
  eksiğim varsa lütfen yoruma ekleyin)", "-mış". GPT: "şüphesiz", "aşikâr", "su götürmez
  bir gerçek", "garantisini verebilirim", "hak ediyor". Parantez içi çekince ya da ek bilgi
  12 çiftte yalnız insanda.
- **GPT okura açık hitapla, insan kişi ekiyle ulaşıyor.** "Merhaba sevgili okurlar / gezgin
  dostlarımız" 4o'da 4 metin (4.1'de 2) ↔ insanda 0; 2. kişi eki /100 kelime insanda
  daha yüksek (0,57 ↔ 0,49).
- **Mizah:** insanda durumdan doğuyor ("demir kapının köşesinin (ki sivridir) benimle bir
  derdi olduğunu gördüm"); GPT'de, sicilde "mizah var" yazınca paragraf başına bir espri
  ekleniyor ("cüzdanınızda yangın çıkmayacak", "balığın Disneyland’ı"). Yargıç zorlama
  şaka: insan 3, 4o 6, doğal 8, 4.1 14 metin.
- **Taraftar/topluluk "biz"i kayboluyor** (b05: "bitiricimiz", "diyoruz" → nötr haber dili).

### 3.7 Açılış ve kapanış

- **Kapanış:** insan metinlerinin 22'si son olgu, sahne, plan ya da kısa özgül bir hükümle
  bitiyor. GPT'de **28/28** (4.1'de 26) metnin sonuna olgu taşımayan bir cümle eklenmiş:
  ders ("hiç unutmayacağımı biliyordum", "neler öğretmez ki hayat bize!"), aforizma ("her
  fotoğraf bir hatıra, her hatıra da bir hikayedir"), dilek ("Umarım…", "İyi seyahatler!"),
  çağrı ("Kronotrop'un kapıları sizler için açık"), genel övgü ("…sadece bir gezi değil,
  ruhunuza dokunan derin bir deneyimdi"). Çift bazında 22 çiftte yalnız GPT'de.
- **Açılış:** insanın 23'ü olay, iddia, alıntı ya da olguyla açılıyor ("Kapımın sert sert
  çalınmasıyla uyandım." "Kafamı yardım." gövdenin ilk cümlesi). GPT'de 18-20 metin genel
  çerçeve ("X deyince aklımıza…", "Hayatta bazen…"), anons ("Bugün sizi … götüreceğim"),
  tanım ("…nadir işletmelerden biridir") ya da uydurma sahneyle açılıyor.

### 3.8 Ritim

Bkz. 3.2: GPT'de düz ritim (tr-scan) 16/28, insanda 1/28; art arda üç benzer boy cümle
22 çiftte GPT'de fazla. Mevcut kuralı güçlü biçimde doğruluyor.

### 3.9 Yapı

- **GPT başlık ekliyor** (4o 19, 4.1 28 metin; istemde başlık olgusu vardı, ama insan
  metninde başlık gövdede yok).
- **İnsan listeyi liste olarak bırakıyor; GPT her listeyi düzyazıya çeviriyor** (insanda
  listeli 8 metnin 8'inde de, üç modelde de). b14'te numaralı ipuçları (emir + tek cümle
  gerekçe) 4o'da her biri bir espri taşıyan paragraflara dönüşüyor.
- **GPT metni kısaltıyor:** "yaklaşık N kelime" istemine rağmen gpt-4o insan
  uzunluğunun %68'i (28/28 çiftte daha kısa). Kısalık, olguların sıkıştırılmasından geliyor;
  süs cümleleri eklenmesine rağmen.

### 3.10 Ek kategori: kanıtsallık ve zaman

- İnsan duyduğu ya da sonradan fark ettiği şeyi -mIş ile veriyor ("Meğer koşarken kapıyı
  unutmuş ve … vurmuşum", "geliyormuş Lviv", "kalkışmış, istemiş, bırakmış" nine
  anlatısında). GPT bunu çoğu yerde korudu; "doğal yaz" istemi ise tarihsel olguyu masal
  -mIş'ına çevirdi (b03: "gelirmiş", "önemliymiş"). 5 çifte ulaşmadı.
- Site tarihçelerinde insan tarihsel şimdiki ya da geniş zaman kullanıyor (s02 "Fakat
  bakıyor ki, işler az…", s03 "açılır", "taşınır"); GPT -DI ya da -mIştIr/-mAktAdIr'a
  çeviriyor (s03'te 4o 11, 4.1 13 -mIştIr/-mAktAdIr ↔ insan 2; s08'de 12 ↔ 1). 3 çift;
  kural için yetmez.

## 4. "Doğal yaz" isteminin etkisi (gpt-4o ↔ gpt-4o doğal)

**Düzeltti:** selamla açılış (4 → 1 metin), "sevgili okur" (4 → 1), "yelken açmak" (3 →
0), cümle başı mekanik geçiş (/100 kelime 0,31 → 0,19), "deneyim" (0,40 → 0,24), duygu
sözü (0,53 → 0,41), tr-scan hype (13 → 6).

**Düzeltmedi:** kapanış eki (28/28 → 28/28; "Umarım…", "Unutmayın…", "Hayat dediğin…"),
düz ritim (16 → 17), uzun cümle yokluğu (21 → 22), metnin kısalığı (%68 → %66), doğrudan
sözün kaybı (14 çift → 14), parantez ve çekince yokluğu, listenin düzyazıya çevrilmesi.

**Bozdu:** uydurma sahne ve ayrıntı ("denizin tuzlu kokusu burnuma doluyor", "uçaktan
aşağıya, bulutların üzerinden bakarken", "Yusuf, henüz altı yaşındaki"): açılışların 20'si
genel ya da uydurma (4o'da 18); olgu hatası (yargıç 9 → 14 metin), genelleme (18 → 21),
"bir" yoğunluğu (3,14 → 3,56), özet bağlacı ("Sonuç olarak", "Sonuçta") 4 → 6 metin,
zorlama şaka 6 → 8. "Klişe kullanma" deyince model klişeyi sahneye taşıyor: kalıp kelime
azalıyor, uydurma canlılık artıyor.

**gpt-4.1** gpt-4o'dan uzun (%88) ve mekanik geçişi az kullanıyor (5 metin), ama en çok
uydurma adı ve repliği, noktalı virgülü (26/28 çiftte insandan fazla), ünlemi, başlığı ve
zorlama şakayı (14 metin) o üretiyor.

## 5. Mevcut beceriyle karşılaştırma

**Doğrulanan:**
- Ritim tekdüzeliği en güçlü iz (`turkce-parmak-izi.md` §15): değişim katsayısı 27/28
  çiftte insanda yüksek, uzun cümle 23/28 çiftte insanda fazla.
- Mekanik geçişler (`yasakli-kaliplar-tr.md` §3) ve olumsuz koşutluk (§8): 4o'da 18 ve 7
  metin.
- Parçacık yokluğu (§0b): de/da 20 çiftte, "zaten" 7 çiftte insanda fazla.
- Dersin açıkça söylenmesi (`mudahale-defteri.md` §1), kapanış klişesi ve hafif iyimser
  kapanış (§14): kapanış eki 28/28; mevcut kural kalıp listesiyle yakalıyor, ama bu
  derlemde kapanışların çoğu listede olmayan cümlelerdi (tr-scan kapanış klişesi yalnız
  2-4 metinde).
- "Doğal yaz" istemi düz ritmi gidermiyor; "X değil, Y" kalıbını azaltmıyor (7 → 7).
- Uydurma yok (değişmez kural) ve hafif fiil / yüksek sicil (§5): yüksek sicil 24/28 çiftte.

**Yeni** (ayrıntı `_kaynak/fark-cift-kurallar.md`): olumsuz yargının olumluya çevrilmesi;
kuşkunun ve kaynağın silinmesi; olayın sıfat öbeğine gömülmesi (sahne yerine sonuç);
doğrudan sözün dolaylıya çevrilmesi; sayının ve saatin genellenmesi; metnin kısaltılması;
kapanışın taşınabilir değerlendirme cümlesi olması (kalıp listesinde olmasa da); açılışın
anons ya da uydurma sahne olması; GPT'ye özgü sözlük ("adeta", "deneyim", "macera",
"yelken açmak", "tanışma fırsatı", "kendimi … buldum"); artlama ve kısa hüküm cümlesi.

**Çelişen:**
- `SKILL.md` (1. geçiş) ve `yasakli-kaliplar-tr.md` §11: "Sitede taranan liste liste olarak
  kalır; **blogda düzyazıya çevrilir**." İyi insan bloglarının 8'i listeyi koruyor (ipucu,
  araştırma maddeleri, marka önerileri); GPT'nin düzyazıya çevirdiği listeler daha kötü
  (her madde süslü bir paragraf). Öneri: bloğun da ipucu/öneri/adım listesi liste kalsın;
  yalnız "**Etiket:** metin" biçimi ve bilgi taşımayan maddeler düzyazıya dönsün.
- `turkce-parmak-izi.md` §11 (özne düşürme): zamiri "yalnız karşıtlık varsa yaz" diyor.
  İnsan zamiri vurgu için de odak konumunda kullanıyor ("stadyuma zorla **ben**
  sürükleniyorum"); kural "karşıtlık ya da vurgu" diye genişlemeli (§0 kural 4 zaten buna
  yakın).
- Sitede içi boş sıfat: iyi insan site metinleri de "eşsiz", "efsanevi", "benzersiz …
  deneyimi" kullanıyor (s04, s05). Kural yanlış değil, ama insan kurumsal metninden ayırt
  edici değil; fark kapanışta ve olgu yoğunluğunda.

## 6. Sınırlar

- Örneklem küçük (28 çift) ve seçim elle: iyi yazılmış metinlere doğru bilinçli bir kayma
  var; sonuçlar "ortalama insan" değil "iyi insan" içindir.
- Olgu listesi GPT-4o'nun çıkarımı; ayrıntının bir kısmı (anekdot tepkileri, bazı adlar)
  listeye girmedi. Somutluk farkının bir bölümü bu kayıptan gelir; sayı ve ad kapsamı
  %85-100 ölçüldü, sahne ayrıntısı ölçülmedi.
- OSCAR metinlerinde (6 blog) paragraf ve kesme işareti yok, URL yok; paragraf ve yapı
  ölçümleri yalnız Wayback'ten (22 metin).
- Yalnız OpenAI modelleri (gpt-4o, gpt-4.1), tek örnekleme (varsayılan sıcaklık).
- Yargıç (GPT-4o) uydurma ve genellemeyi fazla işaretliyor; bu sayılar üst sınırdır.
  Açılış, kapanış ve 5 çiftlik desenler elle sayıldı.
- "Yüklemle bitmeyen cümle" ölçümü kaba bir ek eşleşmesi; eksiltili ad cümlelerini de
  sayıyor.
- Vurgu (odak) otomatik ölçülmedi; bulgular okumaya dayanıyor.
- Site metinleri 2013-2020 kurumsal sayfalar; hizmet sayfası tek (s07).
