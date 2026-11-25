# V11 — üretmeyen son kontrol

25 Kasım 2026. Bu değişiklik, aktif skill'e henüz taşınmamış bir geliştirme adayıdır.

## Neden bu değişiklik?

Tarihsel V10 işi [6b06b6af1460ffe1d5ea6ab4](https://huggingface.co/jobs/lovefengis/6b06b6af1460ffe1d5ea6ab4) terminal COMPLETED; iki özel model dosyası ve denetleyici bitiş kaydı doğrulandı. 20 kaynak × 2 model × 4 yayın kolu = 160 kayıt, ayrıca 40 çalışma notu. **Qwen notlarının 20/20'si ve Gemma notlarının 13/20'si token sınırına ulaştı.** Gemma skill kolunun bir yayın çıktısı da sınırda kesildi. Tam kayıt sayısı uçtan uca kalite veya eksiksiz not anlamına gelmez.

| Model | Taslak → son kontrolde değişen metin | Sayı uyarısı (taslak → son) | Paragraf sayısı farkı (taslak → son) |
|---|---:|---:|---:|
| Qwen3-32B | 2/20 | 1 → 1 | 2 → 2 |
| Turkish Gemma 9B | 15/20 | 13 → 14 | 13 → 14 |

Bunlar risk göstergesidir; anlam puanı değildir. Gemma, sudo-42d0f0b13b707362 ve sudo-3dc45336d810812b vakalarında son metne numaralı değişiklik açıklamaları ekledi. İkinci vakada taslakta kaynakta bulunmayan teknik iddialar vardı ve son kontrol bunları korudu. Eski wrapper denetimi yalnız başa bakması nedeniyle sondaki açıklamaları kaçırdı. [Tam kimlik ve bayraklar](results/historical-v10-summary.json). Özel kaynaklar/adaptasyonlar public depoya taşınmadı.

## Uygulanan izole değişiklik

[run-review-select-v11.py](run-review-select-v11.py), son kontrolü yeni metin üretiminden ayırır. Önce mevcut taslaktan kaynakla hizalanabilen değişmiş düz yazı bloklarını çıkarır. Sayı, bağlantı, alıntı, dosya yolu ve belirli Markdown/Unicode dizileri değişmişse bu dar deneyde ilgili öneriyi dışarıda bırakır; hizalanamayan yapıya da dokunmaz. Model kaynak ve öneriyi görür, yalnız kabul edilen blok kimlikleri ile gerekçe döndürür. Onaylanmayan blok orijinal kalır. Son metin programatik olarak yalnız onaylı, önceden mevcut parçalardan kurulur; modelin açıklamasının veya yeni metninin sonuca sızması mümkün değildir. Boş/geçersiz/kesilmiş karar ayrı işaretlenir, başarı diye sayılmaz.

Bu yaklaşım, V5/V6'da modelin yeni yama üretmesinden farklıdır. Burada ilk taslak sabit; yalnız son denetleyicinin davranışı değiştirilir. Model tarafından kabul edilen bir değişikliğin anlamı koruduğu garanti edilmez. Yapı koruma bu deneyin dar amacı; gerektiğinde iyi bir yeniden yapılandırmayı kaybedebilir. Skill'e aktarılırsa bu bir editoryal muhakeme kuralı olacaktır; deneyin Python veya GPU altyapısı zorunlu kullanıcı bağımlılığı olmayacaktır.

## Sınama ve maliyet

- Kod: `cc1c2a7a8cef4ce3182575adcd5354a260f05a04`.
- CPU [6b06c523b6a90bbe997d096b](https://huggingface.co/jobs/lovefengis/6b06c523b6a90bbe997d096b) COMPLETED: self-test, gerçek çağrı zincirine sahte seçici enjeksiyonu, 9 corpus-lab Python testi, 2 Unicode testi, özel sabit manifest ve iki modelin 200 satırının kimlik/kapsama kontrolü, 160 yayın çıktısının hash denetimi. Model yüklenmedi.
- Veri revizyonu: `0b1b8308559a935e6f3be060fe42bc00ed556f02`. İki gözlenen kusur + kaynak kimliğine göre sıralanan altı kontrol, model başına sekiz vaka. Bunlar daha önce görülmüş geliştirme vakalarıdır, kör test değildir. CPU ön incelemesinde Qwen için 7/8, Gemma için 4/8 vakada en az bir uygun blok var. Bu nedenle 16 vaka kaydı için en fazla 11 gerçek seçici çağrısı gerekir.
- GPU [6b06c542d91f621b9307756e](https://huggingface.co/jobs/lovefengis/6b06c542d91f621b9307756e): RTX PRO 6000, iki model sırayla, 20 dakika üst sınır, nominal azami 0,9167 USD; önceki V10 işi ve denetleyici terminalken başlatıldı. Son durum ilk kayıt sırasında RUNNING, başarı iddiası yok. Özel sonuç yolları `v11/qwen-qwen3-32b.json` ve `v11/ytu-ce-cosmos-turkish-gemma-9b-v0-1.json`.
- [Maliyet defteri](results/compute-ledger-v11.json). V10 tarihsel çalışmanın 59,22 dakikalık duvar süresinin tarife karşılığı yaklaşık 2,7141 USD; gerçek fatura değil. Önceki ledger'lar dahil doğrulanmış süre × tarife toplamı 9,3848 USD; eksik süreler ve V11 aktif işi hariç.

## Sonraki karar

Önce mevcut GPU işinin terminal durumu ve özel çıktı dosyalarının kapsamı doğrulanacak. Yeni GPU açmadan mevcut V11 kayıtlarına bak. Aynı vaka/kolu tekrar çalıştırma. Kaynak, V10 taslağı, V10 üretici son kontrolü ve V11 seçilmiş son metni karşılaştır: düzeltme kaybı, anlam/olgu hataları, gereksiz değişiklik, yeni açıklama, doğal Türkçe, akış. Yalnız kaynak metni korumak başarı değildir. V11 daha iyi sonuç vermezse yeniden aynı kurguyu çalıştırma; hangi yerel düzeltmenin blok seviyesinde kaybolduğunu incele. İyi sonuç varsa yeni kaynaklarda sınanacak küçük bir skill kuralı olarak değerlendir. Bağımsız insan değerlendirmesi ve yayın kapısı değişmedi. Master, yayın, Pages, Unicode bileşeni ve diğer projelerin kaynakları değiştirilmedi.
