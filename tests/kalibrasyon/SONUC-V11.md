# turkish-writer v1.1: önce/sonra ölçümü (2026-10-14)

Dal `v1.1` (push yok, etiket yok). Soru: v1.0'dan sonra beceri katmanında yapılan iyileştirme, saklı hakemde ve dış
dedektörlerde gözle görülür bir iniş veriyor mu? **Kısa cevap: hayır.** Saklı hakem (gpt-6-astra) bağımsız beceri
metinlerini yeni insan metninden hâlâ ayırıyor (AUC 0,999 → 1,000); açık dedektörlerden ikisi Türkçede ters ya da
rastgele çalışıyor, üçüncü (BERTurk) iniş değil çıkış gösterdi. Ölçülebilir kazanç yapısal izlerde (paragraf boyu,
uzunluk uyumu); bunlar a2'yi oynatmadı. Ayrıca Düzelt adımı, v1.0 ve v1.1 talimatıyla aynı, cümle ritmini ağır bozuyor.

## 1. Düzenek

- **Taslak modeli:** gpt-6.1-sol (v1.0 ölçümleri gpt-5.6-sol/gpt-6-sol ile yapılmıştı). Üretim, `openai-taslak.mjs`.
- **a2 hakemi:** saklı gpt-6-astra, editör istemi, tek metin, döngüde hiç kullanılmadı. Karar havuzu 2025+ insan metni:
  **69 metin** (v1.0'da 30; +39: Journo 16, TCMB 6, TÜBİTAK 7, Boğaziçi 6, Hacettepe 4; kaynak ve lisans
  `derlem-yeni-insan/kaynaklar.md`, git dışı). Kurumsal tür 6'da kaldı (büyütülemedi). Eski havuz (≤ 2022, 62) ek bilgi.
  Yeni insan hakem puanı: medyan 0,12; p > 0,5 olan 19/69; blog 0,045 (34), duyuru 0,26 (29), kurumsal 0,135 (6).
- **Setler:** Set A = v1.0'ın bağımsız 36 konusu (blog 12, kurumsal 12, duyuru 12) ve türetilmiş 36 metin. **Set B =
  taze bağımsız 36 konu** (aynı dağılım, hiç görülmemiş konular, kurumsal ve duyuru kurgusal kurum; `derlem-tekli-b/`).
  Son ölçüm Set B'de, taban ve son aynı sette yeniden üretilerek yapıldı.
- **Düzelt ölçümü:** `duzelt-olc.mjs` SKILL.md'nin verilen sürümünü talimat alan gpt-6.1-sol çağrısı (blog hattının
  Düzelt çağrısıyla aynı kurgu: talimat SKILL.md, kesin sınırlar sarmalayıcıda, tr-scan raporu kullanıcı mesajında).
  Taban = v1.0.0 SKILL.md, son = v1.1 SKILL.md.
- **Ölçümler:** a2 AUC (beceri > insan), b = 8 üslup ölçümünde AUC (`olcum-auc.mjs`, nitelikli insan 62; Set A
  türetilmiş için `kalibre-nitelikli.mjs olc`), tr-scan, uzunluk uyumu (%70-110), paragraf boyu CV, dış dedektörler.

## 2. Taban ve son (Set B, taze bağımsız set)

| ölçüt | taban (v1.0 istem) | son (v1.1 istem) | taban + Düzelt v1.0 | son + Düzelt v1.1 |
|---|---|---|---|---|
| a2 AUC, yeni insan 69 [%95 GA] | 0,999 [0,995–1,00] | **1,000** [0,998–1,00] | 0,985 [0,963–0,998] | 0,981 [0,957–0,998] |
| a2 AUC, eski insan 62 | 1,00 | 1,00 | 1,00 | 1,00 |
| a2 blog / kurumsal / duyuru (yeni) | 0,997 / 1,00 / 1,00 | 0,999 / 1,00 / 1,00 | 0,969 / 0,996 / 0,989 | 0,972 / 0,978 / 0,994 |
| beceri medyan p / p>0,5 olan | 0,955 / 36 | 0,97 / 36 | 0,91 / 36 | 0,915 / 36 |
| uzunluk %70-110 bandında (medyan oran) | 15/36 (0,65) | **19/36 (0,70)** | 3/36 (0,46) | 1/36 (0,44) |
| paragraf boyu CV (insan 0,41) | 0,15 | **0,36** | 0,28 | 0,37 |
| b: [0,40; 0,60] bandında (8 ölçüm) | 3/8 | 4/8 | 0/8 | 1/8 |
| cümle ortalaması (insan 18,5) / sapma (8,8) | 15,3 / 7,9 | 16,5 / 8,2 | 10,4 / 4,5 | 10,1 / 4,4 |
| tr-scan medyan; ≤ 80 olan | 100; 0/36 | 100; 2/36 | 94; 0/36 | 94; 1/36 |
| brifte olmayan rakam / bozuk ad / yeni ad | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 1 (du20 "Yükseksekokulu") |

