# Unicode denetimi ve kontrollü biçim düzeltmesi

Kaynak: [guillaumemeyer/watermarks-remover](https://github.com/guillaumemeyer/watermarks-remover), commit [5a62be6338d2812372b1da440e55c82922f97d53](https://github.com/guillaumemeyer/watermarks-remover/commit/5a62be6338d2812372b1da440e55c82922f97d53).
Yalnız standart kütüphane kullanan `service/scripts/text_unicode.py` dosyası MIT lisansıyla aynen alınmıştır. Lisans ve kaynak yolu `scripts/vendor/watermarks-remover/` altında saklanır. Bileşen skill ile birlikte dağıtılır; ayrı kurulum veya servis gerekmez. Python 3.10+ mevcutsa son kontrolde kullanılabilir; yoksa normal editörlük akışı devam eder.

## İnceleme ve düzeltme

```bash
python3 scripts/unicode-denetle.py metin.txt
python3 scripts/unicode-denetle.py metin.txt --temizle --out duzeltilmis.txt
```

İlk komut salt okunur JSON denetimi verir. İkincisi UTF-8 başlangıç kodlama imzasını (varsa) kaldırır, CRLF satır sonlarını LF biçimine dönüştürür ve **yeni bir dosyaya** yazar. Kaynağın üzerine yazmaz; var olan çıktı dosyasını reddeder. Önceki ve sonraki hash'leri, yapılan değişiklikleri ve kalan bulguları JSON olarak bildirir.

Editörün tek tek doğruladığı olağan yapıştırma/biçim kusurları da açık konum onayıyla düzeltilebilir. Önce denetimdeki `source_sha256` ve karakter konumlarını kontrol edin. `--onayli-konum` yalnız onaylanmış özgün metin konumlarına, `--kaynak-sha256` ile birlikte uygulanır. İzin verilen dar kapsam, yanlışlıkla yapıştırılmış bölünmez boşluklar ve satır kırma amaçlı biçim karakterleridir. Gerçek bir tipografik işlev taşıyan karakteri onaylamayın. Diğer karakterler otomatik olarak silinmez; kalan bulgular inceleme içindir.

Görünmez karakter tek başına yapay zekâ kaynağı veya gizli filigran kanıtı değildir. Bu entegrasyon telif hakkını, atfı, yazarlık açıklamasını veya kaynak/provenance bilgisini kaldırmak için kullanılmaz. İstatistiksel watermark, model tabanlı yeniden yazma, agresif homoglif ve medya/metadata katmanları bağlanmamıştır. Yetkili olduğunuz düz metinleri kullanın. İsteğe bağlı düzeltme ayrı bir dosya üretir, sessizce özgün dosyaya müdahale etmez; bağlama göre anlamlı Unicode, emoji ve belge yapısını koruyun.

Upstream güncellemesi: yeni commit açıkça incelenir, lisans ve testler kontrol edilir. Çalışma sırasında ağ erişimi, otomatik indirme veya harici servis çağrısı yapılmaz.
