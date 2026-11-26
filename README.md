<p align="center"><img src="assets/logo.svg" width="128" alt="turkish-writer: güneş ve eski tip mikrofon"></p>

# turkish-writer

Bu beceriyi İzmir'de bir yazılım stüdyosu olan [lovefengis](https://lovefengis.com/?utm_source=github&utm_medium=readme&utm_campaign=turkish-writer) geliştirdi ve açık kaynak yaptı.

Roman, öykü, kitap, deneme, şiir, diyalog, akademik ve kurumsal metin, blog, rehber ve diğer Türkçe metin türleri için bir yazarlık ve editörlük Agent Skill'i. Metni okurun ihtiyacına, türüne ve yazarın sesine göre düzenler; doğal Türkiye Türkçesi, anlam sadakati, düşünce akışı ve yazım üzerinde çalışır.

**V2 önizleme / geliştirme adayı:** Bu dal herkesin inceleyebileceği V2 adayını içerir. Kararlı 1.1.0 sürümü `master` dalında kalır; final V2 henüz doğrulanmadı.

V2 geliştirme dalında editör, çalıştığı ajanın kendisidir. Ayrı bir API, model, sunucu veya çalışma zamanı zorunlu değildir. Amaç bir sınıflandırıcıdan geçmek değil, gerçek okur için daha iyi Türkçe yazmaktır. Editoryal üstünlük henüz bağımsız insan değerlendirmesiyle doğrulanmış değildir.

## Ne yapar

Üç kipi var:

- **Yaz:** özgün kurmaca, kurmaca dışı metin veya kullanıcının istediği başka bir türde yeni taslak.
- **Düzelt:** verilen metni doğallaştırır, TDK hatalarını giderir, anlamı ve olguları korur.
- **Denetle:** metni değiştirmeden somut dil ve anlatım sorunlarını, gerekçelerini ve düzeltme önerilerini gösterir. Yazarlık hakkında hüküm vermez.

V2 akışı: kısa brif, tür ve ses, taslak, editör okuması, isteğe bağlı araçlar ve son kontrol.
Ayrıntı: [`skills/turkish-writer/SKILL.md`](skills/turkish-writer/SKILL.md).

## Kurulum

Kararlı V1.1.0 dalını Claude Code'da kişisel beceri olarak kurmak için (V2 önizlemesinden ayrı):

```bash
git clone https://github.com/systemonster/turkish-writer.git
mkdir -p ~/.claude/skills
cp -r turkish-writer/skills/turkish-writer ~/.claude/skills/
```

