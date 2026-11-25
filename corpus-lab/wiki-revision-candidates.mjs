// Developer-only historical revision candidate miner. No model or network required.
// Raw excerpts are for local review only; never label automatically as editor_verified.
function validDate(s){return typeof s==="string"&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().replace(".000Z","Z")===s&&s<"2018-01-01T00:00:00Z";}

function revText(r){return r?.slots?.main?.contentmodel==="wikitext"&&typeof r.slots.main.content==="string"&&!r.texthidden&&!r.suppressed?r.slots.main.content:null;}

function paragraphs(s){return s.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);}

function words(s){return s.match(/[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}]+)?|[^\s]/gu)||[];}

function cleanParagraph(s){return typeof s==="string"&&s.length<=2200&&s.length>=80&&/[\p{L}]/u.test(s)&&!/[<>{}\[\]|#=*]/.test(s)&&!/(?:https?:\/\/|www\.|@|'{2,}|^[:;!])/i.test(s)&&!/\p{C}/u.test(s);}

function changedSpan(a,b){const x=words(a),y=words(b);let l=0,r=0;while(l<Math.min(x.length,y.length)&&x[l]===y[l])l++;while(r<Math.min(x.length,y.length)-l&&x[x.length-1-r]===y[y.length-1-r])r++;return {old:x.length-l-r,new:y.length-l-r,total:Math.max(x.length,y.length)};}

function candidate(page,older,newer,next){
 if(!Number.isSafeInteger(page?.pageid)||page.pageid<=0||page.ns!==0||typeof page.title!=="string")return null;
 if(!Number.isSafeInteger(older?.revid)||older.revid<=0||!Number.isSafeInteger(newer?.revid)||newer.revid<=0||older.revid===newer.revid||newer.parentid!==older.revid||!validDate(older.timestamp)||!validDate(newer.timestamp)||older.timestamp>newer.timestamp)return null;
 if([older,newer].some(r=>!Array.isArray(r.tags)||r.tags.some(t=>typeof t!=="string"||/revert|rollback|undo|vandal|bot/i.test(t))))return null;
 const before=revText(older),after=revText(newer);
 if(before===null||after===null||before===after||Math.max(before.length,after.length)>500000)return null;
 if(next&&next.parentid===newer.revid&&revText(next)===before)return null;
 const a=paragraphs(before),b=paragraphs(after);if(a.length!==b.length)return null;
 const changed=[];for(let i=0;i<a.length;i++)if(a[i]!==b[i])changed.push(i);
 if(changed.length!==1)return null;
 const i=changed[0],x=a[i],y=b[i];if(!cleanParagraph(x)||!cleanParagraph(y))return null;
 if(JSON.stringify(x.match(/\p{N}+/gu)||[])!==JSON.stringify(y.match(/\p{N}+/gu)||[]))return null;
 const span=changedSpan(x,y);if(Math.max(span.old,span.new)>12||Math.max(span.old,span.new)/span.total>.35)return null;
 return {id:"trwiki-"+older.revid+"-"+newer.revid,source_group:"trwiki:"+page.pageid,source_url:"https://tr.wikipedia.org/w/index.php?diff="+newer.revid+"&oldid="+older.revid,rights_evidence:"https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use",attribution:{page_title:page.title,previous_revision:"https://tr.wikipedia.org/w/index.php?oldid="+older.revid,revised_revision:"https://tr.wikipedia.org/w/index.php?oldid="+newer.revid,license_review_required:true},previous_revision_id:older.revid,revision_id:newer.revid,previous_timestamp:older.timestamp,revision_timestamp:newer.timestamp,genre:"encyclopedia",before:x,after:y,status:"candidate_not_editor_verified",decision:null,review_required:["meaning","vandalism","later_reverts","factual_change","translation","rights_and_attribution","personal_data","editorial_value"],origin:"historical_wikipedia_revision",observed_span:span};
}

function collectPage(page){
 if(!Array.isArray(page?.revisions))return [];
 const rows=page.revisions.filter(r=>Number.isSafeInteger(r?.revid)&&typeof r.timestamp==="string").slice().sort((a,b)=>a.timestamp.localeCompare(b.timestamp)||a.revid-b.revid);
 const out=[];for(let i=1;i<rows.length;i++){const c=candidate(page,rows[i-1],rows[i],rows[i+1]);if(c)out.push(c);}return out;
}

function selfTest(){
 const old="Rapor hazırlandıktan sonra verilerin değerlendirilmesi işlemi yapılacaktır. Sonuçlar ayrı bir toplantıda ekip üyeleriyle paylaşılacaktır.";
 const newer="Rapor hazırlandıktan sonra veriler değerlendirilecektir. Sonuçlar ayrı bir toplantıda ekip üyeleriyle paylaşılacaktır.";
 const rev=(revid,parentid,content,timestamp="2016-05-01T10:00:00Z",tags=[])=>({revid,parentid,timestamp,tags,slots:{main:{contentmodel:"wikitext",content}}});
 const page={pageid:17,ns:0,title:"Sentetik test"};
 const a=rev(1,0,old),b=rev(2,1,newer),p={...page,revisions:[b,a]};
 const checks=[
 ["valid candidate",()=>collectPage(p).length===1],
 ["never auto approve",()=>collectPage(p)[0]?.status==="candidate_not_editor_verified"&&collectPage(p)[0]?.decision===null],
 ["source revision links",()=>collectPage(p)[0]?.source_url.endsWith("diff=2&oldid=1")],
 ["parent mismatch",()=>candidate(page,a,{...b,parentid:99})===null],
 ["post cutoff",()=>candidate(page,a,{...b,timestamp:"2018-01-01T00:00:00Z"})===null],
 ["invalid date",()=>candidate(page,a,{...b,timestamp:"2016-02-31T10:00:00Z"})===null],
 ["nonarticle",()=>candidate({...page,ns:1},a,b)===null],
 ["tagged undo",()=>candidate(page,a,{...b,tags:["mw-undo"]})===null],
 ["immediate revert",()=>candidate(page,a,b,rev(3,2,old))===null],
 ["numeric change",()=>candidate(page,rev(1,0,old+" 123 kişi."),rev(2,1,newer+" 124 kişi."))===null],
 ["markup change",()=>candidate(page,a,rev(2,1,newer+" [[Bağlantı]]"))===null],
 ["hidden content",()=>candidate(page,a,{...b,texthidden:true})===null],
 ["two edited paragraphs",()=>candidate(page,rev(1,0,old+"\n"+old),rev(2,1,newer+"\n"+newer))===null],
 ["large rewrite",()=>candidate(page,a,rev(2,1,"Yayınlanacak raporda bulunan bütün farklı bilgiler önceden açıklanan süreçlerde kullanılmıştır."))===null],
 ["unchanged text",()=>candidate(page,a,rev(2,1,old))===null],
 ["tags absent",()=>candidate(page,a,{...b,tags:undefined})===null],
 ["negative id",()=>candidate({...page,pageid:-1},a,b)===null]
 ];return checks.map(([name,fn])=>({name,pass:!!fn()}));
}

export { candidate, collectPage, selfTest };
