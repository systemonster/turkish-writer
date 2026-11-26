# Denetleyiciler: ne ölçüyorlar, neyi kaçırıyorlar

Bu bölüm "AI denetleyicisini nasıl kandırırım" sorusuna dürüst cevaptır. Kandırma
tekniği değil, **neyin gerçekten işe yaradığının** ve neyin boş inanç olduğunun dökümü.

## Denetleyici türleri

**1. Şaşırtıcılık ve dalgalanma (perplexity + burstiness).**
GPTZero, ZeroGPT, Copyleaks'in ücretsiz katmanı ve Türkçe destekleyen araçların
çoğu burada. Bir dil modeli metni okur, her kelimenin ne kadar tahmin
edilebilir olduğuna bakar. Düşük şaşırtıcılık + düşük dalgalanma = makine.

**2. İnce ayarlı sınıflandırıcı.** Originality.ai, Pangram, Turnitin. İnsan ve makine
metinleriyle eğitilmiş modeller. Kelime dağarcığına değil, dağılımın geneline bakar.
Yüzey düzenlemesine perplexity ölçümünden daha dayanıklıdır. Turnitin 2025'te
"humanizer" araçlarından geçmiş metin için ayrı bir tespit modülü duyurdu.

**3. Yapısal sınıflandırıcı.** StoryScope (Russell vd. 2026) yaklaşımı: üslup
öznitelikleri tamamen çıkarılmış hâlde, yalnızca söylem yapısıyla %93,2 F1 başarı.

**4. Filigran (watermark).** Bazı sağlayıcılar çıktı dağılımına istatistiksel imza
gömer. Yeniden yazma bunu bozar; kopyala-yapıştır bozmaz.

## Türkçe için özel durum

**Ticari ürün yok, araştırma sınıflandırıcısı var.** Türkçeye özel eğitilmiş, yaygın bir
ticari denetleyici bilmiyoruz; ticari araçlar Türkçede çoğunlukla çok dilli bir modelle
çalışıyor. Ama araştırmada Türkçe sınıflandırıcılar yüksek başarıya ulaştı. `fark-tr`
taramasına göre (künyeler doğrulanmadı):
- **Ozdemir 2026** (arXiv 2602.13504): 3.600 haber metni (2021 insan yazısı ve bunların
  ChatGPT ile yeniden yazılmış hâlleri), BERTurk ince ayarı, **%97,08 F1**. 2023-2026
  haberlerinin ortalama yaklaşık %2,5'inin LLM ile yeniden yazıldığını tahmin ediyor.
  Ön işlemede metin küçük harfe çevrilmiş, noktalama ve durak kelimeler silinmiş;
  hangi özniteliğin ayırt ettiğine bakılmamış. "Sinyal ritimde" yorumunu desteklemez.
- LSTM tabanlı bir çalışma (Applied Sciences 15(10):5541, 2025) ve DistilBERT-GCN
  (yaklaşık %98, Applied Sciences 16(14):7249).

