#!/usr/bin/env node
// Developer-only bounded collection. Does not modify any Wikimedia page.
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { dirname, resolve, relative, isAbsolute, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { collectPage, selfTest } from "./wiki-revision-candidates.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const WORK = resolve(ROOT, "work");
const endpoint = "https://tr.wikipedia.org/w/api.php";
const help = "Usage: node corpus-lab/collect-wiki-revisions.mjs --titles-file corpus-lab/work/titles.txt --contact https://your-project.example --out corpus-lab/work/wiki-candidates.jsonl [--batches 1] [--limit 200]\nOr use --input local-formatversion2-response.json instead of --titles-file and --contact. --self-test runs synthetic core checks.";

function argsOf(argv) {
  if (argv.length===1 && argv[0]==="--self-test") return {selfTest:true};
  const allowed=new Set(["--titles-file","--contact","--input","--out","--batches","--limit"]);
  const a={};
  for(let i=0;i<argv.length;i+=2) {
    const k=argv[i],v=argv[i+1];
    if(!allowed.has(k)||!v||v.startsWith("--")||k in a) throw new Error(help);
    a[k]=v;
  }
  if(!a["--out"] || Boolean(a["--input"])===Boolean(a["--titles-file"]) || (a["--titles-file"]&&!a["--contact"])) throw new Error(help);
  if(a["--contact"]&&!/^(?:https:\/\/[^\s()]+|[^\s()@]+@[^\s()@]+\.[^\s()@]+)$/.test(a["--contact"])) throw new Error("A valid project contact URL or email is required by Wikimedia.");
  a.batches=Number(a["--batches"]??1);a.limit=Number(a["--limit"]??200);
  if(!Number.isInteger(a.batches)||a.batches<1||a.batches>4||!Number.isInteger(a.limit)||a.limit<1||a.limit>1000) throw new Error("batches 1–4, limit 1–1000");
  return a;
}
async function localOutput(value) {
  const target=resolve(value), rel=relative(WORK,target);
  if(!rel||isAbsolute(rel)||rel===".."||rel.startsWith(".."+sep)) throw new Error("Output must be inside corpus-lab/work/");
  await mkdir(WORK,{recursive:true});
  if(await realpath(WORK)!==WORK) throw new Error("Work directory must not be a symlink");
  await mkdir(dirname(target),{recursive:true});
  const parent=await realpath(dirname(target));
  const actual=relative(WORK,parent);
  if(isAbsolute(actual)||actual===".."||actual.startsWith(".."+sep)) throw new Error("Output parent escapes work directory");
  return target;
}
function pagesFrom(payload){
  if(payload?.error) throw new Error("MediaWiki API: "+String(payload.error.code||"error"));
  if(!Array.isArray(payload?.query?.pages)) throw new Error("Expected formatversion=2 query.pages");
  return payload.query.pages;
}
async function fetchTitle(title, contact, batches){
  let continuation={}, page=null, seen=new Set(), requestCount=0;
  for(let i=0;i<batches;i++){
    const q=new URLSearchParams({action:"query",prop:"revisions",titles:title,format:"json",formatversion:"2",rvslots:"main",rvprop:"ids|timestamp|tags|content|contentmodel",rvlimit:"50",rvdir:"older",rvstart:"2017-12-31T23:59:59Z",maxlag:"5",...continuation});
    const response=await fetch(endpoint+"?"+q,{headers:{"User-Agent":"TurkishWriterCorpusBot/0.1 ("+contact+")","Accept":"application/json"},signal:AbortSignal.timeout(45000),redirect:"error"});
    requestCount++;
    if(!response.ok) throw new Error("HTTP "+response.status+"; stop collection. Retry-After: "+(response.headers.get("retry-after")??"not supplied"));
    const payload=await response.json(), rows=pagesFrom(payload);
    if(rows.length!==1||rows[0].missing||rows[0].ns!==0) return {page:null,requestCount};
    const p=rows[0];
    if(!page)page={pageid:p.pageid,ns:p.ns,title:p.title,revisions:[]};
    if(p.pageid!==page.pageid) throw new Error("Page ID changed during collection");
    for(const r of p.revisions??[]) if(!seen.has(r.revid)){seen.add(r.revid);page.revisions.push(r);}
    if(!payload.continue)break;
    // Only continuation fields returned by the API; do not override request settings.
    if(typeof payload.continue.rvcontinue!=="string")throw new Error("Unexpected continuation");
    continuation={continue:String(payload.continue.continue??""),rvcontinue:payload.continue.rvcontinue};
    await new Promise(r=>setTimeout(r,500));
  }
  return {page,requestCount};
}
async function main(){
  const a=argsOf(process.argv.slice(2));
  if(a.selfTest){const checks=selfTest();console.log(JSON.stringify(checks,null,2));if(checks.some(x=>!x.pass))process.exitCode=1;return;}
  const target=await localOutput(a["--out"]);
  let requestCount=0,pagesExamined=0,revisionCount=0;
  const out=[],seenIds=new Set(),seenPairs=new Set();
  function add(page){
    if(!page)return;
    pagesExamined++;revisionCount+=page.revisions?.length??0;
    for(const c of collectPage(page)){
      if(out.length>=a.limit)break;
      const key=JSON.stringify([c.before,c.after]);
      if(seenIds.has(c.id)||seenPairs.has(key))continue;
      seenIds.add(c.id);seenPairs.add(key);out.push(c);
    }
  }
  if(a["--input"]){
    const payload=JSON.parse(await readFile(a["--input"],"utf8"));
    for(const page of pagesFrom(payload)){add(page);if(out.length>=a.limit)break;}
  }else{
    const titles=[...new Set((await readFile(a["--titles-file"],"utf8")).split(/\r?\n/).map(s=>s.trim()).filter(Boolean))];
    if(!titles.length||titles.length>20||titles.some(t=>t.length>250||t.includes("|")))throw new Error("Provide 1–20 explicit article titles, one per line");
    for(const title of titles){
      const result=await fetchTitle(title,a["--contact"],a.batches);
      requestCount+=result.requestCount;add(result.page);
      if(out.length>=a.limit)break;
      await new Promise(r=>setTimeout(r,500));
    }
  }
  await writeFile(target,out.map(x=>JSON.stringify(x)).join("\n")+(out.length?"\n":""),{encoding:"utf8",flag:"wx"});
  console.log(JSON.stringify({scope:"unreviewed candidate extraction",requestCount,pagesExamined,revisionCount,candidates:out.length,human_verified:0},null,2));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
