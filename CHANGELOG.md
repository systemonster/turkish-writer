# Değişiklik günlüğü

Biçim [Keep a Changelog](https://keepachangelog.com/tr-TR/1.1.0/), sürümleme
[SemVer](https://semver.org/lang/tr/). Kural: tarayıcı skorunu ya da kural davranışını
değiştiren sürüm **minör**, bayrak/dosya biçimini kıran sürüm **majör**, yalnız düzeltme
**yama** artışıdır. `package.json` sürümü ile git etiketi aynı olur.

## [Unreleased]

### Eklendi

- **Codex arka ucu** (`scripts/codex-arka.mjs`): `openai-taslak.mjs` ve `hakem-dongusu.mjs` için `--codex` bayrağı ya da
  `TW_SAGLAYICI=codex`; istem aynen `codex exec`e (ChatGPT/Codex aboneliği, API anahtarı ve ücret yok) gider, çıktı aynı JSON
  akışından geçer, `-m` ile model seçilir. `TW_CODEX_PARALEL` (varsayılan 4), `TW_CODEX_EFFORT` (varsayılan low), `TW_CODEX_HOME`
  (sade CODEX_HOME: MCP ve bildirim yükü yok). Abonelik sınırında bekler, API'ye dönmez; kipte API anahtarı okunmaz. API yolu varsayılan
  kalır (günlük blog, ilan hattı gibi otomasyonlar). 8 yeni test (sahte codex).
- **Yönerge yığını** (`yonerge-yigini`), **cümle içi kök tekrarı** (`kok-tekrar`), **"-ken" yığını** (`ken-yigini`) bilgileri (tr-scan):
  taslaklarda sık, insan derleminde (136 metin) yanlış pozitif %5 / %6 / %8. Skoru etkilemez. Dedektörlerin cümle düzeyi çözümlemesinden çıktı.
- `tests/kalibrasyon/`: `dedektor-cumle.py` (cümle düzeyi yerel dedektör: BERTurk + Qwen3-1.7B nll/Binoculars), `dedektor-cozum.mjs`,
  `dedektor-zerogpt-cozum.mjs`. SONUC-V11.md "Dedektörler neyi yakalıyor": BERTurk dedektörü cümle uzunluğunu ölçüyor, Qwen3 insanı daha
  tahmin edilebilir buluyor, ZeroGPT resmî haber dilini işaretliyor; Türkçede güvenilir ücretsiz dedektör yok.
- **Kendini adla tanıtma** (`kendini-tanitma`, tr-scan): "Ben Ulaş Saraç'ım", "Adım X", paragraf başı "Ben X olarak …",
  "Ben bir …cıyım" açılışları (kurucu kuralı 2026-09-27). Kesme işaretli ad + ek ayrımı sayesinde insan derleminde
  (131 metin) ve beceri çıktılarında bulgu yok. Skoru etkilemez. SKILL.md 1. geçiş ve hızlı liste.
- **Paragraf boyu** (`paragraf-esit`, tr-scan bilgisi): paragraf boylarının değişim katsayısı < 0,25 (insan medyanı 0,44,
  insanın %9'u; taslakların %83-86'sı). Skoru etkilemez.
- Ölçüm araçları (`tests/kalibrasyon/`): `uret-paralel.mjs`, `duzelt-olc.mjs`, `olcum-auc.mjs`, `trscan-ozet.mjs`,
  `dedektor.py` / `dedektor-zerogpt.mjs` / `dedektor-kur.mjs` / `dedektor-ozet.mjs` (açık ve web dedektörleri);
  `kalibre-tekli.mjs` için `--dizin` ve `--konular` (taze bağımsız set). Sonuç: `tests/kalibrasyon/SONUC-V11.md`.

### Değişti (v1.1 ölçümü)

- Taslak istemi: paragraf boyu çeşitliliği kuralı (en az bir tek cümlelik, en az bir 5+ cümlelik paragraf, art arda eşit boy
  yok). Taze bağımsız sette paragraf boyu CV 0,15 → 0,36 (insan 0,41), uzunluk bandı 15 → 19/36; saklı hakem AUC
  0,999 → 1,000 (değişmedi).
- SKILL.md Düzelt: üç paragraftan uzun metinde zorunlu yapısal müdahale menüsü, cümle boyu dağılımını tr-scan bilgisine göre
  açma, sahadan dört düzeltme hatası (yumuşatma ekleme, sıra/özne düşürme, bağlaçla anlam kaydırma, aynı kalıbı tekrar),
  tarayıcı listesine paragraf boyu. Ölçüm: Düzelt adımı ritmi bozuyor (cümle ortalaması 15 → 10); v1.1 talimatı bunu
  düzeltmedi.
- Varsayılan taslak modeli gpt-6.1-sol (v1.0 ölçümleri gpt-5.6-sol ile yapılmıştı); bu modelle tr-scan taslağı ayıramıyor
  (medyan 100) ve blogda olguları sıkıştırıyor (hedefin %26-53'ü). v1.1 sonucu: a2 hedefi (≤ 0,70) yine karşılanmadı.

### Değişti (Codex ölçümü)

- SKILL.md Düzelt: "Düzelt'in sınırı: ritmi bozma" bölümü (cümle bölme yok, silme yalnız işaretli yerde, önce/sonra ölçüm). Codex, taze set:
  cümle ortalaması 9,0 → 11,0, sapma 3,2 → 5,6; saklı hakem AUC 0,98 (değişmedi). Taslak istemi paragraf kuralı taze sette doğrulandı:
  paragraf CV 0,13 → 0,36, saklı hakem AUC 0,998 → 0,998 (**a2 hedefi yine karşılanmadı**).

### Geri alındı

- İstemde yönerge cümlesini %5'e sınırlama (codex, Set A): yönerge bayrağı 24 → 7/36 ama uzunluk bandı 17 → 9/36, saklı hakem değişmedi. Brif
  şablonunda "Ne yapması gerekir" satırlarını atma: aynı sonuç.

- İstemde "okur ne yapmalı" yönergesini azaltma ve "Görüş:" maddesini olguya bağlama denemesi: a2 değişmedi, türetilmiş
  sette ve uzunlukta kötüleşti.

### Eklendi (v1.0 sonrası, 36ca5fd)

- **Paragraf sonu yinelemesi** (`scripts/yineleme.mjs`, tr-scan türü `yineleme`): paragrafın son
  cümlesi, önceki cümlelerini yeni sayı, özel ad ya da bağlantı eklemeden tekrar ediyorsa
  işaretlenir (içerik köklerinin ≥%55'i önceki cümlelerde; "Bu nedenle…", "…ayrıca
  değerlendir-" kalıbında ≥%40; en az 6 içerik kökü). Uzunluk baskısıyla yazılmış iki blog
  taslağında elle işaretlenen 17 dolgu cümlesinin 16'sını yakalar; insan derlemlerinde ölçülen
  paragrafların %1-5'inde bulgu verir. Skoru etkilemez, raporda ayrı bölüm. JSON alan kipinde
  varsayılan kapalı (`--yineleme` ile açılır).

### Değişti

- SKILL.md: tarayıcı listesine yineleme, mantık kapısına "paragraf sonu yinelemesi" maddesi;
  son okumadaki "Uzunluğu koru" maddesi "Olguyu koru, dolguyu koruma" oldu: uzunluk hedefi
  için yineleme cümlesi eklenmez, yeni olgu yoksa metin kısa kalır.

## [1.0.0] - 2026-09-26 

İlk kararlı sürüm. Kapsam ve ölçütlerin son durumu `docs/V1-OLCUTLER.md`'de; ölçümler
`tests/kalibrasyon/SONUC-NITELIKLI.md` (tur 1-4) ve `SONUC-HAKEM.md`'de. Güçlü LLM hakemi beceri
taslağını insan metninden hâlâ ayırıyor (V1 ölçütü a2 karşılanmadı); bu sürüm bunu iddia etmez.

**Kapsam dışı:** model eğitimi (ince ayar) yok. İyileştirme yalnız beceri katmanında yapılır:
istem, brif şablonu, çıpa, kural ve ölçüm.

### Eklendi

- **Yaz kipinde taslağı OpenAI yazar**: `scripts/openai-taslak.mjs` (0fd8619). Claude brifi
  kurar, taslağı OpenAI yazar, Claude Düzelt geçişlerini uygular. Varsayılan model
  `gpt-5.6-sol`; anahtar `OPENAI_API_KEY` ya da çalışılan dizindeki `.env.local`/`.env`.
- **Söz dizimi kapısı**: `scripts/soz-dizimi.mjs` (395d4ee): `liste-ve`, `ozne-virgul`,
  `eksiltili-yuklem`, `tamlama-eki`; sonradan `liste-iki` (iki ögeli bağlaçsız sıralama).
  Skoru etkilemez, raporda ayrı bölümde durur. tr-scan'e `--etiket`, `--etiket-alan`,
  `--govde-alan` bayrakları; JSON alanının türü anahtar adından çıkar.
- **Çıpa (few-shot)**: `openai-taslak.mjs --tur <site|blog|reklam|whatsapp|teklif|hukuk>`,
  `--cipa <yol>` (proje çıpası, önce girer), `--cipa-yok`. Genel çıpa `cipa/<tür>/` altında
  17 açık lisanslı insan metni (teklif boş). Çıktıda çıpadan 6+ kelimelik birebir dizi
  varsa stderr'e uyarı.
- **Özel ad sadakati** (tur 4): `openai-taslak.mjs` ve `hakem-dongusu.mjs` çıktıdaki özel adları
  brifle karşılaştırır (`adDenetle`). Bozuk yazım ("Süyman" / brifte "Süleyman") ya da brifte
  olmayan yeni ad stderr'e `UYARI` yazar; yeni `--katı` (`--kati`) bayrağıyla çıkış kodu **4**
  olur, taslak yine yazılır. Hakem döngüsünde kapı hatası (1) önce gelir; kayda `ad` alanı girer.
- **Olgu açılımı** (tur 4): brifte olgunun altındaki girintili alt maddeler ("Okur için anlamı",
  "Nasıl işler", "Ne yapması gerekir") kurum ve duyuru metninde olguyu açmak için kullanılır.
  `brifOlcu` alt maddeleri olgu saymaz, `acilim` alanında ayrı sayar.
- **"Brifte olgu az" uyarısı** (tur 3): metin hedef aralığın alt ucunun %70'inin altında kalırsa
  stderr'e yazılır (`brifOlcu`, `uzunlukUyarisi`). Betik dolguya itmemek için yeniden denemez.
- **Hakem döngüsü, deneysel**: `scripts/hakem-dongusu.mjs` (taslak → hakem → işaretli cümleleri
  yeniden yazma, en çok 3 tur, olgu bozan tur atılır). Varsayılan yol değildir: ölçümde kendi
  hakemine aşırı uyum gösterdi (SONUC-HAKEM.md).
- **tr-scan ritim bilgisi** (tur 3): `dar-sapma`, `kisa-cumle`, `uzun-cumle-yok`'un %8 oran eşiği
  ve `ve-yogunlugu` (`RITIM_BILGI`) raporun "bilgi" bölümünde ve JSON'da yeni `bilgi` alanında
  durur; skoru, çıkış kodunu, `bulgular` ve `butunBulgular`'ı etkilemez.
- **Ölçüm düzeni**: `docs/V1-OLCUTLER.md`; `tests/kalibrasyon/kalibre-nitelikli.mjs` (`olgu`,
  `brif`, `uret`, `olc`, `kapi`; `--surum`, `--brif-surum`); `kalibre-tekli.mjs` (bağımsız brifli
  tekli saklı hakem; `acilim` adımı, 2025+ insan havuzuyla tanıma kontrolü); `kalibre-hakem.mjs`;
  kör test set-1/set-2 ve model kör testi (`tests/kalibrasyon/kor-test/`).
- Fikstürler: `tests/ornekler/nitelikli-insan.md` (Vikipedi, CC BY-SA 3.0),
  `tests/ornekler/beceri-asiri-duzeltme.md` (eski istemin taslağı), söz dizimi fikstürü
  39 çift (`tests/ornekler/soz-dizimi.json`).

### Değişti

- **Taslak sistem istemi** (hash `23f878e8842e82b6` → `4beee8889dfb851b` → `0a1c94dc7545a80d`
  → `e09e6d4d16538e61`): "ve'yi azalt" ve kısa cümle yönlendirmesi kaldırıldı; nitelikli insan
  ritmi (ortalama 17-21 kelime, her paragrafta bir 25+ kelimelik cümle, "ve" 100 kelimede 3-5),
  dolgu yasağı (her olgu bir kez, özet ve olgusuz yorum yok, uydurma yok), uzunluk hedef aralık
  (metin olguyu açarak uzar), fazla düzgünlüğe karşı kurallar, olgu açılımı. Tur 4'te denenen
  cümle boyu yayılımı / "bir" ayarı ölçümde iyileşme getirmedi ve geri alındı.
- **tr-scan referansı** 2018 OSCAR metninden editörlü (nitelikli) Türkçeye geçti: `ve-yogunlugu`
  eşiği 2,7 → 4,5 ve sıralamanın son iki ögesini bağlayan "ve" sayılmaz (`veIz100`, 395d4ee);
  `ve-seyrek` puana döndü (100 kelimede < 1,0, ≥ 150 kelime, ağırlık 8). `uzun-cumle-yok` yalnız
  hiç 25+ kelimelik cümle yoksa puanlıdır (0.1.0 anlamı). Sınama yarısında nitelikli insanın
  2/31'i ≤ 80.
- `ozne-virgul` ve `liste-ve` susturmaları (özel ad, sayım, sıfat-fiil zinciri, hâl uyumu;
  `references/mudahale-defteri.md` kural defteri).
- SKILL.md: Yaz kipinde çıpa adımı, brifte uzunluk aralığı ve olgu açılımı, özel ad uyarısı;
  Düzelt kipinin söz dizimi kontrol listesi beş madde; hakem döngüsü deneysel.

### Geriye uyum

- `openai-taslak.mjs`: yeni bayrak `--katı`; bayraksız davranış ve çıkış kodları aynı (ad uyarısı
  yalnız stderr'e yazılır). `bayraklariAyristir` sonucuna `kati` alanı eklendi. `brifOlcu`
  girintili satırları artık olgu saymaz.
- tr-scan JSON çıktısında yeni `bilgi` alanı var. 0.1.0'a göre skorlar: 2018 OSCAR/gpt-4o
  ayrımı korunur (sınama AUC 0,91); `ve-seyrek` 100 kelimede 1'in altında çıkar.
- Eski ölçüm belgelerindeki bantlar (SONUC.md, SONUC-SITE.md: ≤ 65 güçlü iz, 66-80 gri bölge)
  0.1.0 eşiklerine aittir; skor kayıtları yeniden taranmadan karşılaştırılmaz.
- lovefengis site kapısı (`scripts/tr-scan-site.mjs`) 26/26 dosyada 100/0.

## [0.1.0] - 2026-09-23

### Eklendi

- İlk sürüm (2c2df14): SKILL.md (Yaz, Düzelt, Denetle kipleri), `tr-scan.mjs` tarayıcısı
  (2018 OSCAR insan metni ile gpt-4o metnine göre kalibre), TDK yazım denetimleri, eş
  dizim sözlüğü, başvuru belgeleri.
