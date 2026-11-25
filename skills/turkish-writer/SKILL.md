---
name: turkish-writer
description: Türkiye Türkçesinde doğal, açık, bağlama uygun metin yazar, düzenler ve denetler. Site, blog, reklam, e-posta, WhatsApp, teklif, duyuru, sosyal medya, destek ve arayüz metinlerinde çeviri kokusunu, şişkin ifadeleri, söz dizimi ve TDK hatalarını giderir; yazarın sesini ve olguları korur. "Türkçe yaz", "Türk gibi yaz", "AI gibi yazma", "doğal Türkçe", "insan gibi yaz", "çeviri gibi duruyor", "metni düzelt", "TDK'ya uygun mu" isteklerinde kullan.
---

# turkish-writer

Önce [yazım motorunu](references/yazim-motoru.md) oku ve uygula. Hem kendi yazdığın hem isteğe bağlı API/Codex taslağı için aynı motor geçerlidir.

## Görevi belirle

- **Yaz:** yeni metin. Önce brif, sonra metin.
- **Düzelt:** mevcut metni, amacı ve sesi koruyarak düzenle. Gerektiğinde paragrafı yeniden kur; iyi cümleye dokunma.
- **Denetle:** yalnız gerekçeli bulgu ve öneri. Yazarlık hükmü verme; metni değiştirme.

Kullanıcının istediği biçimi ve türü esas al. Türü tahmin etmek mümkünse başlamak için soru sorma. Doğruluğu veya metnin yönünü değiştiren bir boşluk varsa tek odaklı soru sor.

## 1. Kısa brif

Kimin, kime, nerede, neyi, hangi amaçla söylediğini belirle. Kullanıcının açık verdiği biçim, hitap, ses ve uzunluk önceliklidir. Fiyat, süre, ad, koşul, kaynak ve görüşü ayır; olgu eksikse uydurma. Kısa işlerde ayrı brif dosyası gerekmez. Uzun veya çok sayfalı işlerde aşağıdaki alanlar işe yarar:

- Tür ve okur
- Amaç / okurun sonraki adımı
- Konuşan ve hitap
- Olgular, koşullar, kaynaklar, korunacak ifadeler
- İzinli ses örnekleri (varsa)
- Biçim ve uzunluk

## 2. Ses ve tür

Önce kullanıcı örneğini kullan. Yoksa aynı tür, dönem ve hedef okura yakın izinli örnekleri seç; rastgele üç örnek doldurmak gerekmez. Wikipedia tartışmasını müşteri WhatsApp'ı yerine, edebî anlatımı açıklayıcı blog yerine koyma. Örneklerin bilgisini ve cümlelerini ödünç alma. Kullanıcının sesi bilinmiyorsa doğal, sade Türkiye Türkçesi kullan; kişisel deneyim uydurma.

Metin türüne göre ayrıntılar yazım motorunda; eski [sicil kılavuzu](references/sicil.md) ek örnek kaynağıdır, bağlama aykırı kuralları zorunlu değildir. Eski örneklerdeki telifli pasajlar eğitim derlemi olarak kullanılmamalı; kendi ya da izinli örnekler tercih edilmeli.

Blog, rehber ve sektörel analiz için [blog editörü kılavuzunu](references/blog-editoru.md) ayrıca uygula. Araştırma, özgün katkı, kaynak sadakati ve seri yayın denetimi yazım üslubundan önce gelir.

## 3. Taslak

Varsayılan yol: bu beceriyi çalıştıran ajan metni kendisi yazar. Başka modele veya API'ye çağrı zorunlu değildir. Kısa, rutin metin için tek iyi taslak yeterli. Yoğun içerik veya kritik marka metninde iki farklı bilgi sırası veya anlatım açısı dene; aynı olgularla hangisi daha iyi çalışıyorsa onu seç. Kararı cümle boyuna veya AI tespit puanına göre verme.

İsteğe bağlı otomasyon, kullanıcı bu yolu istediğinde:
```bash
node scripts/openai-taslak.mjs brif.md --tur site --out taslak.md
node scripts/openai-taslak.mjs brif.md --tur eposta --codex --out taslak.md
```
API yolu anahtar gerektirir; Codex yolu ayrıca kullanılabilir. Anahtar yoksa yerel ajan yazabilir. Özel ad uyarısı, kopya kontrolü ve uzunluk uyarıları yardımcıdır. Taslak tek başına son metin değildir. Deneysel eski hakem döngüsü yalnız geçmiş deneyleri yeniden çalıştırmak içindir; yayına alma ölçütü değildir.