Set A'da aynı yönde: taban 0,999; çıpalı (`--tur`) 1,000; paragraf-istemli 0,999.

**Okuma.**
- a2 **iki yönde de oynamadı**: 0,999 → 1,000. 36 beceri metninin 36'sı her koşulda p > 0,5; insanın 19/69'u da
  p > 0,5 (kurum duyuruları). Hakem hâlâ "düzenli, tekrarlı, her bilgiyi okura yönergeyle bitiren" metni tanıyor.
- İstem değişikliği **yapısal izi** yer değiştirdi: paragraf boyu CV 0,15 → 0,36 (insan 0,41), uzunluk bandı 15 → 19/36.
- **Düzelt adımı iyi de yapıyor kötü de.** Dolgu ve yinelemeyi siliyor, hakem medyanı 0,955 → 0,91 ve AUC 0,999 → 0,985'e
  iniyor (GA'lar birbirine yakın: yeni insan AUC'sinin üst sınırı 0,998; zayıf bir iniş). Ama metni kısaltıyor (uzunluk 0,65 → 0,46 oran) ve
  cümle ortalamasını 15 → 10'a, sapmayı 8 → 4,5'e düşürüyor: ritim ölçümlerinin hepsi bandın dışına çıkıyor. v1.1
  Düzelt talimatı bunu düzeltmedi (4,4 vs 4,5).

## 3. Dış dedektörler (hesapsız, ücretsiz, Türkçe)

Hangi dedektör denendi, nasıl:

| dedektör | erişim | sonuç |
|---|---|---|
| ads2009/turkish-ai-text-detector-berturk-v10 (Hugging Face, Türkçe ince ayarlı BERT; belgesi yok, 167 indirme) | yerel, GPU | **çalışıyor ama zayıf**: kullanıldı (d1) |
| bibbbu/multilingual-ai-human-detector_xlm-roberta-base (HF, en/zh/vi) | yerel | **işe yaramaz**: her metne 1,00 (Türkçede doymuş), AUC 0,48-0,60; dışarıda bırakıldı |
| Binoculars tarzı (Qwen2.5-3B / -Instruct, sıfır-atış) | yerel | **ters çalışıyor**: insan metni daha "yapay" görünüyor, AUC 0,22-0,43 |
| Fast-DetectGPT analitik (aynı Qwen çifti) | yerel | **ayırmıyor**: AUC 0,37-0,54 |
| ZeroGPT (zerogpt.com, web, hesapsız; Playwright) | web | **ayırmıyor ve engelledi**: AUC 0,42-0,51; ~27 istekten sonra sonuç vermeyi bıraktı, bırakıldı (CAPTCHA/aşma denenmedi) |
| GPTZero (gptzero.me) | web | "yalnız İngilizce"; Scan tıklanınca sonuç gelmedi, bırakıldı |
| Sapling (sapling.ai) | web | girdi alanı otomatikleştirilemedi, bırakıldı |

Metin başına skor: `dedektor.py` ve `dedektor-zerogpt.mjs` çıktıları git dışı (scratch); ölçüm kümesi insan 24 (y-/y2- havuzundan
sabit tohumla, blog 12 / duyuru 12) ve her beceri grubunun 36 metni (ZeroGPT için 15-36).

AUC (beceri > insan) ve beceri medyan skoru; insan medyanı d1 0,838, bino −1,139, fdg −0,546, ZeroGPT 0,646:

| dedektör | Set A taban | Set B taban | Set B son | Set B taban+Düzelt | Set B son+Düzelt |
|---|---|---|---|---|---|
| d1 BERTurk | 0,866 (0,981) | 0,850 (0,965) | 0,878 (0,952) | 0,931 (0,996) | 0,940 (0,998) |
| Binoculars (−skor) | 0,289 | 0,376 | 0,402 | 0,370 | 0,344 |
| Fast-DetectGPT | 0,527 | 0,530 | 0,538 | 0,537 | 0,523 |
| ZeroGPT | 0,420 (0,569) | 0,508 (0,807; n=15) | ölçülmedi (engel) | 0,255 (n=4) | ölçülmedi |

