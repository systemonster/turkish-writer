# V10 teşhis ölçümleri ve kontrollü anlam çiftleri

Bu dosyalar geliştirme araştırmasıdır. Aktif skill'i, sürüm durumunu veya kullanıcı akışını değiştirmez. İnsan editör puanı, bağımsız kalite onayı ve yazarlık tespiti içermez.

## Veri kapsamı

`semantic-mutations-v10.jsonl` bu proje için yeni yazılmış 24 geliştirme örneği içerir. Bunlar insan metni veya insan onaylı altın veri değildir. Her kayıt `provenance: project_generated`, `split: development`, `human_reviewed: false` taşır. On altı anlam karşılaştırmasında bir aday belirli bir ilişkiyi bozar; sekiz kontrolde iki farklı söyleyiş de anlamı korur. İkincisi, her değişikliği reddeden veya eşit adaylarda zorla tercih yapan hakemi görünür kılmak içindir.

On iki örnek kısa bağlam, on ikisi paragraf bağlamıdır. Bunlar uzun bloglar değildir. Kapsam: olasılık/kesinlik, olumsuzluk, özne, zaman, nedensellik, kapsam, görüş atfı, sayı, birim, karşılaştırma, zorunluluk, yapabilme, koşul, bilinmezlik, işlem sırası ve sürenin başlangıcı. Sözcüklerin korunması ilişkilerin korunduğunu göstermez: aynı sayının farklı bir olaya bağlanması da kusurdur.

Her örnekte `source`, `candidates.A`, `candidates.B` ve değerlendirme için ayrı `gold` bulunur. `gold.choice` A/B/ESIT, `gold.defect` kusur türü, `gold.explanation` beklenen kararın gerekçesidir. `gold` adı, etiketin insan tarafından doğrulandığı anlamına gelmez; bunlar proje tarafından belirlenmiş beklenen etiketlerdir.

## Model girdisi ve kör etiketler

`buildJudgePayload(fixture, {swap})` yalnız `{kaynak, A, B}` döndürür. Kimlik, kategori, geliştirme etiketi, kusur, beklenen karar ve gerekçe modele girmez. Kaydı doğrudan isteme serileştirme. `expectedJudgeChoice(fixture, {swap})` yalnız çıktı puanlanırken kullanılır. Her karşılaştırmayı iki sunum sırasında çalıştır; ESIT kontrolü iki sırada da ESIT kalır. Üretici ve hakem sürümü, gönderilen gerçek istemin hash'i, tamamlanma nedeni ve ham yanıtı ayrı kaydet.

```js
import {buildJudgePayload, expectedJudgeChoice, parseJudgeOutput} from './diagnostic-metrics.mjs';

const swap = true;
const input = JSON.stringify(buildJudgePayload(fixture, {swap}));
// Yalnız input model çağrısına gider. fixture ve gold gönderilmez.
const parsed = parseJudgeOutput(rawResponse, {atLimit, finishReason});
const correct = parsed.valid ? parsed.choice === expectedJudgeChoice(fixture, {swap}) : null;
```

Hakemden yalnız A/B/ESIT veya `{"choice":"A","reason":"..."}` istenir. `reason` isteğe bağlıdır; Türkçe `secim`/`gerekce` de kabul edilir. Tek kapalı JSON çiti açık biçim normalizasyonuyla kabul edilir ve sonuçta bu biçim kayıtlı kalır. Bozuk JSON, yinelenen anahtar, belirsiz/ek alan, geçersiz etiket, açıklamayla karışmış serbest etiket veya token sınırına ulaşmış yanıt geçersizdir. Geçersiz çıktıyı yanlış semantik karar veya ESIT diye yeniden sınıflandırma. Tamamlanmış karar, anlam değerlendirmesinde doğru karar demek değildir.

## Yeniden kullanılabilir işlevler

| İşlev | Çıktı ve sınır |
|---|---|
| `protectedValueRisks(source, output, {protectedValues})` | Sayı, birimli miktar, bağlantı, alıntı, satır içi/blok kod, Markdown başlık/tablo/liste işaretleri ve verilen birebir dizilerde fark. Bunlar inceleme işaretidir; tüm anlamsal ilişkileri kontrol etmez. |
| `editMetrics(source, output, {maxDistanceCells})` | Birebir eşitlik, yalnız boşluk değişikliği, sözcük ve noktalama tokenlarıyla Levenshtein uzaklığı, normalize uzaklık ve uzunluk. Miktar ölçer; değişikliğin yararını ölçmez. |
| `descriptiveMetrics(text)` | Sözcük/cümle/paragraf boyları, çeşitlilik, tekrarlanan üçlüler, cümleler ve paragraflar. Sabit kota, tercih aralığı, okunabilirlik notu, kalite skoru veya AI olasılığı yoktur. |
| `stabilityMetrics(source, [pass1, pass2, pass3], options)` | Bir ile üç ardışık tur; tur farkları, kaynaktan son çıktıya fark, gözlenmiş birebir kararlılık ve önceki sürüme dönüş döngüleri. Kararlı yanlış metin de mümkündür. |
| `parseJudgeOutput(raw, {atLimit, finishReason})` | `{valid, choice, reason, format, explanation}`; biçim geçerliliğini anlam doğruluğundan ayırır. |
| `validateSemanticFixtures(fixtures)` | Kayıt şeması, benzersiz kimlik ve geliştirme kökeni kontrolü. Beklenen anlam etiketlerinin doğruluğunu ispatlamaz. |

Literal denetim, “kolaylaşabilir” yerine “kolaylaşır” veya “duyulmuyor” yerine “duyuluyor” yazıldığında hiç işaret üretmeyebilir. Bu durumda bile `semantic_fidelity: not_assessed` ve `requires_semantic_review: true` kalır. `has_literal_or_structure_risk: false` bir geçiş veya güvenlik onayı değildir. Değişiklik risk işareti de tek başına hata kanıtı değildir: doğru bir birim dönüşümü veya istenmiş başlık değişimi inceleme gerektirebilir.

Kelime ayırma Unicode örüntüsüyle, cümle ayırma varsa `Intl.Segmenter('tr')` ile yapılır; dil bilgisi çözümleyicisi değildir. Kısaltmalar ve Markdown cümle sınırlarını etkileyebilir. Kod blokları dil ölçülerinden çıkarılır, kaynak ve çıktı koruma denetiminde tutulur. Sözcük ve tekrar oranlarını farklı tür veya uzunluklar arasında tek kalite sırası gibi karşılaştırma. Türkçe çekimlerin eş köklü olduğu iddiası yapılmaz.

Levenshtein hesabı önce ortak başı ve sonu çıkarır, bellekte yalnız iki satır tutar. Kalan boyutların çarpımı `maxDistanceCells` sınırını aşarsa uzaklık `null`, neden `distance_cell_limit` olur. Yaklaşık bir sayı uydurulmaz. Varsayılan 25.000.000 hücredir. `stabilityMetrics` tek turda kararlılık iddia etmez; aynı metni döndürmeyi editoryal başarıya dönüştürmez.

## Dar doğrulama

```sh
node --test corpus-lab/tests/diagnostic-metrics.test.mjs
```

Bu testler bozulmuş birim/korunan yapı, literal kontrollerin kaçırdığı anlam değişikliği, uzaklık hesabı, betimleyici tekrar ölçüleri, düzenleme döngüsü, bozuk/truncated hakem çıktısı ve modele etiket sızıntısı için yazılım kontrolleridir. Modelin bu çiftleri doğru çözdüğüne veya metinleri iyi düzenlediğine dair sonuç değildir.
