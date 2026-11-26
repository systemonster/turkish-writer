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

## 15. Düzeltilmiş Gemma V6 ve anlam sadakati V7

25 Kasım 2026. [Düzeltilmiş Gemma işi](https://huggingface.co/jobs/lovefengis/6b067c90d0582cfbbefdc6a9) COMPLETED; 52 benzersiz kayıt, tamamlanma işareti, kesilmemiş log. V5'le birebir render hash eşitliği 0/52, ham çıktı eşitliği 1/52. İstem iletim hatası giderildi. [Tam sonuç](results/editorial-patches-v6-gemma-corrected.json); yanlış render içeren önceki V6 kaydı deney geçmişinde tutulur.

| Ölçüt | V5 | Düzeltilmiş V6 |
|---|---:|---:|
| Uygulanabilir yama /52 | 43 | 44 |
| KORU birebir /24 | 12 | 4 |
| DÜZELT değişen /28 | 19 | 23 |
| Uzun DÜZELT değişen /6 | 3 | 3 |

Gemma'da koruma geriledi. Teknik olarak geçerli düzenlemelerde de ağır anlam hataları var:
- `editorial-dev-002`: gönderim süresinde düşüş olasılığı → “gönderim süresini yavaşlatabilir” (yön tersine döndü).
- `editorial-dev-001`: tasarımın payı olup olmadığı bilinmiyor → “ne ölçüde katkıda bulunduğunu” (etki varlığı varsayılıyor).
- `editorial-dev-015`: “yanıltıcı olabilir” → “yanıltıcı olur” (kesinlik artışı).
- `editorial-dev-039`: doğru ölçümün önemi → “sonuçların doğru yorumlanmasını sağlar” (garantiye dönüşüm).
- `long-dev-010`: “yeterli olabilir” → “yeterlidir” (olasılık kesinlik oldu).
- `long-dev-011`: “değerlendirmeye alınamadığı” → “değerlendirmeye alınmadığı” (yapamama ile yapmama ayrımı).
- `editorial-dev-026`: kaynakta belirtilmeyen “kamuoyuyla” eklendi.
- `long-dev-006`: hazırlık sürelerinin ölçülmediği bilgisi karşılaştırılamadığı iddiasına dönüştü; kaynakta olmayan soru ve öneriler eklendi.

V6 hiçbir modelde yayına alınmadı. V7, yeni bir düzenleme istemini aynı 52 vakaya tekrar uydurmak yerine **anlam farkını ayırt etme** becerisini izole eder. [16 sentetik karşılaştırma vakası](semantic-contrast-v1.jsonl) yön, belirsizlik, kesinlik, kapsam, olumsuzluk, özne, zorunluluk, koşul, zaman, karşılaştırma, atıf, yeterlilik, nedensellik, yazar sesi, miktar ve süre hatalarını içerir. Proje üretimi geliştirme vakalarıdır; bağımsız insan testi değildir. [Betiği](run-semantic-contrast.py) iki istem (genel sadakat / somut anlam kontrol listesi) ve her vakada iki sunum sırası, 64 karar/model, 192 toplam karar. Model revizyonları sabittir; doğru etiket yalnız sonuç kaydında, model girdisinde değildir. Doğru/yanlış/geçersiz/kararsız ve iki sırada da doğru seçim ayrı sayılacak. Etiket seçimi, doğal Türkçe üretimi veya bağımsız insan kalitesi kanıtı değildir. Bu testte başarısız olan kontrol listesi hakem olarak kullanılmayacak; başarılı olan da tek başına yayın kapısı açmayacak.

[V7 HF Job](https://huggingface.co/jobs/lovefengis/6b068b10d0582cfbbefde303), sabit commit `47db1152c043db722bcb1292496cee5dbf1ce9bb`, RTX PRO 6000 96 GB, azami 30 dk, nominal 1,375 USD. Önceki Turkish Writer işlerinin bitişi doğrulandı; tek GPU işi başlatıldı. Derleme ve self-test işin başlangıcında çalıştırılacak; sonuç görülmeden başarılı sayılmaz. Gemma düzeltmesinin duvar süresi 3,181 dk, yaklaşık 0,14579 USD. Tamamlanma süresi bilinen 11 iş için yaklaşık 3,78783 USD; üç iptal işinin süresi ve gerçek fatura bilinmiyor. [Maliyet çizelgesi](results/compute-ledger-2026-11-25.json), [25 Kasım HF tarifesi](https://huggingface.co/docs/hub/en/jobs-pricing). Başka proje kaynaklarına dokunulmadı.

## 16. V7 sonuçları ve bağımsız insan değerlendirmesi altyapısı

25 Kasım 2026. [V7 GPU işi](https://huggingface.co/jobs/lovefengis/6b068b10d0582cfbbefde303) COMPLETED. 192 benzersiz karar, üç RUN_INFO, üç BENCHMARK_COMPLETE; log kesilmemiş. [Tam model/kol/vaka/sıra sonuçları](results/semantic-contrast-v7.json), sabit model sürümleri ve gerçek istem hash'leri dahil.

| Model | Genel: doğru /32 | Kontrol listesi: doğru /32 | Genel: iki sırada doğru /16 | Liste: iki sırada doğru /16 |
|---|---:|---:|---:|---:|
| Qwen3-8B | 29 | 28 | 13 | 12 |
| Turkish Gemma 9B | 15 | 2 | 5 | 0 |
| Qwen3-32B | 32 | 28 | 16 | 12 |

Gemma genel kolunda 14 geçersiz, 2 eşit, 1 yanlış; kontrol listesinde 27 geçersiz, 1 eşit, 2 yanlış. Uzun açıklamalar ve token sınırı protokol başarısızlığıdır; semantik yanlışla aynı kategori değildir. Qwen3-32B kontrol listesindeki dört geçersiz cevap açıklama üretmiş, geçerli yanlış seçim yapmamıştır. 8B'de kapsam ve kesinlik (semantic-dev-003/004) her iki istemde yanlış seçilebilmiştir. Ek kontrol listesi üç modelde de toplam doğru karar sayısını artırmadı; varsayılan hakem olarak kabul edilmedi. Qwen3-32B'nin genel kolu bu küçük sentetik ayırt etme testinde başarılıdır, ancak daha önce gerçek düzenlemelerde anlam bozmuştur. Karşılaştırmalı seçim, editörlük üretim başarısı değildir. Aynı 16 örneğe istem uydurmak yerine bağımsız insan değerlendirmesi önceliklendirildi.

### V8: kör inceleme altyapısı (GPU yok)

[build-review-packets.mjs](build-review-packets.mjs) ve [testleri](tests/review-packets.test.mjs) eklendi. İki editör için ayrı anonim paket, her model için dengeli A/B sırası ve tersleme, koordinatöre özel anahtar, kaynak hash bağlama, test/geliştirme ayrımı, eksik/başarısız çıktının saklanması ve değerlendirme şablonu sağlanıyor. [Kullanım ve puanlama yönergesi](HOLDOUT.md). Paketler yalnız git dışı work dizininde oluşur. Gerçek insan onayı veya lisans kontrolü otomatik varsayılmaz.

[CPU regresyon işi](https://huggingface.co/jobs/lovefengis/6b069ad2d0582cfbbefe0594), COMPLETED, sabit commit `f240266fc1bd930dfe280d3bcc06abfc2d6a713a`. Kesilmemiş log, REVIEW_PACKET_REGRESSION_COMPLETE. Corpus Lab 50/50 (11 yeni paket testi), npm 167 başarılı, 7 atlanan, 0 başarısız. Dondurulmuş V2 uzun metin dosyasının blob SHA'sı `f778c165a56eb57804c20a747e633848d276ee1f`; V2 commit'i ve güncel geliştirme dalında aynı. İki modelin önceki baseline/skill çıktılarıyla 12 uzun geliştirme vakası, 24 karşılaştırma/editör, 48 atama denenmiştir. Bunlar insan puanları değildir. Üçüncü taraf ham metin yayımlanmadı; holdout henüz oluşmadı. Aktif skill ve watermarks-remover bileşenleri değiştirilmedi.

Maliyet: V7 duvar süresi 3,0918 dk, yaklaşık 0,141708 USD; V8 CPU 9,434 sn, yaklaşık 0,000026 USD, nominal azami 0,001667 USD. 13 süresi bilinen proje işi toplam tahmini 3,929560 USD; üç iptal işinin süresi ve gerçek fatura bilinmiyor. [Maliyet kaydı](results/compute-ledger-2026-11-25.json), [resmî tarife](https://huggingface.co/docs/hub/en/jobs-pricing). Yeni GPU başlatılmadı. Bağımsız, izinli uzun metin ve gerçek insan editör puanları yayın için eksik. Bir sonraki çalışma: hakları doğrulanabilir kaynak seçimi ve bağımsız inceleme paketinin puan toplama/doğrulama aşaması; aynı sentetik istem deneylerini gereksiz tekrarlama. master ve başka proje kaynakları değiştirilmedi.


## 17. V9: kör inceleme puanlarının doğrulanması

25 Kasım 2026. V2, V7 ve V8 işlerinin inspect/logs kayıtları tekrar kontrol edildi; tamamlanmış sonuçlar yeniden commit edilmedi. V8'de eksik kalan puan toplama aşaması için [collect-reviews.mjs](collect-reviews.mjs) ve [sekiz regresyon testi](tests/collect-reviews.test.mjs) eklendi. Kaynak ve çıktı hash'leri, iki değerlendiricinin tam vaka/kol envanteri, kimlik ayrımı, puan aralığı ve kritik hata gerekçesi kontrol edilir. Ters A/B sıraları doğru kola çevrilir; eksik çıktılar ve kritik hatalar sayılır, anlaşmazlıklar işaretlenir. Sonuçlar model bazında hesaplanır; gerçek insan değerlendirmesi veya nihai yayın kararı araç tarafından onaylanmaz. [Protokol](HOLDOUT.md).

[CPU doğrulaması](https://huggingface.co/jobs/lovefengis/6b06a8751460ffe1d5ea4ead): COMPLETED, test edilen commit `4822e479e231c36d6b6299eb6e04a4a43415db77`. Kesilmemiş log, REVIEW_COLLECTION_REGRESSION_COMPLETE. Corpus Lab 58/58, npm 167 başarılı, 7 atlanan, 0 başarısız. Yeni sekiz test sentetik puanlarla veri doğrulama ve hesaplamayı sınar; gerçek editör puanı değildir. Python/Unicode regresyonları bu turda yeniden çalıştırılmadı; ilgili bileşen değişmedi.

CPU Basic 10 dk sınır, 0,01 USD/saat, nominal 0,001667 USD, 20,279 sn duvar süresi, tahmini 0,000056 USD. [Maliyet çizelgesi](results/compute-ledger-2026-11-25.json) 14 süre bilgili iş için yaklaşık 3,929616 USD; üç iptal işinin süresi ve gerçek fatura bilinmiyor. GPU kullanılmadı. Kaynak incelemesinde tarih, özgün yazarlık ve metne özgü lisans kanıtı bulunmayan adaylar kabul edilmedi. Üçüncü taraf ham metinler yayımlanmadı. Henüz bağımsız holdout veya iki gerçek editörün değerlendirmesi yok. Yeni istem/GPU deneyine sırf tur ilerletmek için başlanmadı. Aktif skill, Unicode vendor ve master değiştirilmedi; diğer HF projelerine müdahale edilmedi.

## V11 — üretmeyen son kontrol

[Tarihsel V10 sonuçları, seçici V11 düzeltmesi, ön test ve GPU deney kaydı](V11-SELECTION-REVIEW.md). Bu turdaki tek GPU işi `6b06c542d91f621b9307756e`; önce bu kesin kimliği ve özel sonuçlarını kontrol et. Aynı çalışmayı yeniden başlatma. Aktif skill ve yayın kapısı değişmedi.


## V18 — tarihsel düzenleme çiftleri ve editoryal bağlam

25 Kasım 2026. Önceki V17 bağlam kılavuzunun devamında 50 tarihsel Vikipedi düzenleme adayı, 98 benzersiz revizyon kimliği üzerinden geri alındı. İlk iki CPU işi (`6b06ed7cd91f621b9307fc7a`, `6b06eda5d91f621b93080363`) ERROR: uzunluk/biçim denetiminin test örneği. Açık denetim ve ayrı hata gerekçeleriyle düzeltildi; üçüncü toplama işi [6b06ef09d91f621b930808e2](https://huggingface.co/jobs/lovefengis/6b06ef09d91f621b930808e2) COMPLETED. Özel ham veri özeti, kaynak kimlikleri, önceki geçici sınıflar ve somut editoryal çıkarımlar [wiki-context-review-v18.json](results/wiki-context-review-v18.json) içinde. 14 yazım, 4 bağlamsal tercih, 10 anlam/olgu değişikliği veya belirsizlik, 4 kuşkulu/kısmi düzeltme, 18 vandalizm/geri alma adayı; bu sınıflar bağımsız insan onayı değildir. 18 çiftin gösterilen bağlamları ve diğer 32 çiftin değişiklik pencereleri AI incelemesinden geçti. Daha sonraki geri almalar ve olgular doğrulanmadı. Kaynak parçaları dağıtılmadı; [lisans/atıf](LICENSE-DATA.md) eklendi.

Somut ürün değişikliği: [bağlamlı Türkçe](../skills/turkish-writer/references/baglamli-turkce.md) kılavuzu §7 ve SKILL.md içinde düzeltmenin kapsamı, arayüz/teknik terimi, kip, kapsam ve yeni olgu ayrımı; tek yazım değişikliği bütün metnin doğruluğunu ispatlamaz. Üç eski referans (yasakli-kaliplar-tr.md, turkce-parmak-izi.md, sicil.md) gerçek kusur, kaynak sadakati ve bağlam önceliğiyle uyumlu hale getirildi. Anlam genişleten eski örnekler değiştirildi; tarihsel kalibrasyon sonuçları, kaynaklar ve dosya yolları korunarak bağlayıcı olmayan ölçümler olarak belirtildi. Kaldırılan dosya yok. Üç derlem kılavuzunun paket dışına çıkan göreli kanıt bağlantıları doğrulanmış sabit GitHub commit bağlantılarına dönüştürüldü; yerel kuruluma ağ bağımlılığı eklenmedi.

CPU regresyonu [6b06eec5b6a90bbe997d983a](https://huggingface.co/jobs/lovefengis/6b06eec5b6a90bbe997d983a) COMPLETED (sabit commit `c05aa8259171535f67309fc97e6e3ddb23c8d950`); gerçek revizyon toplama self-test'i, paket kopyası/kanıt bağlantıları ve 263 test başarılı, 7 atlanan, 0 başarısız. Son skill ve kaynak kılavuzu [6b06ef9dd91f621b93080ae3](https://huggingface.co/jobs/lovefengis/6b06ef9dd91f621b93080ae3) COMPLETED (sabit commit `895fe916ab1b908e5e2841d3ef3bb3163256f272`), 167 npm + 85 derlem Node + 9 Python + 2 Unicode = 263 başarılı; 7 atlanan, 0 başarısız; revizyon self-test, kanıt kimlikleri, bağımsız skill dizini ve Unicode vendor dosyaları doğrulandı. Atlanan testler isteğe bağlı derlenmiş yerel verilerle ilgilidir; bu turda V18'in editoryal kalite artışı iki model ve bağımsız insan değerlendirmesiyle ölçülmedi. [Beş CPU işi ve maliyet kaydı](results/compute-ledger-v18-context.json): ek tahmini 0,000843 USD, toplam bilinen duvar süresi tahmini 11,378172 USD; gerçek fatura değil. Yeni GPU yok; master ve diğer projeler değişmedi. Sonraki iterasyon aynı revizyonları toplamak yerine çok yazarlı, konu ayrımlı izinli gerçek blog/rehber kaynaklarına ve gözlenen editoryal kararların yeni metinlerde karşılaştırılmasına geçmeli.


## V19 — tam derlem, aktarım ve soru işlevi (25 Kasım 2026)

SUDO sabit arşivinin tüm 103 yazısı (32 yazar üst veri grubu, 2.405 blok, 96.480 sözcük, 8.113 sezgisel cümle) işlendi; [tam özet](results/sudo-full-text-v3-summary.json), CPU [6b06f57ad91f621b93081c11](https://huggingface.co/jobs/lovefengis/6b06f57ad91f621b93081c11) COMPLETED. FineWeb gerçek metin pilotu [6b06f5aab6a90bbe997dacf9](https://huggingface.co/jobs/lovefengis/6b06f5aab6a90bbe997dacf9) COMPLETED, sabit kod `4136b6f2c8c85f96fbb14059b1e9064c021027b4`: 305.560 satır = 240.872 işlenen metin + 64.623 üst veri eşiğini geçmeyen + 65 uzunluk sınırını aşan. 96.401.432 sözcük eşleşmesi, 7.243.612 sezgisel segment; başlangıç ve sıra sayımları doğrulandı. [Pilot özeti](results/fineweb-text-shard0-v3-summary.json) içerik/URL/kişi bilgisi taşımıyor. Üst veri tam taraması ve gerçek metin taraması ayrı işlemler; tam FineWeb metin kapsamı henüz tamamlanmadı. Eşikler, kaynak sürümü ve sınırlamalar özetlerde kayıtlı.

Somut editoryal değişiklik: altı eski BOUN train kanıtı, yeni aktarım/soru bağlamı açısından incelendi; [tam cümle kimlikleri ve gözlemler](results/reporting-question-context-v3.json) (ham cümleler yayımlanmıyor). SKILL.md, anlam-incelikleri.md ve baglamli-turkce.md içinde iç içe aktarımlar, soru/itiraz/iç ses, aktarım zamanı, konuşmacı, kip ve çıkarımın kapsamı ayrıldı. Önceki kılavuzdaki "cuma günü hazırdı" ifadesinin başka günleri dışladığı yönündeki hatalı açıklama ve belirsiz nedenin belirli nedene dönüştüğü örnek düzeltildi. FineWeb segment sayıları soru yanıtı veya iyi metin kanıtı sayılmadı. Özgün örnekler tarihsel alıntı değildir; bağımsız insan ve model karşılaştırması henüz yok.

CPU [6b06fc93d91f621b93083372](https://huggingface.co/jobs/lovefengis/6b06fc93d91f621b93083372) COMPLETED, sabit commit `0135d24e25e4240d9350a0c45b358a6e542de25b`: 167 npm + 85 derlem Node + 9 Python + 2 Unicode = 263 başarılı, 7 atlanan, 0 hata; tarama self-test, 85 dosyalı npm paket kontrolü ve ayrı skill dizininde Node/Unicode duman testi geçti. Sonraki `3469c861`, `ad6d6b4d`, `cab5dbaf` commitleri yalnız kaynak kimliği envanteri ve doğrulanabilir bağlantıları tamamladı. Testler editoryal kalite ölçümü değil.

[Devam eden FineWeb 1–24 metin aralığı](https://huggingface.co/jobs/lovefengis/6b06fca9d91f621b930833b6): CPU Upgrade, 4 worker, 60 dk / nominal azami 0,03 USD; aynı sabit scanner ve sürüm, shard bazında özel aggregate checkpoint, tamamlanan parçalar yeniden işlenmez. Üst veri census `6b06f44cd91f621b930818b0` çalışırken aynı census'u yeniden başlatma. [Güncel maliyet kaydı](results/compute-ledger-full-corpus-v2.json); bu derlem işlerinde bilinen duvar süresi tahmini 0,001975 USD, gerçek fatura değil. [HF tarife](https://huggingface.co/docs/hub/en/jobs-pricing), 25 Kasım. Master/release ve diğer projeler değişmedi. Bir sonraki turda mevcut aralıkların sonuç ve checkpointlerini doğrula, yalnız eksik shard'ları işle; yeni tür kaynaklarından bağlamlı editoryal karar çıkarmayı sürdür.


## V20 — edebî bağlam ve geniş derlem doğrulaması (25 Kasım 2026)

FineWeb gerçek metin aralığı [6b06fca9d91f621b930833b6](https://huggingface.co/jobs/lovefengis/6b06fca9d91f621b930833b6) COMPLETED; 1–24 aralığındaki 24 log kaydı ve bitiş işareti mevcut. Önceki 0 ile birlikte 25 özel JSON checkpoint'i tek tek okundu, kaynak/shard kimliği, satır dengesi, segment ve belirteç toplamları kontrol edildi; 24 iş logundaki envanterle eşleşti. [Toplu özet](results/fineweb-text-000-024-v3-summary.json): 8.088.471 satır = 6.267.928 uygun metin + 1.819.271 üst veri filtresinden elenen + 1.272 uzunluk sınırını aşan. 2.395.637.341 sözcük eşleşmesi, 179.641.597 sezgisel segment. Hash'ler worker'ın bildirdiği değerlerdir, bu turda bağımsız yeniden hesaplanmadı. Seçilmiş yüzey belirteci bulunmayan 169.954.128 segment vardır; bu, bağlaçların yokluğunu veya iyi metni kanıtlamaz. Tekilleştirme, tür ve özgün insan yazarlığı doğrulanmadı.

Üst veri census `6b06f44cd91f621b930818b0` ERROR (Job timeout), 0–148 tamamlanmış checkpoint ve log, 47.494.931 satır. Ön planda kalan 149–202 için [6b070863b6a90bbe997dea43](https://huggingface.co/jobs/lovefengis/6b070863b6a90bbe997dea43) açılmış; bu turda RUNNING ve 190 dahil checkpoint doğrulandı. Önceki işi tekrarlama. Metin taraması için [6b070b2ad91f621b930865f5](https://huggingface.co/jobs/lovefengis/6b070b2ad91f621b930865f5) RUNNING, 25–48 dahil, 4 worker, CPU Upgrade, 75 dk (önceki aralık 57 dk 29 sn sürdü), 0,0375 USD nominal sınır. Başlangıç kodu ve gerçek metin ilerleme logları görüldü; tamamlanmış sonuç değil.

Somut ürün değişikliği: [edebî bağlam incelemesi](results/literary-context-v20.json) Ömer Seyfettin'in *Kaşağı* (172873) ve *Forsa* (167612), Ahmet Haşim'in *Bize Göre / Gazi* (170026) ve *O Belde* (140719) sabit Vikikaynak revizyonlarının yakın okumasıdır. Olayın gerçekleşme sırası ile okurun öğrenme sırası, alışkanlık ile tek olay, diyalogda ısrar ve kesik söz, denemede ara düşüncenin savdaki işlevi ve şiirde dize boyunca süren sözdizimi ayrımları mevcut [uzun anlatı kılavuzu](../skills/turkish-writer/references/uzun-anlati.md) §8'e ve SKILL.md'ye işlendi. Özgün örnekler kaynak alıntıları değil; kaynağı belirsiz Orhan Veli sayfası kanıt kapsamına alınmadı. Tarihsel transkripsiyonda yazım/aktarım kusurları olabileceği belirtildi. Kaynak ve katkıcı atıfları [lisans envanterinde](LICENSE-DATA.md) güncellendi. Dört eser iki yazara ait, bağımsız holdout veya insan editör puanı değil. Tür ayrımlarının gerçekten iyileştiği henüz farklı modellerde ölçülmedi.

İlk V20 CPU `6b070b88b6a90bbe997df39f` ERROR, iki V19 dosyasının son bağlantı güncellemesi sonrası eski blob SHA'ları nedeniyle arşiv denetimi durdu; doğru SHA'lar sabit commit'ten alındı. [Düzeltilmiş regresyon 6b070b9db6a90bbe997df3cf](https://huggingface.co/jobs/lovefengis/6b070b9db6a90bbe997df3cf) COMPLETED, test edilen commit `cc88d8f704c786fd3bc933837576c0167544abdc`; 167 npm + 85 derlem Node + 9 Python + 2 Unicode = 263 başarılı, 7 atlanan, 0 başarısız. Edebî kanıt kimliği, 25 shard envanteri, paket içindeki referanslar, npm 85 dosya ve ayrı skill kurulumunda Node/Unicode duman testi doğrulandı. Testlerin geçmesi editoryal kalitenin doğrulandığı anlamına gelmez. [Derlem maliyet çizelgesi](results/compute-ledger-full-corpus-v2.json): terminal işler için bilinen duvar süresi tahmini 0,040787 USD; önceki V18 toplamı 11,378172 USD ile birlikte yaklaşık 11,418959 USD, gerçek fatura değil. Yeni GPU yok; master/release ve diğer projeler değişmedi. Sırada kalan gerçek metin parçalarını tekrar işlemeksizin sürdürmek, edebî kaynakları farklı yazar/tür ve çağdaş dil ile genişletmek, somut karşılaştırmalı faydayı ölçmek var.


## V22 — sicil değişiminde anlam ve tamamlanan derlem aralığı (25 Kasım 2026)

**Somut ürün düzeltmesi:** Türkçe kullanım atlası §5'teki eski örnekler aynı olayın farklı sicilleri olarak sunuluyordu. E-posta örneği geçmişteki erteleme gerekçesini devam eden bir duruma ve gelecekteki birinci çoğul kişi taahhüdüne çevirmişti; kişisel anlatı örneği bekleme deneyimi ekliyordu. Haber örneğinde ilk planlanan saat kayboluyor, toplantı odası tüm örneklerde salon oluyordu. [İlk düzeltme](https://github.com/systemonster/turkish-writer/commit/e26ec02f8a9ba323e3188a8991094ab89164e0d4), [örneğin son düzeltmesi](https://github.com/systemonster/turkish-writer/commit/80eff4c9dfda7dc24d6c4fa5edb07949c98dee1e). Dört gerçek olay anlatımı ayrı sicillerde aynı kaynak olgularını koruyor; kurmaca diyalog ayrı etiketlendi. Yeni iki paragraflı özgün örnek, başvuru alımının kapanmasıyla süre bitimini, incelemeye alma ile bitirmeyi, olasılıkla taahhüdü ve olay bildirimiyle talimatı ayırıyor. Yeni örnek bağımsız kör vaka değildir. Önce/sonra referans incelemesi ve yedi doğrudan kontrol, son blob `ef9a4daeffd3fb79b0820086d6cc13afe9bf17e8`; §5 dışındaki metin birebir aynı. Model kalitesi artışı veya insan editörü onayı ölçülmedi.

[CPU regresyon ve checkpoint denetimi 6b071807d91f621b93088f8e](https://huggingface.co/jobs/lovefengis/6b071807d91f621b93088f8e) COMPLETED, sabit commit `e26ec02f8a9ba323e3188a8991094ab89164e0d4`. npm test başarılı, 7 atlanan, 0 başarısız (bu logda npm başarılı test sayısının satırı görünmüyor); 85 derlem Node + 9 Python + 2 Unicode testi başarılı, paket 85 dosya, ayrı kurulum/Node/Unicode duman testi başarılı. Son örnekteki iki sözcük düzeltmesi bundan sonra yapıldı; tam testlerin tekrar çalıştırıldığı iddia edilmez, son dosya doğrudan regresyon ve fark denetiminden geçti. Atlananlar önceki isteğe bağlı yerel veri testleri. Yeni GPU işi yok.

**Derlem:** [25–48 metin aralığı özeti ve tam üst veri denetimi](results/fineweb-text-025-048-v3-summary.json). [25–48 işi](https://huggingface.co/jobs/lovefengis/6b070b2ad91f621b930865f5) COMPLETED; bitiş logu ve izleyici 24 shard envanterini doğruladı. 24 özel checkpoint tek tek okundu; kaynak/satır/segment/işaret dengesi doğrulandı. Bu aralıkta 7.789.899 satır, 5.862.930 uygun metin, 2.200.321.652 sözcük eşleşmesi, 165.166.074 sezgisel segment. Önceki 0–24 ile toplam 49/203 shard: 15.878.370 satır, 12.130.858 işlenen metin, 4.595.958.993 sözcük eşleşmesi. Metin hash'leri bağımsız tekrar hesaplanmadı. Seçili yüzey belirteci bulunmayan segment oranı 25–48'de yaklaşık %94,65; 0–24'te yaklaşık %94,60. Bu yakınlık tür veya kalite normu değildir, mevcut bağlamsal bağlaç kuralını değiştirmek için yeni gerekçe oluşturmadı.

Üst veri: [149–202 tamamlayıcı iş](https://huggingface.co/jobs/lovefengis/6b070863b6a90bbe997dea43) COMPLETED. İlk census timeout olarak korunuyor. V22 CPU işi bütün 203 metadata checkpoint'ini sabit özel dataset revizyonundan okuyup hash'ledi: toplam 63.260.614 satır, 42.839.790 metadata adayı; 0–148 ve 149–202 satır toplamları sırasıyla 47.494.931 ve 15.765.683. Manifest hash'i ve aday yıl dağılımı sonuç özetinde. Bu sayılar gerçek metin taramasının tamamlandığı, özgün insan yazarlığı veya belge hakları anlamına gelmiyor. Ham metin, URL ve kişi bilgisi yayımlanmadı.

Ön planda başlatılan [49–99](https://huggingface.co/jobs/lovefengis/6b070ed0b6a90bbe997dfd75), [100–151](https://huggingface.co/jobs/lovefengis/6b070ed0b6a90bbe997dfd77) ve [152–202](https://huggingface.co/jobs/lovefengis/6b070ed1d91f621b93087191) metin işleri RUNNING; aynı kod, 4 worker ve 3 saatlik sonlu sınır. [CPU izleyici](https://huggingface.co/jobs/lovefengis/6b07110db6a90bbe997e02ce) RUNNING, kesin dört işi izliyor, 25–48 için COMPLETED_VERIFIED kaydı ve sıfır API hatası gözlendi. İzleyici veya aralıkları yeniden açma. Ön plandaki V21 değerlendirme değişikliklerinin GitHub'a gönderimi gerçekleşmedi; bu dosyalar V22'de gönderilmiş veya test edilmiş sayılmadı.

[Maliyet çizelgesi](results/compute-ledger-full-corpus-v2.json): bu derlem alt defterinde terminal işlerin wall-rate tahmini 0,067704 USD, önceki V18 dahil 11,445876 USD; gerçek fatura değil. Açık işlerin toplam nominal üst sınırı 0,303333 USD, bunun tamamı harcanmış sayılmaz. V22 CPU 21,558 sn duvar süresi, yaklaşık 0,000060 USD, 10 dk nominal 0,001667 USD. [Tarife](https://huggingface.co/docs/hub/en/jobs-pricing) 25 Kasım kontrolü. Master ve diğer projeler değişmedi. Bağımsız holdout, farklı model ailelerinde kalite karşılaştırması ve insan editör değerlendirmesi yok; yayın kapısı geçilmedi. Sonraki tur önce mevcut aralıkların kesin ID ve checkpointlerini kontrol etmeli, yalnız eksikleri işlemeli ve yeni gerçek tür/bağlam kanıtlarını editoryal karara dönüştürmeli.

## V25 — niteleyici yan cümlede kapsam ve tam metin derleminin kapanışı (25 Kasım 2026)

**Somut editoryal kusur:** Fiilimsiler kılavuzunda bir raporu tanımlayan iki sıfat-fiilli yapının üç bağımsız cümleye bölünmesi, yalnız okur hangi raporun söz konusu olduğunu zaten biliyorsa güvenlidir. Birden çok raporun bulunduğu bağlamda niteleme raporu seçer; bağımsız iddia olarak yazılması kapsamı değiştirebilir. [Düzeltme a60ddc0](https://github.com/systemonster/turkish-writer/commit/a60ddc055dbb3a18fd63420e8e95783895a965ed): kılavuzda bu koşul açıklandı, iki koşulu birlikte taşıyan belge alt kümesini koruyan özgün örnek eklendi. Ayrıca "açılacak kapı" ifadesinin nesne belirliliğini tek başına sağlamadığı, "doğrulamadık" ifadesinin doğrulamamanın nedenini bildirmediği netleştirildi. Önce/sonra karar incelemesi: "Başvuru sırasında yüklenen ve henüz imzalanmamış belgeler yeniden incelenecek" cümlesinde yeniden incelemenin kapsamı iki koşulun kesişimidir; bütün belgelerin yeniden inceleneceğini söylemek kapsamı genişletir. "Başvuru sırasında yüklenen belgelerden henüz imzalanmamış olanlar yeniden incelenecek" iki koşulu korur. Kaynak zaten doğal ise değişiklik gerekmez. Bu mantıksal karşılaştırma özgün geliştirme örneğidir, model çıktısı veya bağımsız insan onayı değildir. Önceki V24 eyleyen koruma düzeltmesi [ab226c9](https://github.com/systemonster/turkish-writer/commit/ab226c9eb409ddc61e1e7d6d9cd5d9420ea40151) aynen korundu.

**Regresyon:** [CPU 6b073a47b6a90bbe997e52ee](https://huggingface.co/jobs/lovefengis/6b073a47b6a90bbe997e52ee) COMPLETED; sabit commit a60ddc055dbb3a18fd63420e8e95783895a965ed, 167 npm + 85 derlem Node + 9 Python + 2 Unicode = 263 başarılı, 7 atlanan, 0 başarısız. Sekiz doğrudan referans denetimi, 85 dağıtım dosyası ve ayrı kurulumda Node/Unicode duman testi geçti. Yedi atlanan mevcut isteğe bağlı yerel veri testidir. Testler modelin editoryal kalite kazanımını ölçmez. Yeni GPU veya tarama işi açılmadı.

**FineWeb:** önceki üç uzun iş OAuth süresi dolduğu için checkpoint yükleme aşamasında HTTP 401 ile ERROR oldu; önceki geçerli parçalar korundu. V23 üç kurtarma ve beş son aralık işi tamamlandı; [kurtarma izleyicisi](https://huggingface.co/jobs/lovefengis/6b072789b6a90bbe997e3422) 3/3, [son izleyici](https://huggingface.co/jobs/lovefengis/6b072b26d91f621b9308b2b3) 5/5 tamamlama işaretini doğruladı. V24 ilk tam envanter kontrolü [6b0733e9d91f621b9308c453](https://huggingface.co/jobs/lovefengis/6b0733e9d91f621b9308c453) ERROR: URL geçerliliği metadata ve metin seçiminde aynı koşul olmadığı halde eşitlik varsayılmıştı. Düzeltilmiş [6b073401b6a90bbe997e48e8](https://huggingface.co/jobs/lovefengis/6b073401b6a90bbe997e48e8) COMPLETED; tüm 203 özel checkpoint'in sabit dataset revizyonu ac7876c80d63d9440a9049230eff631fed551add üzerinden bağımsız okunup hash'lendiği tam sonuç logu doğrulandı. [Tam metin derlem özeti](results/fineweb-text-000-202-v3-summary.json): 63.260.614 satır = 42.831.847 uygun metin + 20.420.765 üst veri eşiği dışında + 8.002 uzunluk sınırı dışında. 15.665.177.638 sözcük eşleşmesi ve 1.204.152.602 sezgisel segment. 203/203 tamamlandı; aynı corpus taramasını yeniden başlatma. 42.839.790 önceki metadata adayı farklı URL kapsamına sahip, 42.839.849 metin seçiminde uzunluk öncesi uygun satırla birebir eşit kabul edilmez. Bu ölçümler tekil makale, insan yazarlığı, dil doğruluğu veya editoryal kalite kanıtı değildir. Ham metin/URL/kişisel veri dağıtılmadı.

[Maliyet çizelgesi](results/compute-ledger-full-corpus-v2.json): kapanmış işler için bu alt defterde 0,202126 USD bilinen wall-rate tahmini; önceki V18 dahil 11,580298 USD. Gerçek fatura değil. Önceki iptal edilmiş izleyici 6b07110db6a90bbe997e02ce için API bitiş zamanı vermediğinden maliyeti bu bilinen toplamın dışında; belirsizliği sıfır maliyet sayma. V25 testi 10,704 sn duvar süresi, yaklaşık 0,000030 USD; 5 dk nominal azami 0,000833 USD. Tarife 25 Kasım [HF Jobs](https://huggingface.co/docs/hub/en/jobs-pricing) üzerinden doğrulandı. Açık bilinen iş yok. Master, release, Unicode vendor ve diğer projeler değiştirilmedi.

**Sonraki geliştirme:** Tamamlanan toplu işaret sayımlarından mekanik kurallar üretme. Bağlamlı gerçek kaynak ve yeni uzun, farklı türlerde yazarlık/düzenleme karşılaştırmalarına geç; özellikle niteleme kapsamı, eyleyen ve anlam sadakatini doğal anlatım kazanımıyla birlikte değerlendir. V21–V25 geliştirme örneklerini bağımsız holdout diye sunma. Bağımsız insan editör değerlendirmesi ve görülmemiş metinlerde farklı model ailelerinin tekrarlanabilir kazanımı henüz yok; nihai yayın kapısı geçilmedi.

## V26 — olasılık, hitap ve ekleme odağı (25 Kasım 2026)

[Ürün değişikliği e86f4fc](https://github.com/systemonster/turkish-writer/commit/e86f4fc032f3537b8d4bb9fcd6c792a4f1db88bb) doğrudan aktif `references/turkce-soyleyis.md` kılavuzunu düzeltir. Girdi ve önceki öneri mevcut kılavuzdan; aşağıdaki karşılaştırma proje içi dilsel incelemedir, bağımsız editör veya yeni model çıktısı değildir.

| Kılavuzdaki vaka | Önceki kararın kusuru | Yeni karar |
|---|---|---|
| Bu aşamada işlemin iptal edilmesi söz konusu olabilir. | İptalin gündeme gelmesi ile gerçekleşme ihtimalini eşitlemişti. Bir iptal tartışılmadan da gerçekleşebilir. | Bağlam izin/olasılık ayrımını belirliyorsa doğal kısa biçim seçilir; belirlemiyorsa kaynak korunur. Gündeme gelme ancak gerçekten tartışılma kastedildiğinde uygun. |
| Formun doldurulması için gerekli alanların tamamlanması gerekmektedir. E-posta adresinin girilmesi zorunludur. Telefon numarası ise isteğe bağlıdır. | İkinci kişiye doğrudan talimat ve adresin muhataba ait olduğu varsayımı eklenmişti. Vaka tek başına bunu bildirmiyor. | Zorunlu alanların doldurulması gerekiyor; e-posta adresi zorunlu, telefon isteğe bağlı. Gerçekten muhataba yönelik rehber ise emir biçimi ayrıca uygun olabilir. |
| Bunu da mı unuttun? | Ekleme odağı, daha önce gerçekleşmiş bir unutma olayına zorunlu olarak bağlanmıştı. | Eklemenin başka öğeye veya olaya bağlanabileceği, önceki unutmanın kesin çıkarılamayacağı açıklandı. |

İlk iki vaka kaynakta olmayan izin, eylem veya muhatap bilgisini eklememe; üçüncüsü odak ve bağlam ilişkisi açısından değerlendirildi. Kılavuzun kaynakları ve lisansları değiştirilmedi. Değişiklik gerçek kalite kusurlarını gidermeyi amaçlar; modelin yeni metinlerdeki kazanımı ölçülmedi.

[CPU 6b074251d91f621b9308dc0e](https://huggingface.co/jobs/lovefengis/6b074251d91f621b9308dc0e) COMPLETED: sabit e86f4fc032f3537b8d4bb9fcd6c792a4f1db88bb, 167 npm + 85 Node derlem + 9 Python derlem + 2 Unicode = 263 başarılı, 7 atlanan, 0 başarısız. Yedi doğrudan referans kontrolü, 85 dosyalı paket envanteri, ayrı kurulum ve Node/Unicode duman testi geçti. Atlananlar mevcut isteğe bağlı yerel veri testleri. İşin duvar süresi 10,683 sn; [güncel tarife](https://huggingface.co/docs/hub/en/jobs-pricing) CPU-basic 0,01 USD/saat, 5 dk nominal üst sınır 0,000833 USD, wall-rate tahmini 0,000029675 USD. [Maliyet defteri](results/compute-ledger-full-corpus-v2.json) güncellendi: bilinen birleşik tahmin 11,580327525 USD, gerçek fatura değil; önceki bilinmeyen maliyet kaydı korunuyor.

Tam FineWeb taraması yeniden açılmadı. Ön plandaki sohbet yeni eşleştirilmiş uzun metin ve farklı model ailesi karşılaştırmasının girdilerini hazırlıyor; aynı deney veya GPU işi çoğaltılmadı. Sonraki turda önce onun gerçek commit/job/çıktı kayıtlarını kontrol et, sonuç yoksa dondurulmuş karşılaştırmayı tamamla. Yeni kılavuz değişikliğinin hangi sabit sürümde yer aldığını açık kaydet. Master, release, Unicode vendor ve diğer projeler değişmedi. Bağımsız insan değerlendirmesi ile görülmemiş metinlerde tekrarlanabilir iyileşme hâlâ doğrulanmadı.

## V28 — sahne sürekliliği ve açıklamanın zamanı (26 Kasım 2026, Türkiye)

V27'nin dondurulmuş özel kaynak paketi ve iki model çıktısı ayrı ayrı okundu. Manifest SHA-256 `72937fd29240d35881ac9d1ab126e06bf2ec9de7057bd8fe6474b65ae8fecc29`; kaynak paketinin bildirdiği commit `ea992cb029a66923ffc847cdc96e8c785d1ce4ea`. Bu commit ve yeni V27 fixture dosyaları bu turda GitHub üzerinden okunamadı (404); özel paket kaynak olarak kullanıldı. Ön plandaki V27 karşılaştırmasını, istemlerini veya mevcut checkpointlerini değiştirmedik. Qwen/Qwen3-32B revizyonu `9216db5781bf21249d130ec9da846c4624c16137`, [devam işi 6b075a34d91f621b93090eb7](https://huggingface.co/jobs/lovefengis/6b075a34d91f621b93090eb7) ve [izleyici](https://huggingface.co/jobs/lovefengis/6b075ae7d91f621b93091014) COMPLETED, 36/36 protokol tamamlaması. openai/gpt-oss-120b revizyonu `b5c939de8f754692c1647ca79fbf85e8c1e70f8a`, [ilk iş 6b0755d1d91f621b93090905](https://huggingface.co/jobs/lovefengis/6b0755d1d91f621b93090905) ERROR, 36 kayıt/34 tamamlanmış çıktı; a27-08:v25_guides ve a27-08:compact 8192 token sınırına ulaştı, final kanalı yok. Toplam 70/72 kullanılabilir protokol çıktısı, kalite puanı değil. V27'nin tüm karşılaştırması ve maliyet kapanışı ayrı deney kaydının işidir; burada yalnız tek kusur kümesi kullanılıyor.

**İzole kusur incelemesi:** `v27-write-iskele-paketi` / `a27-08` brifi üçüncü kişi Dila, unutulan yağmurluğu bulma, paketin Rüveyda'dan gelmesi ve içindeki iki eldivenin yalnız son paragrafta ortaya çıkması koşullarını içerir; başlık da içerik ipucu vermemelidir. Qwen compact çıktısında kişi uyumsuzluğu ("Dila eliyle kolumu silkti"), v25_guides çıktısında yağmurluğun ılık çayın içinde unutulması gibi anlamsız nesne bağlanması; gpt-oss adaptive çıktısında başlığın eldivenleri önceden açıklaması görüldü. Tam çıktı kimlikleri sırasıyla `a27-08:compact` final SHA-256 `4b1f5290753394e51bf952a8f61d85ce8be977458e31d408844f420b70198d1b`, `a27-08:v25_guides` `f7266c15ababf0d1c13523a7070866432fbe70c7f40c0da79b9da66f9ec385e4`, `a27-08:adaptive` `69e5c79df6decf7867d141e6de8dbac2c2cc05c68612bd32b0ebde183f28e3b3`. Bunlar tam kapsamlı V27 değerlendirmesi değildir.

[Ürün düzeltmesi c378abcd](https://github.com/systemonster/turkish-writer/commit/c378abcd93c469b918815260580da5da47ed5791) yalnız mevcut uzun-anlati.md §9'u ekler. Önceki soyut süreklilik talimatını sahnede nesnenin yeri/el değiştirmesi, iyelik-kişi ilişkisi, duyusal eylem ve saklanan bilginin başlık dahil açığa çıkma sınırı ile uygulanabilir kılar. Yeni bağımsız proje örneğinde üçüncü kişinin yanlış birinci kişi iyeliği düzeltiliyor; zarf içeriğinin son paragrafta açıklanması koşulunda anahtarı açık eden başlık reddediliyor. Yaratıcı boşluk, bilinçli mecaz, iç konuşma ve izin verilen başlık ipucu korunuyor. Bu karar karşılaştırması model çıktısını iyileştirdiğimizi kanıtlamaz; yeni referans dondurulmuş V27 çalışmasına geriye dönük dahil edilmedi. Kaynak ve lisanslar, vendor, SKILL.md ve önceki referans bölümleri aynen korundu.

[CPU 6b075f63d91f621b93091695](https://huggingface.co/jobs/lovefengis/6b075f63d91f621b93091695) COMPLETED, sabit commit `c378abcd93c469b918815260580da5da47ed5791`: npm test komutu başarılı (görünen logda npm sayı dökümü yok), 85 derlem Node + 9 Python + 2 Unicode testi başarılı; sekiz doğrudan referans kontrolü, 85 dağıtım dosyası ve ayrı kurulumda Node/Unicode duman testi geçti. Bu teknik regresyon, yeni metinlerdeki model kalitesi ölçümü değildir. CPU-basic 5 dakika nominal sınır, 0,000833 USD azami, 10,592 saniye duvar süresiyle 0,000029422 USD tahmini. [Tarife](https://huggingface.co/docs/hub/en/jobs-pricing) ve [maliyet alt defteri](results/compute-ledger-full-corpus-v2.json); birleşik bilinen bu alt defter tahmini 11,580356947 USD, V26 tür ve V27 mimari karşılaştırmalarının ayrı kayıtları dahil değil, gerçek fatura değil. Yeni GPU açılmadı. Master/release değişmedi. Bağımsız insan editörü ve görülmemiş vakalarda tekrarlanabilir kalite kazanımı halen doğrulanmadı.


## V29–V30 — hakem kalibrasyonu ve temiz metni koruma (26 Kasım 2026, Türkiye)

V29 [hakem protokolü ve hata incelemesi](JUDGE-PANEL-V29.md), [terminal vaka/model/kol kayıtları ve maliyet](results/judge-panel-v29-terminal.json) commit 45e2747961a69d5d397137876bdc6f67c1d3d10a. GPU 6b0761a7d91f621b93091b21 ve monitor 6b0761c1b6a90bbe997e96ab COMPLETED. 102/102 kayıt, 60/102 geçerli protokol; Mistral Small 3.2 24B 20/34, YTÜ Turkish Gemma 9B T1 9/34, Phi-4 Mini 8/34 doğru tercih. Kritik hedefler için sıkı kategori/alıntı eşleşmesi sırasıyla 5/24, 1/24 ve 2/24. Yalnızca eşleşme kusuru değil, gerçek anlam/olgu ve A/B kimlik hataları görüldü. Üç modelin hiçbiri önceden belirlenen kabul kapısını geçmedi. Bunları bağımsız editör diye kullanma, insan değerlendirmesi sayma veya aynı deneyi yeniden başlatma. Yeni hakem çalışması gerekirse tek aday/kaynak ilişkisini değerlendirip karşılaştırmayı deterministik türetme ve daha güçlü model ailesiyle yeni vaka tasarımı; salt JSON şekli veya eşik değişikliği kalite çözümü değildir.

**V30 somut kusur ve ürün düzeltmesi:** V27 özel dondurulmuş manifest 72937fd29240d35881ac9d1ab126e06bf2ec9de7057bd8fe6474b65ae8fecc29, Qwen/Qwen3-32B revizyonu 9216db5781bf21249d130ec9da846c4624c16137, temiz blog vakası v27-edit-odunc-rafi-clean / a27-01, source SHA-256 be5c30f33ae50401301f342d55cf164e66f78ef4ec979da5b2293759a84b8309. Kaynak ve üç tam çıktı karşılaştırıldı. Baseline 6c82148b8f368326c61e85a950d15f8edf72950b4efd66ba260dbffb5b252c21: düz başlığı kalınlaştırdı ve bir sözcükte yeni yazım hatası üretti. V25_guides 47213d0580394db761c5da68b03faf9d3770520da821407933385569f42a7789: geriye dönük anlatımın “sanmıştım” kipini “sandım” yaptı; kısa öznelerden sonra işlevsiz virgüller ekledi ve doğal cümle ritmine gereksiz müdahale etti. Compact 62ae651da60b98d30007c7578f0e982913a118b62da492adad51709727e0f829: başlık ve paragraf içerikleri paragraf çevresi boşlukları göz ardı edilince kaynakla eşleşti. Bu tek temiz kontrol, Compact mimarisinin diğer vakalarda üstün olduğunu ispatlamaz; V27'nin kapsamlı karşılaştırmasının yerine geçmez.

[Ürün değişikliği 0f951b3](https://github.com/systemonster/turkish-writer/commit/0f951b3996d067677588d2e1ff4f0ee5b9a729b1): yalnız aktif references/editor-muhakemesi.md kılavuzuna kısa temiz metin son okuması eklendi. Noktalama, kip ve başlık biçimi değişikliğinin somut gerekçesini denetle, işlevsiz müdahaleyi geri al; kaynakta bulunmayan yazım hatası üretme. Özgün yeni örnekler ve gerçek vurgu/ara söz/uzun özne istisnaları içerir; virgül ve kip değişikliğine mutlak yasak koymaz. V27'de dondurulmuş kaynak kılavuz değiştirilmedi. Bu bir karşılaştırma ve ürün müdahalesi; yeni model çıktısında iyileşme henüz ölçülmedi.

[CPU 6b076c26b6a90bbe997ea7cf](https://huggingface.co/jobs/lovefengis/6b076c26b6a90bbe997ea7cf) COMPLETED, sabit 0f951b3996d067677588d2e1ff4f0ee5b9a729b1. npm test komutu başarıyla geçti (görünen logda npm sayısı yok), 85 derlem Node + 9 Python + 2 Unicode testleri geçti; V29 self-test, altı yeni referans kontrolü, 85 dosyalı paket, bağımsız kurulum ve Node/Unicode duman testi başarılı. [Güncel HF tarifesi](https://huggingface.co/docs/hub/main/en/jobs-pricing) 26 Kasım 2026: CPU-basic 0,01 USD/saat, 5 dakika nominal 0,000833 USD azami, duvar süresi 12,132 saniye → 0,0000337 USD wall-rate tahmini. Derlem alt defteri 11,580390647 USD birleşik tahmin; V29 ayrı defteri 0,546061228 USD, bilinen kısmi toplam 12,126451875 USD; V26/V27 ayrı maliyetleri ve önceki bilinmeyenler dahil değil, fatura değil. Master, release, Unicode vendor ve diğer projeler değişmedi. Bağımsız insan editör değerlendirmesi ve yeni uzun metinlerde farklı model aileleriyle tekrarlanabilir kalite kazanımı hâlâ eksik. Sıradaki turda gerçek yeni metinlerde bu müdahalenin faydasını ölç; sentetik kısa hakem kalibrasyonunu tekrar etme.


## V31 — V30 kılavuz değişikliğinin eşleştirilmiş geliştirme karşılaştırması (26 Kasım 2026)

Önceki V29 hakem başarısızlığı tekrar edilmedi. V30'un temiz metni korumaya yönelik tek ek paragrafının gerçek üretimdeki etkisini ölçmek için [V31 karşılaştırma kodu](compare-clean-prose-v31.py) oluşturuldu. İki kol aynı görev, SKILL.md, blog kılavuzu, kaynak ve model ayarlarını kullanır; yalnız editor-muhakemesi.md'nin V30 paragrafı değişir. Önceki kılavuz c378abcd93c469b918815260580da5da47ed5791, sonraki kılavuz 9a340def5fb464885f4f4718832a456fba1e359b; dört Git blob kimliği kodda sabit. CPU preflight farkın yalnız tek paragraf olduğunu kontrol eder. Dört kaynak × iki kol × iki model = 16 planlanan çıktı, henüz sıfır üretilen çıktı. Qwen/Qwen3-32B 9216db5781bf21249d130ec9da846c4624c16137 (thinking kapalı) ve mistralai/Mistral-Small-3.2-24B-Instruct-2506 95a6d26c4bfb886c58daf9d3f7332c857cb27b43, sıcaklık 0, 2048 çıktı token sınırı, dengeli kol sırası. Mistral burada üretici, V29'da güvenilir hakem olarak kabul edilmedi. Sabit kılavuz bağlamı gerçek dinamik ajan çalışması değildir.

Kaynaklar: İlkay Holt, [CC Kafe İstanbul’dan izlenimler](https://creativecommons.org.tr/cc-kafe-istanbuldan-izlenimler/), 1 Aralık 2019, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); Fatih Ars / Mirasium, [Seyahatnamelerin Işığında 17. Yüzyıl Anadolu’su: Bir İmparatorluğun Nabzını Tutmak](https://mirasium.org/seyahatnamelerin-isiginda-17-yuzyil-anadolusu/), 8 Ekim 2025, [CC BY 4.0 metin lisansı açıklaması](https://mirasium.org/kamu-mali-kilavuzu/). İki farklı yazar/yayın/konu, metinlerin seçili kesitleri; CC Türkiye daha önce geliştirmede incelenmiş bir kaynak grubu, Mirasium insan yazarlığı doğrulanmadı. Bunlar bağımsız holdout değildir. İki diğer vaka özgün proje üretimi temiz ve düzeltme gerektiren çok paragraflı teşhis metinleridir (v31-own-clean, v31-own-repair). Kaynakların tarihi olguları doğrulanmış kabul edilmez; düzenleme sırasında olgu güncellemesi istenmez. Seçili özgün kaynak metinleri ve model uyarlamaları yalnız özel araştırma veri kümesine, kaynak künyesiyle yazılır; public GitHub'a üçüncü taraf ham metni aktarılmaz.

İlk preflight, [6b077ab0d91f621b9309482f](https://huggingface.co/jobs/lovefengis/6b077ab0d91f621b9309482f), ERROR: gerçek CC Türkiye HTML'sinde ikinci görünür paragraf aynı p elemanında BR ile ayrılmıştı; startswith denetimi bu yüzden başarısız oldu. [HTML yapı teşhisi 6b077ad1b6a90bbe997ec025](https://huggingface.co/jobs/lovefengis/6b077ad1b6a90bbe997ec025) COMPLETED: CC Türkiye anchor indeksleri 26,27,27,28,34,34,36; arada beş liste öğesi ve bir bağlantı paragrafı; Mirasium 45,46,46,47,48,48; her iki lisans ibaresi gerçek HTML'de bulundu. Eski seçici bu listeyi de kaybedebilirdi. [301583d düzeltmesi](https://github.com/systemonster/turkish-writer/commit/301583d96e510104c6fcc09ba232455e9e686b46) tekil ve sıralı anchor içerme denetimi, aynı p'nin tekrarsız alınması, BR, bağlantı, ara liste ve başlıkların korunması, yanlış kök ve iç içe blokların reddini sağlar. Gerçek kaynaklar tekrar dondurulmuş değildir. Yerel ortamda aynı ayıklama fonksiyonunun sekiz sentetik regresyon kontrolü başarılı (bağlantı, BR ve liste, eksik/çift anchor, yanlış kök, iç içe blok, lisans işareti yokluğu, sıralı liste reddi); gerçek kaynak/tokenizer preflight veya model kalitesi değildir.

Düzeltilmiş preflight gönderme girişimi araç güvenlik kontrolü nedeniyle gerçekleşmedi; yeni job ID oluşmadı. Aynı isteği zorlayarak tekrarlamadık, GPU açılmadı. Sonraki tur önce mevcut job ve dal durumunu, özel dondurma dosyasının olup olmadığını denetlemeli; yalnız normal izinli işlemle ve sabit düzeltme üzerinden preflight doğrulanırsa tek GPU karşılaştırması yapmalı. Başarı işareti V31_PREFLIGHT_COMPLETE, 4 vaka, 8 istem/model, iki sabit tokenizer kimliği ve özel frozen.json SHA-256. Ardından 16 çıktının gerçek anlam, kip, gereksiz noktalama ve başlık değişiklikleri, onarım başarısı ve akışı tek tek incele; otomatik exact_source/title_same değerleri kalite puanı değildir. Sonuçları yeniden çalıştırma veya kalite artışını varsayma.

| İş | Kod | Donanım | Durum | Duvar süresi | Nominal azami USD | Wall-rate tahmin USD |
| --- | --- | --- | --- | ---: | ---: | ---: |
| 6b077ab0d91f621b9309482f | db884fb7969e843532017733d1732222e0eae78a | CPU Upgrade, 7 dk | ERROR | 7,873 sn | 0,0035 | 0,0000656083 |
| 6b077ad1b6a90bbe997ec025 | job inspect komutu, db884fb7969e843532017733d1732222e0eae78a kaynak seçici | CPU Basic, 5 dk | COMPLETED | 7,703 sn | 0,0008333333 | 0,0000213972 |

[HF tarifesi](https://huggingface.co/docs/hub/en/jobs-pricing) 26 Kasım 2026: CPU Upgrade 0,03 USD/saat, CPU Basic 0,01 USD/saat, RTX PRO 6000 96 GB 2,75 USD/saat. V31 bilinen ek wall-rate 0,0000870055 USD, gerçek faturalar bilinmiyor. V30'a dek önceki kısmi 12,126451875 USD toplamla birleşik kısmi 12,1265388805 USD; V26/V27 ayrı defterleri ve önceki bilinmeyen harcamalar hariç. Master, release, Unicode vendor ve diğer projeler değişmedi. Bağımsız insan editör kapısı ve yeni metinlerde tekrarlanabilir kalite kazanımı henüz doğrulanmadı.

### V31 ön kontrol ve karşılaştırma yeniden başlatma — 26 Kasım 2026, 00:45 UTC

Düzeltilmiş HTML seçicinin gerçek ön kontrolü [6b0780b3b6a90bbe997ecbb4](https://huggingface.co/jobs/lovefengis/6b0780b3b6a90bbe997ecbb4), ERROR: HTML kaynak ayıklama geçti, proje üretimi `v31-own-repair` metni 149 sözcükle 150 sözcük koşulunu sağlayamadı. [daf9512](https://github.com/systemonster/turkish-writer/commit/daf951289e9b5cdb365a6173875ec756c949a1ed) ile yalnız bu geliştirme vakasına eksik kayıtların ayrı listede tutulması cümlesi eklendi; 155 sözcük. Temiz kontrol 154 sözcük. Model ve karşılaştırma kolları aynı; önceki başarısız deneme model çıktısı üretmedi.

[6b078116d91f621b93095603](https://huggingface.co/jobs/lovefengis/6b078116d91f621b93095603) COMPLETED ve V31_PREFLIGHT_COMPLETE: dört vaka (v31-cc-kafe 375, v31-mirasium-history 223, v31-own-clean 154, v31-own-repair 155 sözcük), 8 istem/model; özel `v31-clean-prose/frozen.json` SHA-256 `a7146422efc23bb237e30483811fed4b968deb445baf61aa80bce3ba63f840da`. Qwen/Qwen3-32B revizyonu 9216db5781bf21249d130ec9da846c4624c16137, en uzun istem 9176 token; mistralai/Mistral-Small-3.2-24B-Instruct-2506 revizyonu 95a6d26c4bfb886c58daf9d3f7332c857cb27b43, 9010 token. Gerçek kaynak, tek paragraf farkı, sabit tokenizer ve bağlam sınırı ön kontrolü geçti. Bu çıktı bağımsız insan kalite değerlendirmesi değildir.

[GPU 6b078135d91f621b9309566f](https://huggingface.co/jobs/lovefengis/6b078135d91f621b9309566f) RUNNING, RTX PRO 6000 96 GB, sabit daf951289e9b5cdb365a6173875ec756c949a1ed (runner blob 8df7fc02fdc908d9e0e6fc033cb11ac30bdb8d35), Qwen yükleme logu görüldü. İki model sırayla, her biri 850 saniye iç sınırı, toplam job 35 dk. [CPU izleyici 6b07813cd91f621b9309567e](https://huggingface.co/jobs/lovefengis/6b07813cd91f621b9309567e) RUNNING; 15 sn durum logu, 40 dk sınır; yalnız bu job ID ve iki modelin özel çıktı hash/kapsam kontrolü, yeni GPU açmaz. Terminal kaydı `v31-clean-prose/monitor-6b078135d91f621b9309566f.json`. Bu iki işi tekrar gönderme; terminal sonuçlarında iki kol/model/vaka kapsamını, başarısızlık ve maliyetleri kaydet. Gerçek kalite karşılaştırması henüz yapılmadı.

| İş | Kod | Donanım | Durum | Duvar süresi | Nominal azami USD | Wall-rate tahmini USD |
| --- | --- | --- | --- | ---: | ---: | ---: |
| 6b0780b3b6a90bbe997ecbb4 | 301583d96e510104c6fcc09ba232455e9e686b46 | CPU Upgrade 7 dk | ERROR | 19,301 sn | 0,0035 | 0,000160842 |
| 6b078116d91f621b93095603 | daf951289e9b5cdb365a6173875ec756c949a1ed | CPU Upgrade 7 dk | COMPLETED | 21,705 sn | 0,0035 | 0,000180875 |
| 6b078135d91f621b9309566f | daf951289e9b5cdb365a6173875ec756c949a1ed | RTX PRO 6000 35 dk | RUNNING | — | 1,604167 | — |
| 6b07813cd91f621b9309567e | inspect job komutu | CPU Basic 40 dk | RUNNING | — | 0,006667 | — |

[HF tarife](https://huggingface.co/docs/hub/en/jobs-pricing) 26 Kasım: CPU Upgrade 0,03 USD/saat, CPU Basic 0,01 USD/saat, RTX PRO 6000 2,75 USD/saat. Kayıtlı kısmi wall-rate toplamı 12,1268806 USD (önceki ayrı deneyler ve aktif işler hariç; gerçek fatura değil); aktif iki işin nominal üst sınırı yaklaşık 1,610834 USD. HF başlangıç/çalışma aşamasını dakika bazında faturalandırır; duvar-süre hesabı gerçek faturayı göstermez. Kullanıcı bildirimi yaklaşık 20 USD harcamadır; bağımsız fatura doğrulaması yok. Yayın önceliği: V31 geliştirme karşılaştırmasını bitir, varsa ciddi kusuru çöz; daha fazla aynı tip sentetik hakem/derlem sayımı başlatma. Gerçek bağımsız test ve iki insan editör incelemesi olmadan master/release yok. Mirasium ve CC Türkiye artık geliştirme kaynaklarıdır; holdout'a alınmaz.

## V31 terminal ve yayın adayı — 26 Kasım 2026

[Terminal sonuç, tam model/kol/vaka ve maliyet kaydı](results/clean-prose-v31-terminal.json), commit da1e6b68b4daa8e37af1f191f14ab238e9a757c8. GPU 6b078135d91f621b9309566f COMPLETED, 617,667 sn; Qwen 8/8, Mistral 4/8 tamamlanmış protokol çıktısı. İzleyici 6b07813cd91f621b9309567e ERROR, 627,001 sn: doğru biçimde kalite/kapsam eşiğini geçmeyen 4 eksik çıktıyı saptadı; her iki model dosyasını buldu ve çıktı hash'lerini doğruladı, V31_MONITOR_TERMINAL kaydı mevcut. GPU'nun terminal başarı durumu kalite başarısı değildir. 16 kayıt tamamı okundu, özel kaynak metinleri ve adaptasyonları public depoya taşınmadı.

Qwen temiz kontrolü iki kolda aynen döndürdü; onarım kontrolünde önceki kol aynen, sonraki kol yalnız başlık biçimini değiştirerek döndürdü. Mistral dört kolda kılavuz metni üretti ve token sınırına ulaştı. Temiz kontrolün önceki kolunda yanlış ay yazımı ve gereksiz başlık biçimi, onarım kontrolünün önceki kolunda hedef anlatım kusurlarının korunması görüldü. İki gerçek kaynakta Qwen bazı yazım ve akış kusurlarını düzeltti, fakat sonraki CC Kafe çıktısında gereksiz tekrar ve paralel yapı sorunu üretti; Mirasium çıktısı iki kolda özdeş ve başlık biçimi değişmiş. Mistral Mirasium önceki kolu kaynakta olmayan niteleme ekledi; sonraki kol bunu eklemiyor fakat başlık biçimi değişikliği sürüyor. İki ailede tekrarlanabilir kalite artışı doğrulanmadı.

Ürün düzeltmesi c99c4b4763204f0aac68194bf1dfea8959a3771a: gerçek hedefi ve giderilmesi gereken kusuru teslim öncesi denetle. CPU 6b0787a2b6a90bbe997edb9b COMPLETED; npm test komutu, 85 Node derlem +9 Python+2 Unicode, 85 paket dosyası ve ayrı kurulum başarılı. Bu ürün adayı donduruldu, bağımsız kalite sonucu henüz yok.

**Yayın sürecindeki gerçek teknik engel giderildi:** validator geçmiş kısa ve insan incelemesiz geliştirme vakalarının dürüst bir dışlama envanterine girmesini reddediyordu. [e6cd2e5](https://github.com/systemonster/turkish-writer/commit/e6cd2e539903945a8aa310f10280176e05298084) yalnız geliştirme satırları için açık unreviewed statüsünü kabul eder; test/validation insan incelemesi ve uzunluk koşulu değişmedi. [7538f15](https://github.com/systemonster/turkish-writer/commit/7538f15901b385947de66f9faee0689dfce345ef) beş regresyon ekledi. CPU 6b079657b6a90bbe997ef355 COMPLETED, sabit 7538f15, npm test komutu başarılı (çıktı sayısı logda görünmüyor), 90 Node derlem +9 Python+2 Unicode=101 doğrulanmış test, sıfır başarısızlık; 85 paket dosyası ve bağımsız kurulum geçti. Validator geliştirme laboratuvarındadır; dondurulmuş skill değişmedi.

[Bağımsız editör girdi teslimi ve karşılaştırma planı](HOLDOUT.md#yayın-adayı-için-editör-teslimi--26-kasım-2026) eklendi. Gerçek bağımsız kaynak seçimi ve iki editör gerekli; hazır insan puanı veya oluşturulmuş bağımsız çıktı paketi yok. Açık uçlu deneyler durduruldu, yeni GPU açılmadı. Yeni harcama ancak bağımsız kaynaklar geldikten sonra anlamlıdır. Master/release, vendor ve diğer projeler korunmuştur. Birleşik kısmi wall-rate tahmini 12,600514825 USD, ayrı V26/V27 kayıtları ve bilinmeyen harcamalar dahil değil, fatura değil. Bu turdaki yeni CPU işinin nominal üst sınırı 0,000833 USD, duvar-süre tahmini 0,000033503 USD. Güncel [tarife](https://huggingface.co/docs/hub/en/jobs-pricing) 26 Kasım'da yeniden doğrulandı.


## 26 Kasım — V2 önizleme: Unicode biçim düzeltmesi ve depo sadeleştirme

Kullanıcı yerleşik Unicode bileşeninin isteğe bağlı düzeltme de yapmasını ve V2 vitrin/temizliğinin tamamlanmasını istedi. [4521105](https://github.com/systemonster/turkish-writer/commit/4521105ca768e2758c4a3a525f103911b4afa181) ile varsayılan salt okunur denetim korundu; açık temizleme kipi yeni dosyada UTF-8 başlangıç imzası ve CRLF düzeltmesi, SHA-256 ile bağlı tek tek onaylanmış olağan biçim kusurları ve değişiklik raporu sağlar. Orijinal dosya üzerine yazılmaz. Anlamlı Unicode, atıflar ve kaynak açıklamaları korunur; toplu gizli işaret, telif veya istatistiksel filigran kaldırma özelliği değildir. Vendored kod ve lisans değişmedi.

[Bağımlılık taraması](https://huggingface.co/jobs/lovefengis/6b08031cd91f621b930a62af) COMPLETED: denetleyici.md için 7, mudahale-defteri.md için 9 metinsel referans; hakem-dongusu.mjs 22, openai-taslak.mjs 43, codex-arka.mjs 7. Bunlar kullanım sıklığı değil, dosya referansı sayısıdır. İki çelişkili eski kılavuzun özgün içeriği [2ada5dd](https://github.com/systemonster/turkish-writer/commit/2ada5dd393ff361bbf0ed7e2b7d1208a24960cb1) ile docs/archive/v1.1 altına taşındı; eski yollar kısa yönlendirme olarak tutuldu. Testleri ve geriye uyumlu CLI'ları kullanan modüller silinmedi. Arşiv dağıtım paketine girmez. Arşiv byte eşitliği ve vendor blob kimliği doğrulandı.

İlk regresyon 6b080394d91f621b930a6411 ERROR: kullanılan Python tarfile.extractall filter parametresini desteklemiyor; ürün testleri başlamamıştı. Düzeltmede arşiv yolları ve dosya türleri sınırlandırılarak çıkarıldı. [r2 regresyon](https://huggingface.co/jobs/lovefengis/6b0803a8b6a90bbe997fc4a2) COMPLETED; sabit 2ada5dd393ff361bbf0ed7e2b7d1208a24960cb1, npm test ve Corpus Lab Node test komutları sıfır çıkış, 9 derlem Python ve 7 Unicode test başarılı, 85 dosyalı paket, ayrı kurulumda gerçek temiz kopya ve tarayıcı duman testi geçti. Son logun Node test sayılarını içermediği için yeni kesin toplam sayı bildirilmez. Yeni model deneyi veya insan değerlendirmesi yapılmadı. Bu aday önceki c99c4b4 sabitinin yerini aldı; önceki kalite sonuçları yeni değişikliğin etkisini göstermez. Master ve kararlı sürüm değiştirilmedi.

| İş | Durum | CPU Basic süre | Nominal azami USD | Duvar-süre tahmini USD |
| --- | --- | ---: | ---: | ---: |
| 6b08031cd91f621b930a62af | COMPLETED | 10,137 sn | 0,000833333 | 0,0000281583 |
| 6b080394d91f621b930a6411 | ERROR | 6,468 sn | 0,000833333 | 0,0000179667 |
| 6b0803a8b6a90bbe997fc4a2 | COMPLETED | 13,016 sn | 0,000833333 | 0,0000361556 |

[26 Kasım 2026 güncel tarife](https://huggingface.co/docs/hub/en/jobs-pricing) CPU Basic 0,01 USD/saat. Üç sonlu 5 dakika işin toplam nominal azamisi 0,0025 USD, duvar-süre tahmini 0,0000822806 USD. Önceki kayıtlı kısmi toplamla 12,6005971056 USD; gerçek fatura değildir, ayrı V26/V27 kayıtları ve bilinmeyen harcamalar dahil değildir. Yeni GPU yok. Final yayın için önceki bağımsız değerlendirme kapısı halen geçilmemiştir.
