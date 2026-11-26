import { test } from 'node:test'
import assert from 'node:assert/strict'
import { denetle,jsonDenetle } from '../skills/turkish-writer/scripts/tr-scan.mjs'
import { anlamAra,sozcukIncele,kenetYukle } from '../skills/turkish-writer/scripts/sozcuk-muhakemesi.mjs'
const example={
  entries:{'yüz':['face','number'], 'kötü':['negative'], 'bütçe':['budget']},
  senses:{
    face:{pos:'n',gloss:'Yüz bölgesi (özgün test)',members:[{lemma:'yüz',sense:'1'},{lemma:'çehre',sense:'1'}]},
    number:{pos:'n',gloss:'Sayısal anlam (özgün test)',members:[{lemma:'yüz',sense:'2'},{lemma:'100',sense:'1'}]},
    negative:{pos:'a',gloss:'Özgün sentetik test',members:[{lemma:'kötü',sense:'1'},{lemma:'fena',sense:'1'}]},
    budget:{pos:'n',gloss:'Özgün sentetik test',members:[{lemma:'bütçe',sense:'1'}]}
  }
}
test('ambiguous sense: no synonym without explicit selection',()=>{
  const r=anlamAra(example,'YÜZ')
  assert.equal(r.status,'sense-selection-required')
  assert.equal(r.senses.length,2)
  assert.deepEqual(r.candidates,[])
  assert.throws(()=>anlamAra(example,'yüz','negative'),/does not belong/)
  const selected=anlamAra(example,'yüz','face')
  assert.deepEqual(selected.candidates,['çehre'])
  assert.equal(selected.status,'editor-review-required')
  assert.equal(selected.esdizim,'dogrulanmadi')
})
test('no candidate when source missing or a single-member sense',()=>{
  assert.deepEqual(anlamAra(null,'kötü').candidates,[])
  assert.deepEqual(anlamAra(example,'bütçe','budget').candidates,[])
  assert.equal(anlamAra(example,'unknown').status,'not-found')
  assert.deepEqual(anlamAra(example,'constructor').candidates,[])
})
test('no forced literary substitutions and no alteration of plain prose',()=>{
  const good='Bu durum insanların kendilerini kötü hissetmesine neden oldu. Odaya girdi, pencereyi açtı.'
  assert.deepEqual(sozcukIncele(good),[])
  for(const s of ['Fena değil, dedi ve gülümsedi.','Vaziyet biraz karışıktı.','Yazar içindeki sıkıntıyı idrak etti.'])
    assert.deepEqual(sozcukIncele(s),[],s)
  const bad='Bu vaziyet insanların kendilerini fena hissetmesine sebebiyet verdi.'
  const notes=sozcukIncele(bad)
  assert.equal(notes.length,1)
  assert.equal(notes[0].id,'lex-01')
  assert.deepEqual(notes[0].alternatifler,[])
  assert.ok(notes[0].not.includes('duygunun')||notes[0].not.includes('Duygunun'))
})
test('quote, code, links, headings and button labels are not lexical targets',()=>{
  const s='Bu vaziyet insanları fena hissettirdi ve buna sebebiyet verdi.'
  for(const v of ['“'+s+'”','‘'+s+'’','«'+s+'»','> '+s,'# '+s,'- '+s,'| '+s+' |',String.fromCharCode(96)+s+String.fromCharCode(96),String.fromCharCode(96).repeat(3)+'\n'+s+'\n'+String.fromCharCode(96).repeat(3)])
    assert.deepEqual(sozcukIncele(v),[],v)
  assert.deepEqual(sozcukIncele(s,{}, {etiket:true}),[])
})
test('exact repetition is a review signal, not a synonym edit',()=>{
  const s='Bugün bütçeyi belirledik, bütçeyi izledik, bütçeyi değiştirmedik.'
  const r=sozcukIncele(s)
  assert.equal(r.length,1)
  assert.equal(r[0].parca,'bütçeyi')
  assert.equal(r[0].tekrar,3)
  assert.deepEqual(r[0].alternatifler,[])
  assert.deepEqual(sozcukIncele(s,{}, {protectedWords:['bütçeyi']}),[])
})
test('legacy score, findings and information are bit-for-bit unchanged in editor mode',()=>{
  const texts=['Şuan bir çok kişi burada. Günümüzün hızla değişen dünyasında fark yaratın.','Mesele para değil, zaman. Bu vaziyet insanların kendilerini fena hissetmesine sebebiyet verdi.','Yağmur dinmişti. Sokak hâlâ ıslaktı.','Bütçeyi belirledik, bütçeyi izledik, bütçeyi değiştirmedik.']
  for(const s of texts){
    const before=denetle(s),{editor,...after}=denetle(s,{editor:true,kenet:example})
    assert.deepEqual(after,before)
    assert.equal(editor.kenet,'available')
    assert.equal(editor.tdk.bulgu_sayisi,before.bulgular.filter(b=>b.tur.startsWith('tdk-')).length)
  }
})
test('scanner editorial view includes historical signals and independent spelling counts',()=>{
  const r=denetle('Şuan herşey mümkün. Bu sadece bir güncelleme değil, bir devrim.',{editor:true})
  assert.ok(r.editor.tdk.bulgu_sayisi>=2)
  assert.ok(r.editor.tarayici_inceleme.some(b=>b.tur==='olumsuz-kosutluk'))
  assert.ok(r.editor.tarayici_inceleme.every(b=>b.karar.includes('koru')))
})
test('JSON website fields keep their boundaries and old score',()=>{
  const src=JSON.stringify({title:'Önemli hizmet',description:'Bu vaziyet insanların kendilerini fena hissetmesine sebebiyet verdi.',a:'Bugün bütçeyi izledik.',b:'Yarın bütçeyi değiştireceğiz.',c:'Sonra bütçeyi inceleyeceğiz.',url:'https://example.com'})
  const [legacy]=jsonDenetle('site.json',src,{})
  const [r]=jsonDenetle('site.json',src,{editor:true})
  assert.equal(r.skor,legacy.skor)
  assert.deepEqual(r.bulgular,legacy.bulgular)
  assert.equal(r.alanlar.length,5)
  assert.deepEqual(r.alanlar.find(a=>a.yol==='$.title').editor.sozcuk,[])
  assert.equal(r.alanlar.find(a=>a.yol==='$.description').editor.sozcuk.length,1)
  assert.ok(!r.alanlar.some(a=>a.editor.sozcuk.some(x=>x.tur==='sozcuk-tekrar')))
})
test('missing index is optional; no network or forced install',()=>{
  assert.equal(kenetYukle('/__turkish_writer_missing__/index.json').state,'not-installed')
})
