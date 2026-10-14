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

---

# 2. ölçüm: Codex aboneliği (API'siz), dedektörlerin çözümlemesi (2026-10-14, akşam)

Kurucu kararıyla elle yapılan ölçüm OpenAI API'siyle değil `codex exec` ile (ChatGPT/Codex aboneliği, **API harcaması 0 $**)
yapıldı. Yukarıdaki 1. ölçüm (API) olduğu gibi duruyor; bu bölüm aynı soruyu abonelik yolundan, genişletilmiş havuzla ve
taze bir sette yeniden sorar. **Sonuç aynı: saklı hakemde iniş yok.**

## 8. Düzenek (Codex)

- **Taslak modeli:** `gpt-6.1-sol` (abonelikte var), taban ve son aynı model, `model_reasoning_effort=low`.
  **Saklı hakem:** `gpt-6-astra` (abonelikte var; taslak modelinden farklı, döngüde hiç kullanılmadı), editör istemi, tek metin.
  Düzelt ölçümü de `gpt-6.1-sol` (codex). `codex exec -s read-only --ephemeral`, sade `CODEX_HOME` (yalnız auth + model satırı),
  paralel en çok 4. Codex bir ajan kabuğudur: aynı istem API'ye göre ek bir sistem istemiyle çalışır (çağrı başına ~7 bin
  token); taban ve son aynı yoldan geçtiği için karşılaştırma tutarlıdır, API ile mutlak sayılar birebir aynı değildir.
