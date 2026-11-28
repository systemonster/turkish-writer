import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { tdkKaynak, TDK_YEREL_YOLU } from '../skills/turkish-writer/scripts/tdk-baglan.mjs'

test('TDK private source selection is local, optional and overrideable',()=>{
  const dir=mkdtempSync(join(tmpdir(),'tw-private-'))
  try {
    const db=join(dir,'tdk.sqlite')
    assert.equal(tdkKaynak(undefined,{},db),null)
    assert.equal(tdkKaynak('explicit.db',{TW_TDK_KAYNAK:'env.db'},db),'explicit.db')
    assert.equal(tdkKaynak(undefined,{TW_TDK_KAYNAK:'env.db'},db),'env.db')
    writeFileSync(db,'synthetic marker, not dictionary data')
    assert.equal(tdkKaynak(undefined,{},db),db)
    assert.equal(tdkKaynak('explicit.db',{},db),'explicit.db')
    assert.ok(TDK_YEREL_YOLU.endsWith(join('data','private','tdk.sqlite')))
  } finally { rmSync(dir,{recursive:true,force:true}) }
})
