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

**Önceki takip (tamamlandı, §9):** [HF Job: editor-decision-gate-v3](https://huggingface.co/jobs/lovefengis/6b0646781460ffe1d5e9916c), RTX PRO 6000, azami 60 dakika. Sabit kod commit'i `d298b2d2f0ae9abfe55f4602fbc58636ef5a42a3`. [Deney kodu](run-editor-gate.py). 3 model × 52 vaka için karar (KORU/DÜZELT), doğrudan skill, karar kapılı skill ve karar kapılı kısa edit talimatı. Modelin KORU kararı yalnız model çıktısına dayanır, referans kararı verilmez. Ham kararları, yanlış koruma/düzenleme ve biçim/olgu risklerini ayrı değerlendir. Aynı örnekler geliştirme setidir; bağımsız kalite onayı değildir. Sonuçlar §9'da; aynı işi tekrar başlatma.

## 9. Karar kapısı V3 ve somut bulgu V4

[HF Job: V3](https://huggingface.co/jobs/lovefengis/6b0646781460ffe1d5e9916c) tamamlandı: 156 karar ve 468 çıktı. Geliştirme setinde 24 KORU ve 28 DÜZELT vakası var. Yalnız doğru karar sayısı:

| Model | KORU | DÜZELT | Geçerli karar |
|---|---:|---:|---:|
| [Qwen3-8B](results/editorial-gate-v3-qwen-qwen3-8b.json) | 22/24 | 6/28 | 51/52 |
| [Turkish Gemma 9B](results/editorial-gate-v3-ytu-ce-cosmos-turkish-gemma-9b-v0-1.json) | 23/24 | 5/28 | 52/52 |
| [Qwen3-32B](results/editorial-gate-v3-qwen-qwen3-32b.json) | 23/24 | 5/28 | 52/52 |

Karar kapısı gereksiz müdahaleyi azaltsa da düzenlenmesi gereken metinleri büyük oranda gözden kaçırdı. Bu haliyle kabul edilmedi. Aynı metni döndürerek literal kontrolü geçmek editoryal başarı değildir.

**V4 deney tanımı (tamamlandı, §10):** [HF Job](https://huggingface.co/jobs/lovefengis/6b064ad11460ffe1d5e99908), RTX PRO 6000, azami 90 dakika. Sabit commit `183b177e4593d4d98a01fd992a82dd7a6bca691f`, [run-editor-audit.py](run-editor-audit.py). Aynı 52 geliştirme vakası ve üç model üzerinde doğrudan düzenleme, kaynakta birebir alıntıyla kanıtlanan kusurlara göre düzenleme ve karşılaştırmalı son okuma. Karar ve biçim hataları ayrı raporlanır; referans kararları modelden saklanır. Bu deney bir bağımsız insan değerlendirmesi değildir. Ham sonuçlar ve hata analizi §10'da. V3 ve V4 işleri tekrar başlatılmaz; diğer projelerin HF kaynaklarına dokunulmaz.

## 10. V4 tamamlandı: somut bulgu ve aynı modelle son okuma

[Job](https://huggingface.co/jobs/lovefengis/6b064ad11460ffe1d5e99908) 25 Kasım 2026, COMPLETED. Sabit deney commit'i `183b177e4593d4d98a01fd992a82dd7a6bca691f`. 3 model, 52 geliştirme vakası/model; 156 teşhis, 468 çıktı, 142 karşılaştırma kararı. Ham kayıtlar:

| Model | Geçerli teşhis /52 | KORU vakası birebir, doğrudan → teşhisli → son okuma (/24) | DÜZELT vakasında değişiklik, doğrudan → teşhisli → son okuma (/28) | Hakemin B tercihi |
|---|---:|---:|---:|---:|
| [Qwen3-8B](results/editorial-audit-v4-qwen-qwen3-8b.json) | 44 | 16 → 8 → 14 | 16 → 22 → 16 | 26/38 |
| [Turkish Gemma 9B](results/editorial-audit-v4-ytu-ce-cosmos-turkish-gemma-9b-v0-1.json) | 1 | 0 → 0 → 3 | 28 → 28 → 27 | 48/52 |
| [Qwen3-32B](results/editorial-audit-v4-qwen-qwen3-32b.json) | 37 | 0 → 0 → 4 | 28 → 28 → 27 | 47/52 |

Değişen metin iyileşmiş sayılmaz; geçerli JSON da doğru teşhis değildir. V4 şu haliyle varsayılan skill'e alınmadı. Aynı modelin kaynak A ve revizyon B sıralı hakemliği bağımsız değildir; yüksek B seçimi tek başına konum yanlılığını kanıtlamaz. Somut olumsuz örnekler:
- `editorial-dev-001`, Qwen3-32B: doğru belirtme çekimi olan “olmadığını” yerine “olmadığı henüz bilmiyoruz” getirdi. Hakem B'yi tercih etti.
- `long-dev-001`, Turkish Gemma: “sipariş sayısının değişmemesi” yerine “sipariş sayısındaki değişim” getirerek verilen olguyla çelişti. Başlığı kaldırdı; hakem B'yi tercih etti.
- `long-dev-006`, Qwen3-8B: birinci şahıs anlatımını edilgene çevirdi, hazırlık süresini anlatan cümleyi bozdu. Hakem bunlara rağmen B'yi tercih etti.
- `editorial-dev-001`, Qwen3-8B: iyi metinde “ilk hafta” bilgisinin silinmesini kusur giderme olarak önerdi; biçimsel teşhis doğrulaması anlamsal muhakemeyi garanti etmedi.

### 10.1 Ücretsiz yapısal tekrar oynatma

[Offline replay sonuçları](results/editorial-structure-replay-v4.json): aynı 468 çıktı üzerinde yalnız benzersiz ve değişmemiş başlıkta Markdown işaretini geri koyma; kalan başlık, bağlantı, tablo ve satır içi kod farkında kaynak metne dönme. 7 sentetik çekirdek kontrolü geçti. Son okuma kolunda kalan yapısal farkı olan vaka sayıları Qwen3-8B 3, Gemma 9, Qwen3-32B 3. Ancak geri alma Qwen3-8B'de düzenleme gereken vakalarda değişiklik sayısını 16'dan 13'e, Gemma'da 27'den 19'a, 32B'de 27'den 26'ya düşürdü. Bu korumayı başarı sayma: anlamsal hataları yakalamaz ve editoryal kusuru kaynakta bırakabilir. Kod deneysel sonuçta saklı; üretime alınmadı. Ek GPU çalıştırılmadı.

### 10.2 Bağımsız holdout ve bir sonraki hipotez

[Bağımsız değerlendirme protokolü](HOLDOUT.md) ve [manifest doğrulayıcı](validate-holdout.mjs) eklendi. 9 sentetik fonksiyon kontrolü geçti; yeni Node test dosyasının gerçek CLI koşusu ayrıca doğrulanmalıdır. Kaynak, yazar, konu ve birebir hash gruplarının bölüm sızıntısı denetlenir. Aday lisans kaynakları araştırıldı, fakat henüz insan onaylı örnek yok.

Sonraki deneyde tüm belgeyi yeniden ürettirmek yerine değiştirilecek doğal metin parçalarını kesin kaynak alıntısıyla sınırla; belge yapısı, bağlantılar ve değiştirilmemiş paragraflar mekanik olarak korunsun. Çok paragraflı akış gerektiren durumda paragraflar arasında düzenlemeye izin ver; modelden noktasal değişiklik gerekçesi iste. Eşleştirme belirsizse uygulama, model çıktısında bulunmayan yeni olgu veya kip değişimini insan/bağımsız değerlendirme ile kontrol et. Önce CPU'da yama uygulayıcısının testlerini ve bağımsız inceleme paketini doğrula; yalnız sonra yeni anlamlı GPU deneyi başlat. A/B sunum sırası dengeli olmalı; V4 aynı modelin kendini onaylamasıyla kaliteyi ispatlamadı.

### 10.3 Maliyet ve atıflar

[Hesap çizelgesi](results/compute-ledger-2026-11-25.json), [resmî HF tarifesi](https://huggingface.co/docs/hub/en/jobs-pricing) ile oluşturuldu. V4 duvar süresi 24,182 dk, saatlik 2,75 USD, yaklaşık 1,1084 USD; 90 dk süre sınırının nominal bedeli 4,125 USD. Sonlanma zamanı bilinen 7 proje işi için yaklaşık 2,5584 USD; üç iptal edilen işin süreleri ve gerçek fatura bilinmiyor. Toplam gerçek harcama iddia edilmiyor. Başka proje işleri çizelgeye girmedi. [Model atıfları](LICENSE-DATA.md) sabit model sürümleriyle güncellendi.

## 11. V5: tüm metni yeniden üretmek yerine kaynağa bağlı düzenleme

25 Kasım 2026. V4'te aynı modelin kendi revizyonunu onaylayabilmesi ve doğru kaynak cümlelerini bozması nedeniyle yeni deney, çıktı biçimini değiştirdi. [Yama uygulayıcısı](editor-patches.mjs) yalnız kaynak düz yazı bloğundaki benzersiz birebir alıntıyı değiştirir. Kaynağın diğer parçaları yeniden üretilmez. Blok indeksi, geçerli şema, çakışmayan değişiklikler, sözcük sınırı, sayı/bağlantı/alıntı/işaretleyici dizisi ve yapı denetlenir. Geçersiz öneri bütün olarak reddedilir; bu geri dönüş editoryal başarı sayılmaz. Başlık, tablo, liste, kod gibi bloklar bu deneyde değişmez. Sınırlama: olumsuzluğun silinmesi gibi bir anlam hatası teknik olarak geçebilir; Markdown koruması tam ayrıştırıcı değildir. Sonuçlar insan editör değerlendirmesine tabidir.

[Referans erişilebilirlik deneyi](results/patch-reference-feasibility-v5.json): mevcut 40 sentetik kısa vakada 18 koruma ve 22 düzenleme referansının tamamı bu temsil biçimiyle oluşturulabiliyor. Referanslar modele gösterilmedi; bu test üretim başarısı değildir. 12 uzun vakanın referans metni olmadığı için bu sayıya katılmadı.

[CPU regresyon işi](https://huggingface.co/jobs/lovefengis/6b06625d1460ffe1d5e9bc20) tamamlandı. Test edilen commit `c44a57511b8cdc4fdd9e2fd613e1d11d45ccce93`: Corpus Lab Node 39/39 (27 yeni yama testi dahil), npm 167 başarılı, 7 atlanan, 0 başarısız; Python Corpus Lab 5/5, Unicode 2/2. CPU Basic, 10 dk sınır, nominal azami 0,001667 USD, duvar süresi 13,459 saniye; fatura doğrulanmadı. Test çıktısında CPU_REGRESSION_COMPLETE var.

[V5 GPU işi](https://huggingface.co/jobs/lovefengis/6b06629b1460ffe1d5e9bc9b) başladı. [Deney betiği](run-editor-patches.py), sabit commit `d0b6e30e085d58cdd750de4ddb11a37357f2bedd`; aynı 52 geliştirme vakası ve V4'teki üç sabit model revizyonu. RTX PRO 6000, 60 dk sınır, 2,75 USD/saat (25 Kasım [Jobs tarifesi](https://huggingface.co/docs/hub/en/jobs-pricing)). Tek model kolu `exact_span_patch`, her vaka için ham JSON önerisi, kaynak ve istem hash'i. Sonuçlar gelince JSON geçerliliği, yama uygulanabilirliği, korunacak metinde gereksiz değişiklik, gereken düzenlemede gerçek değişiklik ve kalan anlam riskleri V4 ile karşılaştırılacak. V4 doğrudan çıktı ile istem biçimi ve token bütçesi farklı olduğundan mimari karşılaştırma olarak raporlanacak, tek etkene nedensellik atfedilmeyecek. 156 beklenen kayıt tamamlanmadan deney tamamlandı sayılmaz. Bu iş sürerken ikinci Turkish Writer GPU işi açılmayacak. [Maliyet çizelgesi](results/compute-ledger-2026-11-25.json). V5 henüz aktif skill'e entegre edilmedi.


## 12. V5 sonuçları: yapısal güvenlik, editoryal seçim değil

[GPU işi](https://huggingface.co/jobs/lovefengis/6b06629b1460ffe1d5e9bc9b) COMPLETED, 25 Kasım 2026. 3 model × 52 kayıt, her modelin BENCHMARK_COMPLETE işareti mevcut, log kesilmemiş; log API'sindeki finished bayrağı false olsa da inspect tamamlanmış ve tüm kayıtlar mevcut. Uygulayıcı mantığı JS ortamında aynı algoritmayla yeniden yürütüldü; ham öneriler, vaka/kol kimlikleri ve uygulanmış metinler kayıtlı. Çitli JSON için açık biçim normalizasyonu yapıldı. Red halinde kaynak aynen döner; koruma başarısıyla karıştırılmamalı.

| Model | JSON okundu /52 | Geçerli uygulama /52 | KORU birebir /24 | DÜZELT değişen /28 | Uzun DÜZELT değişen /6 |
|---|---:|---:|---:|---:|---:|
| [Qwen3-8B](results/editorial-patches-v5-qwen-qwen3-8b.json) | 52 | 42 | 6 | 24 | 3 |
| [Turkish Gemma 9B](results/editorial-patches-v5-ytu-ce-cosmos-turkish-gemma-9b-v0-1.json) | 51 | 43 | 12 | 19 | 3 |
| [Qwen3-32B](results/editorial-patches-v5-qwen-qwen3-32b.json) | 52 | 48 | 11 | 23 | 5 |

133/156 uygulanabilir çıktı, 23 red. Qwen3-8B hiçbir geçerli boş yama üretmedi; Gemma ve 32B 12'şer boş yama üretti. V5, V4 son okumasına kıyasla Qwen3-8B koruma sayısını 14'ten 6'ya düşürdü; Gemma 3→12, 32B 4→11. Karşılaştırma farklı istem ve çıktı bütçesi nedeniyle mimari karşılaştırmadır. Değişim sayısı editoryal iyileşme değildir.

Somut hatalar (sentetik proje vakaları):
- Qwen3-8B `editorial-dev-020`: düzgün yazar sesi yerine “zorluğuydı” yazdı; teknik uygulayıcı kabul etti.
- Qwen3-8B `editorial-dev-016`: “değerlendirilmekte olup” yapısını özne/çekim ilişkisini bozarak kullandı.
- Gemma `editorial-dev-004`: deneme hesabı kapsamındaki sınırlamayı zayıflattı, hesabın kapanmasını iki kez anlattı.
- Gemma `editorial-dev-031`: kaynakta olmayan parantezli kapsam ekledi, KDV cümlesini tekrarladı.
- Qwen3-32B `editorial-dev-019`: öneriyi zorunluluğa yaklaştırdı; `editorial-dev-007` doğal olmayan “karar verileceği bekleniyor” ifadesini bıraktı.
- Qwen3-8B ve 32B `editorial-dev-033`: düz yazı için uygulanabilir öneri, aynı çıktıda gereksiz liste/no-op önerisi yüzünden tamamen reddedildi. Red koruma olarak raporlanır fakat iyileştirme değildir.

Yama uygulayıcısı yapıyı korumak için değerlidir, fakat değişiklik seçimi ve anlam denetimi hâlâ zayıf; V5 aktif skill'e eklenmedi. Sonraki izole hipotez: aynı yama biçimi, veri, model, uygulayıcı, token bütçesi altında yalnız editoryal karar örneklerini değiştir; kozmetik resmileştirme ile gerçek kusur arasındaki ayrım, komşu cümlede tekrar, olumsuzluk/kip/özne ve kaynakta olmayan kapsamı özellikle göster. Örnekler test setinin metinlerinden alınmayacak. Bağımsız insan doğrulaması hâlâ gerekli.

Maliyet: 12,243 dk, 2,75 USD/saat üzerinden yaklaşık 0,5611 USD; 60 dk nominal üst sınır 2,75 USD. Süresi bilinen dokuz işin tahmini toplamı 3,119571 USD; üç iptal işinin süreleri ve gerçek fatura bilinmiyor. [Maliyet kaydı](results/compute-ledger-2026-11-25.json).

## 13. V6: karşılaştırmalı editoryal karar örnekleri

[HF Job](https://huggingface.co/jobs/lovefengis/6b06700e1460ffe1d5e9d4e9), COMPLETED (25 Kasım 2026; sonuçlar §14). Sabit kod `78ece08bc239c7a09ee6ce2d6a7fccf2c5e6ec58`. Aynı üç model revizyonu, 52 geliştirme vakası, 1024 çıktı token sınırı, V5 yama biçimi ve uygulayıcısı. Tek deneysel fark, isteme eklenen altı konu bağımsız sentetik karar örneği: iyi metni olduğu gibi bırakma, adlaştırmayı azaltma, kip ve kapsam sadakati, komşu cümlede tekrar, belirsiz özne. Bu örnekler insan onaylı veri değildir ve test referansları modele verilmez. `--variant v6`; varsayılan v5 yolu korunur. Başarı ölçütü yalnız geçerli JSON değil: KORU vakasında gereksiz değişiklik azalmalı, DÜZELT vakalarında gerçek iyileşme kaybolmamalı; özellikle V5'teki hatalar ve yeni anlamsal kusurlar vaka bazında incelenir. RTX PRO 6000 (96 GB), 60 dk sınır, 2,75 USD/saat [tarife](https://huggingface.co/docs/hub/en/jobs-pricing); nominal azami 2,75 USD. Sonuç görülmeden aktif skill değişmez. Başka projelerin işleri yönetilmedi.

## 14. V6 sonuçları ve Gemma protokol hatası

25 Kasım 2026. [V6 GPU işi](https://huggingface.co/jobs/lovefengis/6b06700e1460ffe1d5e9d4e9) COMPLETED, kesilmemiş loglarda 156 benzersiz vaka kaydı ve 3 BENCHMARK_COMPLETE. V5 uygulayıcı algoritması aynı JS ortamında yeniden yürütüldü; önceki 156 kayıt için uygulama durumu ve metin birebir yeniden üretildi. V6 için:

| Model | Uygulanabilir /52 (V5→V6) | KORU birebir /24 | DÜZELT değişen /28 | Uzun DÜZELT değişen /6 |
|---|---:|---:|---:|---:|
| [Qwen3-8B](results/editorial-patches-v6-qwen-qwen3-8b.json) | 42→42 | 6→7 | 24→24 | 3→4 |
| [Turkish Gemma 9B](results/editorial-patches-v6-ytu-ce-cosmos-turkish-gemma-9b-v0-1.json) | 43→43 | 12→12 | 19→19 | 3→3 |
| [Qwen3-32B](results/editorial-patches-v6-qwen-qwen3-32b.json) | 48→52 | 11→17 | 23→21 | 5→5 |

**Gemma sonucu V6 müdahalesinin testi değildir.** Kaynak kodunun Gemma tek kullanıcı mesajı dalı seçilmiş `prompt` yerine sabit `PATCH` kullanmış. V5 ile 52/52 gerçek render hash'i ve 52/52 ham çıktı aynı. RUN_INFO genel istem hash'i doğru görünmesine rağmen model örnekleri hiç görmemiş. Qwen modellerinde V5 ile aynı render hash'i 0/52. Bu yüzden Gemma'yı V6 iyileşme/başarısızlık iddiasına dahil etme. [Düzeltme](https://github.com/systemonster/turkish-writer/commit/5d9e850a21069d68bcb86c0eefd4019936ff6c4a) tek satırda aynı seçilmiş istemi kullanır. Yalnız eksik Gemma kolu, aynı model revizyonu, batch 4, 1024 token ve aynı RTX PRO 6000 donanımıyla yeniden çalıştırıldı: [düzeltilmiş V6 işi](https://huggingface.co/jobs/lovefengis/6b067c90d0582cfbbefdc6a9), azami 30 dk, nominal 1,375 USD. Bu işte V5 ile render hash eşitliği sıfır olmalı; 52 kayıt ve tamamlanma işareti aranacak. Qwen deneyleri tekrarlanmayacak.

V6 Qwen3-32B teknik geçerlilik ve gereksiz müdahale göstergesinde ilerleme var; ama anlam sadakati hâlâ başarısız:
- `long-dev-001`: "söylenmesi mümkün değildir" → "iddiası geçerli değildir" ile kanıt yokluğundan iddianın yanlışlığına geçti. "ölçülüp ölçülmediği" yerine "ölçüldüğüne dair kontrol" de varsayımı değiştirdi.
- `editorial-dev-019`: önem bildiren ifadeyi "hareket edilmelidir" gerekliliğine yaklaştırdı.
- `editorial-dev-007`: "bekleniyor" kipini kesin gelecek ifadeye dönüştürdü.
- Qwen3-8B `long-dev-011`: "değerlendirmeye alınamadığı" yerine "değerlendirmeye alınmaması" kullandı; olumsuz çekim ve anlam bozuldu.
- Qwen3-8B `editorial-dev-004`: "yalnızca" kapsamını yitirdi.
- Qwen3-8B `long-dev-001`: yapı reddi nedeniyle düzenleme hiç uygulanmadı.

Bu vakalar, geçerli yama ve birebir koruma sayılarının tek başına yeterli olmadığını gösteriyor. Ham sonuçlardaki protected_review kısa vakaların reference_required ve uzun vakaların protected_literals alanlarını kapsar; V5 özetindeki yalnız protected_literals sayısıyla doğrudan kıyaslanmamalı. İfade değişikliği sinyali anlamsal hata hükmü değildir. V6 mevcut skill'e alınmadı. Bir sonraki yön: yeni istem varyasyonunu yalnızca tekrar tekrar aynı geliştirme vakalarına uydurmak yerine bağımsız insan değerlendirmesi ve anlam koruma karşılaştırmalarına ağırlık ver.

V6 duvar süresi 11,399 dk; resmî 2,75 USD/saat tarife ile tahmini 0,522464 USD. Süresi bilinen on işin tahmini toplamı 3,642035 USD. Fatura ve tamamlanmamış/iptal edilmiş işlerin süreleri doğrulanmadı. [Maliyet kaydı](results/compute-ledger-2026-11-25.json). Kaynaklar ve diğer projelerin işleri korunuyor; yayın kapısı kapalı.
