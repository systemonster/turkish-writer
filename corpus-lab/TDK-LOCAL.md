# Yerel TDK sözlük bağlantısı — 26 Kasım 2026

Ürün: [b3a07b1](https://github.com/systemonster/turkish-writer/commit/b3a07b1f52466f850df8a200f149ba9595c9c86b). Dal: ozellik/esanlam-onerisi. Kullanıcının sağladığı yerel Türkçe Sözlük 2.1.68 APKS kopyası incelendi. Kopya üçüncü taraf paket dağıtımından geldiği için orijinalliği, güncelliği ve yeniden kullanım hakkı bağımsız doğrulanmış değildir. Uygulama çalıştırılmadı; koruma aşılmadı; yalnız şifresiz, sabit isimli paket öğesi okundu. Verinin kendisi, örnek cümleler ve tanım kopyaları GitHub'a veya HF'ye yüklenmedi. Okuyucu, kullanıcı tarafından sağlanan ve kullanma hakkına sahip olunan yerel dosya için isteğe bağlıdır.

## Gerçek yerel kaynak

Kaynak APKS SHA-256: d7f600240a9c749e8bbefa4a86bc01c0ee51054805361415376a6d1efaea83e4. base.apk içinde res/raw/assets_testdb.db, 34.816.000 bayt; SQLite SHA-256: 09eeb5ec5d64743fc07c2ec772f6fabfff8e5867a40a66d19006ca04425de342. PRAGMA quick_check: ok.

| Tablo | Satır |
| --- | ---: |
| madde | 98.738 |
| anlamlar | 132.548 |
| anlam_ozellik | 121.530 |
| ozellikler | 112 |
| ornekler | 45.362 |
| yazarlar | 3.564 |

Sayılar benzersiz sözcük sayısı veya TDK'nın güncel resmî sayımı değildir. 78 anlam kaydının madde ilişkisi eksik; 45.323 örnekte yazar_id dolu, 39.477 örnekte yazar tablosuna ilişki bulunuyor. madde_duz alanı gerçek yazımdan farklı olabildiğinden eşleşme Türkçe büyük/küçük harf ve NFC normalizasyonuyla madde alanına uygulanır; şapka ve harf ayrımı korunur. İki özellik ilişkisi ayrı tutulur.

Gerçek yerel okuyucu sorguları (tanım/örnek içerikleri değil, yalnız sayım):

| Sorgu | Madde kaydı | Anlam | Örnek kaydı |
| --- | ---: | ---: | ---: |
| kötü | 1 | 6 | 5 |
| fena | 2 | 7 | 6 |
| durum | 1 | 3 | 1 |
| vaziyet | 2 | 3 | 2 |
| yüz | 2 | 13 | 8 |
| düşünmek | 1 | 7 | 7 |
| anlamak | 1 | 7 | 5 |
| İZMİR | 1 | 1 | 0 |

TDK okuyucusunun Python 3.13 yerel testleri (5/5) ve Node 22 yerel köprüsü gerçek APKS ile çalıştı. Kaynak kimliği doğrulandı, Node üzerinden kötü/fena/durum/vaziyet için ayrı madde ve anlam kayıtları döndü. Git blob kimlikleri yerelde çalıştırılan dosyalarla eşleşti: tdk-sozluk.py 5df5addf9a8ad0e09587e2e13e33821ca6a9eb2a, tdk-baglan.mjs 9955d694238e5fef18b0b91ac2923b5471c9e15f, test_tdk_sozluk.py d0536a9aa9ac6441c8c244f1056c64fbe16fa8d0.

## Entegrasyon

Python okuyucu: salt okunur SQLite, sınırlandırılmış açık madde başı sorguları, parametreli SQL, şema kontrolü. Yerel APK/APKS dosyasındaki desteklenen şifresiz SQLite öğesi geçici dizinde açılır; kalıcı veri kopyası üretilmez. Node köprüsü ağ ve shell kullanmaz. TW_TDK_KAYNAK veya açık --tdk-kaynak ile etkinleşir. KeNet'te anlam seçilmeden alternatif verilmez. Seçimden sonra asıl madde ve en çok üç harf içeren adayın TDK anlamları sorgulanabilir. Anlam kimlikleri ayrı; bağlam, üslup, çekim, sıklık ve eş dizim onaylanmış değildir. --tdk-ornek yalnız gerektiğinde kullanılır, anlam başına en çok iki örnek ve mevcut yazar atfı korunur. Kullanım hakkı olmayan verinin dağıtılması veya toplu kopyalanması amaçlanmaz.

## Regresyon

[CPU 6b0810ffd91f621b930a86ac](https://huggingface.co/jobs/lovefengis/6b0810ffd91f621b930a86ac) COMPLETED, sabit b3a07b1. npm 176 başarılı / 7 atlanan / 0 başarısız; Corpus Lab Node 90, Corpus Lab Python 9, skill Python 14 (7 Unicode + 2 KeNet + 5 TDK) başarılı. Toplam 289 başarılı, 7 atlanan, sıfır başarısız. 89 dosyalı paket ve bağımsız kurulumda TDK + KeNet sorgu zinciri, yanlış anlamın engellenmesi, örnek atfı, sayısal adayın TDK'da sorgulanmaması, hatalı kaynak reddi ve kaynak dosya hash'i geçti. HF çalışması yalnız özgün sentetik SQLite/APKS ve KeNet fikstürleriyle yapıldı; gerçek TDK verisi oraya gönderilmedi. Paket dışında bırakılması gereken sentetik APK/SQLite dosyalarının gerçekten hariç kaldığı doğrulandı.

CPU Basic 5 dk üst sınır, 0,000833333 USD nominal; 24,615 sn duvar süresi, 0,000068375 USD wall-rate tahmini (0,01 USD/saat önceki güncel tarife; gerçek fatura değil). GPU işi yok. Master değişmedi. Bağımsız editoryal kalite ve yanlış öneri oranı henüz ölçülmedi. Bu teknik entegrasyon, kaynak kullanım izni veya tüm TDK içeriğinin serbestçe dağıtılabileceği anlamına gelmez.
