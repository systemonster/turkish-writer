#!/usr/bin/env node
// Research-only manifest checks. Never publish the private source text or reviewer details.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function validateHoldout(rows){
 const errors=[],counts={development:0,validation:0,test:0},ids=new Set(),groups=new Map();
 if(!Array.isArray(rows)||!rows.length)return {valid:false,counts,errors:["no manifest rows"]};
 const required=["id","source_group","author_group","topic_group","source_url","rights_evidence","reviewer_id","source_sha256","split"];
 for(const [i,row] of rows.entries()){
  const label=`row ${i+1}`;
  if(!row||typeof row!=="object"||Array.isArray(row)){errors.push(`${label}: invalid row`);continue;}
  if(required.some(k=>typeof row[k]!=="string"||!row[k].trim())){errors.push(`${label}: missing required fields`);continue;}
  if(!Object.hasOwn(counts,row.split)){errors.push(`${label}: invalid split`);continue;}
  if(ids.has(row.id))errors.push(`${label}: duplicate id`);
  ids.add(row.id);
  if(!/^[a-f0-9]{64}$/.test(row.source_sha256))errors.push(`${label}: invalid source hash`);
  if(row.review_status!=="editor_verified")errors.push(`${label}: no declared human review`);
  if(!Number.isInteger(row.paragraphs)||row.paragraphs<3)errors.push(`${label}: fewer than 3 paragraphs`);
  if(!Number.isInteger(row.words)||row.words<150)errors.push(`${label}: fewer than 150 words`);
  for(const key of ["source_group","author_group","topic_group","source_sha256"]){
   const value=row[key].trim().toLowerCase();
   const groupKey=key+"\u0000"+value;
   if(groups.has(groupKey)&&groups.get(groupKey)!==row.split)errors.push(`${label}: ${key} leaks across splits`);
   else groups.set(groupKey,row.split);
  }
  counts[row.split]++;
 }
 if(!counts.development||!counts.test)errors.push("both development and test inventories required");
 return {valid:errors.length===0,counts,errors,scope:"Manifest consistency only; no proof of rights, authorship, human review, actual hash, or near-duplicate separation."};
}
export {validateHoldout};
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
 if(process.argv.length!==3)throw Error('Usage: node corpus-lab/validate-holdout.mjs corpus-lab/work/private-manifest.jsonl');
 const rows=readFileSync(process.argv[2],'utf8').split(/\r?\n/).filter(s=>s.trim()).map(JSON.parse);
 const r=validateHoldout(rows);console.log(JSON.stringify(r,null,2));process.exitCode=r.valid?0:1;
 }catch(e){console.error(e.message);process.exitCode=2;}
}
