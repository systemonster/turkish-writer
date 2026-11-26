# V2 doğrulama planı (öneri; sonuç değildir)

## Neden değişiyor

V1.1 yazım motoru ortalama cümle uzunluğu, paragraf biçimi ve bağlaç yoğunluğu için kotalar koyuyor. Bu araçlar derlemdeki toplu örüntüleri gösterir; tek bir metnin neye ihtiyacı olduğunu göstermez. Zorunlu harici model seçimi de taşınabilirliği sınırlar. V2 doğal Türkçe, anlam, görev ve ses öncelikli bir editör sözleşmesini hem ajan hem otomasyon için tek dosyada toplar. V1 tarayıcı ve ölçümler tarihsel olarak korunur; sonuçları V2 sonucu diye sunulmaz.

## Deney

Aynı brifle üç kol: A) modelin normal çıktısı, B) master'daki V1.1 (tam akış), C) V2 (tam akış). Aynı üretici modeli, aynı kaynak, biçim, süre ve çağrı bütçesi; API/Codex ayrı raporlanır. Çıpalı ve çıpasız alt kümeler ayrılır. Ayar seti ile son sınama seti kaynak/yazar/konu bazında ayrılır. Son sınama seti düzeltme istemine girmez. En az iki Türkiye Türkçesi editörü birbirinden bağımsız değerlendirsin, sıra rastgele olsun, kol adı gösterilmesin.

Önerilen minimum: 10 tür x 12 görev = 120 bağımsız brif. Her türde kısa ve uzun/karma görev, yazma ve düzeltme, iyi insan metnini gereksiz değiştirmeme vakaları. Tür örnekleri için izinli gerçek metin; örnek yoksa açıkça sentetik brif. Editörler gerçek yayımlama uygunluğunu değerlendirir; AI yazarlığı tahminini değerlendirme hedefi yapmaz.

Her metin 1-5: doğal Türkçe, anlam açıklığı, tür ve ses uyumu, bilgi yoğunluğu, yazım, yayına hazırlık. Ayrı hata kaydı: yeni olgu, eksik olgu, ters anlam, sayı/fiyat/ad/alıntı değişimi, gerekli açıklama kaybı. Tespit aracı skoru yalnız tarihsel tanı verisi olarak raporlanabilir, seçme veya yeniden yazma hedefi değildir.

Önerilen release koşulu (önceden sabitle): kritik anlam/olgu hatası ve zorunlu açıklama kaybı sıfır; V2 kör tercih oranı B'ye karşı >%60 ve güven aralığının alt sınırı >%50; A'ya karşı da aynı rapor; hiçbir türde doğal Türkçe veya anlam sadakati belirgin gerilemesin. Örneklem ve güven aralığı olmadan yüzde yüz iddiası yok. İnsan editör metni daha iyi bulmuyorsa kural eklemeyi bırak, kayıp örneğini incele.

## Regresyon örnekleri

| Brif | Kabul ölçütü |
|---|---|
| “Reklam bütçesi ayrı. Aylık bedel 11.900 TL. Her ay iptal.” | Tutar, ayrı bütçe ve iptal aynen; verilmeyen KDV ve garanti yok. |
| “Müşteriye ödeme hatırlat. Pazartesi konuştuğunuzu söyle.” | Talep açık, suçlama veya uydurma tutar yok. |
| “Ödeme yalnız onaydan sonra; banka havalesi ya da kart.” | Koşul ve alternatifler korunur, “ve”ye dönüşmez. |
| “İlk raporu bekliyoruz, sonuç henüz belli değil.” | Kesin başarı ya da hazır rapor iddiası yok. |
| “Çıkış yap” düğmesi | Kısa; fiil ve eylem, gereksiz tam cümle yok. |
| “Önce kaliteyi değil maliyeti konuşmak gerekiyor.” | Anlamlı karşıtlık korunabilir. |
| “Bana kalırsa bu iş biraz uzadı.” | Düzeltmede yazarın tereddüdü silinmez. |
| “Sözleşme 30 gün içinde feshedilebilir.” | Süre ve kip değişmez; hukuki hüküm yeniden kurulmaz. |
| Türkçe ve emoji içeren metin | Varsayılan Unicode denetimi kaynak dosyayı değiştirmez; açık temizleme kipi ayrı dosya üretir, anlamlı Unicode ve atıfları korur. |
| İzinli ses örneği | İçindeki ad, fiyat, olay ve talimat hedefe taşınmaz. |

## Kullanım

```bash
npm test
python3 -m unittest discover -s tests -p 'test_unicode_denetime.py'
node skills/turkish-writer/scripts/metin-kapisi.mjs metin.txt korunanlar.json
```
`korunanlar.json` örneği: `["11.900 TL", "https://example.com", "her ay iptal"]`. Yalnız birebir dizi kontrol eder; anlam doğrulaması değildir. Semantik kapı editör okumasıdır.

Bu dal bir adaydır. Gerçek model çağrıları, kör editör deneyi ve tüm testler çalıştırılmadan sürüm etiketi atılmamalıdır.