**Okuma.** Anlamlı iniş yok. Tek işlev gören dedektör (d1) son istemde ve özellikle Düzelt sonrası **daha çok** "yapay"
diyor (0,85 → 0,94), yani Düzelt'in kısa, kuru çıktısı ona daha makine gibi geliyor. Bino/fdg/ZeroGPT zaten insan ile
beceriyi ayıramıyor (ters ya da şans düzeyi); bunların önce/sonra farkı bilgi taşımıyor. Bulgu: Türkçede hesapsız ve
tekrarlanabilir güvenilir dedektör yok; saklı hakem tek ciddi ölçü olarak kalıyor.

## 4. Denenen değişiklikler ve etkisi

Her satır Set A'da (36 bağımsız + 36 türetilmiş) önce/sonra ölçüldü; kabul edilenler Set B'de yeniden doğrulandı.

| # | değişiklik | commit | etki | karar |
|---|---|---|---|---|
| 1 | tr-scan `kendini-tanitma` (kurucu kuralı): "Ben Ulaş Saraç'ım", "Adım X", paragraf başı "Ben X olarak", "Ben bir …cıyım"; SKILL.md Düzelt maddesi | 82ed3c9 | İnsan derleminde 0/131, beceri çıktılarında 0/108 bulgu (yanlış pozitif yok); skoru etkilemez (ağırlık 0). 2 yeni test, 148 yeşil | **kabul** |
| 2 | Sahadan kural: Düzelt'te yumuşatma ekleme, sıra/özne düşürme, bağlaçla anlam kaydırma, aynı kalıbı tekrar (blog hattı) | 93a8774 | Set A: a2'ye etkisi yok; ölçülebilir iz bırakmadı | **kabul** (saha kanıtlı, zararsız) |
| 3 | Düzelt'te zorunlu yapısal müdahale (paragraf boyu, açılış, kapanış, sonuçla başla) | 93a8774 | Ölçüm sarmalayıcısındaki "bölüm sayısını koru" kısıtı müdahaleyi engellemişti (model "dört paragraflık yapı korundu" yazdı); kısıt kaldırıldıktan sonra Set B'de Düzelt paragraf CV'yi 0,15 → 0,28-0,37 yaptı (ama v1.0 Düzelt de 0,28) | **kabul**, katkısı ayrıştırılamadı |
| 4 | Düzelt'te cümle boyu dağılımını açma (tr-scan `dar-sapma`/`kisa-cumle` bilgisini görev say) | 93a8774 | Set A (kısıtlı sarmalayıcı): cümle sapması 6,19 → 6,90, uzun cümle oranı 0,08 → 0,11, b 2/8 → 3/8. **Set B'de (kısıt kalktıktan sonra) tekrarlanmadı:** 4,5 → 4,4 | **belirsiz**, kalıyor ama etkisi doğrulanmadı |
| 5 | tr-scan `paragraf-esit` bilgisi (paragraf boyu CV < 0,25): insan 12/127 (%9), taslak %83-86 | 4f2f125 | Ölçüt: insanla taslağı ayıran en güçlü yapısal iz (AUC 0,06-0,10). Skoru etkilemez | **kabul** |
| 6 | Taslak istemi: paragraf boyu çeşitliliği (en az bir tek cümlelik, bir 5+ cümlelik paragraf; art arda eşit boy yok) | f428b17 | Set A: paragraf CV 0,15 → 0,34 (AUC 0,06 → 0,29); uzunluk 14 → 18/36; a2 0,999 (değişmedi). Set B: 0,15 → 0,36, 15 → 19/36, a2 1,000 | **kabul** (iz kayması gerçek, a2 yok) |
| 7 | Taslak istemi: açılım yönergesini (okur ne yapmalı) azalt, "Görüş:" maddesini olguya bağla, temkin kalıplarını azalt (hakem gerekçelerinden: "her bilgiyi okura yönergeyle bitiriyor") | geri alındı | a2 0,998 (değişmedi), türetilmiş 0,848 → 0,871 (kötü), uzunluk 14 → 11/36 | **geri alındı** |
| 8 | Çıpalı üretim (`--tur blog/site`, genel çıpa) | kod değişikliği yok | a2 1,000 (değişmedi), uzunluk 14 → 17/36 (0,59 → 0,67), paragraf CV değişmedi | **bilgi**: çıpa a2'yi düşürmüyor; uzunluğa küçük katkı |

## 5. Bulgular (v1.0'dan farklı olarak yeni)

