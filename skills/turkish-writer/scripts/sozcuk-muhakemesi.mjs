// Model-independent lexical evidence. Not automatic sense disambiguation.
import { readFileSync, existsSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tdkAra } from './tdk-baglan.mjs'

export const KENET_REV = '09ebb811b08eedaedc4abb9cfde2d08eadfe71e4'
const KENET_BLOB = '2cdf2a59e524764cfe2c11a03fa9623495df21bb'
export const KENET_PATH = join(homedir(), '.cache', 'turkish-writer', 'kenet-' + KENET_REV + '.json')
const tr = s => String(s).normalize('NFC').toLocaleLowerCase('tr')
const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k)
const stop = new Set('olan olarak ancak ayrıca çünkü dolayı dolayısıyla zaten sadece yalnız böyle şöyle kadar sonra önce değil üzere kendi daha bütün hangi her biri bunun bununla bunlar bunları diğer içindeki içinde üzerinde üzerinden karşı arasında birlikte özellikle önemli gereken gerekir kullanılması yapılması yapılacak'.split(' '))

export function kenetYukle(path = KENET_PATH) {
  if (!existsSync(path)) return { state: 'not-installed', data: null }
  if (!statSync(path).isFile() || statSync(path).size > 100 * 1024 * 1024) throw new Error('KeNet index must be a bounded local JSON file')
  const data = JSON.parse(readFileSync(path, 'utf8'))
  if (data.schema !== 1 || data.source?.revision !== KENET_REV || data.source?.blob !== KENET_BLOB ||
      data.source?.license !== 'CC BY-SA 4.0' || !data.entries || !data.senses) throw new Error('Unrecognized KeNet index or source')
  return { state: 'available', data }
}

export function anlamAra(data, word, chosen = null) {
  const key = tr(word).trim()
  if (!data || !own(data.entries,key)) return { word, status: data ? 'not-found' : 'not-installed', senses: [], candidates: [] }
  const ids = data.entries[key]
  if (!Array.isArray(ids)) throw new Error('Invalid sense index')
  const senses = ids.map(id => {
    const s = data.senses[id]
    if (!s || !Array.isArray(s.members)) throw new Error('Invalid synset: ' + id)
    return { id, pos: s.pos, gloss: s.gloss, sense_numbers: s.members.filter(m => tr(m.lemma) === key).map(m=>m.sense),
      member_count: s.members.length }
  })
  if (chosen === null) return { word, status: 'sense-selection-required', senses, candidates: [] }
  if (!ids.includes(chosen)) throw new Error('Selected sense does not belong to the query')
  const selected = data.senses[chosen]
  // A selected synset is still only lexical evidence, never context approval.
  const candidates = [...new Set(selected.members.map(m=>m.lemma).filter(m => tr(m) !== key))].slice(0,3)
  return { word, status: 'editor-review-required', selected: chosen, senses, candidates,
    siklik: 'bilinmiyor', sicil: 'bilinmiyor', esdizim: 'dogrulanmadi',
    note: 'Önce cümleyi olduğu gibi korumayı veya yeniden kurmayı değerlendir. Adaylar aynı anlam kümesindedir; çağrışım, sicil, çekim ve eş dizim doğrulanmadan kullanma.' }
}

