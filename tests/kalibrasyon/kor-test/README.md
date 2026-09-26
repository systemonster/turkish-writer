# Kör testler

Bu klasörde iki kör test var:

- **Model kör testi 1** (`model-seti-1.json`, `model-uret.mjs`, `model-brif/`): aynı brif
  birkaç modele yazdırılır, hangi modelin yazdığı gizlidir.
- **İnsan mı, beceri mi? Kör test 1** (`set-1.json`, `cevap-anahtari-1.json`,
  `hakem-esli.mjs`): aşağıda anlatılıyor.

## İnsan mı, beceri mi? Kör test 2 (2026-09-26)

`set-2.json`, `cevap-anahtari-2.json` (git dışı; anahtarda brif, döngü öncesi taslak, döngü
kaydı, kaynak ve kısa atıf), `set-2-kaynak/` (git dışı: seçim ve brif olguları, Journo ham
metinleri, üretim kayıtları), `kur-set-2.mjs` (kurulum). Set-1'de kullanılmamış, sayfada
gösterilebilir lisanslı insan metni: blog 10 (Journo, CC BY-SA), kurumsal 8 ve duyuru 2 (kamu
kurumu). Beceri tarafı `hakem-dongusu.mjs` ile. Ölçüm: `hakem-esli.mjs --set 2 [--once]`,
saklı hakem için model adı `sakli`. Sonuçlar ve set-1 karşılaştırması: `../SONUC-HAKEM.md`.

## İnsan mı, beceri mi? Kör test 1 (2026-09-26)

Soru: turkish-writer'ın Yaz kipiyle yazılan metin, aynı konuda editörden geçmiş bir insan
metninin yanında konduğunda ayırt edilebiliyor mu?

### Dosyalar

| Dosya | İçerik | Git |
|---|---|---|
| `set-1.json` | 20 çift: `id`, `tur`, `konu`, `a`, `b`. Hangisinin insan olduğu yazmaz. | dışı |
| `cevap-anahtari-1.json` | Her çift için `insan: "a" \| "b"`, kaynak, URL, lisans, insan parçasının paragraf numaraları, kelime sayıları, beceriye giden brif ve LLM hakem sonuçları (`hakem`) | dışı |
| `hakem-esli.mjs` | LLM hakem ön ölçümü | içi |

İki JSON da git dışıdır. Anahtar, set kör kalsın diye dışarıda. Setteki insan parçaları
çoğunlukla CC BY-NC-ND lisanslı kaynaklardan geliyor; derlem bu metinleri "dağıtmadan, iç
ölçüm için" kullanma dayanağıyla aldı. Depoya girmeleri bu dayanağı bozar.

### Nasıl kuruldu

