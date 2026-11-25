#!/usr/bin/env node
// Private, research-only reviewer packets. Standard Node; no network or model required.
import {createHash,createHmac,randomBytes} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,realpathSync,lstatSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateHoldout} from './validate-holdout.mjs';
const root=dirname(fileURLToPath(import.meta.url));
const digest=s=>createHash('sha256').update(s,'utf8').digest('hex');
const token=(key,s)=>createHmac('sha256',key).update(s).digest('hex');
const nonempty=s=>typeof s==='string'&&s.trim().length>0;
const fail=s=>{throw new Error(s)};
const scores=['meaning','natural_turkish','editorial_value','flow','mechanics'];
const issues=['fact','scope','negation','modality','agent','attribution','number','link','quote','voice','condition','structure','other'];
const blank=()=>({scores:Object.fromEntries(scores.map(k=>[k,null])),critical_issues:[],unnecessary_interventions:null,notes:'',repair_minutes:null});
export function buildPackets({manifest,documents,models,outputs,mode},key){
 if(!['development_dry_run','independent_test'].includes(mode))fail('explicit mode required');
 if(typeof key!=='string'||!/^[a-f0-9]{64}$/.test(key))fail('invalid private seed');
 if(!Array.isArray(documents)||!documents.length||!Array.isArray(models)||!Array.isArray(outputs))fail('missing inputs');
 const independent=mode==='independent_test';
 if(independent&&!validateHoldout(manifest).valid)fail('holdout manifest rejected');
 const expected=independent?manifest.filter(r=>r.split==='test'):documents;
 const ids=new Set(expected.map(d=>d.id));
 if(ids.size!==expected.length||documents.length!==ids.size)fail('duplicate or incomplete document inventory');
 const modelMap=new Map();
 for(const m of models){
  if(!m||![m.id,m.family,m.revision,m.baseline_commit,m.candidate_commit,m.baseline_protocol,m.candidate_protocol].every(nonempty)||modelMap.has(m.id))fail('invalid model metadata');
  modelMap.set(m.id,m);
 }
 if(new Set(models.map(m=>m.family.toLowerCase())).size<2)fail('at least two declared model families required');
 const docs=new Map();
 for(const d of documents){
  if(!d||!ids.has(d.id)||docs.has(d.id)||![d.source,d.genre,d.purpose].every(nonempty))fail('invalid document');
  const sha=digest(d.source);
  if(d.source_sha256!==sha)fail('source hash mismatch');
  if(independent){
   const m=expected.find(x=>x.id===d.id);
   if(m.source_sha256!==sha||d.split!=='test'||m.review_status!=='editor_verified')fail('test manifest binding mismatch');
   const paragraphs=d.source.split(/\n\s*\n/u).filter(p=>p.trim()&&!/^\s*#{1,6}\s+[^\n]+\s*$/u.test(p)).length;
   const words=(d.source.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu)||[]).length;
   if(paragraphs<3||words<150)fail('test text below minimum length');
  }else if(d.split!=='development')fail('dry run accepts only development cases');
  docs.set(d.id,d);
 }
 const pairs=new Map();
 for(const o of outputs){
  if(!o||!docs.has(o.id)||!modelMap.has(o.model)||!['baseline','candidate'].includes(o.arm)||typeof o.text!=='string'||typeof o.complete!=='boolean'||o.source_sha256!==docs.get(o.id).source_sha256)fail('invalid output or source binding');
  // Incomplete outputs are retained as explicit failed artifacts, not silently filtered.
  const k=JSON.stringify([o.model,o.id]);if(!pairs.has(k))pairs.set(k,{});
  const pair=pairs.get(k);if(Object.hasOwn(pair,o.arm))fail('duplicate output');pair[o.arm]=o;
 }
 if(pairs.size!==models.length*docs.size||[...pairs.values()].some(p=>!p.baseline||!p.candidate))fail('missing comparison arm');
 const packets=[[],[]],mapping=[];
 for(const m of models){
  const order=[...docs.keys()].sort((a,b)=>token(key,'balance:'+m.id+':'+a).localeCompare(token(key,'balance:'+m.id+':'+b)));
  for(const [i,id] of order.entries()){
   const d=docs.get(id),pair=pairs.get(JSON.stringify([m.id,id])),candidateA=i%2===0;
   for(let j=0;j<2;j++){
    const armA=(j===0?candidateA:!candidateA)?'candidate':'baseline',armB=armA==='candidate'?'baseline':'candidate';
    const blind=token(key,'blind:'+j+':'+m.id+':'+id).slice(0,24);
    packets[j].push({id:blind,source:d.source,genre:d.genre,purpose:d.purpose,A:pair[armA].text,B:pair[armB].text});
    mapping.push({blind_id:blind,reviewer_slot:j+1,case_id:id,model:m.id,source_sha256:d.source_sha256,A:{arm:armA,complete:pair[armA].complete,sha256:digest(pair[armA].text)},B:{arm:armB,complete:pair[armB].complete,sha256:digest(pair[armB].text)}});
   }
  }
 }
 const label=independent?'independent_test_pending_human_review':'development_dry_run_not_independent';
 const reviewer=packets.map((items,j)=>{
  items.sort((a,b)=>token(key,'order:'+j+':'+a.id).localeCompare(token(key,'order:'+j+':'+b.id)));
  return {packet:{scope:label,items},response:{scope:label,reviewer_id:'',rows:items.map(x=>({id:x.id,A:blank(),B:blank(),preference:null,reason:''}))}};
 });
 return {reviewer,coordinator:{scope:label,models,mapping,seed:key,issues,score_fields:scores,warning:'Keep private. A manifest declaration is not independent human review. Unblind only after both assessments are frozen.'}};
}
function main(){
 if(process.argv.length!==4)fail('Usage: node corpus-lab/build-review-packets.mjs input.json new-packet-name');
 const name=process.argv[3];if(!/^[a-zA-Z0-9_-]{1,64}$/.test(name))fail('invalid output name');
 const work=join(root,'work');
 mkdirSync(work,{recursive:true,mode:0o700});
 if(lstatSync(work).isSymbolicLink()||realpathSync(work)!==join(realpathSync(root),'work'))fail('unsafe work directory');
 const result=buildPackets(JSON.parse(readFileSync(process.argv[2],'utf8')),randomBytes(32).toString('hex'));
 const out=join(work,name);mkdirSync(out,{mode:0o700}); // exclusive; do not overwrite
 const save=(p,o)=>writeFileSync(p,JSON.stringify(o,null,2)+'\n',{mode:0o600,flag:'wx'});
 const coord=join(out,'coordinator');mkdirSync(coord,{mode:0o700});save(join(coord,'private-key.json'),result.coordinator);
 for(const [j,r] of result.reviewer.entries()){
  const folder=join(out,'reviewer-'+(j+1));mkdirSync(folder,{mode:0o700});save(join(folder,'packet.json'),r.packet);save(join(folder,'response-template.json'),r.response);
 }
 console.log(JSON.stringify({scope:result.coordinator.scope,items_per_reviewer:result.reviewer[0].packet.items.length,output:out,warning:'Send only one reviewer folder to each reviewer; never share coordinator key. No human result has been generated.'}));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{main()}catch(e){console.error(e.message);process.exitCode=1}}