1. **gpt-6.1-sol blogda olguları sıkıştırıyor.** Brifte 20-22 olgu maddesi olduğu hâlde metin hedefin %26-53'ünde kalıyor
   (bl02: 21 olgu, 141 kelime; hedef 540-630). Sebep: model "metne yalnız bunlar girer" kuralına uyup olguyu tek cümleyle
   söylüyor ve açmıyor; blog brifindeki olgu maddeleri atomik ve konu dışı malzeme (gözlem, örnek, kişisel anlatım) yok.
   Blog uzunluk bandı 0/12 (taban), 1/12 (çıpalı). Kurumsal metinde bant 10/12.
2. **Hakem gerekçeleri (gpt-6-sol döngü hakemi, 36 taban metin, p 0,68-0,99).** Üç tekrar eden iz: (a) aynı bilgiyi
   başka sözle yeniden açıklama (en yaygın; duyuru ve kurumsalda), (b) her bilgiyi okura "ne yapmalı" yönergesiyle
   bitirme ("… planlamalısınız", "… kontrol etmelisiniz": brif şablonundaki "Ne yapması gerekir" açılımının
   doğrudan yan ürünü), (c) blogda sıralı, kronolojik, şablon akış ve sonradan eklenmiş gibi duran kişisel yorum.
   Kural (b)'yi istemle azaltmak (deneme 7) işe yaramadı; kaynak brif şablonu, istem değil.
3. **tr-scan gpt-6.1-sol'u hiç görmüyor.** Taslak tr-scan medyanı 100, ≤ 80 olan 0/36 (beceri puanı insandan yüksek,
   AUC(insan > beceri) 0,13). v1.0'daki "sınama yarısında insan ≤ 80 = 2/31" ölçüsü artık beceriyi yakalama kanıtı
   sayılamaz: tarayıcı yalnız eski (gpt-5.6/4o) izlerini ölçüyor. Yeni insan + eski insan 131 metinde ≤ 80: 16 (%12).
4. **Düzelt'in iki yüzü**: dolgu siliyor (iyi, hakem medyanı −0,05), kısaltıp cümleleri bölüyor (kötü, ritim
   ölçümleri çöküyor). Düzelt talimatındaki "ve yoğunsa ulaçla bağla ya da böl", "yinelemeyi sil" ve silme testi
   birlikte modelde kısaltma baskısı yaratıyor. Çözüm talimatla değil, kodla olmalı (Düzelt sonrası tr-scan
   karşılaştırması ve ritmin düştüğü metni geri alan bir kapı); bu turda yazılmadı.
5. **Sahadan (lovefengis günlük blog hattı).** Hattın kayıtları yalnız Vercel çalışma günlüğünde (`blog_gunluk` JSON):
   adım adı ve geçti/geçmedi; Düzelt'in `degisenler` notu ve kapı bulgusunun metni hiçbir yere yazılmıyor
   (depoda, `content/` ya da `lfos/pazarlama/` altında **bulunamadı**). Örneklenen 7 gün (2., 4., 6., 9., 12., 15., 18.): ilk
   Düzelt'te kapı takılması 3/7 (`yapi` 2, `baglanti` 1), ikinci Düzelt'te üçü de geçti, yayınlanmayan gün 0/7;
   iz skoru günlükte yalnız 92 görüldü (18. gün). Tekrar eden takılmalar blog yapısına özgü (soru başlığı, bağlantı kuralı)
   ve `DUZELT_SISTEM`'de zaten kural; genel beceriye yalnız dört evrensel hata alındı (tablo, #2). Kaynaklar:
   `lovefengis/src/lib/blog-hat/hat.mjs` (DUZELT_SISTEM), `lfos/pazarlama/blog-v1-fark-2026-09-27.md` (yumuşatma ekleme,
   sıra düşürme, bağlaçla anlam kaydırma, özne belirsizleşmesi).

## 6. Durma ölçütü (v1.0'dan aynen)

İki ardışık turda a2 AUC, b bandı, tr-scan ve dış dedektör skorlarından hiçbiri anlamlı iyileşmedi (a2 0,999 → 1,000;
b 3/8 → 4/8 yalnız taslakta ve Düzelt sonrası 0-1/8; tr-scan taslağı hiç görmüyor; d1 kötüleşti). **Dur.** İstem ve
Düzelt talimatı katmanı a2'yi oynatamıyor. Sonraki kaldıraçlar v1.0'da yazılanla aynı: gerçek malzemeli brif
(blog), brif şablonu ("Ne yapması gerekir" açılımını azaltma, ama olguyu açmaya devam), Düzelt'te kod kapısı.

## 7. Harcama ve sınırlar