- **İnsan havuzu 74** (2025+; blog 34, duyuru 29, **kurumsal 11**: +5 TÜBİTAK 2026 sitesi sayfası; hedef 12'ye 1 eksik).
  Eski (≤ 2022) havuzun puanları API'den geldiği için bu ölçümde karıştırılmadı. İnsan hakem puanı: medyan 0,12; p > 0,5 olan 14/74.
- **Set A** (v1.0'ın 36 bağımsız briffi; tur denemeleri burada) ve **Set C = taze 36 konu** (12 blog, 12 kurumsal, 12
  duyuru; olgu ve açılım da codex ile üretildi, olgu modeli `gpt-6.1-sol`; hiç görülmemiş, son karar yalnız bunda).

## 9. Sonuç (Set C, taze, Codex)

| ölçüt | taban (v1.0 istem) | son (v1.1 istem) | taban + Düzelt v1.0 | son + Düzelt v1.1 (`dnew`) | son + Düzelt (sınırsız, `dcur`) |
|---|---|---|---|---|---|
| **a2 AUC, yeni insan 74 [%95 GA]** | 0,998 [0,994–1,00] | **0,998** [0,993–1,00] | 0,980 [0,957–0,995] | 0,983 [0,964–0,997] | 0,984 [0,963–0,996] |
| a2 blog / kurumsal / duyuru | 0,995 / 1,00 / 0,999 | 0,996 / 0,998 / 1,00 | 0,964 / 0,984 / 0,992 | 0,974 / 0,981 / 0,995 | 0,964 / 0,988 / 0,999 |
| beceri medyan p; en düşük p; p < 0,7 olan | 0,92; 0,75; 0 | 0,92; 0,75; 0 | 0,85; 0,65; 3 | 0,88; 0,70; 0 | 0,85; 0,65; 2 |
| uzunluk %70-110 bandında (medyan oran) | 0/36 (0,39) | 2/36 (0,40) | 0/36 (0,28) | 0/36 (0,30) | 0/36 (0,29) |
| paragraf boyu CV (insan 0,41) | 0,13 | **0,36** | 0,21 | 0,37 | 0,37 |
| b: 8 ölçümde [0,40; 0,60] | 3/8 | 3/8 | 0/8 | 1/8 | 0/8 |
| cümle ortalaması (insan 18,5) / sapma (8,8) | 15,3 / 8,3 | 15,5 / 8,4 | 9,0 / 3,2 | **11,0 / 5,6** | 9,4 / 4,2 |
| tr-scan medyan; ≤ 80 olan | 100; 0/36 | 100; 0/36 | 94; 4/36 | 94; 1/36 | 94; 5/36 |
| `yonerge-yigini` / `ken-yigini` / `kok-tekrar` bayrağı (insan 136 metinde 7 / 11 / 8) | 15 / 20 / 17 | 14 / 14 / 17 | 10 / 2 / 1 | 8 / 2 / 1 | 8 / 3 / 4 |

(Set A, aynı yöntem: taban 1,000, son 1,000 [0,998–1,00]; Düzelt sonrası 0,997 / 0,999; paragraf CV 0,14 → 0,34; b 4/8 → 5/8;
uzunluk 16 → 17/36.)

**Okuma.**
- **a2 yine oynamadı:** 0,998 → 0,998. Hiçbir koşulda saklı hakem beceri metinlerini yeni insanın altına indirmedi; Düzelt adımı
  (hangi talimatla olursa olsun) yalnız marjinal bir iniş veriyor (AUC 0,98, medyan p 0,92 → 0,85-0,88). Düzelt'in v1.1 sınırı
  (`dnew`) ritmi kısmen koruyor (cümle ortalaması 9,0 → 11,0; sapma 3,2 → 5,6; b 0/8 → 1/8) ama hakeme yansımıyor; hakem
  medyanı sınırsız Düzelt'ten biraz **yüksek** (0,88 vs 0,85): uzun cümle bırakınca hakem biraz daha "yapay" diyor, yani ritim ile
  hakem puanı aynı yönde hareket etmiyor.
- **İz kayması gerçek:** paragraf boyu 0,13 → 0,36, `ken-yigini` 20 → 14 (taslak). Düzelt, tr-scan raporundaki `ken`, `kok`
  ve yönerge bilgilerini büyük oranda temizliyor (ken 20 → 2, kök 17 → 1, yönerge 15 → 8-10).
- **Bütün bunlar a2'yi oynatmıyor:** hakemin gerekçelerinde adı geçen izleri (yönerge, yineleme, paragraf eşitliği) ölçülebilir
  biçimde azaltmak, saklı hakemin p'sini düşürmüyor. Hakemin sinyali bu adı konabilen izlerden başka bir şeyde.

## 10. Denenen ek değişiklikler (Codex, Set A)

| # | değişiklik | etki | karar |
|---|---|---|---|
| 9 | Taslak istemine "okura yönerge cümlesi cümlelerin en çok %5'i; art arda iki olgu aynı kalıpla bitmez; aynı kök bir cümlede iki kez geçmez" | `yonerge-yigini` bayrağı 24 → 7/36 (insan %5); **a2 1,000 (değişmedi), uzunluk bandı 17 → 9/36, metin kısaldı** | **geri alındı** |
| 10 | Brif şablonunda "Ne yapması gerekir" açılım satırlarını atmak | yönerge 24 → 17/36, `kok-tekrar` 12 → 20/36; a2 0,999; uzunluk 17 → 9/36 | **geri alındı** |
| 11 | SKILL.md Düzelt: "ritmi bozma" bölümü (cümle bölme yok, silme yalnız işaretli yerde, önce/sonra ölçüm) | Set A cümle ort. 10,3 → 11,8; Set C 9,0-9,4 → 11,0; a2 0,997 → 0,999; hakem p aynı ya da biraz yüksek | **kabul** (ritim ölçümleri, hakem nötr) |
| 12 | tr-scan `yonerge-yigini`, `kok-tekrar`, `ken-yigini` (bilgi) | İnsan 136 metinde yanlış pozitif %5 / %6 / %8 (nitelikli 62'de 6 / 4 / 4); taslak yakalama %50-67 / %30 / %70 | **kabul** |

## 11. Dedektörler neyi yakalıyor

Üç düzeyde baktım: (a) cümle düzeyi yerel modeller, (b) ZeroGPT'nin web vurguları, (c) hakem gerekçeleri. Cümle özellikleri tr-scan
benzeri ölçümlerle (kelime sayısı, virgül, "ve", rakam, özel ad, yönerge, "siz", kök tekrarı, açılış/kapanış, paragraf konumu) çıkarıldı;
araçlar `dedektor-cumle.py`, `dedektor-cozum.mjs`, `dedektor-zerogpt-cozum.mjs`. Çözümleme havuzu: insan 74 metin (2.006 cümle), beceri (Set A taban + son,
1.072 cümle).

**Dedektör grupları (aşırı uyuma karşı).**

| grup | dedektör | rol |
|---|---|---|
| **ayar** (iz çıkarmak ve kural kurmak için bakıldı) | `ads2009/turkish-ai-text-detector-berturk-v10` (d1), Qwen3-1.7B-Base/Qwen3-1.7B (nll, Binoculars tarzı oran), Qwen2.5-3B çifti (1. ölçüm), Fast-DetectGPT, ZeroGPT (web), `bibbbu` XLM-R | kural kurmada kullanıldı; "iyileşme var mı" kararına **girmez** |
| **saklı** (ayar sırasında hiç bakılmadı, yalnız son ölçümde bir kez çalıştırıldı) | `ads2009/turkish-ai-text-detector-convbert-v8-balanced` (cb8), `…-berturk-v8-balanced` (bt8) + **gpt-6-astra hakemi** | karar yalnız bunlarla; yönleri eski (≤ 2022, Set C dışı) veriyle sabitlendi (sınıf 1 = yapay, AUC 0,55-0,62) |

**Saklı dedektörler ne dedi (Set C, taze).** cb8 AUC 0,57 / 0,54 / 0,36 / 0,49 / 0,38; bt8 AUC 0,49 / 0,49 / 0,51 / 0,54 / 0,53 (taban, son,
taban+Düzelt, son+Düzelt `dnew`, `dcur`). İki dedektör de her metne ~0,997-0,999 veriyor (doymuş); ayrım gücü yok. Yani
yalnız saklı hakem anlamlı bir ölçüdür ve o iyileşme göstermiyor. Ayar grubunda d1 taslakta 0,977 → 0,987, Düzelt sonrası 0,934-0,965
(d1'in cümle boyuna bağlı olmasındandır, aşağıya bak).

**Ne yakalıyorlar (bulgular).**

1. **BERTurk dedektörü (d1) bir uzunluk dedektörüdür.** Cümle düzeyi puanıyla cümle uzunluğu arasında Spearman ρ = 0,80; virgül 0,45, "ve" 0,44,
   kök tekrarı 0,43. **Cümle boyu sabit tutulunca** insan/beceri ayrımı kayboluyor: AUC 5-11 kelimede 0,48, 12-18'de 0,50, 19-26'da 0,41,
   27+'da 0,49. Metin düzeyindeki yüksek AUC (0,85-0,98), parça ortalaması ve beceri metinlerinin biçim tekdüzeliğinden geliyor.
2. **Yerel açık model (Qwen3-1.7B) ters yönde:** insan cümleleri **daha tahmin edilebilir** (nll insan 2,00, beceri 2,15-2,17; metin düzeyinde
   AUC(−nll) 0,32-0,35, Binoculars oranı 0,39-0,47). Cümle boyu sabitken uzun cümlelerde (19+ kelime) becerinin nll'i insandan yüksek
   (AUC 0,64-0,73): beceri metni resmî, birleşik adlı, kurallı Türkçe; insan haberi (TCMB, Journo, TÜBİTAK) kalıp ve özel ad bakımından
   daha öngörülebilir. Yani "fazla tahmin edilebilir = yapay" varsayımı bu Türkçe derlemde tutmuyor; Binoculars tarzı oran hiç sinyal vermiyor (≈ 0,5).
3. **ZeroGPT cümle vurguları** (55 metin, 555 insan + 530 beceri cümlesi): insan cümlelerinin %30'u, beceri cümlelerinin %43'ü işaretli;
   metin yüzdesi insan 0,69, beceri 0,51 (ters). İnsanda işaretlenenler **özel ad yoğun** (3,3 vs 1,3), **rakamlı** (%42 vs %22), ilk cümle
   (%8 vs %1) ve uzun cümleler; yani resmî haber dili. Beceride işaretlenenler **yönerge** (%31 vs %20) ve **"siz" hitabı** (%24 vs %10) taşıyor.
   ZeroGPT yapay zekâyı değil resmî ve kalıplı kayıtı (haber/kurum) işaretliyor.
4. **Becerinin insandan gerçekten ayrıldığı cümle özellikleri** (insan 2.006 / beceri 1.072 cümle): okura yönerge ("…malısınız", "…gerekir")
   cümlelerin %21'i, insanda %0,4; "siz" hitabı %20 vs %1; cümle içi kök tekrarı 0,072 vs 0,038; virgül 0,42 vs 0,99 cümle başına;
   özel ad 0,79 vs 2,4; rakam %17 vs %27. Kelime düzeyi (1000 kelimede beceri / insan): "gerekir" 8,1 / 0,13 (62×), "önce" 3,9 / 0,56 (7×),
   "alır" 2,4 / 0,08, "dikkate" 5×, "hangi" 6×; son ekler: "-niz/-nız/-ınız" 14-18× (ikinci çoğul hitap), "-ken/-rken" 4,7-5,1× ("planlarken"),
   "-acak/-ecek" 5×. Tür karışıklığı var (insan haber/kurum, beceri hizmet sayfası); bu yüzden kurallar yalnız insan derleminde
   yanlış pozitif < %10 olanlardan alındı.
5. **Hakem gerekçeleri** (gpt-6-sol, 36 taban metin, p 0,68-0,99): "aynı bilgiyi başka sözle tekrar", "her bilgiyi okura yönergeyle bitirme" ve blogda
   "düzenli, kronolojik şablon". İlk ikisi yukarıdaki yönerge ve kök tekrarı özellikleriyle örtüşüyor; üçüncüsü paragraf eşitliğiyle (CV 0,13 vs 0,41).

**Kurala çevrilenler** (yalnız insanda yanlış pozitif < %10): `yonerge-yigini` (%5), `kok-tekrar` (%6), `ken-yigini` (%8), `paragraf-esit` (%9). Hepsi
bilgi, skora girmez. **Kurala çevrilmeyenler:** "siz" hitabı ve "-nız" ekleri (brif hitabı ve tür belirliyor; insan kurumsalında da var), özel ad ve rakam yokluğu
(brif olgusuna bağlı), nll/Binoculars (ters yönde). Bu izlerin giderilmesi saklı hakemi oynatmadı (bkz. § 9, #9-#10).

## 12. Harcama ve sınırlar (Codex turu)

- **OpenAI API harcaması bu turda 0 $.** Önceki (API) turdan kalan tahmin 11-20 $ (§ 7). Codex: ~1.100 `codex exec` çağrısı (Set A taslak
  ve Düzelt denemeleri, Set C olgu/açılım/taslak/Düzelt, hakem ~600), çağrı başına ~7-9 bin token; abonelik sınırına (429) takılma olmadı, bekleme gerekmedi.
- **Sınırlar:** (1) Hakem ve taslak aynı ailede (OpenAI), bağımsız aile (Anthropic) yok. (2) Codex ajan kabuğu ek bir sistem istemi getiriyor; mutlak puanlar API
  ölçümünden farklı (örn. taban medyan p 0,975 Set A, 0,92 Set C); karşılaştırma aynı yolda. (3) Saklı dedektörler doymuş, ayrım gücü yok; karar fiilen tek saklı
  ölçüye (hakem) dayanıyor. (4) Düzelt ölçümü gpt-6.1-sol ile, Claude'un Düzelt'i değil. (5) ZeroGPT yalnız Set A'da çalıştırıldı (kota davranışı); Set C'de çalıştırılmadı.
  (6) Kurumsal insan metni 11 (hedef 12); TÜBİTAK 2026 sitesi tek kurum, liste ve mevzuat alıntısı payı yüksek. (7) Tur denemeleri Set A'da görüldü; Set C yalnız bir kez ölçüldü.
- **Yer:** HF modelleri ve sanal ortam D:\hf altında (venv 4,6 GB, Qwen3-1.7B çifti 7,1 GB, dedektör modelleri ~1,3 GB); C:'ye indirilmiş Qwen2.5-3B çifti, XLM-R ve eski venv silindi.
  Sade CODEX_HOME (kimlik bilgisi kopyası) iş sonunda silindi.

## Durma ölçütü (ikinci kez)

Codex turunda da iki ardışık tur (paragraf kuralı tekrarı + yönerge/brif denemeleri; Düzelt sınırı) a2'yi (0,998), saklı dedektörleri (doymuş) ve
tr-scan'i (taslağı görmüyor) oynatmadı. **Dur.** Sonraki adımlar yine istem katmanının dışında: gerçek malzemeli brif (kişisel gözlem, adlandırılmış örnek),
blogda olgu sıkışması (brif şablonu), Düzelt sonrası ritmi geri alan bir **kod kapısı** (tr-scan önce/sonra karşılaştırması).
