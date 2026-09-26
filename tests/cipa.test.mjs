// node --test tests/
// openai-taslak.mjs çıpa altyapısı: bayrak ayrıştırma, çıpa seçimi, kopya kontrolü, geriye uyum.
// API çağrısı yapılmaz.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import {
  bayraklariAyristir, cipaDosyasiOku, cipaSec, sistemIstemi, kopyaKontrol, brifOlcu, uzunlukUyarisi, kelimeler, adDenetle, adUyarilari,
  SISTEM, TURLER, GENEL_CIPA,
} from '../skills/turkish-writer/scripts/openai-taslak.mjs'

const dosya = (meta, govde) => `---\n${Object.entries(meta).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n\n${govde}\n`

function kurKlasor() {
  const kok = mkdtempSync(join(tmpdir(), 'cipa-'))
  const genel = join(kok, 'genel')
  mkdirSync(join(genel, 'site'), { recursive: true })
  mkdirSync(join(genel, 'blog'), { recursive: true })
  writeFileSync(join(genel, 'site', 'a.md'), dosya({ kaynak: 'x', tur: 'site' }, 'Genel site bir.'))
  writeFileSync(join(genel, 'site', 'b.md'), dosya({ kaynak: 'x', tur: 'site' }, 'Genel site iki.'))
  writeFileSync(join(genel, 'site', 'c.md'), dosya({ kaynak: 'x' }, 'Genel site üç.'))
  writeFileSync(join(genel, 'site', 'd.md'), dosya({ kaynak: 'x' }, 'Genel site dört.'))
  writeFileSync(join(genel, 'site', 'README.md'), 'okunmaz')
  writeFileSync(join(genel, 'site', 'bos.md'), dosya({ kaynak: 'x' }, ''))
  writeFileSync(join(genel, 'site', 'yanlis-tur.md'), dosya({ kaynak: 'x', tur: 'blog' }, 'Blog metni.'))
  writeFileSync(join(genel, 'blog', 'a.md'), dosya({ kaynak: 'x' }, 'Genel blog.'))
  const proje = join(kok, 'proje')
  mkdirSync(join(proje, 'site'), { recursive: true })
  writeFileSync(join(proje, 'site', 'm1.md'), dosya({ kaynak: 'kurucu' }, 'Proje site mesajı.'))
  const duz = join(kok, 'duz')
  mkdirSync(duz)
  writeFileSync(join(duz, 'x.md'), dosya({ kaynak: 'kurucu' }, 'Düz klasör metni.'))
  return { kok, genel, proje, duz }
}

// --- bayrak ayrıştırma

test('bayrak: yalnız brif (eski kullanım)', () => {
  const s = bayraklariAyristir(['brif.md'])
  assert.equal(s.hata, undefined)
  assert.equal(s.brifYolu, 'brif.md')
  assert.equal(s.tur, undefined)
  assert.deepEqual(s.cipa, [])
})

test('bayrak: eski --out ve --model her sırada çalışır', () => {
  for (const argv of [['brif.md', '--out', 't.md', '--model', 'm'], ['--model', 'm', 'brif.md', '--out', 't.md']]) {
    const s = bayraklariAyristir(argv)
    assert.equal(s.hata, undefined)
    assert.equal(s.brifYolu, 'brif.md')
    assert.equal(s.out, 't.md')
    assert.equal(s.model, 'm')
  }
})

test('bayrak: --tur ve tekrarlanan --cipa', () => {
  const s = bayraklariAyristir(['b.md', '--tur', 'site', '--cipa', 'p1', '--cipa', 'p2', '--cipa-yok'])
  assert.equal(s.hata, undefined)
  assert.equal(s.tur, 'site')
  assert.deepEqual(s.cipa, ['p1', 'p2'])
  assert.equal(s.cipaYok, true)
})

test('bayrak: hatalar', () => {
  assert.match(bayraklariAyristir([]).hata, /brif/)
  assert.match(bayraklariAyristir(['b.md', '--tur', 'roman']).hata, /bilinmeyen tür/)
  assert.match(bayraklariAyristir(['b.md', '--tur']).hata, /değer ister/)
  assert.match(bayraklariAyristir(['b.md', '--out', '--model', 'm']).hata, /değer ister/)
  assert.match(bayraklariAyristir(['b.md', '--cipa', 'p']).hata, /--tur gerekir/)
  assert.match(bayraklariAyristir(['b.md', '--xyz']).hata, /bilinmeyen bayrak/)
  assert.match(bayraklariAyristir(['b.md', 'c.md']).hata, /fazla argüman/)
})

