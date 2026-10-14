// Kalibrasyon koruması: --api verilmedikçe API'ye istek ve anahtar yok.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const saglayici = new URL('./kalibrasyon/saglayici.mjs', import.meta.url).href
const taslak = new URL('../skills/turkish-writer/scripts/openai-taslak.mjs', import.meta.url).href
const dizin = mkdtempSync(join(tmpdir(), 'saglayici-'))
const yaz = (ad, kod) => { const y = join(dizin, ad); writeFileSync(y, kod); return y }
const calistir = (yol, ...bayrak) => JSON.parse(execFileSync(process.execPath, [yol, ...bayrak], { encoding: 'utf8', env: { ...process.env, OPENAI_API_KEY: 'sahte', TW_SAGLAYICI: '' } }))

const betik = yaz('a.mjs', `import ${JSON.stringify(saglayici)}
const { anahtar } = await import(${JSON.stringify(taslak)})
let engel = ''
try { await fetch('https://api.openai.com/v1/models') } catch (e) { engel = e.message }
console.log(JSON.stringify({ kip: process.env.TW_SAGLAYICI || null, anahtar: anahtar(), engel, argv: process.argv.slice(2) }))
`)

test('varsayılan: codex kipi açık, API fetch engellenir, anahtar okunmaz', () => {
  const j = calistir(betik)
  assert.equal(j.kip, 'codex')
  assert.equal(j.anahtar, 'codex-abonelik')
  assert.match(j.engel, /engellendi/)
})

test("--api verilirse bayrak argv'den çıkar, codex kipi açılmaz, API anahtarı okunur", () => {
  const j = calistir(betik, '--api', 'x')
  assert.equal(j.kip, null)
  assert.equal(j.anahtar, 'sahte')
  assert.deepEqual(j.argv, ['x'])
})
