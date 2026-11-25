import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / (name + '.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

web = load('sample-web')
stats = load('analyze-web')
cases = load('validate-editorial-cases')

class LabTest(unittest.TestCase):
    def setUp(self):
        self.approved = [{'url_prefix':'https://example.org/blog/', 'genre':'blog',
                          'rights':'test fixture', 'evidence':'synthetic approval'}]
        self.row = {'id':'1','metadata':{'url':'https://example.org/blog/one',
                    'date':'2017-03-15T00:00:00Z','language_score':.99,'fasttext_clean_score':.95},
                    'text':'Türkçe örnek bir cümle. '*100}

    def test_no_permission_no_sample(self):
        self.assertEqual(web.candidate(self.row, [])[1], 'unapproved_source')
        self.assertIsNone(web.permitted('https://example.org.evil/blog/one', self.approved))
        self.assertIsNone(web.permitted('https://example.org/blog-other/one', self.approved))

    def test_sample_provenance_and_duplicate(self):
        out = []
        report = web.sample([self.row, self.row], self.approved, 5, 2, 2, out.append)
        self.assertEqual(report['accepted'], 1)
        self.assertEqual(report['skipped']['duplicate'], 1)
        self.assertIsNone(out[0]['publication_date'])
        self.assertEqual(out[0]['status'], 'candidate_not_editor_verified')

    def test_review_required_for_stats(self):
        row, _ = web.candidate(self.row, self.approved)
        self.assertEqual(stats.summarize([row])['genres'], {})
        row.update(status='editor_verified', reviewer_id='fixture')
        result = stats.summarize([row, row])
        self.assertEqual(result['genres']['blog']['documents'], 1)
        self.assertEqual(result['skipped']['duplicate'], 1)

    def test_pair_guard(self):
        r = {'id':'e1','source_group':'site-a','source_url':'https://example.org/blog/one',
             'rights_evidence':'fixture','reviewer_id':'fixture','genre':'blog','status':'editor_verified',
             'decision':'edit','categories':['syntax'],'before':'30 gün sürer.','after':'Süre 30 gün.',
             'reason':'Sentetik test','protected':['30 gün']}
        self.assertTrue(cases.validate([r])['valid'])
        self.assertFalse(cases.validate([dict(r,after='Süre 20 gün.')])['valid'])
        self.assertFalse(cases.validate([r,dict(r,id='e2',source_group='site-b')])['valid'])
        self.assertEqual(cases.split_for('site-a'),cases.split_for('site-a'))

if __name__ == '__main__':
    unittest.main()
