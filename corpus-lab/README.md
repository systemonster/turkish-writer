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

[TurkishFineweb2-Cleaned](https://huggingface.co/datasets/moganai/turkishfineweb2-cleaned) kartındaki `text`, `id`, `metadata.url`, `metadata.date`, `metadata.language_score` ve `metadata.fasttext_clean_score` alanları üzerinden akış halinde seçme. Tarama tarihi yayın tarihi değildir. 2017 sonu ve öncesi taramalar bir başlangıç kohortudur, insan yazarlığı kanıtı değildir.

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

## 4. Yayın politikası

Ham korpus, üçüncü taraf yazıları ve kişisel veri depoya commit edilmez. Çıkarılan toplu bilgiler ve bağımsız örnekler ancak editör tarafından gözden geçirildikten sonra skill referansı olur. İyi Türkçe, doğruluk, anlam koruma ve editoryal fayda ölçülür. Dil dağılımları kota veya sınıflandırıcı atlatma hedefi değildir.

Durum: BOUN pilotu tamamlandı; web tarama, gerçek editör çiftleri ve insan kör değerlendirmesi henüz yapılmadı. Kaynak ve lisans kaydı: `sources.json`.
