# Kaynaklar ve lisanslar

Bu beceri aşağıdaki kaynakların okunup Türkçe site ve blog metnine uyarlanmasıyla
yazıldı. Kaynaklardan uzun pasaj aktarılmadı; kurallar yeniden yazıldı, kısa örnekler
uyarlandı ve her birinin kaynağı ilgili dosyada belirtildi.

## Yapay zekâ yazısı izleri (İngilizce)

| Kaynak | Lisans | Nerede kullanıldı |
|---|---|---|
| [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) | CC BY-SA 4.0 | `evrensel-izler.md`, `yasakli-kaliplar-tr.md` |
| [Wikipedia: WikiProject AI Cleanup](https://en.wikipedia.org/wiki/Wikipedia:WikiProject_AI_Cleanup) | CC BY-SA 4.0 | `evrensel-izler.md`, `denetleyici.md` |
| [blader/humanizer](https://github.com/blader/humanizer) | MIT | `evrensel-izler.md`, `SKILL.md` (iş akışı, uydurma yasağı, iz gücü kademesi) |
| [petergyang/no-ai-slop](https://github.com/petergyang/no-ai-slop) | MIT | `evrensel-izler.md`, `mantik-kapisi.md` (taşınabilirlik testi, en küçük etkili düzenleme) |
| [conorbronsdon/avoid-ai-writing](https://github.com/conorbronsdon/avoid-ai-writing) | MIT | `evrensel-izler.md` |
| [lynote-ai/humanize-text](https://github.com/lynote-ai/humanize-text) | MIT | `evrensel-izler.md` §3 (teknikleri değerlendirildi, çoğu alınmadı) |
| [rephrasyai/rephrasy-skills](https://github.com/rephrasyai/rephrasy-skills) | MIT | `evrensel-izler.md` §4 (değerlendirildi, alınmadı) |

`evrensel-izler.md` içindeki Wikipedia kaynaklı bölümler CC BY-SA 4.0 kapsamındadır; o
bölümleri yeniden kullanan aynı lisansla paylaşmalıdır.

## Yapay zekâ yazısı izleri (Türkçe)

| Kaynak | Lisans | Nerede kullanıldı |
|---|---|---|
| [tahiryildiz/insanca](https://github.com/tahiryildiz/insanca) | MIT, © 2026 Tahir Yıldız | `turkce-parmak-izi.md`, `yasakli-kaliplar-tr.md`, `scripts/tr-scan.mjs` (kalıp kuralları) |
| [durmazoguzhan/turkish-humanify](https://github.com/durmazoguzhan/turkish-humanify) | MIT | `sicil.md` (sicil dozlama), `scripts/tr-scan.mjs` |
| [agmmnn/turkish-nlp-resources](https://github.com/agmmnn/turkish-nlp-resources) | liste | araç taraması; bağımlılık olarak bir şey alınmadı |
| ChatGPT, DeepSeek, Gemini, Grok, z.ai çıktıları | yok | ilk taslak; "Türkçeyi yapay zekâ gibi yazma" sorusuna verdikleri cevaplar karşılaştırıldı |

Kullanıcının verdiği `korcarc/text-humanizer` bağlantısı çalışmıyor (hesap yok). Yerine
tek Türkçe muadil olan `turkish-humanify` incelendi.

## Türkçe dil bilgisi ve yazım

| Kaynak | Nasıl kullanıldı |
|---|---|
| [TDK Yazım Kılavuzu](https://yazim.tdk.gov.tr/) | `tdk-yazim.md`: kurallar kendi cümlelerimizle özetlendi, her bölüm kaynağına bağlandı |
| TDK Yazım Kılavuzu dizini (`assets/dizin.json`) | **dağıtılmaz**; `scripts/tdk-dizin-derle.mjs` kullanıcının makinesinde TDK'dan indirir |
| [TDK Güncel Türkçe Sözlük](https://sozluk.gov.tr/) | yazım ve telaffuz doğrulaması (ör. ünvan, dâhil/dahil, mütevazı/mütevazi) |
| G. van Schaaik, *The Oxford Turkish Grammar*, Oxford UP, 2020 | `turkce-parmak-izi.md`: odak, sözcük sırası, ulaçlar, söylem parçacıkları (özetlenerek, bölüm numarasıyla) |
| G. L. Lewis, *Turkish Grammar*, 2. bs., Oxford UP, 2000 | aynı |
| TDK, *İmla Kılavuzu* (2000 baskısı) | güncel kılavuzla karşılaştırma |
| Ş. Şimşek, "Türkçe Eğitiminde Yaratıcı Yazma", *Kastamonu Eğitim Araştırmaları Yıllığı*, 2021, s. 531-542 | `turkce-parmak-izi.md` (sınırlı) |

Kitaplar depoda yoktur ve dağıtılmaz. Onlardan yalnız kural özetleri ve bir satırlık
örnekler alındı.

## Araştırmalar

| Çalışma | Kullanıldığı yer |
|---|---|
| Russell ve ark., "StoryScope", 2026, arXiv:2604.03136 | `mudahale-defteri.md`: yapısal izler (%93,2 F1), yüzey düzenlemesinin etkisi (1,6 puan) |
| Kobak ve ark., "Delving into ChatGPT usage in academic writing through excess vocabulary", *Science Advances*, 2025, arXiv:2406.07016 | `denetleyici.md` |
| Juzek ve Ward, "Why Does ChatGPT 'Delve' So Much?", COLING 2025 | `denetleyici.md` |
| Ozdemir, 2026, arXiv:2602.13504 (Türkçe haberde LLM metni sınıflandırma) | `denetleyici.md` |

Türkçe LLM çıktısında hangi kelimelerin aşırı kullanıldığını ölçen hakemli bir çalışma
bulunamadı. Bu becerinin Türkçe ölçümleri kendi kalibrasyonuna dayanır.

## Kalibrasyon verisi

| Veri | Lisans / not |
|---|---|
| [batubayk/TR-News](https://huggingface.co/datasets/batubayk/TR-News) (2009-2020 haber) | `tests/kalibrasyon/derlem/` altında, depoya girmez |
| [turkish-nlp-suite/temiz-OSCAR](https://huggingface.co/datasets/turkish-nlp-suite/temiz-OSCAR) (Common Crawl, 2018) | aynı |
| OpenAI `gpt-4o`, `gpt-4o-mini`, `gpt-4.1-mini` çıktıları | karşılaştırma için üretildi, depoya girmez |

Derlemler telif nedeniyle yayınlanmaz. `tests/kalibrasyon/kalibre.mjs` ve
`kalibre-site.mjs` onları yeniden üretir (OpenAI anahtarı gerekir). Sonuçlar
`SONUC.md` ve `SONUC-SITE.md` dosyalarındadır.

## Çıpa derlemi (`cipa/`)

Yaz kipinde few-shot örnek olarak kullanılan kısa insan metinleri. Her dosyanın başında
kaynak, tarih ve lisans cümlesi aynen yazılıdır.

| Kaynak | Lisans | Tür |
|---|---|---|
| [Creative Commons Türkiye](https://creativecommons.org.tr/) | CC BY 4.0 | site, blog, reklam |
| [Türkçe Vikipedi](https://tr.wikipedia.org/) (Köy çeşmesi, Danışma masası, karşılama şablonu, anı defteri) | CC BY-SA 4.0 (bu dosyalar aynı lisansla paylaşılır) | reklam, whatsapp |
| Sabahattin Ali, *Kürk Mantolu Madonna*, 1943 ([Vikikaynak](https://tr.wikisource.org/wiki/K%C3%BCrk_Mantolu_Madonna)) | kamu malı (FSEK md. 27) | blog |
| 6698 sayılı KVKK md. 10, 13; 6502 sayılı TKHK md. 48 ([mevzuat.gov.tr](https://www.mevzuat.gov.tr/)) | FSEK md. 31 | hukuk |
