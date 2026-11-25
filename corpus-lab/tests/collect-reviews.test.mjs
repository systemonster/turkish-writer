import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildPackets} from '../build-review-packets.mjs';
import {collectReviews} from '../collect-reviews.mjs';
const hash=s=>createHash('sha256').update(s,'utf8').digest('hex');
function fixture(){
 const documents=[1,2].map(i=>({id:'d'+i,source:'Kaynak '+i,source_sha256:hash('Kaynak '+i),split:'development',genre:'blog',purpose:'deneme'}));
 const models=[1,2].map(i=>({id:'m'+i,family:'f'+i,revision:'r',baseline_commit:'b',candidate_commit:'c',baseline_protocol:'p',candidate_protocol:'p'}));
 const outputs=models.flatMap(m=>documents.flatMap(d=>['baseline','candidate'].map(arm=>({id:d.id,model:m.id,arm,text:d.source+' '+arm,source_sha256:d.source_sha256,complete:true}))));
 const data=buildPackets({mode:'development_dry_run',documents,models,outputs},'a'.repeat(64));
 const packets=data.reviewer.map(r=>r.packet),responses=data.reviewer.map(r=>r.response);
 for(let j=0;j<2;j++){
  responses[j].reviewer_id='fixture-'+j;
  for(const row of responses[j].rows){
   const m=data.coordinator.mapping.find(x=>x.blind_id===row.id);
   for(const side of ['A','B']){
    const n=m[side].arm==='candidate'?5:3;
    row[side].scores=Object.fromEntries(Object.keys(row[side].scores).map(k=>[k,n]));
    row[side].unnecessary_interventions=n===5?0:1;
    row[side].repair_minutes=n===5?null:2;
   }
   row.preference=m.A.arm==='candidate'?'A':'B';row.reason='Synthetic fixture, not human evidence';
  }
 }
 return {c:data.coordinator,p:packets,r:responses};
}
const collect=x=>collectReviews(x.c,x.p,x.r);
test('unblind reversed ordering; aggregate by model, not screen position',()=>{
 const result=collect(fixture());
 assert.equal(result.scope,'development_dry_run_not_independent');assert.equal(result.release_gate,'NOT_EVALUATED');
 assert.equal(result.cases,2);assert.equal(result.per_model.length,2);
 for(const m of result.per_model){assert.equal(m.ratings,4);assert.equal(m.preference.candidate,4);assert.equal(m.preference_agreement_cases,2);assert.equal(m.candidate.mean_scores.meaning,5);assert.equal(m.baseline.mean_scores.meaning,3);assert.equal(m.candidate.mean_repair_minutes,null);assert.equal(m.baseline.mean_repair_minutes,2);assert.deepEqual(m.requires_adjudication,[])}
 assert.ok(!JSON.stringify(result).includes('fixture-'));
});
test('reject missing and duplicate reviews',()=>{let x=fixture();x.r[0].rows.pop();assert.throws(()=>collect(x),/inventory/);x=fixture();x.r[0].rows[1]=x.r[0].rows[0];assert.throws(()=>collect(x),/duplicate/);});
test('reject same reviewer and scope substitution',()=>{let x=fixture();x.r[1].reviewer_id=x.r[0].reviewer_id;assert.throws(()=>collect(x),/distinct/);x=fixture();x.r[0].scope='independent_test_pending_human_review';assert.throws(()=>collect(x),/scope/);});
test('reject changed source or output',()=>{let x=fixture();x.p[0].items[0].source+='x';assert.throws(()=>collect(x),/changed source/);x=fixture();x.p[0].items[0].A+='x';assert.throws(()=>collect(x),/output hash/);});
test('reject missing scores and unreasoned critical issues',()=>{let x=fixture();x.r[0].rows[0].A.scores.meaning=null;assert.throws(()=>collect(x),/score/);x=fixture();x.r[0].rows[0].B.critical_issues=[{category:'fact',reason:''}];assert.throws(()=>collect(x),/critical/);});
test('retain critical flags and disagreements even with high scores',()=>{
 const x=fixture(),row=x.r[0].rows[0],m=x.c.mapping.find(y=>y.blind_id===row.id);
 row[row.preference].critical_issues=[{category:'modality',reason:'synthetic flag'}];
 row.preference=row.preference==='A'?'B':'A';
 const result=collect(x).per_model.find(y=>y.model===m.model);
 assert.equal(result.candidate.critical_flagged_cases,1);assert.deepEqual(result.requires_adjudication,[m.case_id]);assert.equal(result.preference_agreement_cases,1);
});
test('reject favorable scoring on incomplete outputs',()=>{
 const x=fixture();x.c.mapping[0].A.complete=false;
 assert.throws(()=>collect(x),/incomplete output/);
});
test('require ties for identical texts',()=>{
 const x=fixture(),m=x.c.mapping.find(y=>y.blind_id===x.r[0].rows[0].id),p=x.p[0].items.find(y=>y.id===m.blind_id);
 p.B=p.A;m.B.sha256=hash(p.B);
 assert.throws(()=>collect(x),/identical texts/);
});
