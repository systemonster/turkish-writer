import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.TW_KILIT_TEST = '1';
const { apiKilidi } = await import('./kalibrasyon/api-kilidi.mjs');
const K = join(dirname(fileURLToPath(import.meta.url)), 'kalibrasyon');

test('api kilidi: codex ya da açık onay yoksa durdurur', () => {
  assert.ok(apiKilidi({}, []));
  assert.equal(apiKilidi({ TW_SAGLAYICI: 'codex' }, []), null);
  assert.equal(apiKilidi({}, ['node', 'x', '--codex']), null);
  assert.equal(apiKilidi({ TW_API_ONAY: '1' }, []), null);
});

test('api kilidi: API çağıran her ölçüm betiğinin ilk importu', () => {
  for (const f of ['uret-paralel', 'kalibre', 'kalibre-nitelikli', 'kalibre-hakem', 'kalibre-beceri', 'kalibre-site', 'duzelt-olc', 'kalibre-fark', 'kalibre-tekli', 'kor-test/hakem-esli', 'kor-test/model-uret']) {
    const ilk = readFileSync(join(K, `${f}.mjs`), 'utf8').split('\n').find((s) => s.startsWith('import'));
    assert.match(ilk, /api-kilidi\.mjs/, f);
  }
});

test('api kilidi: onaysız çalıştırma çıkış kodu 3', () => {
  const env = { ...process.env }; delete env.TW_SAGLAYICI; delete env.TW_API_ONAY; delete env.TW_KILIT_TEST;
  assert.throws(() => execFileSync(process.execPath, [join(K, 'kalibre.mjs')], { env, stdio: 'pipe' }), (e) => e.status === 3);
});
