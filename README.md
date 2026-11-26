<p align="center"><img src="assets/logo.svg" width="128" alt="turkish-writer: güneş ve eski tip mikrofon"></p>

# turkish-writer

Türkçe yazarlık ve editörlük için bir Agent Skill. Metni okurun ihtiyacına, türüne ve yazarın sesine göre düzenler; doğal Türkiye Türkçesi, anlam sadakati, düşünce akışı ve TDK yazımı üzerinde çalışır. Editör, çalıştığı ajanın kendisidir: ayrı bir API, model, sunucu veya çalışma zamanı gerekmez.

Beceri ilk olarak site ve blog metni için yazıldı. Roman, öykü, deneme, şiir ve uzun anlatı kılavuzları V2'de eklendi; bu türlerde kalite deneyseldir ve ayrıca doğrulanmalıdır.

## Durum

**`2.0.0-rc.1`, V2 ön izleme.** Varsayılan dalda, gerçek yazarlık ve editörlük işlerinde denenmek için duran teknik aday; final 2.0.0 sürümü veya GitHub Release değildir. Teknik testler geçti, ancak bağımsız insan editör değerlendirmesi henüz yapılmadı. Bu yüzden V2'nin editoryal üstünlüğü kanıtlanmış sayılmaz. Ayrıntı: [doğrulama planı](docs/V2-DOGRULAMA.md), [bağımsız editör değerlendirme protokolü](corpus-lab/HOLDOUT.md). [Önceki V1.1.0 kodu](https://github.com/systemonster/turkish-writer/tree/0d2a2c6fc1a03ac3b2eb23f61f0e1903eb5bc0ab) korunur.

## Ne yapar

Üç kipi var:

- **Yaz:** özgün kurmaca, kurmaca dışı metin veya kullanıcının istediği başka bir türde yeni taslak.
- **Düzelt / Fix (varsayılan; SKILL.md: Filtrele):** verilen metni doğallaştırır, TDK hatalarını giderir, anlamı ve olguları korur. İyi yazılmış kısımlara dokunmaz.
- **Denetle:** metni değiştirmeden somut dil ve anlatım sorunlarını, gerekçelerini ve düzeltme önerilerini gösterir. Yazarlık hakkında hüküm vermez.

Akış: kısa brif, tür ve ses, taslak, editör okuması, isteğe bağlı araçlar ve son kontrol. Sabit cümle ve paragraf kotaları ya da bağlamdan bağımsız sözcük yasakları yoktur; okur, amaç, tür, doğal söz dizimi ve olgu sadakati belirleyicidir. Tek yazım motoru [yazim-motoru.md](skills/turkish-writer/references/yazim-motoru.md) içindedir. Ayrıntı: [`skills/turkish-writer/SKILL.md`](skills/turkish-writer/SKILL.md).

Neyi yapmaz:

- Denetleyiciyi kandırmak için yazım hatası, görünmez karakter, harf benzeri Kiril karakteri ya da rastgele eş anlamlı değiştirme kullanmaz.
- Uydurma deneyim, müşteri, sayı ya da alıntı eklemez.
- Hukuki hüküm oluşturmaz; gerekli açıklama ve atıfları kaldırmaz. Hukuki metinde yalnız yazım incelemesi veya ayrı açıklama yapar.

## Kurulum

Claude Code'da kişisel beceri olarak:

```bash
git clone https://github.com/systemonster/turkish-writer.git
mkdir -p ~/.claude/skills
cp -r turkish-writer/skills/turkish-writer ~/.claude/skills/
```

