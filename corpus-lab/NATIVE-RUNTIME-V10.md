# V10: ChatGPT ajan çalışma ortamı pilotu

**Bu küçük pilotta skill kolu temiz metni aynen korudu; iki kol da kusurlu metindeki dört hedef sorunu giderdi.** Skill çıktısındaki değişiklikler dört onarım alanında kaldı. Baseline ayrıca iki küçük yüzey değişikliği yaptı. Bu gözlem bir geliştirme örneğine aittir; insan tercihi veya genel kalite üstünlüğü sonucu değildir.

İnceleme tarihi: 25 Kasım 2026. Hesaplar, değişiklik dökümleri, kaynak/çıktı karmaları ve değerlendirme notları [makine raporundadır](results/native-runtime-review-v10.json). Ham ajan çıktıları değiştirilmedi.

## Kullanılabilir koşu ve dışlanan ilk deneme

İlk denemede aynı bağlama dört kaynak verilmişti: `lf10-01-clean`, `lf10-01-flawed`, `lf10-02-clean`, `lf10-02-flawed`. Ajan, kusurlu metinle birlikte temiz karşılığını ve koşulu açıklayan kimliği görebiliyordu. Bu durum temiz karşılığı bir cevap anahtarına dönüştürebilir. Gerçekten kopyalama yapıldığını kanıtlamasa da bağımsız düzenleme karşılaştırmasını geçersiz kılar.

Bu nedenle aşağıdaki ham dosyalar **INVALID_FOR_INDEPENDENT_COMPARISON** olarak işaretlenmiştir; korunur, fakat bu rapordaki karşılaştırma hesaplarına katılmaz:

- `results/agent-baseline-v10.jsonl`
- `results/agent-skill-v10.jsonl`
- Bunların ortak girdisi: `work/v10/agent-pilot-inputs.jsonl`

Düzeltilmiş koşunun denetleyici kaydına göre dört ayrı ajan `collaboration.spawn_agent`, `fork_turns="none"` ile başlatıldı. Her ajana yalnız bir nötr kimlikli girdi dosyası verildi. `case-01`, temiz kaynak; `case-02`, aynı yazının dört kusur eklenmiş biçimidir. Girdi dosyaları yalnız `amac`, `tur`, `kaynak`, `id` alanlarını taşır. Beklenen karar, kusur listesi ve temiz/kusurlu etiketi bu dosyalarda yoktur.

Dosyaların varlığı, içeriği ve kaynak karmaları bu incelemede doğrudan doğrulandı. Ayrı bağlam protokolü denetleyicinin kaydıdır; tam ajan konuşmaları ve bütün dosya erişimleri bağımsız bir iz denetiminden geçirilmedi. Sonuç kümesi **iki kaynak varyantı, bir temel yazı, bir tür ve dört çıktıdan** oluşur. Her koşul yalnız bir kez örneklenmiştir.

## Kaynağa göre değişiklikler

| Girdi | Kol | Kaynak → çıktı sözcük | Değişen metin bloğu | Dört hedef kusur | Korunan literaller |
| --- | --- | ---: | ---: | --- | ---: |
| `case-01`, temiz | Baseline | 668 → 673 | 6 / 16 | Uygulanmaz | 11 / 11 |
| `case-01`, temiz | Skill | 668 → 668 | 0 / 16 | Uygulanmaz | 11 / 11 |
| `case-02`, kusurlu | Baseline | 695 → 669 | 5 / 16 | 4 giderildi | 11 / 11 |
| `case-02`, kusurlu | Skill | 695 → 669 | 4 / 16 | 4 giderildi | 11 / 11 |

Sözcük sayısı `str.split()` ile hesaplandı. Metin blokları çift satır sonuyla ayrılır; 16 bloğa başlıklar da dahildir. Bu sayılar kalite puanı değildir. `SequenceMatcher` farkları, değişikliğin yerini ve kapsamını tarif eder; anlam eşdeğerliğini ölçmez.

### Temiz metin

Skill çıktısı kaynakla tam olarak eşittir. Baseline; tarih ifadesini tamamladı, üç yerde virgül düzenledi, iptal edilen kaydı anlatan cümlede sözcük sırasını değiştirdi ve kesin harcama önerisi verilmediğini daha açık bir ifadeyle yazdı. Altı blokta dokuz sözcük farkı grubu vardır.

Bu AI incelemesi, değişen alanlarda zorunlu bir düzeltme gerektiren hata belirlemedi. Dolayısıyla baseline, geliştirme verisindeki amaçlanan `keep` davranışına uymadı. Bununla birlikte değişiklikler temel bilgiyi bozmuyor; bunlardan insanın metni daha kötü bulacağı sonucu çıkmaz. Buradaki fark, temiz metne müdahale etme eşiğidir.

### Kusurlu metin

