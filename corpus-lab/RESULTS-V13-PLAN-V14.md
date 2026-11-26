# V13 → V14: anlam denetiminden yerel onarıma

25 Kasım 2026. Geliştirme sonuçları; bağımsız insan değerlendirmesi değildir.

## V13 — tamamlandı

Kod: `272cb8d4c34eb16dd33e8965fd378075090a114c`. GPU [6b06cfabd91f621b93078d85](https://huggingface.co/jobs/lovefengis/6b06cfabd91f621b93078d85) 12:10:29 UTC, izleyici [6b06cfadb6a90bbe997d207d](https://huggingface.co/jobs/lovefengis/6b06cfadb6a90bbe997d207d) 12:10:38 UTC tamamlandı. Özel sonuç revizyonu `5721aeb0c4439af1140045ccc0b39f46aeaca7fe`; [tam karar kimlikleri ve skorlar](results/semantic-veto-v13-terminal.json), [maliyet](results/compute-ledger-v13.json).

| Hakem | Sentetik doğru | Yanlış kabul | Yanlış ret | Diğer modelin tarihsel bloklarında kabul |
|---|---:|---:|---:|---:|
| Qwen3-32B | 48/48 | 0 | 0 | 0/1 |
| Turkish-Gemma-9b-v0.1 | 35/48 | 0 | 13 | 4/7 |

Sentetik 48 aday daha önce kullanılan V10 geliştirme örnekleridir (32 eşdeğer, 16 anlamı değişen); 021/024 etiket belirsizliği eski kayıtta duruyor. Dört karar sırası tek adayın dört skoru, dört bağımsız örnek değildir. 104 adayın tamamı ölçüldü. Tarihsel örneklerde altın etiket yok. Qwen'in sentetik 48/48 sonucu kendi tarihsel üretimini doğru denetleyeceğini göstermez; burada Qwen diğer modelin bir bloğunu, Gemma Qwen'in yedi bloğunu inceledi.

### Tarihsel somut bulgular (AI incelemesi)

- Qwen üretimi sudo-0191b6cb1680889a blok 2: tarayıcı yer imi işlevi daha genel/yanlış bir ifadeye dönüşmüş. Gemma veto uygulamadı. Kritik ayrıntı kaybı sürüyor.
- Qwen üretimi sudo-3dc45336d810812b blok 4: iki kesin teknik ifade olasılık biçimine dönüştü. Gemma reddetti. Ret paragraftaki işe yarar noktalama ve söyleyiş düzeltmelerini de kaldırıyor.
- Qwen üretimi sudo-494acdea301a431d blok 2: koşul bağlaçlarının sadeleştirilmesi kaynak anlamına yakın, ancak son kısımdaki anlatım sorunu kalmış. Gemma reddetti; ret ile yararlı yerel değişiklik de kaybolabilir.
- Qwen üretimi sudo-3568afa3aa382fe6 blok 0 reddedildi: ağırlıklı noktalama ve küçük sadeleştirme, esas anlatım sorununu çözmüyor. Blok 2 ve 3 kabul edildi: büyük ölçüde yazım/terim biçimi ve söyleyiş değişikliği; kullanıcı açısından doğrulanmış kalite artışı sayılmaz.
- Qwen üretimi sudo-3dc45336d810812b blok 1 kabul edildi: kaynak zaten anlamsal açıdan bulanık; kabulün tüm teknik ayrıntıları koruduğu kesin değil.
- Gemma üretimi sudo-17c17668853b5918 blok 0 Qwen tarafından reddedildi: yazım düzeltmeleri ile teknik bağlamı yeniden yorumlayan değişiklik aynı blokta; kaynak belirsizken teknik açıklama değiştirilmemeli.

Sonuç: ikili blok veto bir güvenlik garantisi değil; ölçeği küçültmeden daha fazla hakem oyuna geçmek bilgi kaybı/fayda kaybı sorununu çözmez. Bu nedenle V14 doğrudan mevcut modelin editoryal talimatıyla üretim yapacak. Mevcut yayımlanabilir skill değiştirilmedi.

## V14 — yerel onarım talimatı, eşleştirilmiş gerçek metin üretimi

Kod `5ac0e55bc8819b3b47eafb9e732ca737334a59f1`: [run-local-repair-v14.py](run-local-repair-v14.py). Aynı kaynak, aynı model, aynı üretim ayarları ve aynı çekirdek + editör muhakemesi paketi; yalnız değişen cümle/ifade üzerinde somut nesne, kip, ilişki ve ayrıntı kontrolü, yararlı komşu düzeltmeyi kaybetmeden yerel onarım talimatı ekleniyor. Bu sabit bağlamdır, dinamik ajan testi değildir. 8 tarihsel geliştirme vakası + 4 yeni proje üretimi çok paragraflı kontrol/model; iki kol, iki model, toplam 48 üretim. Sentetik kontrollerin beklenenleri modele verilmez. Bağımsız holdout değildir. Doğal anlatım, gereksiz değişim ve anlamı ayrı incele. Ham kaynak/çıktı özel veri kümesinde kalır.

CPU preflight [6b06d358d91f621b9307940b](https://huggingface.co/jobs/lovefengis/6b06d358d91f621b9307940b) tamamlandı: gerçek paired çağrı self-test, 9 corpus testi, 2 Unicode testi, iki sabit model tokenizer/bağlam ve kaynak kontrolü. Qwen en uzun 3187, Gemma 2798 giriş tokeni; 2048 üretim tavanı ile 8192 bağlama sığıyor.

GPU [6b06d395b6a90bbe997d2751](https://huggingface.co/jobs/lovefengis/6b06d395b6a90bbe997d2751) RTX PRO 6000, 25 dakika; CPU izleyici [6b06d397b6a90bbe997d275a](https://huggingface.co/jobs/lovefengis/6b06d397b6a90bbe997d275a) 32 dakika, kesin iş kimliği, iki çıktı dosyası, 48 model/kol/vaka ve hash kapsaması. Sonuçlar henüz doğrulanmadı. Önce terminal logları ve özel `v14/monitor-6b06d395b6a90bbe997d2751.json` dosyası, ardından gerçek çıktılar. Aynı GPU yeniden başlatılmayacak. [Maliyet](results/compute-ledger-v14.json).

Nihai yayın kapısı değişmedi. Yerel onarım talimatı fayda gösterirse ve iki modelde anlam sadakati bozulmazsa geliştirme dalında aday olarak taşınabilir; insan editör doğrulaması olmadan master/release yok. Hiçbir harici model, API ya da ek araç son kullanıcıya zorunlu tutulmayacak.
