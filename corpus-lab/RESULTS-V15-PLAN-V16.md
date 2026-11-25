# V15 sonuçları ve V16 yerel kusur teşhisi

25 Kasım 2026. Yalnız geliştirme dalı; bağımsız insan incelemesi veya yayına hazır sürüm iddiası yok.

## V15 — tamamlandı

GPU [6b06da44d91f621b9307a941](https://huggingface.co/jobs/lovefengis/6b06da44d91f621b9307a941), izleyici [6b06da47b6a90bbe997d3c0c](https://huggingface.co/jobs/lovefengis/6b06da47b6a90bbe997d3c0c) COMPLETED. Özel sonuç revizyonu `284411234bbb07014d37b87e0fbafdd9013412a2`. Model/kol/vaka/hash ve 130 hedef kararı [terminal kayıtlarında](results/sentence-edit-v15-terminal.json). Ham tarihsel kaynak ve çıktılar GitHub'a taşınmadı.

| Model | Hedef | Düzenlenen | Aynen bırakılan | Reddedilen | Değişmeyen belge |
|---|---:|---:|---:|---:|---:|
| Qwen3-32B | 65 | 23 | 41 | 1 | 3/8 |
| Turkish-Gemma-9b-v0.1 | 65 | 36 | 26 | 3 | 1/8 |

Yapısal koruma tek başına anlam koruması değildir. İki modelde sudo-3dc45336d810812b hiçbir hedef üretmedi; teknik satırlardaki tırnaklar yüzünden tüm metin atlandı. Bu aynen kalma başarılı editörlük sayılmaz. Qwen sudo-494acdea301a431d'de bağın kaldırılması şartını bağlama olarak değiştirdi ve zorunluluğu olanağa dönüştürdü. Yer imi ayrıntısı yine kayboldu. Gemma sudo-17c17668853b5918'de soruyu sonraki cümlenin tekrarıyla değiştirdi; v14-local-001'de olasılığı kesinleştirdi. Qwen temiz v14-local-003'ü aynen korudu fakat v14-local-001'in gereksiz adlaştırmalarını da bırakmış oldu. Gemma temiz kontrolde iki gereksiz değişiklik yaptı. Her iki modelde v14-local-004 temel dolambaçlı ifade kaldı. Bunlar kaynak ve çıktıları karşılaştıran AI incelemesidir, insan puanı değildir.

## V16 — somut kusuru teşhis etmeden düzenleme yapmama

[Deney kodu](run-diagnose-repair-v16.py), sabit commit `bc9f025fd39b729a820ea3a2f9576b6d840375f8`. V15'in aynı kaynak ofsetleri, model sürümleri ve koruma kontrolleri kullanılıyor; değişiklik tüm hedef cümleyi yeniden üretmek yerine önce gerçek kusurun kesin, benzersiz metin parçasını teşhis etmek, sonra yalnız bu parçayı onarmak. Hedefte bulunmayan, birden fazla geçen, tüm cümleyi kapsayan veya geçersiz teşhis uygulanmaz. Düzeltme aynı sayıları ve diğer literal imzaları korumalı, geçerli cümle oluşturmalı. JSON protokolü ve biçim reddi editoryal başarı değildir. Bu deney model bağımsız yöntem hakkında kanıt toplar; kurulu skill'e zorunlu bir araç eklemez.

4 tarihsel + 4 sentetik V15 vakası/model; bunlarda önceki V15 çıktıları mevcut karşılaştırma koludur, yeniden üretilmez. İki yeni proje üretimi çok paragraflı metin (tamir günü: karma editoryal kusurlar; kıyı sabahı: doğal anlatıcı sesi) için V15 doğrudan cümle kolu ile V16 teşhis/onarım kolu eşleştirilir. Model başına 113 teşhis hedefi (65 eski + 48 yeni), yalnız geçerli teşhislere onarım çağrısı ve 48 yeni doğrudan cümle üretimi. Toplam 24 belge-kol kaydı. İki yeni metin bağımsız yazar holdout'u değildir; beklenen değerlendirme maddeleri girdiye verilmez.

Önceki Git fetch HTTP 403 ile başarısız oldu ([CPU 6b06e011b6a90bbe997d5062](https://huggingface.co/jobs/lovefengis/6b06e011b6a90bbe997d5062)). Depo public olarak doğrulandı; aynı commit'in normal public archive yoluyla indirilmesi ve dört kaynak dosyasının Git blob kimliği denetimi başarılı ([CPU 6b06e031d91f621b9307bf00](https://huggingface.co/jobs/lovefengis/6b06e031d91f621b9307bf00)). 113 hedef/model, gerçek tokenizer bağlamı, iki self-test, 9 derlem testi ve 2 Unicode testi geçti. Arşiv kaynağı sürüm kaydı için eklenen transport değişikliği de ayrı sabit commit ön testinde geçti ([CPU 6b06e060d91f621b9307bf7e](https://huggingface.co/jobs/lovefengis/6b06e060d91f621b9307bf7e)). Başarısız ilk iş gizlenmedi.

GPU [6b06e080d91f621b9307bfc9](https://huggingface.co/jobs/lovefengis/6b06e080d91f621b9307bfc9), RTX PRO 6000 96 GB, 25 dk nominal azami 1,145833 USD. [İzleyici 6b06e082b6a90bbe997d5227](https://huggingface.co/jobs/lovefengis/6b06e082b6a90bbe997d5227), 35 dk nominal 0,005833 USD; 15 saniyede bir kesin iş kimliğini denetler, yeni GPU açmaz. GPU sonucu henüz doğrulanmadı. Terminalde özel `v16/monitor-6b06e080d91f621b9307bfc9.json` ve iki modelin sonuçları doğrulanmalı. [Maliyet kaydı](results/compute-ledger-v16.json), [güncel resmi tarife](https://huggingface.co/docs/hub/en/jobs-pricing). Bilinen tamamlanmış işlerin duvar süresi üzerinden 10,786337 USD tahmini; gerçek fatura değildir.

Kabul ölçütü: V15'teki somut kip, teknik anlam, tekrar ve gereksiz müdahale kusurlarını azaltırken gerçek kusurların giderilmesi; yeni karma metinde korunacak anlam ve gerçek fayda, temiz metinde gereksiz değişim ayrı değerlendirilir. Önceki atlanan teknik metin V16'da da hedef olmayabilir; bu kapsam sınırlaması açık kalır. Bütün cümle/paragraf yeniden kurma gerektiren işler için bu yaklaşım yetersiz olabilir. Sonuçlara bakılmadan aktif skill değiştirilmez.

## Bağımsız kaynak araştırması

Kaynak adayları (yalnız incelendi, derleme alınmadı):
- Creative Commons Türkiye, [Creative Commons 4.0 Lisansları şimdi Türkçe](https://creativecommons.org.tr/creative-commons-4-0-lisanslari-simdi-turkce/), 24 Mayıs 2017; sayfa yazarı Creative Commons Türkiye ve alt bilgide CC BY 4.0 (istisnalar hariç) açıkça belirtiliyor. SUDO teknik yazılarından ayrı yayın ve konu; bireysel yazar ayrımı kesinleştirilmeden ayrı kişi olarak sayılmayacak. Yalnız özgün makale metni değerlendirilmeli; yorumlar, üçüncü taraf malzemeleri ve kişisel veriler alınmamalı.
- [R. Orçun Madran, Creative Commons Lisansları Artık Türkçe!](https://madran.net/creative-commons-lisanslari-artik-turkce/), 26 Mayıs 2017. Sayfa kendi özgün metnine ait lisans bildirmiyor; lisans konusu hakkında yazmış olması kullanım izni değil. Kabul edilmedi. Önceki adayla konu/yazar ilişkisi de var.
- [Sarkaç hakkında](https://sarkac.org/hakkimizda/): bilim yazıları mevcut ancak standart içerik lisansı CC BY-NC 4.0; ticari kullanım uygunluğu için ayrı izin gerekeceğinden kabul edilmedi.
- [Nitorel içerik lisansı](https://nitorel.com/lisans), CC BY 4.0, 6 Ekim 2026 güncellemesi: lisans olumlu, fakat aday yazıların özgün yazar/tarih kanıtı ve insan editörlüğü ayrıca araştırılmalı. AI sonrası yayın tarihleri insan kökeni kanıtı değildir. Henüz kabul edilmedi.

Bu araştırma bağımsız holdout'u tamamlamaz. Gerçek, izinli, uzun ve farklı yazar/kaynak/konudan örnekleri geliştirme vakalarıyla karıştırmadan dondurmak; bağımsız insan değerlendirmesi için V8/V9 araçlarını kullanmak gerekiyor. Ham üçüncü taraf metin yayımlanmadı. Aktif skill, Unicode vendor, master ve başka Hugging Face projeleri değişmedi.
