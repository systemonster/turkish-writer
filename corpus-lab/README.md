# Turkish Editorial Corpus Lab

Bu klasör geliştirici araştırmasıdır. Skill'in çalışması için indirilmesi, çalıştırılması veya Python/Java/model kurulması gerekmez.

## 1. Çalıştırılmış ilk pilot: BOUN

Sabitlenmiş BOUN eğitim dosyası GitHub üzerinden okunarak 7.803 cümle analiz edildi. `results/boun-train-v1.json` yalnız toplu istatistikleri içerir. CC BY-SA 4.0 kaynak atfı korunur; ham veri dağıtılmaz.

```bash
mkdir -p corpus-lab/work
curl -L https://raw.githubusercontent.com/UniversalDependencies/UD_Turkish-BOUN/09521f40c90904df85524b8e0b43afba6e4c7823/tr_boun-ud-train.conllu -o corpus-lab/work/boun-train.conllu
node corpus-lab/analyze-conllu.mjs corpus-lab/work/boun-train.conllu corpus-lab/work/boun-report.json
node --test corpus-lab/tests/*.test.mjs
```

CLI git blob kimliğiyle dosyanın doğru sürüm ve bölüm olduğunu doğrular. Çıktıyı yanlışlıkla üzerine yazmaz. BOUN dev/test geliştirme için kullanılmaz. `results/` altındaki BOUN istatistiği ve skill'in `references/derlem-bulgulari.md` dosyası CC BY-SA 4.0; proje kodu kendi MIT lisansıyla kalır.

## 2. Sonraki veri kümesi: Türkçe web

