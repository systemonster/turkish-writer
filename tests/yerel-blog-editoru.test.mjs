import test from 'node:test';
import assert from 'node:assert/strict';
import {ayristir, dogrula, denetle} from '../skills/turkish-writer/scripts/yerel-blog-editoru.mjs';
test('yerel port ve model açıkça belirlenir', () => {
  assert.deepEqual(ayristir(['m.md','--model','gemma','--port','1234']), {dosya:'m.md',model:'gemma',port:1234});
  assert.throws(()=>ayristir(['m.md','--model','gemma','--port','65536']));
  assert.throws(()=>ayristir(['m.md','--base-url','https://example.com']));
});
test('metinde olmayan alıntı ve hatalı kategori elenir', () => {
  const b = {alinti:'Rapor hazır.',kategori:'anlam',gerekce:'Kaynak gerekli.',oneri:'Kontrol et.'};
  const r = dogrula({bulgular:[b,{...b,alinti:'Yok'},{...b,kategori:'uydurma'}]},'Rapor hazır.');
  assert.deepEqual(r.bulgular,[b]);
  assert.equal(r.reddedilen.length,2);
  assert.throws(()=>dogrula({},'x'));
});
test('yalnız loopback; kaynak değişmez; sahte HTTP cevabı', async () => {
  const metin = 'İstanbul’da rapor hazır.';
  const r = await denetle(metin,{model:'test',port:1234,fetchFn:async(url,opts)=>{
    assert.equal(url,'http://127.0.0.1:1234/v1/chat/completions');
    assert.equal(opts.redirect,'error');
    assert.equal(JSON.parse(JSON.parse(opts.body).messages[1].content).metin,metin);
    return new Response(JSON.stringify({choices:[{message:{content:'{"bulgular":[]}'}}]}));
  }});
  assert.deepEqual(r.bulgular,[]);
});
