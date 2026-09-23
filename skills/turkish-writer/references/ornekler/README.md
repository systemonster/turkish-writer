# Ses örnekleri

Bu dizin, becerinin yazarken taklit edeceği **doğru sesin** örneklerini tutar. Kural
listesi kötüyü ayıklar; iyi cümleyi örnek öğretir.

Dosya adı sayfa türünü söyler: `ana-sayfa-*.md`, `hizmet-*.md`, `hakkimizda-*.md`,
`sss-*.md`, `blog-*.md`. Her dosyanın başında:

```
kaynak: <bağlantı ya da "kendi yazımız">
neden iyi: <bir iki cümle: hangi özelliği taklit edilmeli>
izin: <yayın izni / kısa alıntı / kendi metnimiz>
```

Başkasının sitesinden alınan metin telifli olabilir: depoya yalnız kısa alıntı
(birkaç cümle) ya da izinli metin girer. Uzun örnekler kullanıcının kendi makinesinde,
`ornekler/yerel/` altında tutulur (bu dizin `.gitignore`'da).

Örnekleri seçmenin ölçütü kulaktır: sesli okununca "bunu bir insan yazmış" dedirten,
çeviri gibi durmayan, somut, kendi sesi olan metin.

## Şu anki örneklerin durumu

`blog-*`, `hakkimizda-*`, `hizmet-*` ve `once-sonra-*` dosyaları geçicidir: kör testte
Claude'un beceriyle yazdığı en iyi metinlerden seçildi (`tests/kalibrasyon/SONUC-BECERI.md`).
İyi Türkçedirler ama becerinin kendi izini taşırlar: "ve" insan metnindekinin yarısı
kadar, uzun cümle az. Sesini taklit ederken bu iki noktayı taklit etme.
`fark-*` dosyaları (gerçek insan yazısı, kısa alıntı) geldikçe öncelik onlardadır.
