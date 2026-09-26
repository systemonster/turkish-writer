# Çıpa derlemi (genel)

Yaz kipinde `openai-taslak.mjs --tur <tür>` seçilince bu klasörden en fazla 3 gerçek insan
metni sistem istemine girer (few-shot). Model kurallardan çok örneği taklit eder; çıpa,
taslağın ritmini ve sözcük seçimini gerçek bir Türk yazarınkine yaklaştırmak içindir.
İçeriği (olgu, ad, marka, konu) çıktıya girmez; betik 6 ve üstü kelimelik birebir diziyi
uyarır.

Türler: `site/`, `blog/`, `reklam/`, `whatsapp/`, `teklif/`, `hukuk/`. Betik dosyaları ad
sırasıyla okur; en iyi örneğin adını `1-`, `2-` diye başlatın. Projeye özgü örnekler
(kurucunun kendi metinleri) bu klasöre değil, projenin kendi deposuna girer ve
`--cipa <yol>` ile verilir; seçimde önce onlar gelir.

## Dosya biçimi

```
---
kaynak: <tam URL>
baslik: <sayfa ya da yazı başlığı>
yazar: <varsa>
tarih: <yayın tarihi ya da sürüm>
lisans: <ör. CC BY 4.0> — "<sitedeki lisans cümlesi aynen>" (<lisans sayfası>)
tur: <site|blog|reklam|whatsapp|teklif|hukuk>
neden_iyi: <hangi ritim ya da sözcük seçimi taklit edilmeli; neden çeviri kokmuyor>
---

<1-3 paragraf, kelimesi kelimesine; özel kişinin adı, telefonu, e-postası çıkarılmış>
```

`kaynak`, `tarih`, `lisans` ve `neden_iyi` zorunludur; `tests/cipa.test.mjs` denetler.

## Kaynak kuralı

- **Lisans açıkça uygun olmalı:** CC BY, CC BY-SA, CC0; kamu malı (Türkiye'de yazarı 70
  yıldan önce ölmüş eser); FSEK md. 31 kapsamındaki resmî metin (kanun, yönetmelik,
  tebliğ, genelge, mahkeme kararı); ya da sitenin koşullarında ticari kullanıma da açık
  "kaynak gösterilerek kullanılabilir" izni. Koşullar okunmadan dosya eklenmez.
- **Girmez:** GayriTicari (NC), Türetilemez (ND), "tüm hakları saklıdır", lisansı belirsiz
  metin; çeviri metin (çeviri kokusu tam da kaçınılan şeydir); yapay zekâ yazmış olabilecek
  yeni kurumsal metin.
- **Kısa tutulur:** dosya başına 1-3 paragraf. CC BY-SA metin aynı lisansla paylaşılır;
  kaynak ve lisans başlıkta durur.
- **Seçim ölçütü kulaktır:** sesli okununca bir Türk'ün yazdığı belli olan, somut,
  kısa ve uzun cümlesi karışık metin. Bürokratik "-mektedir / gerçekleştirilecektir" yığını
  girmez.