Ya da yalnız bir projede kullanmak için `.claude/skills/` altına kopyalayın. Beceri
[Agent Skills](https://agentskills.io) biçimindedir; bu biçimi okuyan başka ajanlarda da
çalışır.

### V2 geliştirme dalı (henüz yayımlanmadı)

Aşağıdaki kurulum yalnız geliştirme adayını ayrı bir proje dizininde denemek içindir:

```bash
git clone --branch native-turkish-editor-v2 --single-branch https://github.com/systemonster/turkish-writer.git turkish-writer-v2
cd turkish-writer-v2
mkdir -p .claude/skills
cp -r skills/turkish-writer .claude/skills/
```

Mevcut bir kurulumu korumak istiyorsanız ayrı bir deneme ortamı kullanın.

V2'nin varsayılanı model bağımsız editoryal filtredir. Var olan metni veya yeni üretilen taslağı çalıştığı ajanla düzeltir; zorunlu API, yerel model veya çalışma zamanı yoktur. OpenAI API ve Codex taslak yolları isteğe bağlıdır. Tek yazım motoru [yazım-motoru.md](skills/turkish-writer/references/yazim-motoru.md) içinde bulunur. Sabit cümle/paragraf kotaları ve bağlamdan bağımsız sözcük yasakları yerine okur, amaç, tür, doğal söz dizimi ve olgu sadakati belirleyicidir. Eski ölçümler V1.1'e aittir; V2 için ilk geliştirme deneyleri çalıştırılmıştır, ancak bağımsız editör doğrulaması tamamlanmamıştır. [Doğrulama planı](docs/V2-DOGRULAMA.md).

```bash
node skills/turkish-writer/scripts/openai-taslak.mjs brif.md --tur site --out taslak.md
node skills/turkish-writer/scripts/openai-taslak.mjs brif.md --tur eposta --codex --out taslak.md
```

İsteğe bağlı [yerleşik Unicode denetimi ve kontrollü biçim düzeltmesi](skills/turkish-writer/references/unicode-denetimi.md), Guillaume Meyer ve katkıcılarının MIT lisanslı watermarks-remover bileşenini kullanır. Varsayılan denetim salt okunurdur. `--temizle --out` seçeneği kodlama ve satır sonu kusurlarını yeni dosyada düzeltir; editörün tek tek onayladığı olağan yapıştırma kusurları da düzeltilebilir. Kaynak, telif, atıf ve anlamlı Unicode korunur; bu bir yapay zekâ filigranı veya telif hakkı kaldırma özelliği değildir.

```bash
python3 skills/turkish-writer/scripts/unicode-denetle.py metin.txt
python3 skills/turkish-writer/scripts/unicode-denetle.py metin.txt --temizle --out duzeltilmis.txt
```

İsteğe bağlı, resmî TDK dizin denetimi için bir kez:

```bash
node ~/.claude/skills/turkish-writer/scripts/tdk-dizin-derle.mjs
```

Bu komut TDK Yazım Kılavuzu dizinini TDK'nın sitesinden indirir ve tarayıcının
kullanacağı sözlüğü **yalnız sizin makinenizde** oluşturur. TDK'nın verisi bu depoda
dağıtılmaz.

İsteğe bağlı, "Türk böyle söyler mi?" eş dizim denetimi için (uzun sürer, ~1,2 GB indirir):

```bash
node ~/.claude/skills/turkish-writer/scripts/esdizim-derle.mjs
```

LLM öncesi 142 milyon kelimelik Türkçe web metninden (OSCAR 2019) isim + fiil
çiftlerini sayar. Sonra "karar yaptık" yazıldığında "Türkçede 'karar' en çok şu
fiillerle geçer: vermek (%71), almak (%23)" önerisi gelir. Ayrıntı:
[`tests/kalibrasyon/SONUC-ESDIZIM.md`](tests/kalibrasyon/SONUC-ESDIZIM.md).

## Tarayıcı

Beceri, bağımlılıksız bir Node betiğiyle gelir (Node 18+):

```bash
node skills/turkish-writer/scripts/tr-scan.mjs metin.md
node skills/turkish-writer/scripts/tr-scan.mjs metin.md --json
cat metin.txt | node skills/turkish-writer/scripts/tr-scan.mjs -
node skills/turkish-writer/scripts/tr-scan.mjs icerik.json   # JSON: her metin alanı yoluyla ayrı
```

Çıktı üç bölümdür: **iz skoru** (0-100, bantlı), skoru etkilemeyen **üslup notları** ve
**TDK hataları** (birleşik/ayrı yazım, düzeltme işareti, kesme, "mi"/"ki", ses uyumu,
sık yanlışlar, eş dizim). Skoru etkilemeyen iki bölüm daha vardır: **söz dizimi kapısı**
(İngilizce iskeletin Türkçeye sızdığı dört yer: bağlaçsız biten sıralama, kısa cümlede özneden
sonra virgül, gövde metninde eksiltili yüklem, iyelik eki düşmüş tamlama) ve **ritim bilgisi**
(cümle boyu sapması, kısa cümle, "ve" yoğunluğu; JSON'da `bilgi` alanı).

## Blog editörlüğü ve isteğe bağlı yerel araçlar

[Filtre kararları](skills/turkish-writer/references/filtre-kararlari.md) ve [model bağımsız filtre değerlendirme planı](docs/FILTRE-DEGERLENDIRME.md), iyi cümleyi koruma ve farklı ajanlarda çalışabilirlik ölçütlerini tanımlar.

[Blog editörü kılavuzu](skills/turkish-writer/references/blog-editoru.md) araştırmayı, editoryal savı, kaynak sadakatini ve seri yayın tutarlılığını ele alır. [Dil araçları](skills/turkish-writer/references/dil-araclari.md) Zemberek ve VNLP adapterlerini, ayrıca loopback adresinde çalışan yerel modelden editör önerisi alma komutunu açıklar. [Kaynak incelemesi ve blog doğrulama planı](docs/BLOG-EDITORU-ARASTIRMA.md) geliştirme dalına aittir; ilk canlı model deneyleri Corpus Lab'da kayıtlıdır.

## Edebî Türkçe ve uzun eserler

[Türkçe kullanım atlası](skills/turkish-writer/references/turkce-kullanim-atlasi.md) ifade, kip, odak ve anlam farklarını; [uzun anlatı ve kitap yazarlığı](skills/turkish-writer/references/uzun-anlati.md) kurmaca, diyalog, anlatıcı, bölüm sürekliliği, anı ve kurmaca dışı eserlerin çalışma biçimini ele alır. Bu kılavuzlar geliştirme adayına dahildir; roman veya kitap ölçeğinde bağımsız editoryal kalite doğrulaması henüz yapılmamıştır.

## Corpus Lab (geliştirici araştırması)

[Corpus Lab](corpus-lab/README.md) skill'in veri temelli geliştirme hattıdır. İlk BOUN eğitim pilotunda 7.803 işaretlenmiş cümle incelendi; [istatistikler](corpus-lab/results/boun-train-v1.json) ve [Türkçe derlem notları](skills/turkish-writer/references/derlem-bulgulari.md) ayrı CC BY-SA 4.0 lisansıyla sunuluyor. İlk bir milyon satırlık üst veri pilotunun ardından FineWeb'in sabit Türkçe veri kümesindeki 203 parçanın tümü denetlendi: 63.260.614 satır, filtreleri karşılayan 42.831.847 metinde önceden belirlenmiş yüzey işaretlerinin toplu sayımı ([tam kapsam özeti](corpus-lab/results/fineweb-text-000-202-v3-summary.json)). Bu sayılar benzersiz makale, insan yazarlığı, belge lisansı veya editoryal kalite kanıtı değildir. Daron Yöndem'in tek yazarlı arşivinde 1.035 uygun düzyazı dosyası ve 326.604 sözcük, SUDO Portal'da 103 yazı incelendi ([tam derlem özeti](corpus-lab/results/full-pass-licensed-v2-summary.json), [SUDO özeti](corpus-lab/results/sudo-full-text-v3-summary.json)). 2.643 tarihsel Vikipedi revizyonundan 50 düzenleme adayı seçildi. İlk model deneyleri, sentetik geliştirme vakaları ve sonuçları [Corpus Lab](corpus-lab/README.md) altında kayıtlıdır; V2 henüz yayına hazır ilan edilmemiştir. Son kullanıcı hiçbir derlem indirmek zorunda değildir.

**26 Kasım 2026 yayın adayı:** [sabit skill](https://github.com/systemonster/turkish-writer/commit/c99c4b4763204f0aac68194bf1dfea8959a3771a); son [V31 geliştirme karşılaştırmasında](corpus-lab/results/clean-prose-v31-terminal.json) Qwen 8/8, Mistral 4/8 tamamlanmış çıktı verdi. Bu sayılar protokol kapsamıdır, kalite puanı değildir. İki ailede tekrarlanabilir iyileşme gösterilmedi; bağımsız kaynak seçimi ve insan editör incelemesi bekleniyor.

Derlemden çıkarılan kararlar [bağlamlı Türkçe](skills/turkish-writer/references/baglamli-turkce.md) kılavuzunda kullanılabilir hale getirildi. İlk yakın okuma pilotunda 503 tarihsel blog, 20 SUDO yazısı ve BOUN eğitim bölümü üzerinden 126 seçilmiş bağlam incelendi; bunlar insan onaylı düzeltme çifti değildir. [Yöntem ve kanıt kimlikleri](corpus-lab/results/context-evidence-v1-summary.json). [Bağımsız editör değerlendirme protokolü](corpus-lab/HOLDOUT.md) yayın kapısı olarak duruyor.

## V1.1 ölçümleri (tarihsel; V2 sonucu değildir)

Tarayıcının ağırlıkları tahminle değil ölçümle seçildi. LLM öncesi yazılmış 180 Türkçe
metin (haber, forum, şirket sitesi, blog) aynı konularda üretilmiş 180 GPT metniyle
karşılaştırıldı:

| derlem | ayırma gücü | 80 eşiğinde GPT metninin yakalanma oranı | insan metninin yanlış işaretlenme oranı |
|---|---|---|---|
| haber + forum | 0,94 | %75 | %8 |
| site + blog | 0,85 | %79 | %22 |

En güçlü ayırıcı, cümle uzunluklarının birbirine benzemesi çıktı. GPT'ye "doğal yaz"
demek bu izi gidermiyor. Sık sanılan bazı izler (ulaç azlığı, `-maktadır`, edilgen,
"bir" yoğunluğu) bağımsız derlemde ayırmadı. Bunlar skordan çıkarıldı, üslup notu
olarak kaldı. Ayrıntılar: [`tests/kalibrasyon/SONUC.md`](tests/kalibrasyon/SONUC.md),
[`tests/kalibrasyon/SONUC-SITE.md`](tests/kalibrasyon/SONUC-SITE.md).

2026-09'da referans, editörden geçmiş Türkçeye (62 metinlik nitelikli derlem: dergi, kurum
sitesi, kurum duyurusu) taşındı. Taslak betiğinin çıktısı bu derlemle ve bağımsız brifle
yazılmış 36 metinle ölçüldü (`tests/kalibrasyon/SONUC-NITELIKLI.md`, `docs/V1-OLCUTLER.md`):

| ölçüm | sonuç |
|---|---|
| brifte olmayan rakam | 4 ölçüm turunda 0 |
| özel ad hatası | otomatik denetim; son turun 108 taslağında bozuk ad 0 |
| uzunluk (hedefin %70-110'u) | olgusu yeterli brifte 33/36; kısa olgulu kurum ve duyuru brifinde 14/24 |
| tr-scan, nitelikli insanı ≤ 80'e düşürme (yanlış pozitif) | 2/31 (%6,5) |
| cümle ritmi, 8 ölçümde insan dağılımına yakınlık (AUC 0,35-0,65) | 5/8; cümle boyu çeşitliliği ve "bir" sıklığı hâlâ insandan az |
| güçlü LLM hakemi (tek metin, "insan mı yapay mı") | **ayırıyor**: 2025+ yayımlanmış insan metinlerine karşı AUC 0,87-1,00 |

Son satır açık bir sınırdır: beceri taslağı hedef okurun gözünde iyi durabilir (kurucunun kör
testinde 13 çiftin 9'unda beceri metni insan sanıldı; tek okur, küçük örneklem), ama güçlü bir
dil modeli onu hâlâ tanıyor.

**Sınırlar.**
- Ölçümler yalnız OpenAI modelleriyle yapıldı.
- İki derlem de ayar için kullanıldı; üçüncü bir bağımsız derlemde sonuç daha düşük
  çıkabilir.
- İnsan metinlerinin beşte biri de gri bölgeye düşebiliyor. Skor bir işarettir, hüküm değil.
- Hiçbir yöntem "hiçbir denetleyici anlayamaz" garantisi vermez. Bu beceri de vermiyor.
  V2 hedefi, iyi Türkçe yazmak ve metni gerçek okur için daha kullanışlı kılmaktır.

## Neyi yapmaz

- Denetleyiciyi kandırmak için yazım hatası, görünmez karakter, harf benzeri Kiril
  karakteri ya da rastgele eş anlamlı değiştirme kullanmaz.
- Uydurma deneyim, müşteri, sayı ya da alıntı eklemez.
- Hukuki hüküm oluşturmaz; gerekli açıklama ve atıfları kaldırmaz. Hukuki metinde yalnız yazım incelemesi veya ayrı açıklama yapar.

## Testler

```bash
npm test
```

## Kaynaklar ve teşekkür

Daron Yöndem'e, SUDO Portal yazarlarına, Boğaziçi Üniversitesi/TABILAB UD Turkish BOUN ekibine ve katkıcılarına, TurkishFineweb2-Cleaned veri kümesinin hazırlayıcılarına, Vikipedi/Vikikaynak katkıcılarına, İlkay Holt ve Creative Commons Türkiye'ye, Mirasium'a; ayrıca yerleşik Unicode bileşeni için Guillaume Meyer ve watermarks-remover katkıcılarına teşekkür ederiz. [Derlem kaynakları ve lisanslar](corpus-lab/LICENSE-DATA.md) ayrı kayıttadır.

Wikipedia'nın "Signs of AI writing" sayfası, blader/humanizer, no-ai-slop,
avoid-ai-writing, insanca, turkish-humanify, TDK Yazım Kılavuzu, Güncel Türkçe Sözlük,
Oxford ve Lewis Türkçe dil bilgisi kitapları ve StoryScope çalışması. Tam liste ve lisanslar:
[`skills/turkish-writer/references/kaynaklar.md`](skills/turkish-writer/references/kaynaklar.md).

## Simge

Simge, Türkçeyi en özenli konuşanlardan biri olan "Sanat Güneşi" Zeki Müren'e bir
selamdır: güneş ve eski tip bir mikrofon. Kişiyi temsil etmez, onun adına konuşmaz.

## Kim yaptı

Bu beceriyi [lovefengis](https://lovefengis.com/?utm_source=github&utm_medium=readme&utm_campaign=turkish-writer)
kendi site ve blog metinleri için yazdı, sonra açık kaynak yaptı. lovefengis İzmir'de özel
panel, entegrasyon, çok dilli site ve otomasyon işleri yapıyor. Hata ya da öneri için
[issue açabilirsiniz](https://github.com/systemonster/turkish-writer/issues).

## Lisans

MIT. watermarks-remover'ın ayrı MIT lisansı ve atfı vendor dizinindedir. İstisnalar: `references/evrensel-izler.md` içindeki Wikipedia kaynaklı bölümler CC BY-SA
4.0'dır. `skills/turkish-writer/cipa/` altındaki çıpa metinleri her dosyanın başındaki lisansla
dağıtılır (Creative Commons Türkiye metinleri CC BY 4.0, Türkçe Vikipedi metinleri CC BY-SA 4.0,
yasa metinleri ve Sabahattin Ali kamu malı). `tests/ornekler/nitelikli-insan.md` Türkçe Vikipedi
kaynaklıdır, CC BY-SA 3.0.

Derlemden türetilen ayrı lisanslı dosyalar: [veri lisansları](corpus-lab/LICENSE-DATA.md).

Sürümler [`CHANGELOG.md`](CHANGELOG.md)'de; semver kuralı orada yazılı.

---

## English

Turkish Writer is an Agent Skill for Turkish authorship and editing across genres, including novels, short stories, books, essays, poetry, dialogue, nonfiction, academic and business writing, blog posts and guides. The development candidate includes a long-form writing guide and a contextual usage atlas; literary and book-length quality has not yet been independently validated. The development branch emphasizes natural Turkish expression, meaningful editorial improvements, coherent paragraphs, factual fidelity and preservation of the author's voice. It does not attempt to establish authorship or optimize detector scores.

**Current status:** V2 is a development candidate, not a released or independently validated upgrade. Its default editorial workflow runs in the active agent; no separate model, API, cloud service or runtime is required. The optional Node scanner and local Unicode inspection provide additional evidence, not editorial verdicts. The explicit clean-copy mode repairs encoding and line-ending defects and individually confirmed ordinary paste/layout defects; original files, meaningful Unicode, attribution and provenance are preserved. No statistical watermark or copyright removal is provided. Historical V1.1 measurements do not validate V2. The [frozen candidate](https://github.com/systemonster/turkish-writer/commit/c99c4b4763204f0aac68194bf1dfea8959a3771a) awaits independent source selection and human editorial review. The [V31 development comparison](corpus-lab/results/clean-prose-v31-terminal.json) yielded 8/8 complete Qwen outputs and 4/8 complete Mistral outputs; protocol completion is not an editorial quality score, and repeatable improvement was not demonstrated.

The Turkish guide [Contextual Turkish](skills/turkish-writer/references/baglamli-turkce.md) translates observations from licensed historical prose and annotated Turkish syntax into contextual editorial decisions. See [research provenance](corpus-lab/LICENSE-DATA.md), [context evidence](corpus-lab/results/context-evidence-v1-summary.json), and the [independent evaluation protocol](corpus-lab/HOLDOUT.md). The completed [FineWeb aggregate](corpus-lab/results/fineweb-text-000-202-v3-summary.json) covered 63,260,614 rows across 203 shards, with 42,831,847 eligible texts processed for fixed descriptive cue counts; it is not proof of human authorship, document rights or editorial quality. No third-party raw research corpus or model weights are required by the skill.

### Acknowledgements / Teşekkür

We thank Daron Yöndem, the contributing SUDO Portal writers, and the UD Turkish BOUN team at Boğaziçi University/TABILAB for their licensed works. We acknowledge the TurkishFineweb2-Cleaned dataset authors, Wikipedia/Wikisource contributors, İlkay Holt and Creative Commons Türkiye, and Mirasium for the documented research use. We also acknowledge Guillaume Meyer and the contributors to watermarks-remover for the vendored MIT-licensed Unicode component used for inspection and individually confirmed layout repairs. Other project, research and language-resource attributions, including materials reviewed but not incorporated, are listed in [sources and licenses](skills/turkish-writer/references/kaynaklar.md) and [data provenance](corpus-lab/LICENSE-DATA.md). Their contributions do not imply endorsement of Turkish Writer.

Built and open-sourced by [lovefengis](https://lovefengis.com/?utm_source=github&utm_medium=readme&utm_campaign=turkish-writer), an İzmir studio.