// Original project-authored contrast cases, not dictionary transcriptions.
// They deliberately favor the plain wording unless context supplies a real reason.
const CASES = [
  // Clustered signs of inflated diction rather than banning individual words.
  {id:'lex-01', match:/(?:(?<!\p{L})(?=\p{L})|(?<=\p{L})(?!\p{L}))vaziyet(?:(?<!\p{L})(?=\p{L})|(?<=\p{L})(?!\p{L}))[^.!?\n]{0,130}(?:(?<!\p{L})(?=\p{L})|(?<=\p{L})(?!\p{L}))fena(?:(?<!\p{L})(?=\p{L})|(?<=\p{L})(?!\p{L}))[^.!?\n]{0,100}(?:(?<!\p{L})(?=\p{L})|(?<=\p{L})(?!\p{L}))sebebiyet ver[\p{L}]*/giu, note:'Üç sözcük birden farklı bir sicile çekilmiş olabilir. Duygunun niteliği ve şiddeti kaynakta belirsizse üzülme, kaygı veya öfke uydurma; doğal ifadeyi koru.'},
  {id:'lex-02', match:/(?:(?<!\p{L})(?=\p{L})|(?<=\p{L})(?!\p{L}))uzun müddet tefekkür et[\p{L}]*/giu, note:'Düşünmenin niteliği, anlatıcının sesi ve dönemini kontrol et. Bilinçli edebî ses değilse düz ifadeyi değerlendir.'},
  {id:'lex-03', match:/(?:(?<!\p{L})(?=\p{L})|(?<=\p{L})(?!\p{L}))beyanlar[\p{L}]*[^.!?\n]{0,100}(?:(?<!\p{L})(?=\p{L})|(?<=\p{L})(?!\p{L}))idrak ed[\p{L}]*/giu, note:'Resmiyet, çağrışım ve kesinlik değişmiş olabilir. Hukukî ifade veya anlatıcı tercihi ise koru.'},
  {id:'lex-04', match:/(?:(?<!\p{L})(?=\p{L})|(?<=\p{L})(?!\p{L}))ehemmiyet arz ed[\p{L}]*/giu, note:'Resmî bir kalıp gerekliyse koru. Gereksiz soyutluk varsa düşünceyi yeniden kur; önem derecesini artırma.'},
  {id:'lex-05', match:/(?:(?<!\p{L})(?=\p{L})|(?<=\p{L})(?!\p{L}))(?:hayata geçirilmesi|gerçekleştirilmesi) işlemi(?:nin)?(?:(?<!\p{L})(?=\p{L})|(?<=\p{L})(?!\p{L}))/giu, note:'Birden çok işlem türü ayrılmıyorsa yüklemi görünür kıl. İşin başlaması, tamamlanması ve eyleyenini aynen koru.'},
]
const reviewable = new Set(['yineleme','kok-tekrar','esdizim','esdizim-derlem','ceviri-kokusu','burokratik','hafif-fiil','bos-vurgu','gpt-sozlugu','hype','giris-klisesi','kapanis-klisesi','olumsuz-kosutluk','retorik-soru','meta'])
const mask = s => s.replace(/[^\n]/g,' ')

