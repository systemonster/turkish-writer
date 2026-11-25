import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeConllu} from '../analyze-conllu.mjs';
const input="# sent_id = ess_1\n# text = Karar verdik.\n1\tKarar\tkarar\tNOUN\t_\tCase=Nom\t2\tobj\t_\t_\n2\tverdik\tver\tVERB\t_\tVerbForm=Fin\t0\troot\t_\t_\n3\t.\t.\tPUNCT\t_\t_\t2\tpunct\t_\t_\n\n# sent_id = ess_2\n# text = Geldi Ali.\n1\tGeldi\tgel\tVERB\t_\tVerbForm=Fin\t0\troot\t_\t_\n2\tAli\tAli\tPROPN\t_\tCase=Nom\t1\tnsubj\t_\t_\n3\t.\t.\tPUNCT\t_\t_\t1\tpunct\t_\t_\n";
test('explicit noun dependencies and word counts',()=>{
  const a=analyzeConllu(input);
  assert.equal(a.sentences,2);
  assert.equal(a.groups.all.words,4);
  assert.equal(a.groups.all.objects.before,1);
  assert.equal(a.groups.all.subjects.after,1);
  assert.equal(a.groups.all.verbalRootsWithNominalSubject,1);
  assert.equal(a.groups.ess.sentences,2);
});
test('malformed relation is not accepted',()=>{
  assert.equal(analyzeConllu(input.replace('2\tobj','99\tobj')).malformed,1);
});
test('recurring lemma tuples use an actual count threshold',()=>{
  const a=analyzeConllu(Array.from({length:5},()=>input).join('\n'));
  assert.equal(a.frequentPairs[0].noun,'karar');
  assert.equal(a.frequentPairs[0].count,5);
});
