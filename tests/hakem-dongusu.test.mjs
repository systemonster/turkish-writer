// hakem-dongusu.mjs: API çağrıları sahte (mock); eşik, tur sınırı, olgu reddi, kayıt biçimi.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { argumanlar, degisiklikUygula, dongu, hakemAyristir, olguDenetle, olgular } from '../skills/turkish-writer/scripts/hakem-dongusu.mjs'

const BRIF = 'Olgu listesi:\n- TCMB Dijital Türk Lirası projesini 2021 yılında başlattı.\n- Proje 3 aşamalıdır.\n- Kurulum 24.900 TL.'
const TASLAK = 'TCMB projeyi 2021 yılında başlattı. Proje üç aşamadan oluşur. Bu üç aşamalı yapı projenin düzenli ilerlediğini gösterir. Kurulum 24.900 TL tutar.'
const DOLGU = 'Bu üç aşamalı yapı projenin düzenli ilerlediğini gösterir.'

// Sahte API: hakem p dizisinden sırayla okur; yeniden yazma verilen cevapları sırayla döndürür.
function sahteApi({ pler, cevaplar = [] }) {
  const cagri = { taslak: 0, hakem: 0, yenidenYaz: 0 }
  return {
    cagri,
    taslak: async () => { cagri.taslak++; return TASLAK },
    hakem: async (metin) => {
      const p = pler[Math.min(cagri.hakem++, pler.length - 1)]
      const cumle = (metin.match(/[^.]*ilerle[^.]*\./) || [DOLGU])[0].trim()
      return hakemAyristir({ p_yz: p, genel: 'düzgün', cumleler: [{ cumle, gerekce: 'tekrar', yon: 'sil ya da bağla' }] }, metin)
    },
    yenidenYaz: async () => cevaplar[Math.min(cagri.yenidenYaz++, cevaplar.length - 1)] ?? { degisiklikler: [] },
  }
}

test('eşik: p eşiğin altındaysa yeniden yazma yok', async () => {
  const api = sahteApi({ pler: [0.3] })
  const r = await dongu({ brif: BRIF, api, esik: 0.5 })
  assert.equal(api.cagri.yenidenYaz, 0)
  assert.equal(r.metin, TASLAK)
  assert.equal(r.kayit.sonuc.durdurma, 'esik')
  assert.equal(r.kayit.turlar[0].islem, 'esik-alti')
})

test('eşik: p eşiği aşınca yalnız işaretli cümle değişir, yeni p eşik altıysa durur', async () => {
  const api = sahteApi({ pler: [0.9, 0.4], cevaplar: [{ degisiklikler: [{ no: 1, yeni: '' }] }] })
  const r = await dongu({ brif: BRIF, api, esik: 0.5 })
  assert.equal(api.cagri.yenidenYaz, 1)
  assert.equal(r.metin, 'TCMB projeyi 2021 yılında başlattı. Proje üç aşamadan oluşur. Kurulum 24.900 TL tutar.')
  assert.deepEqual(r.kayit.turlar.map((t) => t.islem), ['yeniden-yazildi', 'esik-alti'])
  assert.equal(r.kayit.turlar[0].degisen[0].eski, DOLGU)
})

test('eşik tam sınırda: p = eşik aşmış sayılmaz', async () => {
  const api = sahteApi({ pler: [0.5] })
  const r = await dongu({ brif: BRIF, api, esik: 0.5 })
  assert.equal(api.cagri.yenidenYaz, 0)
  assert.equal(r.kayit.sonuc.durdurma, 'esik')
})

test('tur sınırı: hakem hep yüksekse en fazla turSayisi kez yeniden yazılır', async () => {
  let n = 0
  const api = sahteApi({ pler: [0.9] })
  api.yenidenYaz = async () => { n++; return { degisiklikler: [{ no: 1, yeni: DOLGU.replace('gösterir', n % 2 ? 'gösteriyor' : 'gösterir') }] } }
  const r = await dongu({ brif: BRIF, api, esik: 0.5, turSayisi: 3 })
  assert.equal(n, 3)
  assert.equal(r.kayit.sonuc.yeniden_yazma, 3)
  assert.equal(r.kayit.turlar.length, 4)
  assert.equal(r.kayit.turlar.at(-1).islem, 'tur-siniri')
  assert.equal(r.kayit.sonuc.durdurma, 'tur-siniri')
})