İki kol da şu dört sorunu giderdi:

| Eklenen kusur | Gözlenen onarım |
| --- | --- |
| İşlem listesini dışa aktarma eylemini uzatan isimleştirme | İki kol da doğrudan “dışa aktardık” biçimine döndü. |
| Aynı soruya cevap verilmediğini yeniden anlatan ikinci cümle | İki kol da tekrar cümlesini çıkardı. |
| Ürün grupları paragrafının başındaki boş geçiş | İki kol da geçişi çıkardı. |
| Takip kuralının uygulanmasını uzatan isimleştirme zinciri | İki kol da zinciri kısalttı; aynı takip kuralı gereğini korudu. |

Skill çıktısı, kaynakta yalnız bu dört alan değiştirilerek aynen yeniden kurulabiliyor. Baseline'da bunlara ek olarak `maliyet` sonrasına virgül eklendi ve “boşluk çıktı” ifadesi “boşlukla karşılaştık” olarak değiştirildi. Bunlar hedef kusurları gidermek için gerekli olmayan, anlam bakımından eşdeğer yüzey değişiklikleridir.

Takip kuralı cümlesinde baseline “uygulamamız gerekiyordu”, skill ise “uygulanması gerekiyordu” dedi. Baseline anlatıcıyı özne olarak belirginleştiriyor; bu, çevredeki birinci çoğul kişi anlatımıyla uyumlu. Skill daha genel özneyi koruyor. Skill'in bıraktığı kısa isimleştirme burada aynı ağır anlatım kusurunun sürdüğü anlamına gelmez. Temiz kaynağın sözcüklerini birebir üretmek tek doğru onarım değildir.

## Anlam ve bilgi koruması

Dört çıktıda da tarihler, sayılar, harcama tutarları, sipariş başına maliyetler ve rapor alıntısı korundu. Sayısal diziler kaynağınkiyle aynı. AI incelemesinde kârlılık verisinin eksikliği, eşit olmayan iptal takibi, ürün bazındaki ilişkilendirme eksikliği, nedensellik kurulamaması ve kesin bütçe artırma önerisi verilmemesi korunmuş görünüyor. Kurmaca bildirimi aynen kaldı. Maddi bir olgu veya belirsizlik kayması saptanmadı.

Bu sonuç, belirli dört çıktının sınırlı incelemesidir. Literal eşleşmesi tek başına anlam korumasını kanıtlamaz. İnceleyici de AI'dır, koşulları ve kusur haritasını biliyordu; ayrıca geliştirme kaynaklarını yazan ajandır. İnsan değerlendirmesi veya bağımsız altın etiket yoktur.

## Bildirilen referans ve araç kullanımı

| Kol | Ham çıktının bildirdiği referanslar | Bildirilen araçlar |
| --- | --- | --- |
| İki baseline çıktısı | `references_read: []` | `tools_used` alanı yok; bu, hiç araç kullanılmadığı anlamına gelmez. |
| Skill, `case-01` | `SKILL.md`, `editor-muhakemesi.md`, `filtre-kararlari.md`, `unicode-denetimi.md`, `unicode-denetle.py` | `functions.exec`, `tools.exec_command`, `cat`, `python3 -B`, Unicode denetleme betiği |
| Skill, `case-02` | Aynı dört yönerge/referans dosyası | `functions.exec`, `exec_command`, `python3`, Unicode denetleme betiği |

Tam yollar ham JSON'larda ve inceleme raporunda korunmuştur. Bu alanlar **ajanın kendi bildirimidir**; bu inceleme bütün dosya okumalarını veya araç başarılarını ayrı yürütme kayıtlarından doğrulamadı. Betiğin listelenmesi, tek başına sonucunun başarılı olduğunu kanıtlamaz.

## Çalışma ortamı ve çıkarım sınırı

Bu, **ChatGPT'nin devredilmiş ajan çalışma ortamında** yapılmış bir pilottur. Ayrı Codex CLI süreci daha önce salt okunur dosya sistemi hatasıyla başlayamamıştı; engel [V10 deney belgesinde](DIAGNOSTICS-V10.md) kayıtlıdır. Buradaki koşu tam Codex CLI testi olarak sunulamaz.

Kesin arka uç model sürümü, seed, sıcaklık ve tam yürütme izi mevcut çıktı kayıtlarında yoktur. Skill kolu yönergeleri, seçilen referansları ve bildirilen araç kullanımını birlikte içerir; farkın hangi bileşenden kaynaklandığı ayrıştırılmadı. Tek yazıdan genel Türkçe kalitesi, istatistiksel üstünlük, insan tercihi veya detektör başarısı sonucu çıkarılamaz. Bu pilot yalnız temiz kaynağı koruma ve bilinen yerel kusurları onarma davranışına dair dar bir gözlem sağlar.