test('bayrak: bütün türler geçerli', () => {
  for (const t of ['site', 'blog', 'reklam', 'whatsapp', 'teklif', 'hukuk']) assert.ok(TURLER.includes(t))
})

// --- dosya okuma

test('çıpa dosyası: ön bilgi ve gövde ayrılır', () => {
  const { meta, govde } = cipaDosyasiOku('---\nkaynak: https://ornek\nlisans: CC BY 4.0\nneden_iyi: ritim\n---\n\nBirinci paragraf.\n\nİkinci.\n')
  assert.equal(meta.kaynak, 'https://ornek')
  assert.equal(meta.lisans, 'CC BY 4.0')
  assert.equal(meta.neden_iyi, 'ritim')
  assert.equal(govde, 'Birinci paragraf.\n\nİkinci.')
})

test('çıpa dosyası: eski ornekler/ biçimi (başlık satırları + tek ---) ve CRLF', () => {
  const { meta, govde } = cipaDosyasiOku('kaynak: kendi\r\nneden iyi: kısa\r\n---\r\nMetin burada.\r\n')
  assert.equal(meta.kaynak, 'kendi')
  assert.equal(meta['neden iyi'], 'kısa')
  assert.equal(govde, 'Metin burada.')
})

// --- seçim

test('seçim: --tur yoksa çıpa yok', () => {
  const { genel } = kurKlasor()
  assert.deepEqual(cipaSec({ genel }), [])
})

test('seçim: en fazla 3, ad sırasıyla; README, boş gövde ve başka türün dosyası atlanır', () => {
  const { genel } = kurKlasor()
  const s = cipaSec({ tur: 'site', genel })
  assert.deepEqual(s.map((c) => c.ad), ['a.md', 'b.md', 'c.md'])
  const hepsi = cipaSec({ tur: 'site', genel, enFazla: 10 }).map((c) => c.ad)
  assert.ok(!hepsi.includes('README.md') && !hepsi.includes('bos.md') && !hepsi.includes('yanlis-tur.md'))
  assert.equal(hepsi.length, 4)
})

test('seçim: proje çıpası (<yol>/<tür>/) genelden önce gelir', () => {
  const { genel, proje } = kurKlasor()
  const s = cipaSec({ tur: 'site', yollar: [proje], genel })
  assert.deepEqual(s.map((c) => c.govde), ['Proje site mesajı.', 'Genel site bir.', 'Genel site iki.'])
})

test('seçim: türe ait alt klasörü olmayan proje klasörünün kendisi, ya da tek dosya okunur', () => {
  const { genel, duz } = kurKlasor()
  assert.equal(cipaSec({ tur: 'blog', yollar: [duz], genel })[0].govde, 'Düz klasör metni.')
  assert.equal(cipaSec({ tur: 'blog', yollar: [join(duz, 'x.md')], genel }).length, 2)
})

test('seçim: olmayan yol ve boş tür sessizce atlanır', () => {
  const { genel, kok } = kurKlasor()
  assert.deepEqual(cipaSec({ tur: 'teklif', yollar: [join(kok, 'yok')], genel }), [])
})

// --- uzunluk uyarısı (tur 3)

test('brifOlcu: uzunluk aralığı, tek hedef ve olgu maddesi sayısı', () => {
  assert.deepEqual(brifOlcu('Olgu listesi:\n- a\n- b\n* c\nUzunluk: 400-480 kelime.'), { olgu: 3, alt: 400, ust: 480 })
  assert.deepEqual(brifOlcu('- a\nUzunluk: yaklaşık 1.200 kelime.'), { olgu: 1, alt: 1200, ust: 1200 })
  assert.deepEqual(brifOlcu('- a\nKısa yaz.'), { olgu: 1 })
})

