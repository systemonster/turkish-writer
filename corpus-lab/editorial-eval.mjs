#!/usr/bin/env node
// Development harness, not a detector, not a model-quality score.
import {readFileSync,writeFileSync,mkdirSync,realpathSync} from "node:fs";
import {resolve,dirname,relative,isAbsolute,sep} from "node:path";
import {fileURLToPath} from "node:url";

function bag(text,pattern){return (text.match(pattern)||[]).sort();}

function changes(a,b){const x=new Map(),y=new Map();for(const s of a)x.set(s,(x.get(s)||0)+1);for(const s of b)y.set(s,(y.get(s)||0)+1);const added=[],removed=[];for(const s of new Set([...x.keys(),...y.keys()])){const d=(y.get(s)||0)-(x.get(s)||0);for(let i=0;i<Math.abs(d);i++)(d>0?added:removed).push(s);}return {added,removed};}

function diagnostic(source,output){
 const numbers=changes(bag(source,/[+-]?\p{N}+(?:[.,:/]\p{N}+)*/gu),bag(output,/[+-]?\p{N}+(?:[.,:/]\p{N}+)*/gu));
 const links=changes(bag(source,/\]\([^)]+\)|https?:\/\/[^\s<>]+/gu),bag(output,/\]\([^)]+\)|https?:\/\/[^\s<>]+/gu));
 const quotes=changes(bag(source,/“[^”]+”|«[^»]+»/gu),bag(output,/“[^”]+”|«[^»]+»/gu));
 return {numbers,links,quotes,changed:source!==output,requires_review:[numbers,links,quotes].some(x=>x.added.length||x.removed.length)};
}

function validateCases(cases){
 const ids=new Set();
 for(const c of cases){
  if(typeof c.id!=="string"||!c.id||ids.has(c.id)||c.split!=="development"||typeof c.source!=="string"||!c.source.trim()||typeof c.reference!=="string"||!c.reference.trim()||typeof c.category!=="string"||typeof c.reason!=="string"||!["keep","edit"].includes(c.decision)||((c.decision==="keep")!==(c.source===c.reference))||!Array.isArray(c.reference_required)||c.reference_required.some(s=>typeof s!=="string"||!s||!c.reference.includes(s)))throw Error("Invalid case: "+c.id);
  ids.add(c.id);
 }
 if(!cases.length)throw Error("No cases");
}

function assess(cases,outputs){
 validateCases(cases);const byId=new Map(cases.map(c=>[c.id,c])),seen=new Set(),report=[];
 for(const row of outputs){
  if(!byId.has(row.id)||seen.has(row.id)||typeof row.output!=="string"||!row.output.trim())throw Error("Invalid or duplicate output: "+row.id);
  seen.add(row.id);const c=byId.get(row.id),d=diagnostic(c.source,row.output);
  report.push({id:c.id,category:c.category,reference_decision:c.decision,actual_change:d.changed,agrees_with_reference_change:d.changed===(c.decision==="edit"),literal_review_flags:{numbers:d.numbers,links:d.links,quotes:d.quotes},requires_review:d.requires_review});
 }
 const missing=cases.filter(c=>!seen.has(c.id)).map(c=>c.id);
 if(missing.length)throw Error("Missing outputs: "+missing.join(", "));
 return {scope:"development diagnostics only; no semantic quality score or authorship inference",total:report.length,reference_change_agreement:report.filter(r=>r.agrees_with_reference_change).length,flagged_for_literal_review:report.filter(r=>r.requires_review).length,rows:report};
}

function tasks(cases){validateCases(cases);return cases.map(c=>({id:c.id,mode:"filter",instruction:"Aşağıdaki metni bağlamına uygun doğal Türkiye Türkçesiyle düzenle. Anlamı, bilgiyi ve biçimi koru. Yalnız sonuç metnini döndür.",source:c.source}));}

function jsonl(p){return readFileSync(p,"utf8").split(/\r?\n/).filter(s=>s.trim()).map(JSON.parse);}
const root=dirname(fileURLToPath(import.meta.url));
function localWrite(p,content){
 const work=resolve(root,"work"),target=resolve(p),rel=relative(work,target);
 if(!rel||isAbsolute(rel)||rel===".."||rel.startsWith(".."+sep))throw Error("Output must be in corpus-lab/work/");
 mkdirSync(work,{recursive:true});if(realpathSync(work)!==work)throw Error("Work directory must not be a symlink");
 mkdirSync(dirname(target),{recursive:true});const parent=relative(work,realpathSync(dirname(target)));
 if(isAbsolute(parent)||parent===".."||parent.startsWith(".."+sep))throw Error("Output parent escapes work");
 writeFileSync(target,content,{encoding:"utf8",flag:"wx"});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const [mode,file]=process.argv.slice(2);
  const cases=jsonl(resolve(root,"editorial-stress-v1.jsonl"));
  if(mode==="--prepare"&&file&&process.argv.length===4)localWrite(file,tasks(cases).map(x=>JSON.stringify(x)).join("\n")+"\n");
  else if(mode==="--check"&&file&&process.argv.length===4)console.log(JSON.stringify(assess(cases,jsonl(file)),null,2));
  else if(mode==="--fixture-check"&&!file&&process.argv.length===3)console.log(JSON.stringify(assess(cases,cases.map(c=>({id:c.id,output:c.reference}))),null,2));
  else throw Error("Usage: --prepare corpus-lab/work/tasks.jsonl | --check outputs.jsonl | --fixture-check");
 }catch(e){console.error(e.message);process.exitCode=1;}
}
export {diagnostic,validateCases,assess,tasks};
