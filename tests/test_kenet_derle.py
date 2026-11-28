import importlib.util
import pathlib
import tempfile
import unittest

path = pathlib.Path(__file__).resolve().parents[1] / "skills/turkish-writer/scripts/kenet-derle.py"
spec = importlib.util.spec_from_file_location("kenet_derle", path)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class KeNetIndexTest(unittest.TestCase):
    def test_nested_and_direct_literals_sense_separation(self):
        fixture = """<SYNSETS><SYNSET><ID>test-a</ID><SYNONYM><LITERAL>yüz<SENSE>1</SENSE></LITERAL><LITERAL>çehre<SENSE>1</SENSE></LITERAL></SYNONYM><POS>n</POS><DEF>Özgün test tanımı</DEF><EXAMPLE>Not included</EXAMPLE><SR>unrelated</SR></SYNSET><SYNSET><ID>test-b</ID><LITERAL>yüz<SENSE>2</SENSE></LITERAL><POS>n</POS><DEF>İkinci test anlamı</DEF></SYNSET></SYNSETS>"""
        with tempfile.TemporaryDirectory() as d:
            p=pathlib.Path(d)/"fixture.xml"
            p.write_text(fixture,encoding="utf-8")
            data=mod.read_index(p)
            self.assertEqual(data["entries"]["yüz"],["test-a","test-b"])
            self.assertEqual(data["senses"]["test-a"]["members"][1]["lemma"],"çehre")
            self.assertNotIn("EXAMPLE",str(data))
            self.assertNotIn("Not included",str(data))
            self.assertNotIn("unrelated",str(data))
            self.assertEqual(data["source"]["license"],"CC BY-SA 4.0")
            with self.assertRaises(ValueError):
                mod.checked_input(p)

    def test_existing_and_distribution_paths_rejected_before_read(self):
        with tempfile.TemporaryDirectory() as d:
            p=pathlib.Path(d)/"existing.json";p.write_text("keep")
            with self.assertRaises(FileExistsError):
                mod.write_index(pathlib.Path("/missing"),p)
            self.assertEqual(p.read_text(),"keep")
            with self.assertRaises(ValueError):
                mod.write_index(pathlib.Path("/missing"),path.parents[1]/"kenet-test.json")

if __name__ == "__main__":
    unittest.main()
