import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {buildPackets} from '../build-review-packets.mjs';
const key='a'.repeat(64);
const hash=s=>createHash('sha256').update(s,'utf8').digest('hex');
const fixture=()=>{
 const documents=Array.from({length:4},(_,i)=>{const source='Deneme '+i+'.';return {id:'d'+i,source,source_sha256:hash(source),split:'development',genre:'rehber',purpose:'örnek'}});
 const models=['one','two'].map((id,i)=>({id,family:'family'+i,revision:'rev'+i,baseline_commit:'base',candidate_commit:'new',baseline_protocol:'v1',candidate_protocol:'v1'}));
 const outputs=models.flatMap(m=>documents.flatMap(d=>['baseline','candidate'].map(arm=>({id:d.id,model:m.id,arm,text:d.source+' '+(arm==='baseline'?'ilk':'ikinci'),source_sha256:d.source_sha256,complete:true}))));
 return {mode:'development_dry_run',documents,models,outputs};
};
test('deterministic private seed, blinded labels, complete counterbalance',()=>{
 const data=fixture(),r=buildPackets(data,key);assert.deepEqual(r,buildPackets(data,key));
 assert.equal(r.coordinator.mapping.length,16);
 for(const review of r.reviewer){assert.equal(review.packet.items.length,8);assert.equal(review.response.rows.length,8);for(const row of review.packet.items){assert.deepEqual(Object.keys(row),['id','source','genre','purpose','A','B']);assert.match(row.id,/^[a-f0-9]{24}$/)}}
 for(const m of data.models)for(const d of data.documents){
  const x=r.coordinator.mapping.filter(a=>a.case_id===d.id&&a.model===m.id);
  assert.equal(x.length,2);assert.notEqual(x[0].A.arm,x[1].A.arm);assert.notEqual(x[0].blind_id,x[1].blind_id);
 }
 for(let j=1;j<=2;j++)for(const m of data.models)assert.equal(r.coordinator.mapping.filter(a=>a.reviewer_slot===j&&a.model===m.id&&a.A.arm==='candidate').length,2);
 assert.notDeepEqual(buildPackets(data,'b'.repeat(64)).reviewer,r.reviewer);
});
test('refuse incorrect source hash',()=>{const d=fixture();d.documents[0].source+='x';assert.throws(()=>buildPackets(d,key),/hash mismatch/)});
test('refuse output not bound to same source',()=>{const d=fixture();d.outputs[0].source_sha256='b'.repeat(64);assert.throws(()=>buildPackets(d,key),/source binding/)});
test('refuse missing arm',()=>{const d=fixture();d.outputs.pop();assert.throws(()=>buildPackets(d,key),/missing comparison arm/)});
test('refuse duplicate output',()=>{const d=fixture();d.outputs.push(d.outputs[0]);assert.throws(()=>buildPackets(d,key),/duplicate output/)});
test('require separate model families',()=>{const d=fixture();d.models[1].family=d.models[0].family;assert.throws(()=>buildPackets(d,key),/two declared model families/)});
test('development cannot masquerade as holdout',()=>{const d=fixture();d.mode='independent_test';assert.throws(()=>buildPackets(d,key),/manifest rejected/)});
test('require explicit scope and valid private seed',()=>{const d=fixture();assert.throws(()=>buildPackets(d,'public'),/private seed/);delete d.mode;assert.throws(()=>buildPackets(d,key),/explicit mode/)});
test('retain failed empty outputs with private failure status',()=>{const d=fixture();d.outputs[0].text='';d.outputs[0].complete=false;const r=buildPackets(d,key);assert.equal(r.coordinator.mapping.filter(x=>!x.A.complete||!x.B.complete).length,2);assert.equal(r.reviewer.flatMap(x=>x.packet.items).filter(x=>x.A===''||x.B==='').length,2)});
test('positive independent path binds declared manifest, exact bytes and minimum length',()=>{
 const d=fixture();d.mode='independent_test';
 const source=Array(3).fill(Array(60).fill('deneme').join(' ')).join('\n\n');
 d.documents=d.documents.map((x,i)=>({...x,source:source+' '+i,source_sha256:hash(source+' '+i),split:'test'}));
 d.outputs=d.outputs.map(x=>({...x,source_sha256:d.documents.find(doc=>doc.id===x.id).source_sha256}));
 const row=(doc,split)=>({id:doc.id,source_group:doc.id,author_group:doc.id,topic_group:doc.id,source_url:'https://example.invalid/'+doc.id,rights_evidence:'synthetic fixture only',reviewer_id:'fixture',source_sha256:doc.source_sha256,split,review_status:'editor_verified',paragraphs:3,words:181});
 d.manifest=[row({id:'dev',source_sha256:hash('dev')},'development'),...d.documents.map(x=>row(x,'test'))];
 assert.equal(buildPackets(d,key).coordinator.scope,'independent_test_pending_human_review');
 d.manifest[1].source_sha256=hash('unrelated');assert.throws(()=>buildPackets(d,key),/manifest binding/);
});
test('dry run on frozen V2 long-form outputs, not independent evidence',()=>{
 const load=rel=>readFileSync(new URL('../'+rel,import.meta.url),'utf8');
 const documents=load('editorial-longform-v1.jsonl').trim().split(/\r?\n/).map(s=>JSON.parse(s)).map(d=>({...d,source_sha256:hash(d.source)}));
 const inputs=[['qwen-qwen3-32b','Qwen'],['ytu-ce-cosmos-turkish-gemma-9b-v0-1','Gemma']].map(([suffix,family])=>({family,data:JSON.parse(load('results/editorial-abc-text-v2-'+suffix+'.json'))}));
 const models=inputs.map(({family,data})=>({id:data.run.model,family,revision:data.run.revision,baseline_commit:data.run.git,candidate_commit:data.run.git,baseline_protocol:data.run.protocol,candidate_protocol:data.run.protocol}));
 const ids=new Map(documents.map(d=>[d.id,d]));
 const outputs=inputs.flatMap(({data})=>data.outputs.filter(o=>ids.has(o.id)&&['baseline','skill'].includes(o.arm)).map(o=>({id:o.id,model:o.model,arm:o.arm==='skill'?'candidate':'baseline',text:o.output,source_sha256:ids.get(o.id).source_sha256,complete:!o.at_limit})));
 const r=buildPackets({mode:'development_dry_run',documents,models,outputs},key);
 assert.equal(r.coordinator.mapping.length,48);assert.equal(r.reviewer[0].packet.items.length,24);
 assert.equal(r.reviewer[1].packet.items.length,24);
 assert.equal(r.coordinator.scope,'development_dry_run_not_independent');
});
