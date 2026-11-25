import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]

def load(name, file):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'corpus-lab' / file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

prepare = load('prepare_v10', 'prepare-diagnostics-v10.py')
runner = load('runner_v10', 'run-diagnostics-v10.py')

class DiagnosticsV10Tests(unittest.TestCase):
    def test_reasoning_is_never_reported_as_final(self):
        self.assertEqual(runner.extract_final('<think>private draft', 'Qwen/Qwen3-32B'), ('', 'missing_thinking_terminator'))
        self.assertEqual(runner.extract_final('<think>private</think>Son metin<|im_end|>', 'Qwen/Qwen3-32B'), ('Son metin', None))
        self.assertEqual(runner.extract_final('analysis only', 'openai/gpt-oss-120b'), ('', 'missing_final_channel'))
        raw = 'analysis text<|end|><|start|>assistant<|channel|>final<|message|>Son metin<|return|>'
        self.assertEqual(runner.extract_final(raw, 'openai/gpt-oss-120b'), ('Son metin', None))

    def test_ablations_remove_exact_named_content(self):
        b = prepare.bundles()
        self.assertIn('4. **En küçük işe yarayan düzenleme.**', b['full']['prompt'])
        self.assertNotIn('4. **En küçük işe yarayan düzenleme.**', b['drop_core_minimal']['prompt'])
        self.assertIn('1. **Anlamı sabitle.**', b['drop_core_minimal']['prompt'])
        self.assertIn('## 2. Söyleyiş ve bilgi akışı', b['full']['prompt'])
        self.assertNotIn('## 2. Söyleyiş ve bilgi akışı', b['drop_guide_style']['prompt'])
        self.assertEqual(len({v['sha256'] for v in b.values()}), len(b))

    def test_fail_closed_if_ablation_heading_drifts(self):
        with self.assertRaises(ValueError):
            prepare.remove_section('# No expected section\n', '## Missing')

    def test_manifest_excludes_gold_and_resolves_dependencies(self):
        needed = ['longform-v10.jsonl', 'semantic-mutations-v10.jsonl', 'brief-pairs-v10.jsonl']
        if any(not (ROOT / 'corpus-lab' / f).exists() for f in needed):
            self.skipTest('Data authoring is not yet complete')
        m = prepare.build()
        ids = {t['id'] for t in m['tasks']}
        for t in m['tasks']:
            if t.get('depends_on'):
                self.assertIn(t['depends_on'], ids)
            if t['user']:
                payload = json.loads(t['user'])
                self.assertFalse({'gold', 'seeded_defects', 'decision', 'protected_facts'} & set(payload))
        self.assertFalse(m['human_validated'])
        self.assertFalse(m['independent_holdout'])
        groups = {t['kind'] for t in m['tasks']}
        self.assertTrue({'longform_edit', 'ablation', 'stability', 'semantic_choice', 'semantic_edit', 'brief_generation'} <= groups)

if __name__ == '__main__':
    unittest.main()
