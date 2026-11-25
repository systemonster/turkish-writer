#!/usr/bin/env node
// Research only. Never use a synthetic review as independent human evidence.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,lstatSync,realpathSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const hash=s=>createHash('sha256').update(s,'utf8').digest('hex');
const fail=s=>{throw new Error(s)};
const nonempty=x=>typeof x==='string'&&x.trim().length>0;
const scores=['meaning','natural_turkish','editorial_value','flow','mechanics'];
const categories=['fact','scope','negation','modality','agent','attribution','number','link','quote','voice','condition','structure','other'];
const scopes=['development_dry_run_not_independent','independent_test_pending_human_review'];
const sides=['A','B'];
function index(rows,field){
 if(!Array.isArray(rows))fail('missing rows');
 const m=new Map();
 for(const row of rows){if(!row||!nonempty(row[field])||m.has(row[field]))fail('invalid or duplicate '+field);m.set(row[field],row)}
 return m;
}
function checkAssessment(a,complete,text){
 if(!a||!a.scores||Object.keys(a.scores).length!==scores.length||scores.some(k=>!Number.isInteger(a.scores[k])||a.scores[k]<1||a.scores[k]>5))fail('missing or invalid score');
 if(!Number.isInteger(a.unnecessary_interventions)||a.unnecessary_interventions<0)fail('invalid intervention count');
 if(!Array.isArray(a.critical_issues)||a.critical_issues.some(x=>!x||!categories.includes(x.category)||!nonempty(x.reason)))fail('invalid critical issue');
 if(typeof a.notes!=='string'||(a.repair_minutes!==null&&(!Number.isFinite(a.repair_minutes)||a.repair_minutes<0)))fail('invalid notes or repair time');
 if(!complete||!text.trim()){
  if(scores.some(k=>a.scores[k]!==1)||!nonempty(a.notes))fail('incomplete output requires minimum scores and reason');
 }
}
const avg=x=>x.length?x.reduce((a,b)=>a+b,0)/x.length:null;
export function collectReviews(coordinator,packets,responses){
 if(!coordinator||!scopes.includes(coordinator.scope)||!Array.isArray(coordinator.models)||!Array.isArray(coordinator.mapping)||!coordinator.mapping.length||packets.length!==2||responses.length!==2)fail('invalid review bundle');
 const models=index(coordinator.models,'id'),map=index(coordinator.mapping,'blind_id');
 if(responses.some(x=>!x||!nonempty(x.reviewer_id))||responses[0].reviewer_id.trim()===responses[1].reviewer_id.trim())fail('two distinct reviewer identifiers required');
 const pairs=new Map(),seen=new Set();
 for(let j=0;j<2;j++){
  const p=packets[j],r=responses[j];
  if(!p||p.scope!==coordinator.scope||r.scope!==coordinator.scope)fail('scope mismatch');
  const items=index(p.items,'id'),rows=index(r.rows,'id');
  const expected=coordinator.mapping.filter(x=>x.reviewer_slot===j+1);
  if(items.size!==expected.length||rows.size!==expected.length)fail('incomplete reviewer inventory');
  for(const m of expected){
   const item=items.get(m.blind_id),row=rows.get(m.blind_id);
   if(!item||!row||!models.has(m.model)||!nonempty(m.case_id)||typeof item.source!=='string'||hash(item.source)!==m.source_sha256)fail('missing case or changed source');
   if(!m.A||!m.B||new Set([m.A.arm,m.B.arm]).size!==2||![m.A.arm,m.B.arm].every(a=>['baseline','candidate'].includes(a)))fail('invalid arm mapping');
   if(!['A','B','equal'].includes(row.preference)||!nonempty(row.reason))fail('missing preference or reason');
   const value={slot:j+1,preference:row.preference==='equal'?'equal':m[row.preference].arm};
   for(const side of sides){
    if(typeof item[side]!=='string'||typeof m[side].complete!=='boolean'||hash(item[side])!==m[side].sha256)fail('output hash mismatch');
    checkAssessment(row[side],m[side].complete,item[side]);
    value[m[side].arm]={...row[side],complete:m[side].complete&&!!item[side].trim(),hash:m[side].sha256};
   }
   if(item.A===item.B&&row.preference!=='equal')fail('identical texts must tie');
   if(!value.candidate.complete&&value.baseline.complete&&value.preference==='candidate')fail('failed output preferred');
   if(!value.baseline.complete&&value.candidate.complete&&value.preference==='baseline')fail('failed output preferred');
   seen.add(m.blind_id);
   const k=JSON.stringify([m.model,m.case_id]);if(!pairs.has(k))pairs.set(k,{model:m.model,id:m.case_id,reviews:[]});
   pairs.get(k).reviews.push(value);
  }
 }
 if(seen.size!==map.size)fail('unassigned mapping row');
 const records=[...pairs.values()];
 const ids=new Set(records.map(x=>x.id));
 if(records.length!==ids.size*models.size)fail('incomplete model/case matrix');
 for(const x of records){
  if(x.reviews.length!==2||new Set(x.reviews.map(y=>y.slot)).size!==2)fail('missing second review');
  for(const arm of ['baseline','candidate'])if(x.reviews[0][arm].hash!==x.reviews[1][arm].hash||x.reviews[0][arm].complete!==x.reviews[1][arm].complete)fail('reviewers received different outputs');
 }
 const per_model=[...models.keys()].map(model=>{
  const cases=records.filter(x=>x.model===model),ratings=cases.flatMap(x=>x.reviews);
  const armSummary=arm=>({incomplete_cases:cases.filter(x=>!x.reviews[0][arm].complete).length,critical_flagged_cases:cases.filter(x=>x.reviews.some(y=>y[arm].critical_issues.length)).length,mean_scores:Object.fromEntries(scores.map(k=>[k,avg(ratings.map(r=>r[arm].scores[k]))])),mean_unnecessary_interventions:avg(ratings.map(r=>r[arm].unnecessary_interventions)),mean_repair_minutes:avg(ratings.map(r=>r[arm].repair_minutes).filter(x=>x!==null)),repair_time_observations:ratings.filter(r=>r[arm].repair_minutes!==null).length});
  return {model,cases:cases.length,ratings:ratings.length,baseline:armSummary('baseline'),candidate:armSummary('candidate'),preference:Object.fromEntries(['baseline','candidate','equal'].map(a=>[a,ratings.filter(r=>r.preference===a).length])),preference_agreement_cases:cases.filter(x=>x.reviews[0].preference===x.reviews[1].preference).length,requires_adjudication:cases.filter(x=>{const [a,b]=x.reviews;return a.preference!==b.preference||['baseline','candidate'].some(arm=>Boolean(a[arm].critical_issues.length)!==Boolean(b[arm].critical_issues.length))}).map(x=>x.id)};
 });
 return {scope:coordinator.scope,cases:ids.size,reviewers:2,per_model,release_gate:'NOT_EVALUATED',warning:'Completeness and arithmetic only. Reviewer identities, independence, rights, holdout provenance and judgments are not verified by this tool. Adjudicate disagreements separately. No release authorization inferred.'};
}
function main(){
 if(process.argv.length!==4||!/^[a-zA-Z0-9_-]{1,64}$/.test(process.argv[2])||!/^[a-zA-Z0-9_-]{1,64}$/.test(process.argv[3]))fail('Usage: node corpus-lab/collect-reviews.mjs packet-name report-name');
 const work=join(root,'work'),dir=join(work,process.argv[2]);
 for(const p of [work,dir,join(dir,'coordinator'),join(dir,'reviewer-1'),join(dir,'reviewer-2')])if(lstatSync(p).isSymbolicLink()||realpathSync(p)!==p)fail('unsafe directory');
 const read=p=>{if(lstatSync(p).isSymbolicLink()||!lstatSync(p).isFile())fail('unsafe file');return JSON.parse(readFileSync(p,'utf8'))};
 const c=read(join(dir,'coordinator','private-key.json')),p=[1,2].map(j=>read(join(dir,'reviewer-'+j,'packet.json'))),r=[1,2].map(j=>read(join(dir,'reviewer-'+j,'response.json')));
 const result=collectReviews(c,p,r);
 writeFileSync(join(dir,'coordinator',process.argv[3]+'.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600,flag:'wx'});
 console.log(JSON.stringify({scope:result.scope,cases:result.cases,models:result.per_model.length,release_gate:result.release_gate}));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{main()}catch(e){console.error(e.message);process.exitCode=1}}
