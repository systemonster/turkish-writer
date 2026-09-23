// node --test tests/
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { esdizimDenetle, esdizimVerisiVar, FIIL_BICIM, FIILLER, isimAdaylari, isimKoku } from '../skills/turkish-writer/scripts/esdizim.mjs'

const fiil = (b) => (FIIL_BICIM.has(b) ? FIILLER[FIIL_BICIM.get(b)].m : null)

// ---------------------------------------------------------------------------
// Veri gerektirmeyen: fiil biçimleri ve isim kökü
// ---------------------------------------------------------------------------

test('çekimli fiil biçimleri köke bağlanır', () => {
  const beklenen = {
    yapıyor: 'yapmak', yapılacak: 'yapmak', yapamadığı: 'yapmak', yapmaktadır: 'yapmak',
    ediyor: 'etmek', edildi: 'etmek', ettiği: 'etmek', kaydedildi: 'kaydetmek',
    sağlıyor: 'sağlamak', sağlanması: 'sağlamak', ödüyor: 'ödemek', oynuyor: 'oynamak',
    alındı: 'almak', verir: 'vermek', yapacağım: 'yapmak', çektiği: 'çekmek', çeker: 'çekmek',
    gerçekleştirilecek: 'gerçekleştirmek', konuldu: 'koymak',
  }
  for (const [b, m] of Object.entries(beklenen)) assert.equal(fiil(b), m, b)
})

test('fiile benzeyen isimler fiil sayılmaz', () => {
  for (const b of ['yapı', 'yapım', 'yapısı', 'veri', 'verim', 'altı', 'alan', 'sorun', 'düşünce', 'olarak', 'yazar', 'bakan', 'katıl', 'kat', 'taşı', 'kurulu']) {
    assert.equal(fiil(b), null, b)
  }
})

test('isim adayları: belirtme, yönelme, iyelik ekleri ve yumuşama', () => {
  assert.ok(isimAdaylari('kararını').includes('karar'))
  assert.ok(isimAdaylari('çözüme').includes('çözüm'))
  assert.ok(isimAdaylari('soruyu').includes('soru'))
  assert.ok(isimAdaylari('sorusunu').includes('soru'))
  assert.ok(isimAdaylari('kitabı').includes('kitap'))
  assert.ok(isimAdaylari('farkındalığı').includes('farkındalık'))
})

test('isim kökü: derlemde en sık aday seçilir', () => {
  const s = { karar: 100, kararı: 30, kapı: 50, kap: 10 }
  const f = (k) => s[k] || 0
  assert.equal(isimKoku('kararı', f), 'karar')
  assert.equal(isimKoku('kapı', f), 'kapı')
  assert.equal(isimKoku('bilinmeyenler', f), 'bilinmeyenler')
})

// ---------------------------------------------------------------------------
// Derlem verisi gerektiren (data/esdizim.json yoksa atlanır:
// node skills/turkish-writer/scripts/esdizim-derle.mjs)
// ---------------------------------------------------------------------------

const veriVar = esdizimVerisiVar()
const atla = !veriVar && 'eş dizim verisi derlenmemiş (esdizim-derle.mjs)'
const isaretli = (metin) => esdizimDenetle(metin).map((b) => `${b.isim} ${b.fiil}`)

test('çeviri eş dizimleri işaretlenir', { skip: atla }, () => {
  assert.ok(isaretli('Bu konuda hızlı bir karar yaptık.').includes('karar yapmak'))
  assert.ok(isaretli('Dün uzun bir toplantı tuttuk.').includes('toplantı tutmak'))
  assert.ok(isaretli('Bu adımı almadan önce düşünün.').includes('adım almak'))
  assert.ok(isaretli('Lütfen derse dikkat ödeyin.').includes('dikkat ödemek'))
})

test('öneri en sık fiili gösterir', { skip: atla }, () => {
  const b = esdizimDenetle('Bu konuda hızlı bir karar yaptık.').find((x) => x.isim === 'karar')
  assert.equal(b.oneriler[0].fiil, 'vermek')
  assert.match(b.mesaj, /vermek \(%\d+\)/)
})

test('doğal eş dizimler işaretlenmez', { skip: atla }, () => {
  for (const m of ['Kararı dün verdik.', 'Bir soru sordu.', 'Çok zaman harcadım.', 'Önemli bir rol oynadı.', 'Fotoğraf çektim.', 'Hata yaptım.', 'Gerekli önlemleri aldık.', 'Derse dikkat edin.']) {
    assert.deepEqual(isaretli(m), [], m)
  }
})

test('veri yoksa ya da metin boşsa boş döner', () => {
  assert.deepEqual(esdizimDenetle('', {}), [])
})
