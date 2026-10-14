// node --test tests/ ; gerçek codex çağrılmaz: PATH'e sahte bir `codex` konur.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dizin = mkdtempSync(join(tmpdir(), 'sahte-codex-'))
const kayit = join(dizin, 'cagri.json')
// Sahte codex: argümanları ve stdin'i kayda yazar, -o dosyasına ortam değişkenindeki cevabı bırakır.
writeFileSync(join(dizin, 'sahte.mjs'), `
import { readFileSync, writeFileSync } from 'node:fs'
const a = process.argv.slice(2)
const girdi = readFileSync(0, 'utf8')
writeFileSync(${JSON.stringify(kayit)}, JSON.stringify({ a, girdi }))
if (process.env.SAHTE_HATA) { console.error('ERROR: usage limit reached'); process.exit(1) }
writeFileSync(a[a.indexOf('-o') + 1], process.env.SAHTE_CEVAP || 'tamam')
`)
if (process.platform === 'win32') writeFileSync(join(dizin, 'codex.cmd'), '@node "%~dp0sahte.mjs" %*\r\n')
else { writeFileSync(join(dizin, 'codex'), `#!/bin/sh\nexec node "${join(dizin, 'sahte.mjs')}" "$@"\n`); chmodSync(join(dizin, 'codex'), 0o755) }
process.env.PATH = `${dizin}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH}`
const oku = () => JSON.parse(readFileSync(kayit, 'utf8'))

const { codexSor, codexIstemi, codexAcik, codexAc, jsonAyikla } = await import('../skills/turkish-writer/scripts/codex-arka.mjs')
const { taslakUret, anahtar, bayraklariAyristir } = await import('../skills/turkish-writer/scripts/openai-taslak.mjs')
const { jsonSor, sakliSor } = await import('../skills/turkish-writer/scripts/hakem-dongusu.mjs')

test('codexIstemi: talimat ve girdi ayrı bölümlerde, araç kullanma yasağı başta', () => {
  const i = codexIstemi({ sistem: 'SİSTEM', kullanici: 'BRİF' })
  assert.match(i, /^Bu bir metin işleme görevidir\. Araç kullanma/)
  assert.match(i, /<talimat>\nSİSTEM\n<\/talimat>/)
  assert.match(i, /<girdi>\nBRİF\n<\/girdi>/)
})

test('codexSor: model, salt okunur sandbox ve düşük akıl yürütme bayrakları; istem stdin ile gider', async () => {
  process.env.SAHTE_CEVAP = '  Merhaba dünya.  '
  const c = await codexSor({ sistem: 's', kullanici: 'k', model: 'gpt-6.1-sol' })
  assert.equal(c, 'Merhaba dünya.')
  const { a, girdi } = oku()
  assert.deepEqual(a.slice(0, 1), ['exec'])
  assert.ok(a.includes('read-only') && a.includes('--ephemeral') && a.includes('--skip-git-repo-check'))
  assert.equal(a[a.indexOf('-m') + 1], 'gpt-6.1-sol')
  assert.ok(a.includes('model_reasoning_effort=low'))
  assert.equal(a.at(-1), '-')
  assert.match(girdi, /<talimat>\ns\n<\/talimat>/)
})

test('codex kipinde anahtar() API anahtarı okumaz; taslakUret codex exec kullanır', async () => {
  const onceki = process.env.TW_SAGLAYICI
  codexAc()
  try {
    assert.ok(codexAcik())
    assert.equal(anahtar(), 'codex-abonelik')
    process.env.SAHTE_CEVAP = 'Taslak metin.'
    assert.equal(await taslakUret({ brif: 'Brif', model: 'gpt-6.1-sol', cipalar: [], key: 'codex-abonelik' }), 'Taslak metin.')
    assert.match(oku().girdi, /<girdi>\nBrif\n<\/girdi>/)
  } finally { if (onceki === undefined) delete process.env.TW_SAGLAYICI; else process.env.TW_SAGLAYICI = onceki }
})

test('codex kipinde jsonSor ve sakliSor JSON ayıklar (çit ve ön metin atılır)', async () => {
  codexAc()
  try {
    process.env.SAHTE_CEVAP = 'İşte:\n```json\n{"insan_puani": 80}\n```'
    assert.deepEqual((await jsonSor({ key: 'x', model: 'gpt-6-astra', istem: 'i' })).json, { insan_puani: 80 })
    assert.equal((await sakliSor({ key: 'x', metin: 'm' })).p, 0.2)
    assert.equal(oku().a[oku().a.indexOf('-m') + 1], 'gpt-6-astra')
  } finally { delete process.env.TW_SAGLAYICI }
})

test('API kipi varsayılan: TW_SAGLAYICI yokken codex kullanılmaz', () => {
  delete process.env.TW_SAGLAYICI
  assert.equal(codexAcik(), false)
})

test('--codex bayrağı ayrıştırılır, varsayılan kapalı', () => {
  assert.equal(bayraklariAyristir(['b.md']).codex, false)
  assert.equal(bayraklariAyristir(['b.md', '--codex']).codex, true)
})

test('jsonAyikla: JSON yoksa hata', () => {
  assert.throws(() => jsonAyikla('düz metin'), /JSON bulunamadı/)
})

test('codex abonelik sınırında yeniden dener, sınır sürerse API\'ye dönmeden hata verir', async () => {
  process.env.SAHTE_HATA = '1'
  await assert.rejects(codexSor({ sistem: '', kullanici: 'k', deneme: 1 }), /codex exec başarısız \(abonelik sınırı\)/)
  delete process.env.SAHTE_HATA
})