test('uzunlukUyarisi: hedefin %70 altı "brifte olgu az" der; yeterliyse ve hedef yoksa susar', () => {
  const brif = '- tek olgu\nUzunluk: 100-120 kelime.'
  assert.match(uzunlukUyarisi(brif, 'kelime '.repeat(40)), /brifte olgu az: metin 40 kelime, hedef 100-120 \(%40\); 1 olgu/)
  assert.equal(uzunlukUyarisi(brif, 'kelime '.repeat(75)), null)
  assert.equal(uzunlukUyarisi('- a', 'kısa'), null)
})

// --- istem

test('istem: çıpa yoksa sistem istemi eskisiyle birebir aynı (geriye uyum)', () => {
  assert.equal(sistemIstemi([]), SISTEM)
  assert.equal(sistemIstemi(), SISTEM)
  // SISTEM metni sabitlenir: istem değişikliği bilinçli olmalı ve ölçümle gelmeli.
  // 23f878e8842e82b6 (0fd8619/395d4ee, 0.1.0) → 4beee8889dfb851b (2026-09-26): "ve'yi azalt" ve
  // kısa cümle yönlendirmesi kaldırıldı; nitelikli insan ritmi (ortalama 17-21 kelime, her 4-5
  // cümleden biri 25+), dolgu yasağı, esnek uzunluk ve "fazla düzgünlük" kuralları eklendi.
  // Gerekçe ve önce/sonra ölçümü: tests/kalibrasyon/SONUC-NITELIKLI.md "İstem turu 2".
  // 4beee8889dfb851b → 0a1c94dc7545a80d (tur 3): uzunluk hedef aralık; metin olguları açarak uzar
  // (okur için anlamı, işleyişi, adımı), yeni olgu ve dolgu yine yasak. SONUC-NITELIKLI.md "Tur 3".
  // 0a1c94dc7545a80d → e09e6d4d16538e61 (tur 4, adım A): brifteki girintili olgu açılımı (okur için anlamı /
  // nasıl işler / ne yapması gerekir) kurum ve duyuru metninde olguyu açmak için kullanılır. SONUC-NITELIKLI.md "Tur 4".
  assert.equal(createHash('sha256').update(SISTEM).digest('hex').slice(0, 16), 'e09e6d4d16538e61')
})

test('istem: çıpalar taklit talimatı ve içerik kopyalama yasağıyla girer', () => {
  const ist = sistemIstemi([{ govde: 'Örnek bir.' }, { govde: 'Örnek iki.' }])
  assert.ok(ist.startsWith(SISTEM))
  assert.match(ist, /Bu kişilerin yazdığı gibi yaz; içeriği değil ritmi ve sözcük seçimini taklit et/)
  assert.match(ist, /olgu, ad, marka/)
  assert.match(ist, /<ornek no="1">\nÖrnek bir.\n<\/ornek>/)
  assert.match(ist, /<ornek no="2">/)
})

// --- kopya kontrolü

const cipa = [{ ad: 'c.md', govde: 'Kısa cümlenin yanına uzun bir cümle koyarsanız metin nefes alır, okur da yorulmaz.' }]

test('kopya: 6 kelimelik birebir dizi yakalanır; büyük harf ve noktalama fark etmez', () => {
  const b = kopyaKontrol('Bizde de öyle: KISA cümlenin yanına, uzun bir cümle koyarız.', cipa)
  assert.equal(b.length, 1)
  assert.equal(b[0].cipa, 'c.md')
  assert.equal(b[0].dizi, 'kısa cümlenin yanına uzun bir cümle')
  assert.equal(b[0].uzunluk, 6)
})

test('kopya: en uzun eşleşme tek bulgu olarak raporlanır', () => {
  const b = kopyaKontrol('uzun bir cümle koyarsanız metin nefes alır, okur da yorulmaz', cipa)
  assert.equal(b.length, 1)
  assert.equal(b[0].uzunluk, 10)
})

test('kopya: 5 kelime ve altı uyarmaz; çıpa yoksa bulgu yok', () => {
  assert.deepEqual(kopyaKontrol('Kısa cümlenin yanına uzun bir tablo koyarız.', cipa), [])
  assert.deepEqual(kopyaKontrol('Kısa cümlenin yanına uzun bir cümle.', []), [])
})

test('kopya: Türkçe küçük harf (İ/I) doğru eşlenir', () => {
  assert.deepEqual(kelimeler('İstanbul’da IŞIK'), ['istanbul', 'da', 'ışık'])
})

// --- depodaki genel çıpa

