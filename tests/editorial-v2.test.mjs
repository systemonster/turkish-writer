import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { selfTest } from "../corpus-lab/wiki-revision-candidates.mjs";
import { assess, diagnostic, tasks, validateCases } from "../corpus-lab/editorial-eval.mjs";

const cases=readFileSync(new URL("../corpus-lab/editorial-stress-v1.jsonl",import.meta.url),"utf8").trim().split(/\r?\n/).map(JSON.parse);

test("historical revision candidate extraction guards",()=>{
 const checks=selfTest();
 assert.equal(checks.length,17);
 for(const c of checks)assert.equal(c.pass,true,c.name);
});
test("40 synthetic editorial cases: fixtures and reference diagnostics",()=>{
 validateCases(cases);
 assert.equal(cases.length,40);
 assert.equal(cases.filter(c=>c.decision==="keep").length,18);
 assert.equal(new Set(cases.map(c=>c.category)).size,8);
 const r=assess(cases,cases.map(c=>({id:c.id,output:c.reference})));
 assert.equal(r.reference_change_agreement,40);
 assert.equal(r.flagged_for_literal_review,0);
});
test("diagnostics flag literal changes and never equate literal checks with meaning",()=>{
 assert.equal(diagnostic("Fiyat 1.250 TL.","Fiyat 1.500 TL.").requires_review,true);
 assert.equal(diagnostic("[Koşullar](/kosullar)","Koşullar").requires_review,true);
 assert.equal(diagnostic("Oran “yaklaşık %12”.","Oran “%12”.").requires_review,true);
 // Negation can change while all literal checks pass: human semantic review remains essential.
 assert.equal(diagnostic("Başvuru onaylandı.","Başvuru onaylanmadı.").requires_review,false);
});
test("evaluation tasks omit development references",()=>{
 for(const t of tasks(cases)){assert.equal("reference" in t,false);assert.equal("decision" in t,false);assert.equal("category" in t,false);}
});
test("missing or duplicate outputs do not silently pass",()=>{
 assert.throws(()=>assess(cases,[]),/Missing outputs/);
 assert.throws(()=>assess(cases,[{id:cases[0].id,output:"x"},{id:cases[0].id,output:"x"}]),/duplicate/);
});