function prose(src) {
  // Preserve offsets. Do not suggest changes inside fenced code, quotations,
  // inline code, URLs, HTML, headings, list items or tables.
  return String(src)
    .replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/,mask)
    .replace(/(^|\n)[ \t]*(?:\x60{3,}|~{3,})[^\n]*\n[\s\S]*?(?:\n[ \t]*(?:\x60{3,}|~{3,})[^\n]*(?=\n|$)|$)/g,mask)
    .replace(/<[^>\n]+>|https?:\/\/[^\s)]+|\x60[^\x60\n]*\x60|“[^”]*”|‘[^’]*’|«[^»]*»|"[^"\n]*"/g,mask)
    .replace(/^[ \t]*(?:#{1,6}\s|>\s?|[-*+]\s|\d+[.)]\s|\|).*(?:\n|$)/gm,mask)
}
const line = (s,i) => s.slice(0,i).split('\n').length
export function sozcukIncele(src, scan = {}, options = {}) {
  if (options.etiket) return []
  const s = prose(src)
  const protectedWords = new Set((options.protectedWords || []).map(tr))
  const out = []
  for (const [matchText, offset, id, note] of CASES.flatMap(c =>
    Array.from(s.matchAll(c.match),m=>[m[0],m.index,c.id,c.note]))) {
    if (protectedWords.has(tr(matchText))) continue
    out.push({tur:'sozcuk-baglam',id,satir:line(s,offset),parca:matchText,konum:offset,
      karar:'baglamda-incele',not:note,alternatifler:[]})
  }
  // Exact surface form only, no 4-character pseudo-stems. A repetition is
  // a question for an editor, not proof of a lexical error.
  for (const m of s.matchAll(/\S[\s\S]*?(?=\n\s*\n|$)/g)) {
    const para=m[0], start=m.index, hits=new Map()
    for (const w of para.matchAll(/\p{L}{5,}/gu)) {
      if (!/^\p{Ll}/u.test(w[0])) continue // names and uncertain capitalized words
      const key=tr(w[0])
      if (stop.has(key)||protectedWords.has(key)) continue
      if (!hits.has(key)) hits.set(key,[])
      hits.get(key).push(start+w.index)
    }
    for (const [word,positions] of hits) {
      if (positions.length < 3) continue
      // Exact technical repetitions remain a review signal, never an edit.
      const lex=anlamAra(options.kenet,word)
      out.push({tur:'sozcuk-tekrar',satir:line(s,positions[0]),parca:word,konum:positions[0],
        tekrar:positions.length,karar:'tekrar-gerekli-mi',not:'Terim, kişi, motif veya bilinçli vurgu ise koru. Gereksizse önce cümleyi yeniden kur.',
        sozluk_durumu:lex.status,anlam_sayisi:lex.senses.length,alternatifler:[]})
    }
  }
  // Scanner hits are separately listed; never assume their old imperative
  // messages authorize a deletion or a synonym substitution.
  return out.sort((a,b)=>a.konum-b.konum).slice(0,40)
}

export function editorRaporu(src,scan,options={}) {
  const findings=scan.bulgular||[], info=scan.bilgi||[]
  const tdk=findings.filter(x=>x.tur.startsWith('tdk-'))
  const syntax=findings.filter(x=>['liste-ve','ozne-virgul','eksiltili-yuklem','tamlama-eki','ad-ad-belirsizlik','liste-iki'].includes(x.tur))
  const wordCount=scan.olcum?.kelime||0
  const evidence=[...findings,...info].filter(b=>reviewable.has(b.tur))
  return {surum:1,tdk:{bulgu_sayisi:tdk.length,
      bin_kelime_basina:wordCount?Number((tdk.length*1000/wordCount).toFixed(2)):null,
      kapsam:options.tdkDizin?'yerel-yazim-dizini-ve-kurallar':'yerlesik-sinirli-kurallar',
      not:'Otomatik yazım bulguları; doğrulanmış hata veya Türkçe kalite puanı değildir.'},
    soz_dizimi_bulgulari:syntax.length,
    tarayici_inceleme:evidence.map(b=>({tur:b.tur,satir:b.satir??0,parca:b.parca||'',not:b.not,
      karar:'Metnin amacını ve anlamını incele; gerçek kusur yoksa koru.'})),
    sozcuk:sozcukIncele(src,scan,options),
    kenet:options.kenet?'available':'not-installed',
    not:'İz skoru tarihsel ölçümdür. Editör önerileri skoru değiştirmez, metni otomatik düzenlemez.'}
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const argv=process.argv.slice(2), value=flag=>{const i=argv.indexOf(flag);return i>=0?argv[i+1]:undefined}
  const word=value('--kelime'), chosen=value('--anlam')??null
  const tdkSource=value('--tdk-kaynak')||process.env.TW_TDK_KAYNAK
  const examples=argv.includes('--tdk-ornek')
  if (!word || word.startsWith('--') || (argv.includes('--tdk-kaynak') && (!value('--tdk-kaynak') || value('--tdk-kaynak').startsWith('--'))) || (examples&&!tdkSource)) {console.error('Kullanım: node sozcuk-muhakemesi.mjs --kelime KELIME [--anlam ID] [--kenet DOSYA] [--tdk-kaynak YEREL_DOSYA] [--tdk-ornek]');process.exitCode=2}
  else try {
    const {data}=kenetYukle(value('--kenet')||KENET_PATH)
    const result=anlamAra(data,word,chosen)
    if(tdkSource){
      const terms=[...new Set([word,...result.candidates.filter(t=>/\p{L}/u.test(t))])]
      result.tdk=tdkAra(tdkSource,terms,{examples})
      result.tdk_note='TDK anlam kimlikleri ve KeNet anlam kümeleri ayrı kaynaklardır; eşleştirme, anlam seçimi veya kullanım onayı otomatik yapılmaz.'
    }
    console.log(JSON.stringify(result,null,2))
  } catch(e){console.error(e.message);process.exitCode=2}
}
