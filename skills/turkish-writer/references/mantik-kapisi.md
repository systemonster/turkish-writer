# Mantık kapısı: hece, kelime, cümle

Doğallaştırma sırasında en çok gözden kaçan şey şudur: metni "insan gibi" yaparken
**anlamsız** hâle getirmek. Bu bölüm bunun önündeki kapıdır. Her cümle altı denetimden
geçer. Bir tanesinde takılan cümle yayına çıkmaz.

Denetimler küçükten büyüğe sıralıdır: hece → kelime → tamlama → cümle → paragraf →
metin. Küçük katman bozuksa büyüğü düzeltmenin anlamı yok.

---

## Kapı 1: hece

**Soru: Bu kelime Türkçede bu hecelerle kurulur mu?**

Türkçe hece kalıpları yalnızca şunlardır: V, VC, CV, CVC, VCC, CVCC.
Kelime başında **iki ünsüz yan yana gelmez** (Türkçe kökenli kelimelerde).
Kelime içinde ikiden fazla ünsüz yan yana gelmez.

Kontroller:

- **Uydurma kelime yok.** Model, Türkçe kök + yanlış ek birleştirip var olmayan kelime
  üretebiliyor: "bilgilendirimsel", "çözümlemsellik", "hızlandırımlı".
  Test: kelime TDK Güncel Türkçe Sözlük'te ya da açık bir türetme kuralında var mı?
- **Ek dizilişi kurallı mı?** Türkçede ek sırası sabittir:
  `kök + yapım ekleri + çoğul + iyelik + hâl + kişi`.
  "ev-ler-im-de" doğru; "ev-de-ler-im" yok.
- **Satır sonu bölme.** TDK: kelimeler satır sonunda heceden bölünür, tek harf satır
  sonunda ya da satır başında bırakılmaz, kısaltmalar ve rakamlar bölünmez, kesme
  işaretinin olduğu yerden bölünmez. Dizgi/CSS tarafında `hyphens: auto` Türkçe için
  `lang="tr"` olmadan yanlış böler; bu bir metin kusuru olarak sayılır.
- **Büyük harf dönüşümü.** CSS `text-transform: uppercase`, bir şablon ya da slayt
  aracı "i" harfini yerel ayara bakmadan büyütürse "DENEYİM" yerine "DENEYIM" çıkar.
  Kaynak metin doğru olduğu için hata metinde görünmez, yalnız sayfada görünür. Çare
  yine `lang="tr"` (humanify layer-1 §7).
- **Ünlü uyumu.** Ek, kalınlık-incelik ve düzlük-yuvarlaklık uyumuna girmiş mi?
  "kitapları" doğru, "kitaplerı" değil. Alıntı kelimelerde istisna listesine bak
  (saat**i**, kalb**i**, rol**ü**, hukuk**u**): `tdk-ses-ek-esdizim.md`.
- **Ünsüz benzeşmesi.** f, s, t, k, ç, ş, h, p ile biten kelimede ek sertleşir:
  "kitap-ta", "Ahmet'-te", "sabah-tan". "kitapda" bir hece hatasıdır.
- **Ünsüz yumuşaması.** "kitap → kitabı" ama "hukuk → hukuku" (hukuğu **değil**),
  "sanat → sanatı", "millet → milleti". Tek heceli kelimelerin çoğu yumuşamaz.

---

## Kapı 2: kelime

**Soru: Bu kelime bu anlamda kullanılır mı, burada gerekli mi?**

- **Eş dizim (collocation).** Türkçede hangi ad hangi fiille gider bellidir.
  "karar vermek" (karar yapmak ✗), "söz vermek", "hata yapmak", "rüya görmek",
  "duş almak", "banyo yapmak", "kahvaltı etmek", "önlem almak", "sorumluluk üstlenmek",
  "risk taşımak", "teklif vermek/sunmak", "fiyat çıkarmak".
  LLM bu çiftleri karıştırır: "çözüm sağlamak" yerine "çözüm getirmek/üretmek"
  daha yerindedir; "katkı sağlamak" yerine "katkıda bulunmak".