test('depodaki genel çıpa: her dosyada kaynak, tarih, lisans ve "neden iyi" var; gövde dolu', () => {
  if (!existsSync(GENEL_CIPA)) return
  for (const tur of TURLER) {
    const klasor = join(GENEL_CIPA, tur)
    if (!existsSync(klasor)) continue
    for (const f of readdirSync(klasor).filter((x) => x.endsWith('.md') && x !== 'README.md')) {
      const { meta, govde } = cipaDosyasiOku(readFileSync(join(klasor, f), 'utf8'))
      for (const alan of ['kaynak', 'tarih', 'lisans', 'neden_iyi']) assert.ok(meta[alan], `${tur}/${f}: ${alan}`)
      assert.ok(!/\b(NC|ND)\b|GayriTicari|Türetilemez/i.test(meta.lisans), `${tur}/${f}: lisans NC/ND olamaz`)
      assert.ok(govde.split(/\s+/).length >= 20, `${tur}/${f}: gövde çok kısa`)
    }
  }
})

// --- özel ad sadakati (tur 4): brifteki ad aynen geçer, bozuk yazım ve yeni ad uyarı verir

const AD_BRIF = 'Olgu listesi:\n- Sinan, Kanuni Sultan Süleyman döneminde baş mimar oldu.\n- Bereket Ovası Tarım Kooperatifi ödeme takvimini duyurdu.\n- Çaykur 1971 yılında kuruldu.'

test('ad sadakati: bozuk yazım yakalanır, brifteki doğru ad önerilir', () => {
  const r = adDenetle(AD_BRIF, 'Sinan, Kanuni Sultan Süyman döneminde baş mimar oldu.')
  assert.deepEqual(r.bozuk, [{ ad: 'Süyman', benzer: 'Süleyman' }])
  assert.deepEqual(r.yeni, [])
  assert.equal(r.ok, false)
})

test('ad sadakati: cümle başındaki ve ekli bozuk ad da yakalanır', () => {
  assert.deepEqual(adDenetle(AD_BRIF, "Süyman döneminde Sinan baş mimar oldu.").bozuk, [{ ad: 'Süyman', benzer: 'Süleyman' }])
  assert.deepEqual(adDenetle(AD_BRIF, "Sinan, Süyman'ın baş mimarıydı.").bozuk, [{ ad: 'Süyman', benzer: 'Süleyman' }])
})

test('ad sadakati: brifte olmayan yeni özel ad yakalanır', () => {
  const r = adDenetle(AD_BRIF, "Sinan, Kanuni Sultan Süleyman döneminde Edirne'de baş mimar oldu.")
  assert.deepEqual(r.yeni, ['Edirne'])
  assert.deepEqual(r.bozuk, [])
  assert.equal(r.ok, false)
})

test('ad sadakati: ekli ad, kesmesiz kurum adı eki ve cümle başındaki sıradan kelime uyarı vermez', () => {
  const metin = "Bu dönemde Sinan, Süleyman'ın baş mimarıydı. Ödeme listeleri Bereket Ovası Tarım Kooperatifinin merkezinde asılır. Kooperatif Çaykur'dan ayrıdır."
  const r = adDenetle(AD_BRIF, metin)
  assert.deepEqual(r.bozuk, [])
  assert.deepEqual(r.yeni, [])
  assert.equal(r.ok, true)
})

test('ad sadakati: brifteki ad çıktıda yoksa "eksik" bilgi olarak döner, uyarı sayılmaz', () => {
  const r = adDenetle(AD_BRIF, 'Sinan baş mimar oldu.')
  assert.ok(r.eksik.includes('Süleyman'))
  assert.equal(r.ok, true)
})

test('ad sadakati: uyarı satırları', () => {
  const s = adUyarilari(adDenetle(AD_BRIF, "Sinan, Kanuni Sultan Süyman döneminde Edirne'de baş mimar oldu."))
  assert.deepEqual(s, ['UYARI: özel ad bozuk yazılmış: "Süyman" (brifte "Süleyman")', 'UYARI: brifte olmayan özel ad: "Edirne"'])
  assert.deepEqual(adUyarilari(adDenetle(AD_BRIF, 'Sinan baş mimar oldu.')), [])
})