test('tur sınırı 0: yalnız ölçer', async () => {
  const api = sahteApi({ pler: [0.9] })
  const r = await dongu({ brif: BRIF, api, esik: 0.5, turSayisi: 0 })
  assert.equal(api.cagri.yenidenYaz, 0)
  assert.equal(r.kayit.sonuc.durdurma, 'tur-siniri')
})

test('olgu sadakati: brifte olmayan sayı getiren tur atılır, metin değişmez', async () => {
  const api = sahteApi({ pler: [0.9], cevaplar: [{ degisiklikler: [{ no: 1, yeni: 'Proje 12 ayda tamamlandı.' }] }] })
  const r = await dongu({ brif: BRIF, api, esik: 0.5, turSayisi: 2 })
  assert.equal(r.metin, TASLAK)
  assert.equal(r.kayit.turlar[0].islem, 'olgu-reddi')
  assert.deepEqual(r.kayit.turlar[0].olgu.fazla, ['12'])
  assert.equal(r.kayit.sonuc.kabul_edilen, 0)
})

test('olgu sadakati: fiyatı ya da özel adı düşüren ya da ekleyen değişiklik reddedilir', () => {
  assert.equal(olguDenetle(BRIF, TASLAK, TASLAK.replace('24.900', '24.500')).ok, false)
  assert.deepEqual(olguDenetle(BRIF, TASLAK, TASLAK.replace('Kurulum 24.900 TL tutar.', 'Kurulum ucuzdur.')).eksik, ['24900', 'TL'])
  assert.deepEqual(olguDenetle(BRIF, TASLAK, TASLAK.replace('Proje üç', 'Proje, Ankara merkezli ekibiyle üç')).fazla, ['Ankara'])
  assert.equal(olguDenetle(BRIF, TASLAK, TASLAK.replace('Proje üç aşamadan', 'Proje 3 aşamadan')).ok, true)
  assert.equal(olguDenetle(BRIF, TASLAK, TASLAK.replace('TCMB projeyi', "Projeyi TCMB'nin ekibi")).ok, true)
})

test('olgular: cümle başındaki büyük harf ad sayılmaz, ek kesmeden önce kesilir', () => {
  const o = olgular("Proje başladı. Kurulumu İzmir'deki ekip yapar.")
  assert.deepEqual([...o.adlar], ['İzmir'])
})

test('hakem cevabı: metinde olmayan cümle atılır, p sıkıştırılır', () => {
  const h = hakemAyristir({ p_yz: 87, cumleler: [{ cumle: 'Uydurma cümle.' }, { cumle: '  Proje  üç aşamadan oluşur. ' }] }, TASLAK)
  assert.equal(h.p, 0.87)
  assert.deepEqual(h.cumleler.map((c) => c.cumle), ['Proje üç aşamadan oluşur.'])
  assert.ok(Number.isNaN(hakemAyristir({}, TASLAK).p))
})

test('değişiklik yalnız işaretli cümleye uygulanır', () => {
  const u = degisiklikUygula(TASLAK, [{ cumle: DOLGU }], { degisiklikler: [{ no: 1, yeni: 'x' }, { no: 2, yeni: 'y' }] })
  assert.equal(u.degisen.length, 1)
  assert.equal(u.metin, TASLAK.replace(DOLGU, 'x'))
})