- **Deyim bütünlüğü.** Deyimler kalıptır, sözcüğü değiştirilmez; çekim eki serbesttir.
  "göz atmak" ✓, "göz gezdirmek" ✓, "göz koymak" ✓, ama üçü farklı anlama gelir ve
  birbirinin yerine geçmez. "kulak kabartmak" ✓, "kulak vermek" ✓,
  "kulak asmamak" ✓; "kulak atmak" ✗. İki deyimi birleştiren melez biçim yasaktır
  ("baltayı derin sulara vurmak" ✗).
- **Deyim dozu.** Deyim tuz gibi kullanılır: 150-250 kelimede en fazla bir tane, iki
  deyim yan yana gelmez. Argo kökenli deyim site metninde sırıtır (insanca Ak16;
  ölçülmedi). "Taşı gediğine koyduk, işin içinden çıktık, çorbada tuzumuz var." → tek
  deyim bırak ya da hiç bırakma.
- **Yanlış anlam aktarımı.** İngilizceden yanlış eşleştirilen kelimeler:
  *actually* → "aslında" (aktüel ✗), *eventually* → "sonunda" (eninde sonunda ✓,
  "nihayetinde" ağır), *sensible* → "makul" (hassas ✗), *support* → bağlama göre
  "destek/dayanak/tutmak" (her yerde "desteklemek" ✗).
- **Duruluk: kelime düzeyinde silme testi.** Anlamı daraltmadan çıkarılabilen kelime
  atılır (insanca Ak14). Tipik fazlalıklar: "kurumuş olan çiçekler" (olan), "tekrar
  yinelemek", "geri iade", "karşılıklı istişare", "en optimum", "önceden rezerve".
  "Başvurunuzu geri iade edilmek üzere tekrar yeniden inceliyoruz." → "Başvurunuzu
  yeniden inceliyoruz."
- **Terim tutarlılığı.** Bir kavram, metin boyunca bir kelime (`turkce-parmak-izi.md` §13).
- **Uydurma Türkçeleştirme yok.** Sektörde yerleşik terim varsa bırakılır: API,
  deploy, framework, webhook. Zorla Türkçeleştirmek "uygulama programlama arayüzü
  dağıtımı" gibi anlaşılmaz metinler üretir.

---

## Kapı 3: tamlama ve ek uyumu

**Soru: Ekler birbiriyle tutuyor mu?**

- **Belirtili / belirtisiz tamlama karışması.** "müşteri talebi" (belirtisiz, tür
  bildirir) ile "müşterinin talebi" (belirtili, belirli bir müşteri) aynı şey değil.
  LLM ikisini aynı cümlede karıştırır.
- **Zincir sınırı.** Üç halkadan uzun tamlama zinciri okunmaz hâle gelir:
  "müşteri memnuniyeti artırma süreci yönetimi" → zinciri fiille kır.
- **Hâl eki uyumu.** Fiil hangi hâli istiyorsa o gelir: "bir şey**e** karar vermek",
  "bir şey**i** çözmek", "bir şey**den** vazgeçmek", "bir şey**le** ilgilenmek".
  "Sorunu çözüm getirmek" ✗ → "Soruna çözüm getirmek" ✓.
- **Özne-yüklem uyumu.** Çokluk eki kuralı: cansız çoğul özne tekil yüklem alır
  ("Dosyalar yüklendi" ✓, "Dosyalar yüklendiler" ✗); insan çoğul öznede iki kullanım
  da olur ama metin içinde tutarlı olmalı.
- **Kişi tutarlılığı.** Bir metinde hem "yapıyorum" hem "yapıyoruz" olmaz. Ses baştan
  seçilir ve korunur.
- **Zaman tutarlılığı.** Bir paragrafta zaman kipi sebepsiz değişmez.

---

## Kapı 4: cümle

**Soru: Bu cümle bir şey söylüyor mu, söylediği tutarlı mı, okur onu bir kerede izleyebiliyor mu?**

- **Yüklem var mı?** Telgraf dili kusurdur (bkz. `turkce-parmak-izi.md` §7).
- **Gönderim açık mı?** "Bu", "o", "bunlar", "söz konusu durum" neyi gösteriyor?
  Okur geriye bakmadan çözemiyorsa kusur.
