// Research-only exact-span patch experiment. Structural safeguards do not prove semantic fidelity.
function blocks(source){
  // Only LF prose blocks; unknown/structured Markdown is deliberately immutable.
  const parts=source.split(/(\n[ \t]*\n(?:[ \t]*\n)*)/u);
  let fenced=false;
  return parts.map((text,index)=>{
    if(index%2)return {index,text,editable:false};
    const hasFence=/^[ \t]{0,3}(?:`{3,}|~{3,})/mu.test(text);
    const wasFenced=fenced;
    for(const line of text.split("\n"))if(/^[ \t]{0,3}(?:`{3,}|~{3,})/u.test(line))fenced=!fenced;
    const structured=/^[ \t]*(?:#{1,6}(?:\s|$)|>|[-*+]\s|\d+[.)]\s|\||(?:---|\*\*\*|___)\s*$|<|!?\[[^\]]+\]:)/mu.test(text)||/^[ \t]{4,}\S/mu.test(text)||/^\t/mu.test(text)||/^[ \t]*(?:=+|-+)[ \t]*$/mu.test(text);
    return {index,text,editable:!wasFenced&&!hasFence&&!structured&&!text.includes("\r")&&!!text.trim()};
  });
}
function signature(s){
  // Literal diagnostics, not semantic checks. Preserve order and multiplicity.
  return JSON.stringify([
    [...s.matchAll(/https?:\/\/[^\s<>()]+|!?\[[^\]\n]*\]\([^)\n]*\)|`+[^`\n]+`+|“[^”]*”|«[^»]*»|"[^"\n]*"|\b[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}\b/gu)].map(x=>x[0]),
    [...s.matchAll(/[+-]?\p{N}+(?:[.,:/–-]\p{N}+)*/gu)].map(x=>x[0]),
    [...s.matchAll(/[*_~`[\]<>\\|#]/gu)].map(x=>x[0]),
    [...s.matchAll(/\p{Cf}/gu)].map(x=>x[0])
  ]);
}
function applyPatches(source, patches){
  if(typeof source!=="string"||!Array.isArray(patches)||patches.length>24) return {valid:false,output:source,reason:"schema"};
  const units=blocks(source), byIndex=new Map();
  const fail=reason=>({valid:false,output:source,reason});
  for(const patch of patches){
    if(!patch||typeof patch!=="object"||Array.isArray(patch)||!Number.isSafeInteger(patch.index)||typeof patch.before!=="string"||typeof patch.after!=="string"||typeof patch.reason!=="string"||!patch.reason.trim()||!patch.before.trim()||patch.before===patch.after)return fail("schema");
    const b=units[patch.index];if(!b?.editable)return fail("immutable-block");
    const start=b.text.indexOf(patch.before);
    if(start<0||b.text.indexOf(patch.before,start+1)>=0)return fail("missing-or-ambiguous-anchor");
    if(/[\r\n]/u.test(patch.before)||/[\r\n]/u.test(patch.after))return fail("line-boundary");
    // An isolated UTF-16 substring must not cut through a letter, combining mark or number.
    const end=start+patch.before.length;
    const word=/[\p{L}\p{M}\p{N}]/u;
    if((start>0&&word.test(b.text[start-1])&&word.test(b.text[start]))||(end<b.text.length&&word.test(b.text[end-1])&&word.test(b.text[end])))return fail("partial-word");
    if((start>0&&/[\uD800-\uDBFF]/u.test(b.text[start-1]))||(end<b.text.length&&/[\uD800-\uDBFF]/u.test(b.text[end-1])))return fail("surrogate-boundary");
    const ranges=byIndex.get(patch.index)||[];
    if(ranges.some(r=>start<r.end&&end>r.start))return fail("overlap");
    ranges.push({start,end,after:patch.after});byIndex.set(patch.index,ranges);
  }
  for(const [index,ranges] of byIndex){
    const b=units[index];let value=b.text;
    for(const r of ranges.sort((a,b)=>b.start-a.start))value=value.slice(0,r.start)+r.after+value.slice(r.end);
    if(!value.trim()||!blocks(value)[0]?.editable||signature(b.text)!==signature(value))return fail("literal-or-structure-change");
    b.text=value;
  }
  const output=units.map(b=>b.text).join("");
  return {valid:true,output,reason:null};
}
export { blocks, applyPatches };