**Bizim ölçtüğümüz.** `tests/kalibrasyon/SONUC.md` (100 haber ve forum insan metni, 100
gpt-4o / gpt-4o-mini metni) ve bağımsız sınama `SONUC-SITE.md` (40 site + 40 blog insan
metni, 80 gpt-4o / gpt-4.1-mini metni, 20'si "doğal yaz" istemli):
- En güçlü ayırıcı iki derlemde de **cümle ritmi**: cümle uzunluğu değişim katsayısı
  (güç haber ve forumda 0,93, sitede 0,76, blogda 0,83). LLM cümleleri aynı boyda,
  insanınkiler dağınık; uzun cümle insan metinlerinin çoğunda var, LLM'lerin azında.
- "ve" yoğunluğu iki derlemde de tuttu (0,72-0,79).
- Kalıplardan olumsuz koşutluk en sağlamı: "doğal yaz" istemi kapanış klişesini
  azalttı ama "X değil, Y" kalıbını metinlerin yarısından çoğuna çıkardı.
- **Ayırt etmeyenler:** "bir" yoğunluğu (bağımsız derlemde çöktü), cümle başına ulaç,
  *-maktadır*, -DIr oranı, ortalama cümle uzunluğu. Kelime başına hece LLM'de insandan
  **yüksek** çıktı.
- Tarayıcı skoru bağımsız derlemde güç 0,85 verdi; insan site metinlerinin önemli bir
  kısmı da gri bölgeye düşüyor. Skor işarettir, hüküm değil.

Bu yüzden eski varsayım ("Türkçede doğal yazmak ile tahmin edilemez yazmak aynı şeydir;
ulaç ve derin morfoloji şaşırtıcılığı yükseltir") kanıtla desteklenmiyor ve bırakıldı.
Ulaç ve devrik iyi Türkçenin araçlarıdır, denetleyici numarası değildir. Ölçülebilen
ortak nokta ritimdir: anlamın gerektirdiği uzunlukta yazılmış, kısa ve uzun cümlesi
karışık metin hem daha doğal okunur hem de düz ritim izini taşımaz.

**Yanlış pozitif.** Çok dilli model Türkçeyi zayıf modelliyor, bu yüzden bazı
denetleyiciler düzgün insan Türkçesini de makine sanar. Skor bir gerçek değil, bir
tahmindir. Bu becerinin tarayıcısı da bir tahmindir (bkz. SONUC.md "Skor ne değildir").

## Kelime izleri neden eskir

- **Kobak vd. 2025** (*Science Advances* 11(27): eadt3813): 2010-2024 arası 15,1
  milyon PubMed özetinde "fazla kelime" yöntemi. 2024'te 454 fazla kelime, 379'u üslup
  kelimesi (çoğu fiil); *delves* beklenenin 28 katı. 2024 özetlerinin en az %13,5'i
  LLM'den geçmiş. Ders: iz konuda değil üslupta ve fiillerde.
- **Juzek ve Ward 2025** (COLING, s. 6397-6411): 21 odak kelime (*delves* +%6697). Eğitim
  verisi ya da mimari yönünde kanıt bulamıyor; aynı mimarideki temel ve sohbet modeli
  karşılaştırması ince ayarı / RLHF'yi işaret ediyor, ama insan tercihi deneyi
  sonuçsuz kaldı. GPT-4o-mini'de *boasts* artık aşırı kullanılmıyor, *underscore*
  milyonda 18'den 1365'e çıkmış: kelime listesi model sürümüyle eskir.
- **Türkçe için** Kobak ya da Juzek tarzında bir LLM fazla kelime çalışması, `fark-tr`
  taramasında (DergiPark, arXiv) **bulunamadı**. Türkçe kelime listelerimiz gözleme
  dayanır; yapısal izler (ritim, kalıp) daha sağlamdır.

## Neyin işe yaradığı (kanıta dayalı sıralama)

| Katman | Etkisi | Kaynak |
|---|---|---|
| Yapı (söylem düzeyi) | **En yüksek.** Tek başına %93,2 F1 ayırt edici | StoryScope 2026 |
| Cümle ritmi (uzunluk dağılımı) | **Yüksek.** Türkçede ölçülmüş en güçlü ayırıcı, güç 0,76-0,93 | kalibrasyon (iki derlem) |
| Kalıp: olumsuz koşutluk, kapanış klişesi, boş vurgu | Yüksek, türe bağlı (blogda güçlü, sitede seyrek) | kalibrasyon |
| Somut, doğrulanabilir ayrıntı (ad, sayı, tarih, fiyat) | Yüksek | StoryScope: adlandırılmış gönderme %47'ye %24 |
| "ve" yoğunluğu | Orta, güç 0,72-0,79 | kalibrasyon |
| "bir", ulaç, -maktadır, edilgen | **Ayırt etmiyor.** Üslup için düzeltilir, denetleyici için değil | kalibrasyon |
| Kelime değiştirme (uzun tire, "delve", klişe) | **Düşük.** Profesyonel yüzey düzenlemesi tespiti yalnız 1,6 puan düşürdü | StoryScope / LAMP |

Sıralamanın anlamı: uzun tireleri temizleyip işin bittiğini sanmak en yaygın hatadır.
Yüzey katmanı **gerekli ama yetersiz**. Yapı ve ritim asıl işi yapar.

## Denetle kipinde iz sayılmayanlar

insanca'nın Tespit Rehberi ve humanify'ın "Do not flag" listesinden:
- Kusursuz dil bilgisi iz değildir. Tek kısa cümle, tek retorik soru, tek "ayrıca",
  gündelik "belki de", tanımdaki -DIr, alıntı içindeki kalıp da iz değildir.
- Anlatım bozukluğu (özne-yüklem uyumsuzluğu, öge eksikliği) insan işidir; iz olarak
  değil, dil bilgisi hatası olarak düzeltilir.
- İzler eşit ağırlıkta değildir. "Bir yapay zekâ modeli olarak" kesin kanıttır, tek bir
  "kapsamlı" zayıf sinyaldir.
- Ölçüldüğünde ayırt etmediği görülen özellikler (yukarıdaki tablo) iz diye raporlanmaz,
  gerekirse üslup notu olarak yazılır.
- Metin zaten iyiyse çıktı girdinin aynısıdır.

## Yasak numaralar

Aşağıdakiler kısa vadede skoru düşürür, ama bu becerinin amacına aykırıdır ve
kullanılmaz:

- **Homoglif** (Kiril "а", Yunan "ο") ve **sıfır genişlikli karakter** enjeksiyonu.
  Yazımı bozar, ekran okuyucuyu bozar, aramayı bozar, kopyalamada ortaya çıkar ve
  denetleyicilerin bir kısmı bunu zaten "manipülasyon" olarak işaretler.
- **Kasıtlı yazım hatası ve noktalama bozukluğu.** "İnsan hata yapar" mantığı burada
  geçersiz: hedef hem doğal hem TDK'ya uygun metin. Hata, doğallık değil özensizliktir.
- **Eş anlamlı sözlükten rastgele kelime değiştirme.** Anlamı bozar, eş dizimi bozar,
  metni okunmaz hâle getirir ve ince ayarlı sınıflandırıcıyı zaten atlatamaz.
- **Argo ve kota ile serpiştirme.** "abi", "kanka" gibi argo iki sicilde de yasaktır.
  "zaten, yani, işte" gibi söylem parçacıkları yasak değildir, ama kota doldurur gibi
  serpiştirmek yeni bir kalıptır.
- **Uzunluğu yapay çeşitlendirme.** Ritim izini gidermek için cümleleri rastgele bölüp
  uzatmak, özellikle art arda kısa cümle yığmak, düzeltmenin kendi izini üretir.
- **Uydurma deneyim, uydurma müşteri, uydurma istatistik.** Bunlar hem yalan hem de
  LLM'lerin en tipik davranışı; doğallık değil, tam tersini sağlar.

## Dürüst beyan

Hiçbir yöntem "hiçbir denetleyici asla anlayamaz" garantisi vermez. Bunu iddia eden
her araç yalan söylüyor. Bu becerinin verdiği söz şudur:

1. Metin, **elle yazılmış iyi Türkçeden ayırt edilemez** hâle gelmeyi hedefler, çünkü
   artık elle yazılmış iyi Türkçedir.
2. Yüzey, ritim ve yapı katmanları birlikte düzeltildiğinde, ölçtüğümüz izler (düz
   ritim, kapanış ve koşutluk kalıpları, "ve" yoğunluğu) ortadan kalkar. Ticari
   denetleyicilerde sonucu ölçmedik; skorun düşeceği **taahhüt edilmez**.
3. Metin TDK'ya uygun kalır ve içinde mantıksız tek cümle bulunmaz.

Sıralama bilinçlidir: 3. madde 2. maddeden önce gelir. Denetleyici skoru uğruna
Türkçeyi bozmak, bu becerinin reddettiği tek şeydir.

## Yakınsama tuzağı

En büyük risk, bu beceriyi uygulayan metinlerin **birbirine benzemesidir**.
StoryScope'un en derin bulgusu buydu: beş farklı LLM, yapısal uzayda tek ve dar bir
bölgede toplanıyor; insanlar dağınık. **Seyreklik, insan sinyalinin kendisidir.**

Doğallaştırma araçları da bu tuzağa düşüyor: DAMAGE çalışması (arXiv 2501.03437) 19
"humanizer" aracını inceledi, en iyilerinde bile akıcılık kazanımı %26'da kaldı. Kör
"hangisi daha insan" testleri ise uydurma deneyimi ödüllendirebiliyor (humanify); bu
yüzden ölçüt hiçbir zaman "okur insan sandı mı" değil, "doğru ve iyi Türkçe mi"dir.

Yani: her metinde bütün müdahaleleri birden uygulama. Metin başına 1-2 yapısal
müdahale seç, bunları metinden metne değiştir ve neden bu metnin bu biçimi aldığını
söyleyebil. Aksi hâlde yeni ve tespit edilebilir bir kalıp üretmiş olursun.

`references/mudahale-defteri.md` bunun kaydını tutmak içindir.