- **Yüklem-özne mantığı.** Cansız özne, insan fiili almaz: "Sistem karar veriyor"
  teknik bağlamda kabul edilebilir, "Rapor düşünüyor" değildir.
- **Çelişki yok.** Aynı metinde "14 gün ücretsiz deneme" ve "deneme sürümü yok"
  birlikte bulunamaz. Sayılar, süreler, koşullar metin içinde çapraz denetlenir.
- **Boş cümle yok.** Üç test:
  1. *Silme:* cümleyi silsem ne kaybolur? Cevap "hiçbir şey" ise cümle silinir.
  2. *Taşınabilirlik:* cümle başka bir şirkete ya da ürüne aynen taşınabiliyorsa dolgudur.
     **Son cümleye mutlaka uygula:** fark derleminde (`tests/kalibrasyon/SONUC-FARK.md`)
     GPT kapanışlarının 28/28'i olgu taşımıyordu, çoğu kalıp listesinde yoktu ("…ruhunuza
     dokunan derin bir deneyimdi"). Son cümleyi sil; olgu kaybolmuyorsa silinmiş kalsın
     (`turkce-parmak-izi.md` §14).
  3. *Boş doğru:* cümlenin tersini savunacak kimse var mı? Yoksa cümle bilgi
     taşımıyordur (insanca §6). "Güven zamanla inşa edilir", "Başarı bir gecede gelmez",
     "Değişim kaçınılmazdır". Somut ve tartışılabilir bir iddiaya çevir ya da sil.
     "Başarı bir gecede gelmez." → "Yeni site aramada ilk aylarda az görünür, trafiği
     ilk haftadan yargılamayın." (Olgu varsa.)

  Yüzey temizliği yapılmış ama içi boş metin, temizlenmiş değil **zımparalanmış**
  metindir; denetleyiciyi geçer, okuru geçmez.
- **Tek fikir, ama uzunluk tavanı yok.** Cümlede bir asıl fikir olsun. Cümleyi
  uzunluğu yüzünden bölme: kalibrasyonda 25 kelimeyi aşan cümle insan metinlerinin
  %68'inde, LLM metinlerinin %23'ünde çıktı; uzun cümle insan işaretidir, tekdüze
  uzunluk ise en güçlü LLM izi (`turkce-parmak-izi.md` §15). **Okur takılıyorsa böl.**
  Takılmanın işaretleri:
  - okur yüklemi görene kadar ilk yarıyı aklında tutmak zorunda kalıyor;
  - sıfat-fiilin içinde ikinci bir sıfat-fiil var;
  - adın önüne yığılan niteleme 10-12 kelimeyi aşıyor;
  - cümlede birbirine bağlı olmayan iki asıl bilgi var.

  Ulaçla ya da virgülle zincirlenmiş ardışık eylemler uzun olabilir; okur her halkada
  dinlenir. Sonuçta metinde kısa ve uzun cümleler karışık dursun.
  "Ekibimiz, müşterilerimizin sipariş verdikleri ürünlerin depodan çıktığı andan itibaren
  takip edilebildiği paneli geliştirdi." (iç içe sıfat-fiil) → "Ekibimiz yeni bir panel
  geliştirdi. Sipariş depodan çıktığı andan itibaren buradan izlenebiliyor."

---

## Kapı 5: paragraf ve bağ

**Soru: Cümleler birbirini gerçekten takip ediyor mu?**

- **Sahte bağlaç yok.** "Dolayısıyla", "bu nedenle", "bu bağlamda" gerçek bir
  nedensellik varsa kullanılır. Model bunları süs olarak koyar; koyduğunda cümleler
  arasında olmayan bir mantık varmış gibi görünür. Bu, mantık hatasının en sinsi
  biçimidir.
- **Tekrar yok.** İkinci cümle birincinin aynısını başka kelimelerle söylüyorsa silinir.
- **Atlama yok.** A'dan C'ye geçilmişse B yazılır ya da geçiş kurulur.

---

## Kapı 6: metin

**Soru: İddialar doğrulanabilir mi, düzeltme kaynağa sadık mı?**

- **Kaynak denetimi.** Her sayı, oran, süre, fiyat, müşteri sayısı, ödül, deneyim
  iddiası olgu listesine karşı doğrulanır. Listede yoksa metinde de yoktur.