1. **İnsan tarafı.** `tests/kalibrasyon/derlem-nitelikli/insan/` (paralel olarak kurulan
   nitelikli derlem; kaynak, tür ve lisans `meta.json`'da) içinden 20 metin seçildi. Her
   metinden kendi içinde anlamlı, 85-145 kelimelik ardışık paragraflar alındı; ara başlık
   atıldı, metne dokunulmadı. Önceki paragrafa bağlanan ("Oysa", "bu yapı içinde"),
   çeviri alıntı taşıyan ve dağınık yazım hatalı bölümler seçilmedi.
   - Blog 11: Açık Bilim 5 (ab01, ab05, ab06, ab09, ab10), Journo 4 (jo03, jo04, jo09,
     jo10), Heinrich Böll Stiftung Türkiye 2 (bo02, bo03).
   - Duyuru 7: TCMB 2 (tc04, tc05), Boğaziçi Üniversitesi 3 (bu05, bu07, bu08), KOSGEB 1
     (ko05), TÜBİTAK 1 (tb04).
   - Kurumsal 2: TCMB tanıtım ve tarihçe sayfaları (tk01, tk02).
   - Vikipedi seçkin maddeleri derlemde "blog" etiketliydi, ansiklopedi metni olduğu ve
     çeviri olup olmadığı belirsiz olduğu için alınmadı.
2. **Brif.** Her parçanın olguları ve görüşleri madde madde, cümleleri kopyalanmadan
   yazıldı: metin türü, konu, kişi ve ses, olgu listesi, hedef kelime (insan parçasının
   uzunluğu, ±%8) ve paragraf sayısı. Brifte "bu, daha uzun bir yazının ortasından bir
   bölümdür; başlık, selam, kapanış yok" notu da vardı; insan tarafı da bir bölüm olduğu
   için. Ad, kurum, sayı ve tarihler iki tarafta aynı: brife aynen girdi. Brifler
   `cevap-anahtari-1.json` içinde (`brif` alanı).
3. **Beceri tarafı.** `skills/turkish-writer/scripts/openai-taslak.mjs`, model
   `gpt-5.6-sol`, çıpa açık. Tür bayrağı: blog için `--tur blog`; duyuru ve kurumsal için
   `--tur site` (betikte duyuru türü yok, en yakını site). Betik lovefengis klasöründen
   çalıştırıldı, anahtarı oradaki `.env`'den aldı. Uzunluk ±%13 dışına çıkarsa brife
   "çok kısa/uzun" notu eklenip yeniden üretilecekti; 20 çiftin 19'u ilk denemede tuttu,
   ab06 ikinci denemede. İki brif (bo03, ab05) ilk üretimde brifin iç dilini metne
   taşıdığı için ("yazara göre", "yazıda daha önce anlatılan") brif düzeltilip yeniden
   üretildi. Uzunluk oranı beceri/insan 0,89-1,02.
4. **Eşitleme.** İki tarafta da kıvrık tırnak ve kesme işareti düz tırnağa çevrildi, fazla
   boşluk silindi. Başka değişiklik yok.
5. **Sıra.** Çiftlerin sırası ve insan metninin a/b yeri tohumlu rastgele (tohum
   anahtarda). İnsan 10 çiftte `a`, 10 çiftte `b`.

### LLM hakem ön ölçümü

```bash
# lovefengis klasöründen (anahtar .env'de)
node <turkish-writer>/tests/kalibrasyon/kor-test/hakem-esli.mjs gpt-4.1 gpt-6-sol
```

Soru `kalibre-beceri.mjs`'deki eşli istemle aynı: "Biri insan, öteki yapay zekâ; hangisini
insan yazdı?" Her çift iki sırayla (a-b, b-a) soruldu: 20 × 2 = 40 deneme. gpt-4.1
temperature 0; gpt-6-sol (o gün erişilebilen en yeni metin modeli, 2026-09-14) varsayılan
ayarla. Doğru = insan metnini seçmek, şans %50.

| Hakem | Doğru | Oran | %95 GA (Wilson) | Binom p | Çift: ikisi doğru / ikisi yanlış / tutarsız | Blog / duyuru / kurumsal | "A" seçimi |
|---|---|---|---|---|---|---|---|
| gpt-4.1 | 23/40 | %57,5 | %42,2-71,5 | 0,43 | 7 / 4 / 9 | 13/22, 7/14, 3/4 | 21/40 |
| gpt-6-sol | 39/40 | **%97,5** | %87,1-99,6 | < 0,001 | 19 / 0 / 1 | 21/22, 14/14, 4/4 | 21/40 |

**Okuma.**
- gpt-4.1 şans düzeyinden ayrılmadı; 20 çiftin 9'unda iki sırada farklı karar verdi. Bu
  hakemle beceri bu insan metinlerinden ayırt edilemiyor. Ama gpt-4.1 bu testte zayıf bir
  hakem, bu sonuç tek başına "ayırt edilemiyor" demek değil.
- gpt-6-sol beceriyi neredeyse her seferinde yakaladı. Gerekçelerinde iki şey tekrar
  ediyor: insan metni "yer yer pürüzlü", "kendine özgü"; beceri metni "düzgünleştirilmiş
  bir yeniden yazım", "tekrarlı", "gereksiz açıklamalarla genişletilmiş".
- "Tekrarlı" gerekçesi gerçek bir kusura denk geliyor: uzunluğu tutturmak için beceri aynı
  olguyu ikinci kez söyleyen dolgu cümleleri ekledi (bo02, bu05, ab01, tk01, bu08).
- tr-scan iki tarafı ayırmıyor (skor medyanı insan 100, beceri 94). Ayıran tek ölçüm yine
  uzun cümle: 25 kelimeyi aşan cümlesi olan metin insanda 14/20, beceride 5/20
  (`SONUC-BECERI.md` §4 #10'daki iz sürüyor).

Kurucunun oylaması sonra gelecek; `set-1.json`'u okuyup her çift için "insan: a/b" yazması
yeterli, sonuç `cevap-anahtari-1.json` ile karşılaştırılır.

### Bilinen sınırlar

- **Eşli tasarım "hangisi yeniden yazım" sorusuna dönüşebiliyor.** İki metin aynı olguları
  taşıdığı için güçlü hakem, olguları brif sırasıyla, sadık ve düzgün veren metni
  "öbürünün yeniden yazımı" diye seçebiliyor. Gerçek kullanımda okur yalnız bir metin görür.
- **Yalnız taslak ölçüldü.** Beceri Yaz kipinde taslaktan sonra Düzelt geçişlerini (0-6)
  uygular; burada uygulanmadı, çünkü elle düzeltme Claude'un sesini katar ve 20 çifte
  aynı özenle yapılamaz. Tam beceri çıktısı bundan iyi olabilir. Özellikle "uzunluğu koru"
  ve "tekrar" kusurları Düzelt geçişinde ele alınması gereken şeyler.
- **Uzunluk dar ama tek yönlü.** Beceri metinleri insanınkinden ortalama %5 kısa
  (oran 0,89-1,02); ±%15 içinde ama hep aynı yönde.
- **Brifi Claude kurdu.** Olguları insan parçasından çıkarmak, insan metnin bilgi sırasını
  ve vurgusunu brife taşıyor; beceri bu sırayı izliyor. Bu da "yeniden yazım" izlenimini
  güçlendiriyor.
- **Tür dengesi.** 20 çiftin 11'i blog, 7'si duyuru, 2'si kurumsal (derlemde kurumsal
  yalnız iki metin vardı). Blog tarafı editörlü dergi ve düşünce kuruluşu yazısı; kişisel
  blog yok. Duyuru ve kurumsal için becerinin ayrı bir türü yok, `site` çıpası kullanıldı.
- **Kaynak yoğunluğu.** Duyuruların çoğu 2019-2021 kamu kurumu metni; blogların yarısı
  Açık Bilim. Aynı kaynaktan birden fazla parça var.
- **Hakem ailesi.** İki hakem de OpenAI; üretici de OpenAI (gpt-5.6-sol). Başka ailenin
  hakemi farklı sonuç verebilir. gpt-6-sol'da temperature verilemediği için tekrar
  çalıştırmada birkaç karar değişebilir.
- **Az örnek.** 20 çift, 40 deneme; tür kırılımları (özellikle kurumsal 4 deneme) yorum
  için fazla küçük.
- **İnsan metni de kusursuz değil.** Seçilen parçalarda "dahil", "onbinlerce", "tedariğine",
  "itibari ile" gibi TDK dışı yazımlar kaldı; bunlar insan işareti olarak okunabilir.
