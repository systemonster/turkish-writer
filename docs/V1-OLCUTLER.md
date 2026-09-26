# turkish-writer v1.0 ölçütleri

Tarih: 2026-09-26 (tur 4 sonrası). `package.json` 0.1.0, etiket yok; `CHANGELOG.md`'de 1.0.0
başlığı hazır, tarihi boş.

**v1.0'ın anlamı:** beceri, blog ve site yayınında kurucunun gözetimi olmadan kullanılabilir.
Metni editörden geçmiş iyi Türkçeden ayırt edilemez; kuralları iyi Türkçeyi bozmaz; yakalanan
her hata bir daha geri gelmez. "2018 web metninden ayırt edilemez" hedef değildir: o metin
hatalıdır ve hakemler cilalı metni ona zaten tercih ediyor (SONUC-BECERI.md).

**Kapsam dışı: model eğitimi yok** (kurucu kararı, 2026-09-26: "biz skillimizi geliştiriyoruz,
modeli değil"). İyileştirme yalnız beceri katmanında yapılır: istem, brif şablonu, çıpa, kural,
ölçüm. Taslak modeli hazır bir OpenAI modelidir; seçimi ölçümle yapılır.

Aşağıdaki değerler ölçülmüş değerlerdir; ölçülmeyen yer "yok" diye yazıldı. Ayrıntı:
`tests/kalibrasyon/SONUC-NITELIKLI.md` (tur 1-4), `SONUC-HAKEM.md`.

## Ölçüt tablosu (son durum, tur 4)

| # | Ölçüt | Hedef (v1.0) | Son durum | Durum | v1.0 kapsamı |
|---|---|---|---|---|---|
| a1 | **İnsan kör testi, hedef okur**: nitelikli insan metni / beceri metni, eşli 80–150 kelimelik çift | Kurucu **ve en az bir Türkçe okur**, her biri 20 çift; her okurda doğruluk ≤ %60 | Kurucu: 13 çiftte 4 doğru, **%31** (binom p ≈ 0,27). Beceriyi 9/13 kez insan sandı. İkinci okur yok | kısmen | kurucu sonucu raporlanır; ikinci okur sonraki sürüme |
| a2 | **Bağımsız tekli saklı hakem**: derlemle örtüşmeyen konularda bağımsız brifle yazılmış 36 beceri metni; saklı hakem (gpt-6-astra) her metne tek başına p(yapay) verir | AUC (beceri > insan) ≤ 0,70. **Tur 4'ten itibaren karar havuzu 2025+ yayımlanmış insan metni**; ≤ 2022 havuzu ek bilgi | Eski insan (≤ 2022, 62): AUC 1,00 (tur 1-4). **Yeni insan (2025+, 30): bağımsız 0,98 (tur 3) / 1,00 (tur 4); türetilmiş 0,87 / 0,87.** Yeni insan medyan p 0,14 (eski 0,02; duyuruda 0,65) | **tutmadı** | tutmadığı açıkça yazılır; "insan metninden ayırt edilemez" iddiası v1.0'da yok |
| b | **Üslup dağılımı**: nitelikli derlemde 8 ana ölçümde AUC (beceri > insan) | Her ölçümde AUC ∈ [0,40; 0,60] | Tur 4 (türetilmiş set, son istem): [0,40; 0,60] **3/8** (cumleOrt 0,44, hafifFiil200 0,41, heceOrt 0,50); [0,35; 0,65] 5/8. Dışarıda: cumleCV 0,24, cumleSapma 0,22, bir100 0,28. Ritim istemi (tur 4 B) geri alındı | kalıyor | ölçüm ve bulgu raporlanır |
| c | **Söz dizimi kurallarında yanlış pozitif** (nitelikli insan) | kural başına < %10, ayarda görülmemiş derlemde | Ayar derleminde liste-ve %10, ozne-virgul %13, liste-iki %3, diğer ikisi %0. Görülmemiş derlemde ölçülmedi. tr-scan skoru: sınama yarısında insan ≤ 80 **2/31 (%6,5)** | kısmen | kurallar raporda ayrı bölümde, skora girmez |
| d | **Regresyon** | Defter satırları test/fikstür adı taşır; `npm test` yeşil; TDK dizini testleri CI'da atlanmıyor | **143 test geçiyor** (tur 3: 129). İstem, tarayıcı ve ad sadakati defter satırları test adı taşıyor; kural defteri 9 satır fikstür kimliğisiz; dizin testleri dizin yoksa atlanıyor | kısmen | test ve defter bağı |
| e | **Tür kapsamı**: site, blog, reklam, WhatsApp, teklif, hukuk | Her türde `--tur`, ≥ 3 çıpa, ≥ 10 metinlik ölçüm, kör testte ≥ 3 çift | `--tur` 6 tür. Çıpa: site 2, blog 4, reklam 4, whatsapp 4, hukuk 3, teklif **0**. Ölçüm blog, kurumsal, duyuru (36'şar, iki set) | kalıyor | v1.0: site/kurum, blog, duyuru ölçülü; diğer türler "ölçülmedi" diye belgelenir |
| f | **Çıpa derlemi** | Her türde ≥ 3 gerçek insan örneği; proje çıpası dolu; çıpalı çıktı kör testte kötü değil | Genel çıpa 17 metin (teklif boş). Proje çıpası yok. Model kör testinde uzun türlerde çıpalı, kısa türlerde çıpasız seçildi | kısmen | genel çıpa + `--cipa` altyapısı |
| g | **Sürüm hijyeni** | Keep a Changelog, semver, `package.json` = etiket | `CHANGELOG.md` 1.0.0 başlığı hazır (tarih boş); `package.json` 0.1.0; etiket yok | hazır, onay bekliyor | sürüm numarası ve etiket kurucu onayıyla |
| h | **Olgu sadakati** | Brifte olmayan sayı, özel ad, tarih = 0; otomatik denetim + 10 metinlik elle örneklem | Brifte olmayan rakam: tur 1-4'te **0**. **Özel ad denetimi otomatik** (`adDenetle`, `--katı`): tur 3'teki "Süyman" hatasını yakalıyor; tur 4'ün 108 taslağında bozuk 0, yeni ad 1 ("DNA"). Tarih ayrı denetlenmiyor (rakam denetimine giriyor). Elle örneklem yok | **büyük ölçüde geçer** | v1.0'da |
| i | **Uzunluk uyumu** | Yeterli olgusu olan briflerde ≥ %70 metin hedefin %70-110'unda | Türetilmiş set: **33/36 (%92)**. Bağımsız set: 22/36; kurum+duyuru **14/24 (%58)** (tur 3: 4/24). Tekrarlı açılımla 21/24 ama metin dolgulu | türetilmişte geçer, bağımsız kurum/duyuruda tutmadı | "brifte olgu az" uyarısı + açılım şablonu |
| j | **Model seçimi kulakla** | Varsayılan model kurucu + bir okurun oylarıyla | gpt-5.6-sol tr-scan puanıyla seçildi; ilk kör oylamada 5 brifte 3 | kısmen | varsayılan korunur |

## Ölçütlerin gerekçesi

- **a2 neden tekli ve bağımsız (tur 3).** Eşli testte beceri metni insan metninin olgularından
  türetiliyordu; iki metin aynı olguyu taşıyınca hakem "hangisi yeniden yazım?" sorusunu
  cevaplayabiliyor (SONUC-HAKEM.md §6). Tekli sınıflandırmada hakem her metni tek başına görür;
  beceri metinleri başka konularda, bağımsız brifle yazıldığı için insan metniyle eşleşme ipucu
  yoktur. Hakem döngüde hiç kullanılmamış olmalı (döngü kendi hakemine aşırı uyum yaptı). AUC ≤ 0,70
  "ayırt edemez" demek değildir; bugünkü 1,00'dan ölçülebilir bir iniş ister.
- **a1, a2 ayrı.** Hedef okur ile güçlü LLM hakemi aynı şeyi ölçmüyor: kurucu şansın altında
  kaldı (%31), gpt-6-sol neredeyse hepsini yakaladı (%97,5). Okur yayının gerçek alıcısıdır,
  hakem ise tekrarlanabilir ve yarın arama motorlarının ya da müşterinin kullanacağı sınıflayıcıya
  yakındır. İkisi birden gerekir. Eşik neden %60/%70: 20 çiftte %60 = 12/20, iki yönlü binom
  p ≈ 0,50; daha sıkı eşik bu örneklemle ölçülemez. Hakem için %70, bugünkü %97,5'ten ölçülebilir
  bir iniş ister ama "ayırt edemez" iddiası taşımaz.
- **b nitelikli derlemde.** Eski OSCAR referansında iyi Türkçe "uzun cümleli, ve'li" tarafa
  düşüyordu; nitelikli metinde ortalama cümle 19,5 kelime, OSCAR'da 14,5. Referans değişince
  hangi metnin "insan gibi" olduğu değişiyor. [0,40; 0,60] bandı "ayırt edilemez" demektir;
  iki yönde de sapma kusurdur (aşırı düzeltme de iz bırakır).
- **c kural başına ve görülmemiş derlemde.** Bir kural iyi Türkçeyi işaretliyorsa Düzelt kipi
  onu bozar: "ve sıralaması" hatası (lovefengis 04fc3a9) tam olarak buydu. Ayarlandığı derlemde
  ölçülen oran iyimserdir.
- **d, e, f, g** kurucunun istediği asgari ölçütler. **h, i, j** bu ölçümde çıkan boşluklar:
  uydurma yasağı becerinin kırmızı çizgisi olduğu hâlde otomatik denetimi yok; metinlerin
  sistematik kısa kalması hem hakemin hem SONUC-BECERI'nin bulgusu; model seçiminde tr-scan
  puanı kulakla örtüşmedi (kurucunun seçtiği iki çıpalı metin en düşük puanlıydı, 74).
- **Daha iyi ölçüt önerisi.** a1'i tek sette bırakmayın: her düzeltme turundan sonra **yeni** bir
  kör set (set-2, set-3). Aynı sette tekrar ölçmek, okurun ya da hakemin o çiftleri
  ezberlemesine ve kuralların o sete göre ayarlanmasına yol açar.

- **a2 yeniden kalibrasyonu (tur 4).** ≤ 2022 yayımlanmış insan metinleri saklı hakemden çok düşük
  p alıyor (medyan 0,02); 2025+ yayımlanmış 30 nitelikli metin 0,14 aldı (AUC yeni > eski 0,94).
  Eski havuz ayrımı tanıma ya da dönem diliyle şişiriyor. Karar havuzu 2025+ metin olur ve her
  turda yenilenir (hakem yeni metinleri de zamanla görebilir). Sınır: 2025+ kurum metinlerinde
  yapay zekâ desteği dışlanamaz; duyurularda insan medyanı 0,65.

## Tur 4 sonucu (2026-09-26)

- **Tanıma kontrolü:** iki senaryo da kısmen doğru. Eski havuzla ölçülen 1,00 tanımayla şişkin;
  ama yeni insan havuzuyla da bağımsız beceri metinleri 0,98-1,00, türetilmiş 0,87. Hakem
  gerçekten ayırıyor.
- **Kurum ve duyuru uzunluğu:** brif şablonuna olgu açılımı ("Okur için anlamı / Nasıl işler /
  Ne yapması gerekir") ve istem talimatı eklendi. Tekrarsız açılımla 4/24 → 14/24; hedef %70
  tutmadı. Tekrarlı açılım 21/24 verdi ama olguyu başka sözle yineleyen dolgu üretti; o yol
  seçilmedi.
- **Özel ad sadakati:** otomatik; `openai-taslak.mjs` ve `hakem-dongusu.mjs` UYARI yazar,
  `--katı` ile çıkış kodu 4. Testli.
- **Ritim ayarı** (cümle boyu yayılımı, "bir"): etkisiz, geri alındı.
- **Durma ölçütü:** tur 4'te i (bağımsız set) ve h ilerledi; a2 ve b ilerlemedi. a2 dört turdur
  yerinde: istem cümlesi hakemin gördüğü dağılımı değiştirmiyor. İstem ayarı turları burada durur.

## v1.0 kapsamı

v1.0 şunları vaat eder, şunları etmez:

- **Vaat:** Yaz kipinde taslağı OpenAI yazar, beceri brif kurar ve düzeltir; uydurma sayı ve
  özel ad otomatik yakalanır (h); dolguya karşı istem kuralları ve "brifte olgu az" uyarısı;
  tr-scan varsayılan GPT Türkçesini yakalar (2018 OSCAR/gpt-4o sınama AUC 0,91), nitelikli
  insanı nadiren işaretler (%6,5); söz dizimi kapısı ayrı bölümde; çıpa altyapısı; lovefengis
  site kapısı 26/26; 143 test.
- **Vaat edilmeyen:** güçlü bir LLM hakeminin beceri taslağını insan metninden ayıramayacağı
  (a2 tutmadı); kurum ve duyuru metninde her brifle hedef uzunluk (i, bağımsız set); ikinci
  okurla kör test (a1); teklif, reklam, WhatsApp, hukuk türlerinde ölçüm (e).
- **Kapsam dışı:** model eğitimi (ince ayar) yok; hakem döngüsü deneysel, varsayılan değil.

## Sonraki sürüme kalanlar (yalnız beceri katmanı)

1. **a2 için brif malzemesi (blog).** Kişisel gözlem, kaynak alıntısı, adı konmuş örnek brifte
   yoksa üretilemez (SONUC-HAKEM.md §6). SKILL.md kullanıcıdan istemeyi söylüyor; ölçüm, gerçek
   malzemeli 12 blog brifiyle yeni insan havuzuna karşı yapılmalı. Maliyet: kurucu zamanı; API
   ~1 $ (üretim + hakem).
2. **a2 için yapısal müdahale.** Hakem gerekçelerinden kalan "fazla düzgünlük" (her paragraf bir
   olgu açıp kapatıyor): Düzelt geçişinde müdahale defterinden zorunlu bir yapısal müdahale ve
   kurum metninde paragraf boyu çeşitliliği ölçümü. Maliyet: kural + ölçüm, ~2 $ API.
3. **Çıpa ile ölçüm.** a2 ölçümü bugüne dek çıpasız taslakla yapıldı. `--tur blog`/`--tur site`
   genel çıpasıyla ve lovefengis proje çıpasıyla aynı bağımsız sette yeniden ölç. Maliyet: ~3 $.
4. **Kurum/duyuru brif malzemesi (i).** Açılım şablonu doğru yönde; kalan fark bilgi eksiği.
   Brif kurarken olgu kelimesinin hedefin ~%80'ine yaklaşması; bağımsız sette yeniden ölç.
5. **Yeni insan havuzunu büyüt.** 30 → ≥ 60, kurumsal ≥ 12 (bu turda 6); her turda yeni
   metin, çünkü hakem zamanla onları da görebilir.
6. **Kural FP'si görülmemiş derlemde (c)**, **ikinci okur (a1)**, **teklif çıpası ve diğer
   türlerde ölçüm (e, f)**, **kural defterine fikstür kimliği ve dizinsiz CI fikstürü (d)**.
7. **Ritim izi (b).** İstemle denendi (tur 4 B), etkisiz. Sonraki deneme istem değil: Düzelt
   geçişinde cümle boyu dağılımını tr-scan bilgisine göre elle açmak; önce/sonra ölçümle.

## Kurucunun yapması gerekenler

1. **v1.0 onayı:** sürüm numarası (`package.json`), `CHANGELOG.md` tarihi, etiket, commit ve
   push. Aşağıdaki lisans kararları commit'ten önce.
2. **Kör test ikinci okur** (a1): bir Türkçe okur, 20 çift.
3. **Çıpa örnekleri:** kendi müşteri mesajları (WhatsApp, teklif), kişisel veri silinmiş 3-5'er
   örnek; lovefengis deposunda proje çıpası. Teklif türünün çıpası yok.
4. **Blog brifine gerçek malzeme** (yukarıda 1): 12 konuda birer gözlem, rakam ya da örnek.
5. **Onaylar:** derlemdeki CC BY-NC-ND metinlerin (eski 11, yeni 3) yalnız iç ölçümde kalması.

## Lisans kontrolü (v1.0 commit'inden önce)

Depo MIT. Depoya girecek (ya da zaten giren) ve lisansı MIT'ten farklı dosyalar:

| dosya | lisans | öneri |
|---|---|---|
| `tests/ornekler/nitelikli-insan.md` (Vikipedi "Sabahattin Ali", 2 paragraf) | CC BY-SA 3.0 | **Atıf başlığı yeterli**, ama README'nin lisans bölümüne istisna olarak yazılmalı (dosya CC BY-SA 3.0 kalır, MIT'e girmez). Başlığa madde sürüm bağlantısı (oldid ya da Wayback URL) eklenmeli |
| `cipa/reklam/2-…`, `cipa/reklam/4-…`, `cipa/whatsapp/1-4` (Vikipedi Köy çeşmesi, Danışma masası, şablon, anı defteri; 6 dosya) | CC BY-SA 4.0 | **Atıf başlığı yeterli** (kaynak oldid'li, yazar "Vikipedi katkıcıları", lisans cümlesi var; imza/kullanıcı adı yok). README'de "cipa/ altındaki Vikipedi dosyaları CC BY-SA 4.0" istisnası şart |
| `cipa/site/1-2`, `cipa/blog/2-3`, `cipa/reklam/1`, `cipa/reklam/3` (Creative Commons Türkiye) | CC BY 4.0 | Atıf başlığı yeterli; MIT ile birlikte dağıtılabilir. README istisna listesine eklenmeli |
| `cipa/blog/1-emin-fedar-ram-nedir.md` | MIT (depo lisansı; yazıyı açıkça anmıyor) | **Çıkarıldı (1.0.0)**: lisans teyidi yok; blog çıpası kalan 3 örnekle çalışır |
| `cipa/blog/4-sabahattin-ali-…` | Kamu malı (FSEK md. 27, ö. 1948) | Sorun yok; başlık yeterli |
| `cipa/hukuk/1-3` (KVKK, TKHK) | FSEK md. 31 (resmî metin, serbest) | Sorun yok |
| `references/ornekler/fark-*.md` (8 dosya, 0.1.0'dan beri depoda, her biri ~190-240 kelime) | **Telifli ticari blog/site metni** (manifold.press, esrageziyor, rotasizseyyah, sultanahmetkoftesi, yoldaolmak, 5harfliler, karakoygulluoglu; Wayback) | **En riskli grup.** Kaynak var ama lisans yok; `ornekler/README.md`'nin kendi kuralı "depoya yalnız kısa alıntı (birkaç cümle) ya da izinli metin" diyor, dosyalar bunun üstünde. Öneri: v1.0'da insan tarafını 1-2 cümlelik alıntıya indirmek ya da dosyaları `ornekler/yerel/`'e (git dışı) taşımak. Geçmişteki commit'lerde kalacakları ayrıca not edilmeli |

| `references/evrensel-izler.md`, `yasakli-kaliplar-tr.md`, `denetleyici.md` (Wikipedia "Signs of AI writing" kaynaklı bölümler) | CC BY-SA 4.0 | README'de zaten beyanlı; olduğu gibi kalır |
| `tests/kalibrasyon/kor-test/model-seti-1.json`, `model-brif/*` | Model çıktısı + lovefengis'in kendi ses kılavuzu | Sorun yok |
| Git dışı derlemler (`derlem-*`, `derlem-yeni-insan/`, `set-*.json`) | CC BY-NC-ND ve telifli metin içerir | `.gitignore`'da; dağıtılmaz. Commit'ten önce `git status` ile bir kez daha doğrulanmalı |
