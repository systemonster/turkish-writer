// node --test tests/
// Söz dizimi kuralları: liste-ve, ozne-virgul, eksiltili-yuklem, tamlama-eki.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { denetle, jsonDenetle } from '../skills/turkish-writer/scripts/tr-scan.mjs'

const { ciftler } = JSON.parse(readFileSync(new URL('./ornekler/soz-dizimi.json', import.meta.url), 'utf8'))
const turler = (metin, secenek) => denetle(metin, secenek).bulgular.map((b) => b.tur)

for (const [i, c] of ciftler.entries()) {
  test(`fikstür ${i}: ${c.kural} · ${c.kaynak}`, () => {
    if (!c.yalnizDogru) assert.ok(turler(c.yanlis).includes(c.kural), `"${c.kural}" bekleniyordu: ${c.yanlis}`)
    assert.ok(!turler(c.dogru).includes(c.kural), `"${c.kural}" beklenmiyordu: ${c.dogru}`)
  })
}

test('her kural en az bir yanlış örnekle sınanıyor', () => {
  for (const k of ['liste-ve', 'ozne-virgul', 'eksiltili-yuklem', 'tamlama-eki'])
    assert.ok(ciftler.some((c) => c.kural === k && !c.yalnizDogru), k)
})

test('bulgu açıklama ve düzeltme önerisi taşır', () => {
  const b = denetle('Ödeme teslimata bağlı, kaynak kod sizin.').bulgular
  for (const tur of ['eksiltili-yuklem', 'tamlama-eki']) {
    const x = b.find((y) => y.tur === tur)
    assert.ok(x && x.not.length > 20 && x.parca, tur)
  }
  assert.match(b.find((y) => y.tur === 'tamlama-eki').not, /kaynak kodu/)
})

test('etiket kipi: eksiltili yapıya izin verilir, tamlama eki yine denetlenir', () => {
  const t = turler('Ödeme teslimata bağlı, kaynak kod sizin', { etiket: true })
  assert.ok(!t.includes('eksiltili-yuklem'))
  assert.ok(t.includes('tamlama-eki'))
  assert.ok(!turler('Tasarım, kodlama, test yapıyoruz', { etiket: true }).includes('liste-ve'))
})

test('JSON: alan adı etiketse eksiltili yapı serbest, gövdeyse işaretlenir', () => {
  const src = JSON.stringify({
    guven: { satir: 'Ödeme teslimata bağlı, kaynak kod sizin' },
    hero: { baslik: 'Fiyat sabit, teslim tarihi belli', cta: 'Fiyat sabit, teslim tarihi belli', eyebrow: 'Fiyat sabit, teslim tarihi belli' },
  })
  const [s] = jsonDenetle('x.json', src, {})
  const alan = (yol) => s.alanlar.find((a) => a.yol === yol).bulgular.map((b) => b.tur)
  assert.ok(alan('$.guven.satir').includes('eksiltili-yuklem'))
  for (const yol of ['$.hero.baslik', '$.hero.cta', '$.hero.eyebrow']) assert.ok(!alan(yol).includes('eksiltili-yuklem'), yol)
})

test('JSON: --etiket-alan ve --govde-alan alan türünü değiştirir', () => {
  const src = JSON.stringify({ a: { satir: 'Fiyat sabit, teslim tarihi belli' }, b: { baslik: 'Fiyat sabit, teslim tarihi belli' } })
  const [s] = jsonDenetle('x.json', src, { etiketAlan: /^\$\.a\.satir$/, govdeAlan: /^\$\.b\.baslik$/ })
  const alan = (yol) => s.alanlar.find((a) => a.yol === yol).bulgular.map((b) => b.tur)
  assert.ok(!alan('$.a.satir').includes('eksiltili-yuklem'))
  assert.ok(alan('$.b.baslik').includes('eksiltili-yuklem'))
})

test('markdown: başlık ve tablo satırı etikettir, madde satırı cümledir', () => {
  assert.ok(!turler('# Fiyat sabit, teslim tarihi belli\n').includes('eksiltili-yuklem'))
  assert.ok(!turler('| Fiyat sabit, teslim tarihi belli | x |\n').includes('eksiltili-yuklem'))
  assert.ok(turler('- Fiyat sabit, teslim tarihi belli.\n').includes('eksiltili-yuklem'))
})

test('yer tutucu rakam sayılmaz: {y0} içeren sıralama yine denetlenir', () => {
  assert.ok(turler('Keşif {y0} tutarında kapsamı, maliyeti, süreyi, sırayı yazılı hâle getirir.').includes('liste-ve'))
})

// Kök neden (lovefengis 04fc3a9, "100/0 metin turu"): "ve" yoğunluğu izi, zorunlu sıralama
// bağlacını da saydığı için düzeltme geçişi "A, B ve C"yi "A, B, C"ye çevirdi (99 dönüşüm).
// Sıralamanın son iki ögesini bağlayan "ve" (TDK 8.2/1) iz sayılmaz; cümle bağlayan "ve" sayılır.
import { olc } from '../skills/turkish-writer/scripts/tr-scan.mjs'
test('ve yoğunluğu: sıralama bağlacı sayılmaz, cümle bağlayan ve sayılır', () => {
  const liste = 'Sipariş, stok ve fatura ekranlarını kurarız. Logo, Mikro ve Netsis ile çalışırız. Kapsam, fiyat ve süre yazılı olur.'
  const cumle = 'Formu doldurdunuz ve gönderdiniz. Mesajı okuduk ve cevap yazdık. Kapsamı çıkardık ve fiyat verdik.'
  assert.equal(olc(liste).veSiralama, 3)
  assert.equal(olc(liste).veIz100, 0)
  assert.ok(olc(liste).ve100 > 10) // ham sayı (ve-seyrek için) değişmez
  assert.equal(olc(cumle).veSiralama, 0)
  assert.ok(olc(cumle).veIz100 > 10)
})