- **Ters yön: olgu listesindeki her sayı, saat, ad metinde aynen var mı?** Olguyu
  genellemek uydurmanın tersi yönde aynı kaynak hatasıdır. Fark derleminde sayı içeren
  insan cümlelerinin %44'ünde gpt-4o sayıyı düşürdü ("on gün" → "bazen günler hatta
  haftalar").
  "Cumartesi akşamı aynı dizinin aynı bölümünü art arda izlemek bana biraz fazla geldi."
  → "Saat 21:00 de, büyük TV kanallarının birinde sıradan bir dizi başladı. Dizi 23:00 de
  bitti. 5 dakika sonra aynı dizinin, aynı bölümünün tekrarını yayınladılar."
- **Söz denetimi.** Kaynakta doğrudan söz varsa metinde söz olarak kalır, dolaylı özete
  dönmez; kaynakta yoksa söz yazılmaz (`sicil.md`).
- **Politika kayması denetimi.** Model, olgu listesinde olmayan kural uydurabiliyor:
  "7/24 destek", "memnun kalmazsanız ödemezsiniz", "ücretsiz keşif". Özellikle şunlara
  bak: kapsam, garanti, iade, süre, fiyat, kim için / kim için değil.
- **Sahte deneyim denetimi.** "Ben de benzer bir süreçten geçtim", "müşterilerimizden
  sürekli olumlu dönüş alıyoruz": doğruluğu bilinmiyorsa yazılmaz.
- **Düzelt kipinde sadakat: kesinlik ve ilişki de içeriktir** (humanify rewrite-mode
  kural 1-4). Olgu eklenip düşmemesi yetmez. humanify bu dört hatanın dördünü de metni
  sıkıştırırken, tek kelimeyle yapıldığını ölçmüş:
  1. **Kesinlik derecesi ve kaynağı korunur.** "yaygın, çoğu, genellikle, olabilir,
     başlıca, tipik" silinirse iddia güçlenir. "Yaygın yaklaşım" → ~~"En yaygın
     yaklaşım"~~. Kuşku ve kaynak da içeriktir: "sanırım", "nerede okumuştum", duyulanı
     bildiren -mış, parantez içi çekince silinmez; yerine "şüphesiz", "garantisini
     verebilirim" konmaz (`turkce-parmak-izi.md` §18).
  2. **Yeni ilişki kurulmaz.** Kaynakta yan yana duran iki cümleyi "çünkü", "bu
     yüzden", "yani" ya da ulaçla (-ince, -dikçe) bağlamak yeni bir nedensellik
     iddiasıdır. "Trafik arttı. Satışlar da arttı." → ~~"Trafik artınca satışlar arttı."~~
  3. **Başlığın iddiası metindekiyle aynı güçte kalır.** Kaynak "Yapılandırma çoğu
     durumda faizi düşürür" diyorsa başlık ~~"Yapılandırma faizi düşürür"~~ değil,
     "Yapılandırma faizi neden çoğu zaman düşürür?" olur.
  4. **Sayı eklemek, doğru olsa bile eklemedir.** Kaynakta "birkaç adım" varsa "üç
     adım" yazılmaz.
  5. **Yargının yönü korunur.** Yazarın olumsuz ya da çekinceli hükmü olumluya
     çevrilmez; "güzelleştirirken" en sık kaçan budur (humanify'da yok; fark derleminde 5 çift).
     "bu ülkeyi es geçin derim. Boş yere zaman ve paranızdan olmayın." →
     ~~"bu güzel ülkeyi keşfetmek, beklentilerimi fazlasıyla karşıladı."~~ "fiyatlar
     saçmalık derecesinde yüksekti" → ~~"oldukça makul"~~.

---

## Uygulama sırası

Kapıları yukarıdan aşağıya, **tek tek** geç. Aspect tabanlı denetim (her turda tek
konu) tek büyük geçişten belirgin biçimde daha çok kusur yakalar: StoryScope'un kendi
işlem hattında %95'e karşı %68.

Her kapıdan geçen kusuru kaydet: ne bozuktu, ne yaptın. Rapor, düzeltmenin kendisi
kadar önemlidir; aynı kusur tekrar ediyorsa sorun metinde değil, brief'tedir.