test('kayıt biçimi', async () => {
  const api = sahteApi({ pler: [0.9, 0.2], cevaplar: [{ degisiklikler: [{ no: 1, yeni: '' }] }] })
  const r = await dongu({ brif: BRIF, api, esik: 0.5 })
  const k = r.kayit
  for (const a of ['surum', 'esik', 'tur_sayisi', 'turlar', 'sonuc', 'kapi']) assert.ok(a in k, a)
  for (const t of k.turlar) for (const a of ['tur', 'p', 'isaretli', 'islem', 'degisen']) assert.ok(a in t, a)
  assert.deepEqual(Object.keys(k.sonuc).sort(), ['durdurma', 'kabul_edilen', 'p_ilk', 'p_son', 'yeniden_yazma'])
  assert.equal(k.sonuc.p_ilk, 0.9)
  assert.equal(k.sonuc.p_son, 0.2)
  assert.equal(typeof k.kapi.trscan_skor, 'number')
  assert.ok(Array.isArray(k.kapi.soz_dizimi))
  assert.equal(r.taslak, TASLAK)
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(k)))
})

test('argümanlar: openai-taslak bayrakları ve döngü bayrakları', () => {
  const s = argumanlar(['brif.md', '--tur', 'blog', '--cipa', 'x', '--out', 'm.md', '--tur-sayisi', '2', '--esik', '0.6', '--sakli'])
  assert.equal(s.tur, 'blog'); assert.deepEqual(s.cipa, ['x']); assert.equal(s.turSayisi, 2); assert.equal(s.esik, 0.6); assert.equal(s.sakli, true)
  assert.match(argumanlar(['brif.md', '--tur-sayisi', 'x']).hata, /tam sayı/)
  assert.match(argumanlar(['brif.md', '--tur', 'roman']).hata, /bilinmeyen tür/)
  assert.equal(argumanlar(['brif.md']).turSayisi, 3)
})

// --- özel ad sadakati (tur 4): döngü çıktısı da denetlenir
test('argümanlar: --katı geçer', () => {
  assert.equal(argumanlar(['brif.md', '--katı']).kati, true)
  assert.equal(argumanlar(['brif.md']).kati, false)
})

test('uçtan uca: döngü çıktısındaki bozuk ad UYARI verir, kayda girer; --katı ile çıkış kodu 4', async () => {
  const { spawnSync } = await import('node:child_process')
  const { mkdtempSync, writeFileSync, readFileSync } = await import('node:fs')
  const { join } = await import('node:path')
  const { tmpdir } = await import('node:os')
  const { pathToFileURL, fileURLToPath } = await import('node:url')
  const kok = mkdtempSync(join(tmpdir(), 'hd-'))
  const taslak = 'Sinan, Kanuni Sultan Süyman döneminde baş mimar oldu.'
  writeFileSync(join(kok, 'mock.mjs'), `globalThis.fetch = async (url, o) => {
  const b = JSON.parse(o.body); const soru = b.messages.at(-1).content;
  const icerik = soru.includes('p_yz') ? JSON.stringify({ p_yz: 0.1, genel: '', cumleler: [] }) : ${JSON.stringify(taslak)};
  return new Response(JSON.stringify({ model: b.model, choices: [{ message: { content: icerik } }], usage: {} }), { status: 200 });
};\n`)
  writeFileSync(join(kok, 'brif.md'), '- Sinan, Kanuni Sultan Süleyman döneminde baş mimar oldu.\n')
  const betik = fileURLToPath(new URL('../skills/turkish-writer/scripts/hakem-dongusu.mjs', import.meta.url))
  const kos = (...a) => spawnSync(process.execPath, ['--import', pathToFileURL(join(kok, 'mock.mjs')).href, betik, 'brif.md', ...a], { cwd: kok, env: { ...process.env, OPENAI_API_KEY: 'sahte' }, encoding: 'utf8' })
  const a = kos('--out', 'a.md')
  assert.equal(a.status, 0, a.stderr)
  assert.match(a.stderr, /UYARI: özel ad bozuk yazılmış: "Süyman" \(brifte "Süleyman"\)/)
  const kayit = JSON.parse(readFileSync(join(kok, 'a.md.kayit.json'), 'utf8'))
  assert.deepEqual(kayit.ad.bozuk, [{ ad: 'Süyman', benzer: 'Süleyman' }])
  assert.equal(kos('--out', 'b.md', '--katı').status, 4)
})