## 4. Editör okuması

Ayrı düşün, birlikte düzenle:
1. Anlam ve doğruluk: tüm gerekli bilgi var mı; yeni iddia, anlam kayması, düşen koşul veya sahte deneyim var mı?
2. Türkçe: eş dizim, tamlama, fiil, söz dizimi, vurgu, söylem parçacığı, doğal bilgi sırası.
3. Okur ve ses: gereksiz giriş, tekrar, genel övgü, kaçınılan net cevap, zorlama samimiyet, yanlış tür.
4. Yazım: TDK, ekler, noktalama ve biçim. Alıntı, kod, URL, kimlik, fiyat ve gerekli açıklamalara dokunma.

Yalnız sorunu çözmeye yetecek kadar değiştir. Bir metin iyi çalışıyorsa değişiklik yapmamak geçerli bir editör kararıdır. Bir cümleyi bölmek veya kısa bırakmak doğalysa tarayıcı puanı düşse de koru. Yapay ritim, kelime kotası, zoraki devrik cümle, rastgele eş anlamlı, kasıtlı hata ve görünmez karakter ekleme yoktur. Kalıp listesi inceleme önerisidir; yasak listesi değildir.

## 5. İsteğe bağlı araçlar

Metin dosyası varsa ve araç çalıştırılabiliyorsa:
```bash
node scripts/tr-scan.mjs metin.md --json
node scripts/tr-scan.mjs baslik.txt --etiket
```
Bulguları bağlamda doğrula. Ritim istatistikleri ve iz skoru tanı amaçlıdır; geçme notu değildir. Gerekiyorsa ilgili dosyayı aç:
- [Türkçeye özgü kullanım](references/turkce-parmak-izi.md), [mantık](references/mantik-kapisi.md), [yapı](references/mudahale-defteri.md)
- [TDK yazım](references/tdk-yazim.md), [ek ve eş dizim](references/tdk-ses-ek-esdizim.md)
- [Türkçe kalıplar](references/yasakli-kaliplar-tr.md), [genel üslup](references/evrensel-izler.md), [ölçüm sınırları](references/denetleyici.md)

Son metni istersen Unicode açısından ayrı denetle:
```bash
python3 scripts/unicode-denetle.py metin.txt
```
Bu, watermarks-remover'ın Unicode incelemesini yerel ve salt okunur biçimde kullanır. Unicode bulgusu AI kökeni kanıtı değildir. Varsayılan çıktı metni değiştirmez; yalnız kod noktası bulgularını raporlar. Kod, alıntı, başka alfabe, emoji, erişilebilirlik işaretleri ve kaynak/AI açıklamaları korunur. Otomatik kaynak işareti veya metadata temizleme, tespit sistemlerini atlatmaya yönelik dönüşüm ve istatistiksel watermark işlemi kapsam dışıdır. Ayrıntı [Unicode entegrasyonu](references/unicode-denetimi.md).

İleri dil çözümleme ve yerel editör seçenekleri [dil araçları](references/dil-araclari.md) bölümünde. [İleri Türkçe](references/ileri-turkce.md) bağlamsal ek, kip, özne ve anlam ilişkisi denetimlerini açıklar. Yerel editör yalnız kullanıcı tarafından çalıştırıldığında öneri verir.

## 6. Yayına hazırlık

Yazılmış metni asıl talep ve kaynakla karşılaştır. Sayı, ad, hüküm, olumsuzluk, kapsam ve kesinlik korundu mu? Çıkarılan bilgi gerçekten gereksiz miydi? Anlam değiştiyse düzelt. Gerekirse [koruma denetimi](scripts/metin-kapisi.mjs) ile açıkça belirtilen değişmez dizileri kontrol et.

Metin yeterince iyi ve sadıksa dur. Art arda yeniden yazmak kaliteyi düşürebilir. Tespit edilemezlik, %100 doğallık ya da doğrulanmamış ölçüm iddiasında bulunma.

## Çıktı

Yaz ve düzelt kiplerinde varsayılan olarak yalnız istenen metin. Kullanıcı değişiklikleri veya gerekçeyi istediyse ayrıca kısaca ver. Denetle kipinde metinden gerçek alıntı, konum (biliniyorsa), sorun, etkisi ve öneri ver. Bir editörün karar vereceği bağlamı belirt; köken tahmini yapma.
