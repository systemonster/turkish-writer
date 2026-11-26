import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "skills/turkish-writer/scripts/unicode-denetle.py"

class UnicodeDenetimTest(unittest.TestCase):
    def test_source_is_unchanged(self):
        raw = "İstanbul, hâlâ, IŞIK. 👩‍💻\nDeneme\u200bmetni".encode("utf-8")
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "test.txt"
            path.write_bytes(raw)
            result = subprocess.run([sys.executable, str(SCRIPT), str(path)], capture_output=True, check=True)
            obj = json.loads(result.stdout)
            self.assertEqual(obj["mode"], "read-only")
            self.assertIn("unicode", obj)
            self.assertEqual(path.read_bytes(), raw)

    def test_stdin_and_invalid_utf8(self):
        result = subprocess.run([sys.executable, str(SCRIPT), "-"], input="Türkçe".encode(), capture_output=True, check=True)
        self.assertIn("unicode", json.loads(result.stdout))
        invalid = subprocess.run([sys.executable, str(SCRIPT), "-"], input=b"\xff", capture_output=True)
        self.assertEqual(invalid.returncode, 2)

    def test_clean_copy_transport_and_preservation(self):
        body = "İstanbul, hâlâ, IŞIK. 👩‍💻\u202f© Yazar.\n[Kaynak](https://example.org)\nAI desteği kullanıldı.  \n"
        raw = ("\ufeff" + body.replace("\n", "\r\n")).encode("utf-8")
        with tempfile.TemporaryDirectory() as d:
            src, out = Path(d) / "source.txt", Path(d) / "clean.txt"
            src.write_bytes(raw)
            p = subprocess.run([sys.executable, str(SCRIPT), str(src), "--temizle", "--out", str(out)], capture_output=True, check=True)
            r = json.loads(p.stdout)
            self.assertEqual(r["mode"], "clean-copy")
            self.assertTrue(r["changed"])
            self.assertEqual(r["repairs"]["crlf_normalized"], 3)
            self.assertTrue(r["repairs"]["leading_bom_removed"])
            self.assertEqual(out.read_bytes(), body.encode("utf-8"))
            self.assertEqual(src.read_bytes(), raw)
            self.assertEqual(r["output_sha256"], hashlib.sha256(out.read_bytes()).hexdigest())

    def test_confirmed_layout_repair_and_no_unapproved_changes(self):
        value = "Yanlış\u00a0boşluk. Satır\u00adsonu. Deneme\u200bmetni. 👩‍💻\u200f © Eser"
        raw = value.encode("utf-8")
        with tempfile.TemporaryDirectory() as d:
            src, out = Path(d) / "source.txt", Path(d) / "clean.txt"
            src.write_bytes(raw)
            inspect = subprocess.run([sys.executable, str(SCRIPT), str(src)], capture_output=True, check=True)
            digest = json.loads(inspect.stdout)["source_sha256"]
            p = subprocess.run([sys.executable, str(SCRIPT), str(src), "--temizle", "--out", str(out),
                                "--kaynak-sha256", digest, "--onayli-konum", str(value.index("\u00a0")),
                                "--onayli-konum", str(value.index("\u00ad"))], capture_output=True, check=True)
            self.assertEqual(out.read_text(encoding="utf-8"), value.replace("\u00a0", " ").replace("\u00ad", ""))
            self.assertEqual(len(json.loads(p.stdout)["repairs"]["approved_repairs"]), 2)
            self.assertEqual(src.read_bytes(), raw)

    def test_reject_unsupported_or_stale_positions(self):
        value = "👩‍💻\u00a0Türkçe"
        raw = value.encode("utf-8")
        with tempfile.TemporaryDirectory() as d:
            src, out = Path(d) / "source.txt", Path(d) / "clean.txt"
            src.write_bytes(raw)
            digest = hashlib.sha256(raw).hexdigest()
            base = [sys.executable, str(SCRIPT), str(src), "--temizle", "--out", str(out)]
            for args in [
                ["--kaynak-sha256", digest, "--onayli-konum", "1"],
                ["--kaynak-sha256", "0" * 64, "--onayli-konum", "3"],
                ["--kaynak-sha256", digest, "--onayli-konum", "3", "--onayli-konum", "3"],
                ["--onayli-konum", "3"],
            ]:
                self.assertNotEqual(subprocess.run(base + args, capture_output=True).returncode, 0)
                self.assertFalse(out.exists())

    def test_existing_output_and_source_not_overwritten(self):
        with tempfile.TemporaryDirectory() as d:
            src, out = Path(d) / "source.txt", Path(d) / "clean.txt"
            src.write_bytes(b"a\r\n")
            out.write_bytes(b"keep")
            for target in [out, src]:
                result = subprocess.run([sys.executable, str(SCRIPT), str(src), "--temizle", "--out", str(target)], capture_output=True)
                self.assertEqual(result.returncode, 2)
            self.assertEqual(src.read_bytes(), b"a\r\n")
            self.assertEqual(out.read_bytes(), b"keep")

    def test_clean_copy_of_good_text_is_byte_identical(self):
        raw = "İyi Türkçe. 👩‍💻\u200f © Yazar\nAI açıklaması.  \n".encode("utf-8")
        with tempfile.TemporaryDirectory() as d:
            out = Path(d) / "clean.txt"
            p = subprocess.run([sys.executable, str(SCRIPT), "-", "--temizle", "--out", str(out)],
                               input=raw, capture_output=True, check=True)
            self.assertFalse(json.loads(p.stdout)["changed"])
            self.assertEqual(out.read_bytes(), raw)

if __name__ == "__main__":
    unittest.main()
