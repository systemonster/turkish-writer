import test from 'node:test';
import assert from 'node:assert/strict';
import { korumaDenetle } from '../skills/turkish-writer/scripts/metin-kapisi.mjs';
test('korunan diziler aynen kalır', () => {
  assert.equal(korumaDenetle('Aylık 11.900 TL. Her ay iptal.', ['11.900 TL', 'Her ay iptal']).ok, true);
});
test('eksik, değişen ve yinelenen dizileri raporlar', () => {
  assert.deepEqual(korumaDenetle('11.990 TL', ['11.900 TL', 'her ay iptal', '11.900 TL']).eksik, ['11.900 TL', 'her ay iptal']);
});
test('geçersiz liste reddedilir', () => {
  assert.throws(() => korumaDenetle('metin', ['']), TypeError);
  assert.throws(() => korumaDenetle('metin', 'metin'), TypeError);
});
