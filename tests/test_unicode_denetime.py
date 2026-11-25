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

if __name__ == "__main__":
    unittest.main()
