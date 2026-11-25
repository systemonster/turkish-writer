<p align="center"><img src="assets/logo.svg" width="128" alt="turkish-writer: güneş ve eski tip mikrofon"></p>

# turkish-writer

Bu beceriyi İzmir'de bir yazılım stüdyosu olan [lovefengis](https://lovefengis.com/?utm_source=github&utm_medium=readme&utm_campaign=turkish-writer) geliştirdi ve açık kaynak yaptı.

Türkçe site içeriği ve blog yazısı için bir yapay zekâ becerisi (Claude Code / Agent
Skills). Yapay zekânın Türkçe yazdığı metnin iki ortak kusurunu giderir: sesli okununca
**yanlış yerde vurgulu** olması ve **İngilizceden çevrilmiş gibi** durması. Metin TDK
yazım kurallarına da uyar.

İngilizce için bu işi yapan çok araç var. Türkçeye uyarlananlar genellikle İngilizce
listeyi çevirip bırakıyor. Oysa Türkçe metni ele veren şeylerin bir kısmı İngilizcede hiç
yok: vurgunun yüklemden önceki öğeye düşmesi, "bir"in *a/an* gibi her cümleye girmesi,
ulaç yerine "ve", "karar vermek adına" gibi edat kalıpları. Bu beceri bunları ayrı bir
katman olarak ele alıyor ve hepsini ölçüyor.

## Ne yapar

Üç kipi var:

- **Yaz:** yeni site ya da blog metni.
- **Düzelt:** verilen metni doğallaştırır, TDK hatalarını giderir, anlamı ve olguları korur.
- **Denetle:** metni değiştirmeden izleri satır satır listeler. "Bunu yapay zekâ yazdı"
  hükmü vermez.

V2 akışı: kısa brif, tür ve ses, taslak, editör okuması, isteğe bağlı araçlar ve son kontrol.
Ayrıntı: [`skills/turkish-writer/SKILL.md`](skills/turkish-writer/SKILL.md).

## Kurulum

Claude Code'da kişisel beceri olarak:

```bash
git clone https://github.com/systemonster/turkish-writer.git
cp -r turkish-writer/skills/turkish-writer ~/.claude/skills/
```

Ya da yalnız bir projede kullanmak için `.claude/skills/` altına kopyalayın. Beceri
[Agent Skills](https://agentskills.io) biçimindedir; bu biçimi okuyan başka ajanlarda da
çalışır.

### V2 geliştirme dalı

V2'de beceri, çalıştığı modelle doğrudan yazabilir; OpenAI API ve Codex taslak yolları isteğe bağlıdır. Tek yazım motoru [yazım-motoru.md](skills/turkish-writer/references/yazim-motoru.md) içinde bulunur. Sabit cümle/paragraf kotaları ve bağlamdan bağımsız sözcük yasakları yerine okur, amaç, tür, doğal söz dizimi ve olgu sadakati belirleyicidir. Eski ölçümler V1.1'e aittir; V2 başarısı henüz ölçülmemiştir. [Doğrulama planı](docs/V2-DOGRULAMA.md).

```bash
node skills/turkish-writer/scripts/openai-taslak.mjs brif.md --tur site --out taslak.md
node skills/turkish-writer/scripts/openai-taslak.mjs brif.md --tur eposta --codex --out taslak.md
```

İsteğe bağlı [watermarks-remover Unicode denetimi](skills/turkish-writer/references/unicode-denetimi.md) yerel ve salt okunur çalışır; yazarlık veya tespit sonucu hakkında hüküm vermez.

```bash
python3 skills/turkish-writer/scripts/unicode-denetle.py metin.txt
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

## Kaynaklar

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

Sürümler [`CHANGELOG.md`](CHANGELOG.md)'de; semver kuralı orada yazılı.

---

## English

`turkish-writer` is an Agent Skill for writing and editing Turkish website copy and blog
posts so they read as written by a Turkish speaker, not translated from English or
generated by an LLM. It covers Turkish-specific tells that English humanizers miss
(misplaced focus/stress, *bir* as an article calque, *ve* instead of converbs,
calqued postpositions), follows the official TDK spelling rules, and ships a
dependency-free Node scanner. Calibrated on 180 pre-LLM Turkish texts vs 180 GPT texts;
see `tests/kalibrasyon/`. It does not use invisible characters, homoglyphs or deliberate
typos, and it does not invent facts. In V2, the active agent can write directly; OpenAI/Codex drafting is optional. The V1.1 measurements are historical and do not validate V2. Optional read-only Unicode inspection uses a vendored MIT module from watermarks-remover.

Built and open-sourced by [lovefengis](https://lovefengis.com/?utm_source=github&utm_medium=readme&utm_campaign=turkish-writer),
an İzmir studio for custom panels, integrations, multilingual sites and automation.
