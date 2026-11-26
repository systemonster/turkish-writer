# BOUN derleminden ilk dil bilgisi bulguları

Kaynak: [UD Turkish BOUN](https://github.com/UniversalDependencies/UD_Turkish-BOUN/tree/09521f40c90904df85524b8e0b43afba6e4c7823), TABILAB / Boğaziçi Üniversitesi; Türkçe Ulusal Derlem'den seçilmiş, elle işaretlenmiş metinler. Eğitim bölümü, 7.803 cümle. Bu sayılar gerçek hesaplamadır; blog editörlüğü başarı ölçümü değildir. Kaynak: CC BY-SA 4.0. Bu türetilmiş veri notu da CC BY-SA 4.0 olarak dağıtılır. [Tam istatistik](https://github.com/systemonster/turkish-writer/blob/b2b8cebd9099b3eb7c0d8e802390f37940b6ea1c/corpus-lab/results/boun-train-v1.json).

## Dil bilgisi kararları

| Grup | Cümle | İşaretli sözcük (noktalama/simge hariç) | Fiil başına bağlı açık öznenin fiilden önce gelme oranı* | Fiil başına bağlı nesnenin fiilden önce gelme oranı* | En az bir zarf-fiil işaretli cümle |
|---|---:|---:|---:|---:|---:|
| Toplam | 7803 | 83998 | %97,3 (4497/4623) | %97,8 (4806/4915) | 837 |
| Biyografi | 1576 | 16455 | %97,4 (898/922) | %97,1 (1013/1043) | 204 |
| Deneme | 1561 | 18310 | %95,2 (797/837) | %97,8 (1216/1243) | 181 |
| Öğretici | 1580 | 13962 | %95,5 (855/895) | %96,8 (784/810) | 168 |
| Haber | 1518 | 20831 | %99,7 (1309/1313) | %99,2 (971/979) | 119 |
| Popüler kültür | 1568 | 14440 | %97,3 (638/656) | %97,9 (822/840) | 165 |

* Sadece bağımlılık çözümünde VERB başına bağlı nsubj/obj bağımlılıkları; tüm özne veya nesneler, odak, vurgu ya da özne düşürme ölçülmüyor. Sözcük sayısı CoNLL-U çözümleme birimidir; yüzeydeki boşlukla ayrılmış kelime sayısıyla aynı değildir. Gruplar kaynak sent_id ön ekleridir.

- Özne ve nesne çoğunlukla fiilden önce, ancak fiilden sonra gelen örnekler de var. Bu bulgu yerleşik Türkçe sıralama tercihinin katı bir düzeltme kuralına dönüşmemesi gerektiğini destekler. Odağı ayrıca bağlamdan çıkar.
- Zarf-fiil kullanımı metin türüne göre değişir. Her `ve`yi ulaçla değiştirme. Eyleyen, zaman ve nedensellik aynı kalmalı.
- Sadece 2505/4879 fiil köklü cümle yapısında doğrudan nsubj işaretlendi. Bu sayım öznenin yokluğu veya düşürülme oranı değildir; açık özne aramak için kaba bir oran kullanılmaz.
- Aşağıdaki eş dizimler sözcük kökü/bağımlılık düzeyinde gözlenmiş ilişkilerdir. Bunlar dil bilgisi açısından olası örneklerdir, yasaklı veya zorunlu kullanım listesi değildir. Düşük frekans yanlış kullanım demek değildir; alan, anlam ve bağlam değişebilir.

| İsim lemması | Fiil lemması | Bağ | Durum | Sayı |
|---|---|---|---|---:|
| baş | ol | obl | Loc | 15 |
| iş | yap | obj | Acc | 13 |
| şey | yap | obj | Acc | 12 |
| akıl | gel | obl | Dat | 11 |
| hâl | gel | obl | Dat | 11 |
| iç | bulun | obl | Loc | 11 |
| zaman | ol | obl | Nom | 11 |
| hâl | getir | obl | Dat | 10 |
| kapı | aç | obj | Acc | 10 |
| ara | ol | obl | Loc | 9 |
| dakika | pişir | obl | Nom | 9 |
| bilgi | ver | obj | Acc | 8 |
| sabah | uyan | obl | Nom | 8 |
| ara | bulun | obl | Loc | 7 |
| ayakkabı | giy | obj | Acc | 7 |

## Sınır

Bu çalışma blog paragrafı, anlatım gücü, kaynak kalitesi veya editör kararının ölçümü değildir. Yalnız BOUN train bölümü incelendi; dev/test kullanılmadı. Büyük web derlemi ve editör düzeltme çiftleri ayrı aşamadır. Sayıları bir metin için hedef, puan veya otomatik düzenleme emri yapma.