[TurkishFineweb2-Cleaned](https://huggingface.co/datasets/moganai/turkishfineweb2-cleaned) kartındaki alanlar üzerinden akış halinde seçme. Sabitlenen Parquet sürümünde `url`, `date`, `language_score`, `fasttext_clean_score` üst düzey alanlardır; seçim kodu bu biçimi de destekler. Tarama tarihi yayın tarihi değildir. 2017 sonu ve öncesi taramalar bir başlangıç kohortudur, insan yazarlığı kanıtı değildir.

Geliştirici kendi ortamında çalıştırır. İlk aşamada sadece küçük, izinli örneklem: 500–1.000 belge. Tam 70,5 GB indirme yok. Önce `sources.json` içinden kaynakları ve kullanım haklarını incele. ODC-By veri tabanı lisansıdır; içindeki yazıların yeniden kullanım hakkını garanti etmez. `source-approvals.example.json` gerçek izin içermez. Kendi `work/approvals.json` dosyana yalnız doğrulanmış URL öneklerini, lisansı/izni, türü, kaynak kanıtını gir.

```bash
python -m pip install 'datasets>=3,<5'
python corpus-lab/sample-web.py --approvals corpus-lab/work/approvals.json --revision DATASET_COMMIT --out corpus-lab/work/sample.jsonl --limit 500 --scan-limit 100000
```

Komut yalnız açıkça izin verilen URL öneklerinde, 2017 sonu ve öncesi tarama, geçerli Türkçe dil puanı, uzunluk ve kalite ön filtreleriyle aday seçer. Alan başına kota, birebir metin tekrarı kontrolü, tarama sınırı ve ham veriyi git dışına yazma var. Filtrelenmiş adaylar henüz insan editör onaylı değildir. Kaynak bazında bölme yapılır; eşiklerin niteliği sonraki editör örneklemiyle doğrulanır. Kalite puanı insan yazarlığı göstergesi değildir.

### İnceleme ve derlem ölçümü

`sample.jsonl` kayıtları başlangıçta adaydır. Editör kaynak metni, izin kanıtını, türünü, çeviri/tekrar/düşük bilgi riskini ve gerçek Türkçe kullanımını inceler. Kabul edilenlere `status: editor_verified` ve anonim `reviewer_id` eklenir; reddedilenler ayrı kaydedilir. Tarama tarihi ile doğrulanmış yayın tarihi ayrı alanlardır. Adayı otomatik olarak onaylı sayma.

```bash
python corpus-lab/analyze-web.py corpus-lab/work/reviewed.jsonl corpus-lab/work/web-profile.json
```

Bu rapor yalnız insan onaylı, hak kanıtı olan ve birebir tekrar olmayan kayıtlardan türe/alan dağılımı, belge ve paragraf boyu, yaklaşık cümle uzunluğu istatistikleri üretir. Cümle bölme sezgiseldir; blog editörlük kalitesi veya doğallık hakkında sonuç çıkarılmaz. Ham metin rapora girmez. Geliştirme verisi ile bağımsız test yazıları kaynak/yazar/konu bazında ayrılmalı; sadece tarih veya satır numarası yeterli değildir.

## 3. Editoryal örnekler

Kendi metinlerimiz veya kullanımı açıkça izinli düzenleme çiftleri: ilk metin, son metin, müdahale gerekçesi, değişmemesi gereken olgular, tür ve kaynak. Bir cümlenin korunması gereken örnekler de veri setinde tutulur. `editorial-cases.jsonl` yalnız bu proje için yazılmış sentetik başlangıç vakalarıdır; insan onaylı altın veri değildir. Gerçek önce/sonra çiftleri ayrıca toplanır. Vikipedi revizyonları CC BY-SA koşulları ve tarihsel atıflarla incelenebilir; vandalizm ve olgu güncellemesi stil müdahalesi diye etiketlenmez.

Gerçek, izinli ve editör onaylı çift için alanlar: `id, source_group, source_url, rights_evidence, reviewer_id, before, after, reason, genre, status, decision, categories, protected`. Kaynak grubu aynı yayın/yazar ve bilinen yakın kopyaları aynı bölümde tutacak şekilde belirlenir. `status` yalnız gerçekten gözden geçirilmiş kayıtta `editor_verified`; karar `keep/edit/conditional`. Kategoriler `validate-editorial-cases.py` içinde. Kişisel veri ve gizli metin taşınmaz.

```bash
python corpus-lab/validate-editorial-cases.py corpus-lab/work/reviewed-pairs.jsonl
python -m unittest discover -s corpus-lab/tests -p 'test_*.py'
```

Yapısal kontrol, korunan dizilerin kaybını, aynı kaynağın farklı bölümlere dağılmasını ve birebir kopyaları kontrol eder. Benzer metinler, konu çakışması ve anlam sadakati ayrıca editör tarafından incelenir. Bu kontrol insan doğrulamasının yerini tutmaz.

## 4. Tarihsel düzenleme adayları: Vikipedi

`collect-wiki-revisions.mjs` ve `wiki-revision-candidates.mjs`, 2018 öncesi birbirinin doğrudan ebeveyni olan iki Türkçe Vikipedi madde revizyonundan tek bir temiz paragraf içindeki küçük değişiklikleri ayıklar. Bu bir editör onayı değil, inceleme kuyruğudur. Sayı değişiklikleri, belirgin wiki işaretlemesi, etiketli geri alma ve eldeki bir sonraki revizyonda tamamen geri dönen değişiklikler elenir. Daha geç geri alma, botlar, yanlış veya olgusal müdahale ve yakın kopya kalabilir. Yöntem kasıtlı olarak dar kapsamlıdır; teknik ve blog metninin yerini tutmaz. Kimlik, revizyon tarihi, kaynak ve geçmiş bağlantısı saklanır; kullanıcı adı, IP veya düzenleme özeti istenmez. Kişisel veri ve yeniden kullanım koşullarını insan incelemesinde ayrıca kontrol et.

Node 18+ ile sentetik çekirdek testi:

```bash
node corpus-lab/collect-wiki-revisions.mjs --self-test
```

İnternet erişimi olan geliştirme makinesinde `work/titles.txt` içine satır başına bir tane, en fazla 20 madde başlığı yaz. Gerçek iletişim adresini kullan, istekleri art arda yap; API sınırı veya maxlag durumunda betik durur.

```bash
node corpus-lab/collect-wiki-revisions.mjs --titles-file corpus-lab/work/titles.txt --contact https://your-project.example --out corpus-lab/work/wiki-candidates.jsonl --batches 2 --limit 200
```

Daha önce alınmış MediaWiki Action API formatversion=2 JSON yanıtıyla çevrimdışı da çalışır:

```bash
node corpus-lab/collect-wiki-revisions.mjs --input corpus-lab/work/revisions.json --out corpus-lab/work/wiki-candidates.jsonl
```

Adayları doğrudan skill'e taşıma. Editör iki revizyonu geçmişiyle inceleyerek olgu değişikliği ve vandalizmi ayırır, gerekçeyi yazar ve lisans/atfı doğrular. Gerçek onaydan sonra 3. bölümdeki şema ile ayrı dosya oluşturup doğrula. Büyük taramalar için API yerine Wikimedia dump verisi araştırılır. İlgili kaynaklar: [MediaWiki revizyon API](https://www.mediawiki.org/wiki/API:Revisions), [API etiquette](https://www.mediawiki.org/wiki/API:Etiquette), [Wikimedia kullanım koşulları](https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use), [WikiSmallEdits](https://github.com/tguinard/WikiSmallEdits). Son kaynak ayrı bir araştırmadır; bu depoda kodu kopyalanmamıştır.

## 5. Editoryal stres testi

`editorial-stress-v1.jsonl` 40 proje üretimi geliştirme vakası içerir: 18 korunacak, 22 düzenlenecek. Sekiz alan: anlam, söz dizimi, metin akışı, sicil, terminoloji, eş dizim, yapı ve anlatım sesi. Açık geliştirme verisidir; bağımsız kör test olarak kullanılamaz. Referans düzenleme tek geçerli cevap değildir. Otomatik denetim sayı, bağlantı, tırnak içi alıntı değişikliklerini inceleme için işaretler; anlam ve kalite hakkında hüküm vermez.

```bash
node corpus-lab/editorial-eval.mjs --fixture-check
node corpus-lab/editorial-eval.mjs --prepare corpus-lab/work/editorial-tasks.jsonl
node corpus-lab/editorial-eval.mjs --check corpus-lab/work/model-outputs.jsonl
```

Model çıktısı her satırda `{"id":"editorial-dev-001","output":"..."}` biçimindedir. Hazırlanan görevler referansı, kategori veya beklenen müdahaleyi göstermez. Aynı görevleri dört deney kolunda ayrı oturumlarda çalıştır. Çıktıları kodlanmış rastgele sırada iki bağımsız editör değerlendirsin. Literal değişiklikler otomatik ret değil inceleme sinyalidir. Sayının silinmesi, aynı sayının farklı özneye bağlanması, yeni olgu, olumsuzluğun değişmesi veya gereksiz müdahale gibi kusurları anlam denetiminde ayrıca yakala. Geliştirme örneklerinden yeni kurallar çıkar; yeni kuralları tekrar bu veri üzerinde başarı kanıtı sayma. Bağımsız, görülmemiş bloglar ve gerçek editör kararı olmadan V2 yayın kapısı açılmaz. [Değerlendirme planı](../docs/FILTRE-DEGERLENDIRME.md).

## 6. Yayın politikası

Ham korpus, üçüncü taraf yazıları ve kişisel veri depoya commit edilmez. Çıkarılan toplu bilgiler ve bağımsız örnekler ancak editör tarafından gözden geçirildikten sonra skill referansı olur. İyi Türkçe, doğruluk, anlam koruma ve editoryal fayda ölçülür. Dil dağılımları kota veya sınıflandırıcı atlatma hedefi değildir.

## 7. 2026-11-25: çalıştırılmış araştırmalar

| Deney | Gözlem | Sınır |
|---|---|---|
| [Fineweb üst veri pilotu](results/mogan-metadata-1m-v1.json) | 1.000.000 satır, 87.390 ön filtre adayı, 22.624 alan adı | Metinlerin tamamı okunmadı; hak ve editör onayı yok. |
| [Tarihsel blog profili](results/historical-blog-profile-v1.json) | 1.038 dosyadan 503 yazı; 274.756 sözcük, 5.401 paragraf, yaklaşık 20.048 cümle | Daron Yöndem'in 2007–2017 yazıları; tek yazar, sezgisel sayım. |
| [Vikipedi pilotu](results/wiki-historical-pilot-v1.json) | 2.643 revizyon, 50 aday | Model ön incelemesi; sıfır insan onayı; ham alıntı dağıtılmıyor. |
| [Qwen3-8B A/B](results/editorial-ab-qwen-qwen3-8b.json) | 40 vaka/kol; birebir koruma 9/18 → 13/18 | Tek başına editörlük kalitesi değil; bazı düzenlemeler eksik, anlam riski mevcut. |
| [Turkish Gemma A/B](results/editorial-ab-ytu-ce-cosmos-turkish-gemma-9b-v0-1.json) | 40 vaka/kol; çıktı biçimi karışması | JSON girdi protokolü karıştırıcı etken. |
| [Qwen3-32B eksik A/B](results/editorial-ab-qwen-qwen3-32b-incomplete.json) | 40 temel çıktı; sonraki kol GPU bellek hatası | Kollar karşılaştırılamaz. |

[Deneysel kısa editör adayı](editor-core-candidate.md) henüz varsayılan değildir. [Uzun metin geliştirme vakaları](editorial-longform-v1.jsonl) 12 yeni sentetik örnektir. Üç kollu deney aynı düz metin protokolüyle 52 vaka/model planlar. Sabit kod sürümü `40c9bce705e0985230f4ffe5b90d02f317aa182e`; [HF Job](https://huggingface.co/jobs/lovefengis/6b063f971460ffe1d5e9851e). Sonuç görülmeden adayın daha iyi olduğu iddia edilmez.

Çalıştırılmış yazılım doğrulaması: npm test 167 başarılı, 7 atlanan, 0 başarısız; ayrıca Corpus Lab Node 3 ve Python 5 başarılı. Model geliştirme vakaları bağımsız kör test değildir. İnsan editör onaylı önce/sonra veri seti ve bağımsız çok yazarlı değerlendirme hâlâ eksiktir. Skill için zorunlu bulut, API ya da model yoktur.

## 8. Üç kollu deney tamamlandı; karar kapısı deneyi başlatıldı

[HF Job: text-v2](https://huggingface.co/jobs/lovefengis/6b063f971460ffe1d5e9851e), 25 Kasım 2026, tamamlandı. Üç modelin her biri 52 vaka × 3 kol üretti (468 çıktı). Aşağıdaki sayı, beklenen kararı KORU olan 24 metnin ham çıktıda birebir korunmasıdır. Tek başına editörlük kalitesi ölçüsü değildir.

| Model | Yalın | Mevcut skill | Kısa çekirdek |
|---|---:|---:|---:|
| [Qwen3-8B](results/editorial-abc-text-v2-qwen-qwen3-8b.json) | 7/24 | 18/24 | 0/24 |
| [Turkish Gemma 9B](results/editorial-abc-text-v2-ytu-ce-cosmos-turkish-gemma-9b-v0-1.json) | 0/24 | 0/24 | 2/24 |
| [Qwen3-32B](results/editorial-abc-text-v2-qwen-qwen3-32b.json) | 3/24 | 1/24 | 0/24 |

Qwen3-32B kısa çekirdeğinde 28/52 çıktı kaynak sınırı etiketlerini içerdi; etiketi temizledikten sonra 9/24 koruma vakası birebir. Bu ham çıktı hatasını sonradan başarı sayma. Bazı kollar sayı, başlık, alıntı ve korunan ifadelerde değişiklik yaptı. Mevcut skill, kısa çekirdekle değiştirilmedi. Karar kapısı ve düzenleme adımlarını ayıran deney, bu kusurları hedefliyor.

**Aktif takip:** [HF Job: editor-decision-gate-v3](https://huggingface.co/jobs/lovefengis/6b0646781460ffe1d5e9916c), RTX PRO 6000, azami 60 dakika. Sabit kod commit'i `d298b2d2f0ae9abfe55f4602fbc58636ef5a42a3`. [Deney kodu](run-editor-gate.py). 3 model × 52 vaka için karar (KORU/DÜZELT), doğrudan skill, karar kapılı skill ve karar kapılı kısa edit talimatı. Modelin KORU kararı yalnız model çıktısına dayanır, referans kararı verilmez. Ham kararları, yanlış koruma/düzenleme ve biçim/olgu risklerini ayrı değerlendir. Aynı örnekler geliştirme setidir; bağımsız kalite onayı değildir. Bu deney henüz tamamlanmamıştır; önce sonucu al, aynı işi tekrar başlatma.

## 9. Karar kapısı V3 ve somut bulgu V4

[HF Job: V3](https://huggingface.co/jobs/lovefengis/6b0646781460ffe1d5e9916c) tamamlandı: 156 karar ve 468 çıktı. Geliştirme setinde 24 KORU ve 28 DÜZELT vakası var. Yalnız doğru karar sayısı:

| Model | KORU | DÜZELT | Geçerli karar |
|---|---:|---:|---:|
| [Qwen3-8B](results/editorial-gate-v3-qwen-qwen3-8b.json) | 22/24 | 6/28 | 51/52 |
| [Turkish Gemma 9B](results/editorial-gate-v3-ytu-ce-cosmos-turkish-gemma-9b-v0-1.json) | 23/24 | 5/28 | 52/52 |
| [Qwen3-32B](results/editorial-gate-v3-qwen-qwen3-32b.json) | 23/24 | 5/28 | 52/52 |

Karar kapısı gereksiz müdahaleyi azaltsa da düzenlenmesi gereken metinleri büyük oranda gözden kaçırdı. Bu haliyle kabul edilmedi. Aynı metni döndürerek literal kontrolü geçmek editoryal başarı değildir.

**Aktif deney V4:** [HF Job](https://huggingface.co/jobs/lovefengis/6b064ad11460ffe1d5e99908), RTX PRO 6000, azami 90 dakika. Sabit commit `183b177e4593d4d98a01fd992a82dd7a6bca691f`, [run-editor-audit.py](run-editor-audit.py). Aynı 52 geliştirme vakası ve üç model üzerinde doğrudan düzenleme, kaynakta birebir alıntıyla kanıtlanan kusurlara göre düzenleme ve karşılaştırmalı son okuma. Karar ve biçim hataları ayrı raporlanır; referans kararları modelden saklanır. Bu deney bir bağımsız insan değerlendirmesi değildir. Tamamlanınca ham sonuçlar ve hata analizi kaydedilir. V3 ve V4 işleri tekrar başlatılmaz; diğer projelerin HF kaynaklarına dokunulmaz.