test('bayrak: --katı (ve --kati) ad uyarısını hataya çevirir', () => {
  assert.equal(bayraklariAyristir(['b.md', '--katı']).kati, true)
  assert.equal(bayraklariAyristir(['b.md', '--kati']).kati, true)
  assert.equal(bayraklariAyristir(['b.md']).kati, false)
})

// Uçtan uca: OpenAI çağrısı sahte fetch'le (--import) değiştirilir; betik gerçek süreçte koşar.
function sahteOpenai(taslak) {
  const kok = mkdtempSync(join(tmpdir(), 'ad-'))
  const mock = join(kok, 'mock.mjs')
  writeFileSync(mock, `globalThis.fetch = async (url, o) => {
  const b = JSON.parse(o.body); const soru = b.messages.at(-1).content;
  const icerik = soru.includes('p_yz') ? JSON.stringify({ p_yz: 0.1, genel: '', cumleler: [] }) : ${JSON.stringify(taslak)};
  return new Response(JSON.stringify({ model: b.model, choices: [{ message: { content: icerik } }], usage: {} }), { status: 200 });
};\n`)
  writeFileSync(join(kok, 'brif.md'), AD_BRIF + '\nUzunluk: 5-10 kelime.\n')
  return { kok, mock: pathToFileURL(mock).href }
}
function kos(betik, args, { kok, mock }) {
  const r = spawnSync(process.execPath, ['--import', mock, betik, ...args], { cwd: kok, env: { ...process.env, OPENAI_API_KEY: 'sahte' }, encoding: 'utf8' })
  return { kod: r.status, err: r.stderr }
}
const TASLAK_BETIK = join(GENEL_CIPA, '..', 'scripts', 'openai-taslak.mjs')

test('uçtan uca: bozuk ad stderr\'e UYARI yazar; --katı ile çıkış kodu 4, taslak yine yazılır', () => {
  const o = sahteOpenai('Sinan, Kanuni Sultan Süyman döneminde baş mimar oldu.')
  const a = kos(TASLAK_BETIK, ['brif.md', '--out', 'a.md'], o)
  assert.equal(a.kod, 0)
  assert.match(a.err, /UYARI: özel ad bozuk yazılmış: "Süyman" \(brifte "Süleyman"\)/)
  const b = kos(TASLAK_BETIK, ['brif.md', '--out', 'b.md', '--katı'], o)
  assert.equal(b.kod, 4)
  assert.ok(existsSync(join(o.kok, 'b.md')))
})

test('uçtan uca: adlar temizse --katı çıkış kodu 0', () => {
  const o = sahteOpenai('Sinan, Kanuni Sultan Süleyman döneminde baş mimar oldu.')
  const r = kos(TASLAK_BETIK, ['brif.md', '--out', 'a.md', '--katı'], o)
  assert.equal(r.kod, 0)
  assert.doesNotMatch(r.err, /özel ad/)
})

test('ad sadakati: ek değişen kurum adı ve 4 harfli kısa kelime yanlış alarm vermez (tur 3 derleminden)', () => {
  const brif = '- Tıp Fakültesi Hacettepe Üniversitesinde kuruldu.\n- Dekan Banu Aras açılışı yaptı.'
  assert.equal(adDenetle(brif, 'Açılışı Dekan Banu Aras yaptı; Fakültenin binası Üniversitemizde yer alır.').ok, true)
  assert.equal(adDenetle(brif, '"Bana göre" dedi Banu Aras. Araç yolu açıldı.').ok, true)
})

test('ad sadakati: kısaltmanın büyük/küçük yazımı (COVID / Covid) bozuk sayılmaz', () => {
  assert.equal(adDenetle('- COVID-19 salgını 2020 yılında başladı.', 'Salgın döneminde Covid testleri arttı.').ok, true)
})

test('brifOlcu: girintili alt madde (olgu açılımı) olgu sayılmaz, ayrı sayılır (tur 4)', () => {
  const brif = 'Olgu listesi:\n- Üyelik ücretsizdir.\n  - Okur için anlamı: Ödeme yapmazsınız.\n  - Ne yapması gerekir: Danışmaya başvurursunuz.\n- Pazar kapalıdır.\nUzunluk: 200-240 kelime.'
  assert.deepEqual(brifOlcu(brif), { olgu: 2, acilim: 2, alt: 200, ust: 240 })
})