- **OpenAI (tahmin; gerçek fatura ölçülemedi, kullanım ekranına erişim yok):** üretim 324 metin (ölçülen ortalama 2.395
  girdi / 1.451 çıktı token), Düzelt 360 çağrı (4,49 M girdi / 0,37 M çıktı token, sayaç `uyg.json`), hakem ~480 çağrı,
  olgu/açılım/gerekçe ~110 çağrı. gpt-6.1-sol birim fiyatı 2/10 $ (1M, lovefengis `hermes/config.yaml`, 2026-09-29),
  önbellek indirimi olmadan **üst sınır ≈ 20 $** (Düzelt 12,7 + üretim 6,3 + hakem ve olgu ≈ 1,5); talimatın 11 bin
  tokenlık ön eki önbelleğe giriyorsa ≈ 11 $. **15 $ bütçesinin aşılmış olması mümkün** (üst sınır senaryosu); OpenAI
  kullanım sayfasından doğrulanmalı. gpt-6-astra ve gpt-6-sol fiyatı bilinmiyor (hakem payı küçük).
- **Süre:** ~2 saat duvar saati. 3 iyileştirme turu: (1) kural + istem, (2) paragraf boyu + Düzelt ablasyonu, (3) taze set.
- **Sınırlar:** Taban ve son yalnız bir üretici (gpt-6.1-sol) ve bir hakemle; hakem OpenAI ailesinden. Düzelt ölçümü
  gpt-6.1-sol ile yapıldı, Claude'un Düzelt'i değil (Claude'a kredi yok; talimat aynı). Düzelt ablasyonunda d1/d2/d3 üç
  değişiklik kümülatif, ayrı ayrı ayrıştırılamadı; d1 ilk koşuda sarmalayıcıdaki "bölüm sayısını koru" kısıtıyla
  engellendi (Set A d0-d3 bu kısıtla, Set B kısıtsız). İnsan havuzunda 2026 kurum duyurularının bir kısmı YZ destekli olabilir;
  TÜBİTAK/Boğaziçi/Hacettepe sayfalarında kesin yayın tarihi çıkarılamadı. Kurumsal insan metni 6'da kaldı (hedef 12).
  ZeroGPT sonuç vermeyi kesti, Set B son koşulu ölçülmedi. "Ölçülmedi" yazılanlar ölçülmedi.

## Yeniden üretme

```bash
# lovefengis klasöründen; TW=C:/Users/pc/Documents/turkish-writer; K=$TW/tests/kalibrasyon
node $K/kalibre-tekli.mjs olgu    --dizin derlem-tekli-b --konular <konular-b.json>
node $K/kalibre-tekli.mjs acilim  --surum t4c --dizin derlem-tekli-b --konular <konular-b.json>
node $K/kalibre-tekli.mjs brif    --surum t4c --dizin derlem-tekli-b --konular <konular-b.json>
TW_TASLAK=<v1.0 openai-taslak.mjs> node $K/uret-paralel.mjs $K/derlem-tekli-b/brif-t4c $K/derlem-tekli-b/beceri-taban
node $K/uret-paralel.mjs $K/derlem-tekli-b/brif-t4c $K/derlem-tekli-b/beceri-son
node $K/duzelt-olc.mjs $K/derlem-tekli-b/beceri-taban $K/derlem-tekli-b/brif-t4c <SKILL-v1.0.md> $K/derlem-tekli-b/beceri-tabanduz
node $K/duzelt-olc.mjs $K/derlem-tekli-b/beceri-son   $K/derlem-tekli-b/brif-t4c $TW/skills/turkish-writer/SKILL.md $K/derlem-tekli-b/beceri-sonduz
node $K/kalibre-tekli.mjs hakem --surum <taban|tabanduz|son|sonduz> --brif-surum t4c --dizin derlem-tekli-b --konular <konular-b.json>
node $K/olcum-auc.mjs derlem-tekli-b/beceri-taban derlem-tekli-b/beceri-son
node $K/dedektor-kur.mjs girdi.json 24 B-taban=derlem-tekli-b/beceri-taban ...   # sonra: python -I dedektor.py girdi.json cikti.json d1,bino
node $K/dedektor-ozet.mjs cikti.json insan-yeni B-taban d1,bino,fdg
```
`konular-b.json`: 36 yeni konu (blog 12: bl13-24; kurumsal 12: ku13-24; duyuru 12: du13-24), bu belgenin yanında saklanmadı
(konu listesi `derlem-tekli-b/` ile birlikte git dışı); biçim `[id, tür, hedef kelime, konu]`.
