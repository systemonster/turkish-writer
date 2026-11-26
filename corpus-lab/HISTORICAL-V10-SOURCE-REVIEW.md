# V10 tarihsel pilot: kaynak ön incelemesi

25 Kasım 2026. Dondurulmuş özel kaynak dosyasının tamamı (20 kayıt) okundu. Bu notlar tarihsel pilotun model çıktıları görülmeden hazırlandı. İnsan değerlendirmesi, altın etiket veya bağımsız holdout değildir. Ön inceleme yalnız kaynak metnin kendisini esas alır; yeni teknik doğruluk araştırması veya dış bilgiyle düzeltme yapılmadı.

Kaynak: [SUDO Portal arşivi](https://github.com/ubuntu-tr/ubuntu-tr.github.io), sabit revizyon `18cd8b55645f92578d120e9fb105487f236fed79`; [dondurma özeti](results/historical-pilot-v10-source-freeze.json). Özel dosya: `lovefengis/turkish-writer-historical-review-v10/v10/source-candidates.jsonl`. Kaynaklar CC BY-SA 4.0 olarak kayıtlıdır; her kayıtta kaynak adresi, revizyon, hak kanıtı, yazar bilgisi ve içerik hash'i alanları mevcut. Bu, lisansın her eser için bağımsız hukuk denetimi veya insan yazarlığının ispatı değildir. Ham alıntılar, adlar/rumuzlar ve düzenlenmiş sürümler bu rapora taşınmadı.

## Gerçekte neyi sınayacağız?

- 20 alıntı, 15 farklı yazar grubu, 3.928 sözcük. Her metin 154–291 sözcük, 3–5 paragraf. Tarihler 2011–2016 arasında.
- Tek yayın ve ağırlıklı olarak teknoloji alanı: farklı yazarlar mevcut fakat kaynak grubu tek. Tam uzun blog ölçümü veya geniş tür temsili olarak sunulamaz.
- Bunlar temiz insan metni kontrol grubu diye etiketlenmemeli. Kaynaklarda gerçek yazım hataları, çeviri izlenimi veren cümleler, anlatıcı sesine özgü kullanım, eski teknik iddialar ve alıntının dışında kalan bölümlere göndermeler aynı anda bulunuyor.
- Kaynaktaki belirsiz/bozuk teknik anlatımı bağlam olmadan çözmek farklı bir iştir. Dönemin bilgisini güncellememek, metindeki tartışmalı iddiayı doğrulanmış gerçek saymak anlamına gelmez. Böyle bir ayrıntıyı kendi bilgisiyle kesinleştiren editör anlam sadakati açısından ayrıca değerlendirilir.

## Vaka bazlı inceleme dayanakları

Her satır, daha sonra **kaynak, baseline, skill, candidate_draft, candidate_reviewed** karşılaştırılırken bakılacak somut ilişkileri ve editoryal fırsatı gösterir. Bunlar insan puanları veya zorunlu edit kararları değildir. Çıktı görmeden doğru/yanlış sayısı verilmemiştir. Aşağıdaki notlar modele, üretim istemine veya hakem girdisine eklenmez.

| Vaka | Öncelikli kaynak ilişkisi | Editoryal inceleme |
|---|---|---|
| sudo-0191b6cb1680889a | Çevrimdışı kopya ile oturum açma özelliğinin ayrı işlevleri; parola örneğinin uzunluğu; veri dışa aktarma biçimleri. | Dört özellik başlığını ve anlatım sırasını koru; ürün adına gelen ekler ve teknik terim yazımı kontrol edilebilir. Yeni güvenlik garantisi eklenmemeli. |
| sudo-275024ea30cc6cd8 | DPI ile diğer denetim sistemlerinin karşılaştırması; port değişikliğinin örnekteki koşullu etkisi; başka uygulamaları etkileme olasılığı. | Tekrar ve dolambaçlı tanımlar sadeleşebilir; örnekteki koşul ve varsayımlar kesin bir ağ davranışına çevrilmemeli. |
| sudo-42d0f0b13b707362 | Dizin yolunun, sanal dosya sistemi açıklamasının ve açılışta bağlama iddiasının korunması. | Özne/yüklem ve paralellik sorunları incelenebilir. Kaynaktaki teknik iddiaları editörün güncel bilgisiyle değiştirmemesi gerekir. |
| sudo-7703aecdf8a7be14 | Kişisel anının yaklaşık tarihi, alıntıdaki konuşma biçimi ve oyun sıralaması birbirinden ayrılmalı. | Argo, uzatmalar, gülümseme işareti ve kısa cümlelerin anlatıcı sesiyle ilişkisi korunmalı; otomatik olarak kurumsallaştırma olumlu edit sayılmamalı. |
| sudo-17c17668853b5918 | Uçbirim deneyimi, yazarın değerlendirmesi ve ileri IDE'lere ilişkin bazı geliştiricilerin görüşü ayrı. | Bağlaç/ek yazımı ve dil sürçmeleri düzelebilir; benzetme, espri ve görüşün atfı korunmalı. |
| sudo-50d6ece31d55717e | Dönemin pazar görüşleri, ihtimalli gerekçe, PC oyunlarıyla sınırlandırma ve platform farkı. | Açık yazım sürçmeleri ile yerleşik konuşma üslubunu ayır; tarihsel görüşleri bugüne ait kesin iddia gibi yeniden kurma. |
| sudo-3dc45336d810812b | Dosya sistemi seçeneklerinin adları, karşıtları ve yazmanın zamanına ilişkin açıklama. | Kaynak başlangıcında bağlam/alıntı işareti eksikliği ve anlamı belirsiz teknik bir ifade var. Bağlam dışı düzeltmeyi kesin bilgi gibi eklemek yerine belirsizliği korumak gerekir. |
| sudo-683964dac133b5a7 | Dili ortaya çıkaran gerekçeler, teknik karşılaştırmalar, paketlerin geliştirici/son kullanıcı ayrımı. | Girişte kişisel ton ve benzetme, sonraki bölümde yüklem uyumu; güncel teknik doğruluk müdahalesi ayrı tutulmalı. |
| sudo-e16e34a2f54e9e12 | Yazarın öğrenme sürecinin kronolojisi, OSI modelindeki katmanlar ve ağ türleriyle cihaz ilişkisi. | Anlatım bozukluğu ve gereksiz dolaylı ifadeler düzelebilir; kişisel tecrübe bir genel eğitim kuralına dönüşmemeli. |
| sudo-ade6216058d9725b | Tmux ve Screen için farklı önek tuşları; gösterim biçimleri; komutların sırası. | Yazım sürçmesi ve uzun geçişler düzeltilebilir. Klavye notasyonları ayrı teknik dizilerdir; eşanlamlı gibi otomatik dönüştürülmemeli. |
| sudo-aae107bfbfb4130c | Dosya sistemi sürümleri, farklı azami değerler, erişim zamanı alanları ve parçalanma açıklaması. | Çeviri etkisi taşıyan tamlamalar ve bağlar incelenebilir; belirsiz teknik kavram kendi kendine tamamlanmamalı. |
| sudo-50e8feac5ded1d05 | Eklentinin ilk amacı, yaklaşık kod uzunluğu, dahil edilen satır türleri, kullanıcı işlemleri ve gerekli bilgi düzeyi. | Birinci tekil kişinin mütevazı tonu ve parantezlerin taşıdığı ayrıntılar korunmalı; ürün başarısı veya özellik eklenmemeli. |
| sudo-acca8e35954043cb | Yazarın oyun deneyimi, dil yeterliliği görüşü, bulmaca çözüm biçimi, ses/görsel üretimi ayrımı. | Yazım ve eş dizim kusurları düzeltilebilir. Öznel beğeni ve konuşma alıntısı nesnel inceleme üslubuna zorlanmamalı. |
| sudo-4a55f3cd291f0f5c | Tarihsel öngörü, donanım/yazılım ayrımı, sürüm koşulu ve önyükleme sırası. | Tekrar ve tamlama yapısı iyileştirilebilir; tarihsel iddiaların kapsamını daraltma/genişletme teknik araştırma gerektirir. |
| sudo-494acdea301a431d | Çevrimiçi işlem koşulları, dönüştürülebilen dosya sistemleri, yedekleme gerekçesi ve kopyalama mekanizması. | Terim yazımı ve tekrar düzelebilir. Yedek alma önerisinin kuvveti ve veriyi değiştiren uygulama ile diğerleri arasındaki ilişki korunmalı. |
| sudo-741970d6fea3f9b1 | Dosya uzantıları, uygulamanın görüntüleme işlevi ve yazarın kişisel kullanım örneği. | Dil sürçmesi düzelebilir; espri, çekince ve kişisel benzetme korunmalı; desteklenen yeni biçimler eklenmemeli. |
| sudo-3568afa3aa382fe6 | Güven ve paketleme ilişkisi, farklı dağıtımların işlem sırası, tarihsel araç adları. | Özne ve yüklem uyumu iyileştirilebilir; güven derecesi artırılmamalı, eski araçlar güncelleriyle değiştirilmemeli. |
| sudo-9b1316ace778f57f | Yorum satırı işareti, yorumlayıcının davranışı, farklı kodlama yollarına dair benzetme. | Alışılmadık söyleyiş, yazım hatası ve didaktik kişisel ses ayrılmalı; kod işareti ve örneklerin göreli kapsamı korunmalı. |
| sudo-8bcf95d244c79cb9 | Eksen yönleri, koordinatlar, pencere/görsel boyutları, değişken ve fonksiyon adları. | Gerçek boşluk, bağlaç ve yazım hataları var. Sayıları korumak yetmez; her sayı aynı nesneye ve aynı eksene bağlı kalmalı. |
| sudo-55d641e04d2b137d | Yazarın kendi kullanım biçimi, editörün özellikleri ve başka ortamlarla ilişkisi. | Tekrar ve kişi uyumu kontrol edilebilir. Anlatıcının kendini hangi kullanıcı grubuna ait gördüğüne ilişkin nüans korunmalı. |

## Çıktılar geldiğinde karar

En küçük müdahale ile gerçek kusurun giderilmesi ayrı ölçülecek. Birinci öncelik kritik anlam hatası; ikinci öncelik kaynakta olmayan dil hatası; üçüncü öncelik çözülen somut editoryal sorun; dördüncü öncelik gerekçesiz değişiklik ve ses kaybı. Otomatik sayısal risk işareti bu kararların yerine geçmez. Düzeltilmiş ve geri alınmış bölümler ayrı sayılır. Bir arm tamamlanmadıysa eksik olarak raporlanır; çalışma notu veya taslak kesilmişse sonraki arm'ın tamamlanmış görünmesi güvenilir bir uçtan uca başarı kanıtı değildir.

İlk V10 modelinde seçim göreviyle düzenleme sadakati arasındaki fark [RESULTS-V10.md](RESULTS-V10.md) içinde zaten kaydedildi. Bu nedenle yeni bir tam metin üretimini yalnızca iyi görünen A/B seçimiyle onaylamayacağız. Eğer tarihsel pilotun son hakem turu anlamı bozuyor veya sağlam bir düzeltmeyi gereksiz yere geri alıyorsa, bir sonraki izole adayda **tam yeniden yazım yerine yalnız kanıtlı hatalı değişiklikleri geri alma** yaklaşımı sınanmalı: kaynak ve aday arasındaki tek bir değişiklikte özne, eylem, nesne, koşul, olumsuzluk ve belirsizliği karşılaştır; ilişki bozulmuşsa yalnız o değişikliği geri al. Önceki V5/V6 yama üretimiyle aynı deney değildir; burada yama ilk editörlük değil, sonradan doğrulanmış bir hatanın geri alınmasıdır. Fayda henüz ölçülmediğinden aktif skill'e eklenmedi.

İnsan editör puanı bulunmadığı için bu notlar yayın kapısını açmaz. Gerçek metinlerin ve dört kolun tamamlanması beklenirken ikinci GPU işi başlatılmadı.
