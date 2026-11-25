#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function analyzeConllu(text) {
  const groups = new Map(), pairs = new Map();
  const get = (key) => {
    if (!groups.has(key)) groups.set(key,{sentences:0,words:0,verbalRoots:0,verbalRootsWithNominalSubject:0,subjects:{before:0,after:0},objects:{before:0,after:0},converbs:0,converbSentences:0,nominalVerbPairs:0});
    return groups.get(key);
  };
  let total=0, malformed=0;
  for (const block of text.split(/\r?\n\s*\r?\n/)) {
    if (!block.trim()) continue;
    const lines=block.split(/\r?\n/), id=lines.find(l=>l.startsWith("# sent_id = "))?.slice(12).trim();
    const rows=lines.filter(l=>/^\d+\t/.test(l)).map(l=>l.split("\t"));
    if(!id||!rows.length||rows.some(r=>r.length!==10||!/^\d+$/.test(r[6]))) {malformed++;continue;}
    const map=new Map(rows.map(r=>[Number(r[0]),r]));
    if(map.size!==rows.length||rows.some(r=>Number(r[6])!==0&&!map.has(Number(r[6])))) {malformed++;continue;}
    const group=id.split("_")[0], local=[get("all"),get(group==="all"?"unknown":group)];
    const words=rows.filter(r=>!["PUNCT","SYM"].includes(r[3])).length;
    const roots=rows.filter(r=>r[7]==="root"&&r[3]==="VERB");
    const conv=rows.filter(r=>r[3]==="VERB"&&/(?:^|\|)VerbForm=Conv(?:\||$)/.test(r[5])).length;
    total++;
    for(const g of local){g.sentences++;g.words+=words;g.verbalRoots+=roots.length;g.converbs+=conv;if(conv)g.converbSentences++;for(const rt of roots){if(rows.some(r=>r[6]===rt[0]&&r[7].split(":")[0]==="nsubj"))g.verbalRootsWithNominalSubject++;}}
    for(const r of rows){
      const head=map.get(Number(r[6]));if(!head||head[3]!=="VERB")continue;
      const rel=r[7].split(":")[0], dir=Number(r[0])<Number(head[0])?"before":"after";
      if(rel==="nsubj"||rel==="obj")for(const g of local)g[rel==="nsubj"?"subjects":"objects"][dir]++;
      if(r[3]==="NOUN"&&(rel==="obj"||rel==="obl")&&r[2]!=="_"&&head[2]!=="_"){
        const kase=r[5].match(/(?:^|\|)Case=([^|]+)/)?.[1]??"_";
        // Lemma tuples, not quotations. Only display recurring combinations.
        const key=JSON.stringify([r[2],head[2],rel,kase]);
        pairs.set(key,(pairs.get(key)||0)+1);for(const g of local)g.nominalVerbPairs++;
      }
    }
  }
  const sorted=Object.fromEntries([...groups].sort(([a],[b])=>a==="all"?-1:b==="all"?1:a<b?-1:a>b?1:0));
  const recurring=[...pairs].filter(([,n])=>n>=5).sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:a[0]>b[0]?1:0)).slice(0,40).map(([key,count])=>{const [noun,verb,relation,kase]=JSON.parse(key);return {noun,verb,relation,case:kase,count};});
  return {sentences:total,malformed,groups:sorted,frequentPairs:recurring};
}

export const SOURCE = {
  "dataset": "UD Turkish BOUN",
  "origin": "Turkish National Corpus",
  "repo": "https://github.com/UniversalDependencies/UD_Turkish-BOUN",
  "commit": "09521f40c90904df85524b8e0b43afba6e4c7823",
  "blob": "2045db158c0f2f6cc136d8ddef1ef3057086b038",
  "split": "train",
  "license": "CC BY-SA 4.0",
  "note": "Derived aggregate statistics; no source sentences included. Development only; dev/test not read."
};
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [input, output] = process.argv.slice(2);
    if (!input || !output || process.argv.length !== 4) throw Error('Kullanım: node corpus-lab/analyze-conllu.mjs train.conllu report.json');
    const raw = readFileSync(input);
    const gitBlob = createHash('sha1').update('blob ' + raw.length + '\0').update(raw).digest('hex');
    if (gitBlob !== SOURCE.blob) throw Error('Kaynak blob eşleşmedi; yalnız sabitlenmiş BOUN train dosyası kabul edilir.');
    const report = analyzeConllu(raw.toString('utf8'));
    if(report.sentences !== 7803 || report.malformed) throw Error('Eksik veya bozuk veri.');
    writeFileSync(output, JSON.stringify({schema:1,source:SOURCE,method:"integer CoNLL-U word rows excluding PUNCT/SYM; nsubj and obj of verbal heads; VerbForm=Conv; NOUN obj/obl + VERB lemma and case, min count 5, top 40",...report},null,2)+'\n',{flag:'wx'});
    console.log(report.sentences + ' cümle işlendi.');
  } catch (e) { console.error(e.message); process.exitCode=2; }
}
