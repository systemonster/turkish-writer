<p align="center"><img src="assets/logo.svg" width="128" alt="turkish-writer: güneş ve eski tip mikrofon"></p>

# turkish-writer

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

Altı geçiş sırayla uygulanır: yüzey (klişe, şişirme, noktalama), Türkçe söz dizimi (vurgu,
ritim, "ve"/"bir", söylem parçacıkları, çeviri kokusu), yapı, mantık kapısı, TDK, son okuma.
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
sık yanlışlar, eş dizim).

## Ne kadar güvenilir

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

**Sınırlar.**
- Ölçümler yalnız OpenAI modelleriyle yapıldı.
- İki derlem de ayar için kullanıldı; üçüncü bir bağımsız derlemde sonuç daha düşük
  çıkabilir.
- İnsan metinlerinin beşte biri de gri bölgeye düşebiliyor. Skor bir işarettir, hüküm değil.
- Hiçbir yöntem "hiçbir denetleyici anlayamaz" garantisi vermez. Bu beceri de vermiyor.
  Hedefi, metni iyi Türkçe yazan bir insanın metninden ayırt edilemez kılmak.

## Neyi yapmaz

- Denetleyiciyi kandırmak için yazım hatası, görünmez karakter, harf benzeri Kiril
  karakteri ya da rastgele eş anlamlı değiştirme kullanmaz.
- Uydurma deneyim, müşteri, sayı ya da alıntı eklemez.
- Hukuki metin, akademik makale ve kurmaca için tasarlanmadı.

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

## Lisans

MIT. `references/evrensel-izler.md` içindeki Wikipedia kaynaklı bölümler CC BY-SA 4.0'dır.

---

## English

`turkish-writer` is an Agent Skill for writing and editing Turkish website copy and blog
posts so they read as written by a Turkish speaker, not translated from English or
generated by an LLM. It covers Turkish-specific tells that English humanizers miss
(misplaced focus/stress, *bir* as an article calque, *ve* instead of converbs,
calqued postpositions), follows the official TDK spelling rules, and ships a
dependency-free Node scanner. Calibrated on 180 pre-LLM Turkish texts vs 180 GPT texts;
see `tests/kalibrasyon/`. It does not use invisible characters, homoglyphs or deliberate
typos, and it does not invent facts.
