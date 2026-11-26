# İleri Türkçe denetimi

Dil bilgisi kuralını üslup tercihinden ayır. Örnekler bu proje için hazırlanmış sentetik örneklerdir.

| Denetim | İncelenecek yapı | Karar |
|---|---|---|
| Ulaç ve özne | Müşteri formu doldurup ekibimiz onayladı. | Müşteri formu doldurdu, ekibimiz de onayladı. |
| Ulaç ve ilişki | Rapor gecikti. Müşteri aradı. | Kaynakta neden yoksa “geciktiği için” eklenmez. |
| Adlaştırma | Ödemenin yapılmasının ardından kurulumun gerçekleştirilmesine başlanacaktır. | Eyleyen bizsek: Ödeme yapıldıktan sonra kuruluma başlayacağız. |
| Grup çekimi | Sistem hızlıdır ve güvenilirdir. | Aynı kapsamdaysa: Sistem hızlı ve güvenilirdir. |
| Odak | Dün İzmir'e ben gittim. / Ben İzmir'e dün gittim. | İlkinde kim, ikincisinde ne zaman sorusu öne çıkar; ikisi de doğaldır. |
| Kanıtsallık | Sunucu gece yeniden başlamış. | Sonradan öğrenilmişse -mış korunur. |
| Kapsam | Başlıca üç neden var. | “Üç nedeni var” biçimi listenin eksiksiz olduğunu ima edebilir. |
| Edilgen | Talep alındı. | Eyleyen önemsiz veya bilinmiyorsa etkin çatıya çevirme. |
| Tamlama | Reklam hesap performans analiz raporu. | Reklam hesabının performans raporu. |
| Gereksiz iyelik | Kendi müşterilerinizin kendi tercihleri. | Karşıtlık yoksa müşterilerinizin tercihleri. |

Kullanıcı metninin yapısı korunur: listeler, tablo, alıntı, kaynak, kod, uyarı, başlıklar. Yeni metinde yapı amaca göre kurulur. TDK noktalama kuralları ile bir markanın biçem tercihi aynı şey değildir. Noktalı virgül, ünlem, karşıtlık bağlacı, eksilti veya uzun cümle kendi başına sorun sayılmaz.

Zemberek sözcük biçimi ve ekler hakkında, VNLP cümle içi bağımlılık ilişkileri hakkında ek kanıt verebilir. İkisi de anlamı, odak ve anlatım kalitesini tek başına doğrulamaz. Bir çözümleyicinin tanımadığı özel ad, kısaltma veya terim otomatik hata değildir.

Kaynak yaklaşımı: turkish-anti-ai-skill (ulaç, ek eylem ve kanıtsallık ayrımları); turkish-humanify (anlam ilişkisi ve kesinlik sadakati); turkce-humanizer (yapı ve ses profili). Kurallar burada yeniden ifade edilmiş ve örnekler bağımsız yazılmıştır.
