# Unicode denetimi: watermarks-remover

Kaynak: https://github.com/guillaumemeyer/watermarks-remover, commit 5a62be6338d2812372b1da440e55c82922f97d53.
Yalnız standart kütüphane kullanan `service/scripts/text_unicode.py` dosyası MIT lisansıyla aynen alınmıştır. Lisans ve kaynak yolu `scripts/vendor/watermarks-remover/` altında saklanır. Bileşen skill ile birlikte dağıtılır; ayrı kurulum veya servis gerekmez. Python 3.10+ mevcutsa yayıma hazır metinlerde son kontrolde kullanılır. Python mevcut değilse normal editoryal akış devam eder; Node ve skill kullanımı Python gerektirmez.

```bash
python3 scripts/unicode-denetle.py metin.txt
cat metin.txt | python3 scripts/unicode-denetle.py -
```

Komut UTF-8 düz metin okur, yerel JSON denetimi verir ve dosyaya yazmaz. Sık rastlanan yapıştırma/biçim sorunlarını incelemeye yardımcı olur. Unicode kod noktaları bağlam gerektirir: bölünmez boşluk, dilsel birleştirici veya emoji bileşeni tek başına sorun değildir. Bulgular kaynak veya yazarlık hakkında kanıt değildir.

Bu entegrasyon metne veya dosya metadata'sına gizlice müdahale etmez. Upstream'in istatistiksel watermark, tespit servisi, model tabanlı yeniden yazma, agresif homoglif ve medya işlemleri bağlanmamıştır. Korunması gereken açıklama ve atıflar her zaman kalır. Yetkili olduğunuz metinleri inceleyin. Unicode denetimi normal yazım ve Türkçe editörlüğünün yerini tutmaz.

Upstream güncellemesi: yeni commit açıkça incelenir, lisans ve testler kontrol edilir. Kullanım sırasında ağ erişimi, otomatik indirme veya upstream servis çağrısı yapılmaz.
