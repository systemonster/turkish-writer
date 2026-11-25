#!/usr/bin/env python3
"""Read-only Unicode hygiene audit of UTF-8 plain text."""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import sys

VENDOR = Path(__file__).resolve().parent / "vendor" / "watermarks-remover"
sys.path.insert(0, str(VENDOR))
from text_unicode import inspect_text

MAX_BYTES = 4 * 1024 * 1024

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", nargs="?", default="-")
    args = parser.parse_args()
    try:
        if args.path == "-":
            raw = sys.stdin.buffer.read(MAX_BYTES + 1)
        else:
            path = Path(args.path)
            if not path.is_file():
                raise ValueError("Düz, okunabilir dosya gerekli.")
            with path.open("rb") as f:
                raw = f.read(MAX_BYTES + 1)
        if len(raw) > MAX_BYTES or b"\x00" in raw:
            raise ValueError("En çok 4 MiB UTF-8 düz metin gerekli.")
        value = raw.decode("utf-8", errors="strict")
    except (OSError, ValueError) as exc:
        print(str(exc), file=sys.stderr)
        return 2
    report = inspect_text(value).to_dict()
    print(json.dumps({"mode": "read-only", "unicode": report}, ensure_ascii=False))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