Yalnız bir projede kullanmak için dizini o projenin `.claude/skills/` klasörüne kopyalayın. Orada eski bir `turkish-writer` varsa önce yedekleyin; eski ve yeni dosyaları karıştırmayın. Beceri [Agent Skills](https://agentskills.io) biçimindedir, bu biçimi okuyan başka ajanlarda da çalışır.

### İlk yazı

Ajanınıza `turkish-writer` becerisini kullanmasını söyleyin. Örneğin: “Küçük işletmelerin reklam bütçesini planlaması hakkında 600 kelimelik bir Türkçe blog yazısı hazırla. Hedef okur işletme sahibi. Kaynakla doğrulanmamış sayılar, uydurma deneyimler ve gereksiz dolgu kullanma. Teslimden önce editör okumasını yap.”

## İsteğe bağlı araçlar

Hiçbiri zorunlu değildir. Çıktıları ipucudur; yazarlık kanıtı veya otomatik değişiklik emri değildir.

**tr-scan tarayıcısı (V1.1 mirası).** Bağımlılıksız bir Node betiği (Node 18+). Geriye uyumluluk için korunur; V2'nin yazarlık ve editörlük kalitesini ölçmez.

```bash
node skills/turkish-writer/scripts/tr-scan.mjs metin.md
node skills/turkish-writer/scripts/tr-scan.mjs metin.md --json
cat metin.txt | node skills/turkish-writer/scripts/tr-scan.mjs -
node skills/turkish-writer/scripts/tr-scan.mjs icerik.json   # JSON: her metin alanı yoluyla ayrı
```

Çıktıda **iz skoru** (0-100, bantlı) ve **TDK hataları** (birleşik/ayrı yazım, düzeltme işareti, kesme, "mi"/"ki", ses uyumu, sık yanlışlar, eş dizim) bulunur. Skoru etkilemeyen üç bölüm daha vardır: **üslup notları**, **söz dizimi kapısı** (İngilizce iskeletin Türkçeye sızdığı dört yer: bağlaçsız biten sıralama, kısa cümlede özneden sonra virgül, gövde metninde eksiltili yüklem, iyelik eki düşmüş tamlama) ve **ritim bilgisi** (cümle boyu sapması, kısa cümle, "ve" yoğunluğu; JSON'da `bilgi` alanı). Eski dedektör ve müdahale kılavuzları [tarihsel arşivde](docs/archive/v1.1/README.md), testlerle kullanılan eski komutlar ise paket içindedir.

**Unicode denetimi.** [Yerleşik Unicode denetimi ve kontrollü biçim düzeltmesi](skills/turkish-writer/references/unicode-denetimi.md), Guillaume Meyer ve katkıcılarının MIT lisanslı watermarks-remover bileşenini kullanır. Varsayılan denetim salt okunurdur. `--temizle --out` seçeneği kodlama ve satır sonu kusurlarını yeni dosyada düzeltir; editörün tek tek onayladığı olağan yapıştırma kusurları da düzeltilebilir. Kaynak, telif, atıf ve anlamlı Unicode korunur. Bu bir yapay zekâ filigranı veya telif hakkı kaldırma özelliği değildir.

```bash
python3 skills/turkish-writer/scripts/unicode-denetle.py metin.txt
python3 skills/turkish-writer/scripts/unicode-denetle.py metin.txt --temizle --out duzeltilmis.txt
```

**TDK dizini.** Resmî TDK dizin denetimi için bir kez çalıştırın:

```bash
node ~/.claude/skills/turkish-writer/scripts/tdk-dizin-derle.mjs
```

Komut TDK Yazım Kılavuzu dizinini TDK'nın sitesinden indirir ve tarayıcının kullanacağı sözlüğü **yalnız sizin makinenizde** oluşturur. TDK'nın verisi bu depoda dağıtılmaz.

**Eş dizim.** "Türk böyle söyler mi?" denetimi için (uzun sürer, ~1,2 GB indirir):

```bash
node ~/.claude/skills/turkish-writer/scripts/esdizim-derle.mjs
```

LLM öncesi 142 milyon kelimelik Türkçe web metninden (OSCAR 2019) isim + fiil çiftlerini sayar. Sonra "karar yaptık" yazıldığında "Türkçede 'karar' en çok şu fiillerle geçer: vermek (%71), almak (%23)" önerisi gelir. Ayrıntı: [`tests/kalibrasyon/SONUC-ESDIZIM.md`](tests/kalibrasyon/SONUC-ESDIZIM.md).

**OpenAI API ve Codex taslak yolları.** Mevcut otomasyonla geriye uyumluluk için tutulur; varsayılan filtre bunlara ihtiyaç duymaz.

```bash
node skills/turkish-writer/scripts/openai-taslak.mjs brif.md --tur site --out taslak.md
node skills/turkish-writer/scripts/openai-taslak.mjs brif.md --tur eposta --codex --out taslak.md
```

**Yerel dil araçları.** [Dil araçları](skills/turkish-writer/references/dil-araclari.md) Zemberek ve VNLP adapterlerini, ayrıca loopback adresinde çalışan yerel modelden editör önerisi alma komutunu açıklar.

## Kılavuzlar

- [Filtre kararları](skills/turkish-writer/references/filtre-kararlari.md) ve [model bağımsız filtre değerlendirme planı](docs/FILTRE-DEGERLENDIRME.md): iyi cümleyi koruma ve farklı ajanlarda çalışabilirlik ölçütleri.
- [Blog editörü kılavuzu](skills/turkish-writer/references/blog-editoru.md): araştırma, editoryal sav, kaynak sadakati ve seri yayın tutarlılığı. [Kaynak incelemesi ve blog doğrulama planı](docs/BLOG-EDITORU-ARASTIRMA.md) geliştirme dalına aittir; ilk canlı model deneyleri Corpus Lab'da kayıtlıdır.
- [Türkçe kullanım atlası](skills/turkish-writer/references/turkce-kullanim-atlasi.md): ifade, kip, odak ve anlam farkları.
- [Uzun anlatı ve kitap yazarlığı](skills/turkish-writer/references/uzun-anlati.md): kurmaca, diyalog, anlatıcı, bölüm sürekliliği, anı ve kurmaca dışı eserlerin çalışma biçimi.
- [Bağlamlı Türkçe](skills/turkish-writer/references/baglamli-turkce.md): derlemden çıkarılan editoryal kararlar.

## Araştırma ve doğrulama kayıtları

[Corpus Lab](corpus-lab/README.md) becerinin veri temelli geliştirme hattıdır; deneyler olumlu ve olumsuz sonuçlarıyla orada kayıtlıdır. İncelenen kaynaklar: BOUN eğitim derleminde 7.803 işaretlenmiş cümle ([istatistikler](corpus-lab/results/boun-train-v1.json) ve [Türkçe derlem notları](skills/turkish-writer/references/derlem-bulgulari.md) ayrı CC BY-SA 4.0 lisansıyla), FineWeb'in sabit Türkçe veri kümesindeki 203 parçanın tümü ([tam kapsam özeti](corpus-lab/results/fineweb-text-000-202-v3-summary.json)), Daron Yöndem'in tek yazarlı arşivi ([tam derlem özeti](corpus-lab/results/full-pass-licensed-v2-summary.json)), SUDO Portal ([SUDO özeti](corpus-lab/results/sudo-full-text-v3-summary.json)), tarihsel Vikipedi revizyonları ve yakın okuma için seçilen 126 bağlam ([yöntem ve kanıt kimlikleri](corpus-lab/results/context-evidence-v1-summary.json)). Derlem sayımları insan yazarlığını, belge lisansını ya da editoryal kaliteyi kanıtlamaz; bağlam örnekleri insan onaylı düzeltme çifti değildir. Son kullanıcı hiçbir derlem indirmek zorunda değildir.

- 26 Kasım 2026'da test edilen [sabit skill](https://github.com/systemonster/turkish-writer/commit/2ada5dd393ff361bbf0ed7e2b7d1208a24960cb1): son [V31 geliştirme karşılaştırmasında](corpus-lab/results/clean-prose-v31-terminal.json) Qwen 8/8, Mistral 4/8 tamamlanmış çıktı verdi. Bu sayılar protokol kapsamıdır, kalite puanı değildir; iki ailede tekrarlanabilir iyileşme gösterilmedi.
- [26 Kasım regresyonu](https://huggingface.co/jobs/lovefengis/6b0803a8b6a90bbe997fc4a2): Unicode için 7 test, derlem Python için 9 test, mevcut npm ve Corpus Lab Node test komutları ve 85 dosyalı paket/ayrı kurulum kontrolü başarılı. Kaynak dosyanın korunması, ayrı temiz kopyanın gerçekten üretilmesi, atıfların ve anlamlı Unicode'un korunması sınandı.

### V1.1 ölçümleri (tarihsel; V2 sonucu değildir)

<details>
<summary>V1.1 tarayıcı ve taslak deneylerinin ayrıntılarını aç</summary>


Tarayıcının ağırlıkları tahminle değil ölçümle seçildi. LLM öncesi yazılmış 180 Türkçe
metin (haber, forum, şirket sitesi, blog) aynı konularda üretilmiş 180 GPT metniyle
karşılaştırıldı:

| derlem | ayırma gücü | 80 eşiğinde GPT metninin yakalanma oranı | insan metninin yanlış işaretlenme oranı |
|---|---|---|---|
| haber + forum | 0,94 | %75 | %8 |
| site + blog | 0,85 | %79 | %22 |

En güçlü ayırıcının cümle uzunluklarının birbirine benzemesi olduğu görüldü. GPT'ye "doğal yaz"
demek bu izi gidermiyor. Sık sanılan bazı izler (ulaç azlığı, `-maktadır`, edilgen,
"bir" yoğunluğu) bağımsız derlemde ayırmadı. Bunlar skordan çıkarıldı, üslup notu
olarak kaldı. Ayrıntılar: [`tests/kalibrasyon/SONUC.md`](tests/kalibrasyon/SONUC.md),
[`tests/kalibrasyon/SONUC-SITE.md`](tests/kalibrasyon/SONUC-SITE.md).

2026-09'da referans, editörden geçmiş Türkçeye taşındı: dergi, kurum sitesi ve kurum
duyurusundan oluşan 62 metinlik nitelikli derlem. Taslak betiğinin çıktısı bu derlemle ve bağımsız brifle
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

</details>

## Testler

```bash
npm test
```

## Kaynaklar ve teşekkür

Daron Yöndem'e, SUDO Portal yazarlarına, Boğaziçi Üniversitesi/TABILAB UD Turkish BOUN ekibine ve katkıcılarına, TurkishFineweb2-Cleaned veri kümesinin hazırlayıcılarına, Vikipedi/Vikikaynak katkıcılarına, İlkay Holt ve Creative Commons Türkiye'ye, Mirasium'a; ayrıca yerleşik Unicode bileşeni için Guillaume Meyer ve watermarks-remover katkıcılarına teşekkür ederiz. Adı geçenlerin katkısı Turkish Writer'ı onayladıkları anlamına gelmez. [Derlem kaynakları ve lisanslar](corpus-lab/LICENSE-DATA.md) ayrı kayıttadır.

Yararlanılan diğer kaynaklar: Wikipedia'nın "Signs of AI writing" sayfası, blader/humanizer, no-ai-slop,
avoid-ai-writing, insanca, turkish-humanify, TDK Yazım Kılavuzu, Güncel Türkçe Sözlük,
Oxford ve Lewis Türkçe dil bilgisi kitapları ve StoryScope çalışması. Tam liste ve lisanslar:
[`skills/turkish-writer/references/kaynaklar.md`](skills/turkish-writer/references/kaynaklar.md).

## Simge

Simge, Türkçeyi en özenli konuşanlardan biri olan "Sanat Güneşi" Zeki Müren'e bir
selamdır: güneş ve eski tip bir mikrofon. Kişiyi temsil etmez, onun adına konuşmaz.

## Geliştiren

Beceriyi İzmir'de bir yazılım stüdyosu olan [lovefengis](https://lovefengis.com/?utm_source=github&utm_medium=readme&utm_campaign=turkish-writer)
kendi site ve blog metinleri için yazdı, sonra açık kaynak yaptı. lovefengis özel
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

Turkish Writer is an Agent Skill for Turkish authorship and editing. It edits text for the reader's needs, the genre and the author's voice, working on natural Turkish expression, factual fidelity, coherent paragraphs and TDK spelling. The editor is the active agent itself: no separate model, API, cloud service or runtime is required. It does not attempt to establish authorship or optimize detector scores.

The skill was first written for website and blog copy. Guides for novels, short stories, essays, poetry and long-form writing were added in V2; quality in these genres is experimental and needs separate validation.

### Status

**`2.0.0-rc.1`, V2 preview.** A public source-code preview on the default branch for real-world trials, not a final 2.0.0 release or a GitHub Release. Technical tests pass, but independent human editorial review has not been done, so V2's editorial superiority is not established. Historical V1.1 measurements do not validate V2. See the [independent evaluation protocol](corpus-lab/HOLDOUT.md); the [previous V1.1.0 code](https://github.com/systemonster/turkish-writer/tree/0d2a2c6fc1a03ac3b2eb23f61f0e1903eb5bc0ab) remains available.

### What it does

- **Write:** a new draft of fiction, nonfiction or another requested genre.
- **Düzelt / Fix (default; SKILL.md: Filtrele):** makes the given text natural, fixes TDK errors, preserves meaning and facts, and leaves well-written parts untouched.
- **Review:** shows concrete language problems, reasons and suggested fixes without changing the text. It gives no verdict on authorship.

### What it does not do

It does not use typos, invisible characters, look-alike Cyrillic letters or random synonym swaps to fool detectors; it does not invent experiences, customers, numbers or quotes; it does not draft legal rulings or remove required notices and attributions.

### Install

As a personal skill in Claude Code:

```bash
git clone https://github.com/systemonster/turkish-writer.git
mkdir -p ~/.claude/skills
cp -r turkish-writer/skills/turkish-writer ~/.claude/skills/
```

For a single project, copy the directory into that project's `.claude/skills/` folder; back up any existing `turkish-writer` there first. The skill uses the [Agent Skills](https://agentskills.io) format and works in other agents that read it.

### Optional tools

None is required; their output is evidence, not an editorial verdict. The Node scanner (`tr-scan`, a V1.1 legacy kept for compatibility), local Unicode inspection, the TDK index, collocation counts and the OpenAI/Codex draft paths are listed with their commands in the Turkish section above. The Unicode clean-copy mode repairs encoding and line-ending defects and individually confirmed paste/layout defects in a new file, preserving meaningful Unicode, attribution and provenance. No statistical watermark or copyright removal is provided.

### Research and validation records

The Turkish guide [Contextual Turkish](skills/turkish-writer/references/baglamli-turkce.md) translates observations from licensed historical prose and annotated Turkish syntax into contextual editorial decisions. See [research provenance](corpus-lab/LICENSE-DATA.md) and [context evidence](corpus-lab/results/context-evidence-v1-summary.json). The completed [FineWeb aggregate](corpus-lab/results/fineweb-text-000-202-v3-summary.json) covered 63,260,614 rows across 203 shards, with 42,831,847 eligible texts processed for fixed descriptive cue counts; it is not proof of human authorship, document rights or editorial quality. No third-party raw research corpus or model weights are required by the skill.

The [frozen candidate](https://github.com/systemonster/turkish-writer/commit/2ada5dd393ff361bbf0ed7e2b7d1208a24960cb1) awaits independent source selection and human editorial review. The [V31 development comparison](corpus-lab/results/clean-prose-v31-terminal.json) yielded 8/8 complete Qwen outputs and 4/8 complete Mistral outputs; protocol completion is not an editorial quality score, and repeatable improvement was not demonstrated.

### Acknowledgements / Teşekkür

We thank Daron Yöndem, the contributing SUDO Portal writers, and the UD Turkish BOUN team at Boğaziçi University/TABILAB for their licensed works. We acknowledge the TurkishFineweb2-Cleaned dataset authors, Wikipedia/Wikisource contributors, İlkay Holt and Creative Commons Türkiye, and Mirasium for the documented research use. We also acknowledge Guillaume Meyer and the contributors to watermarks-remover for the vendored MIT-licensed Unicode component used for inspection and individually confirmed layout repairs. Other project, research and language-resource attributions, including materials reviewed but not incorporated, are listed in [sources and licenses](skills/turkish-writer/references/kaynaklar.md) and [data provenance](corpus-lab/LICENSE-DATA.md). Their contributions do not imply endorsement of Turkish Writer.

### Developed by

Built and open-sourced by [lovefengis](https://lovefengis.com/?utm_source=github&utm_medium=readme&utm_campaign=turkish-writer), an İzmir studio.
