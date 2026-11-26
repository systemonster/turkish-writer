#!/usr/bin/env python3
"""Inspect UTF-8 text and optionally repair verified paste/transport defects in a copy."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import sys

VENDOR = Path(__file__).resolve().parent / "vendor" / "watermarks-remover"
sys.path.insert(0, str(VENDOR))
from text_unicode import clean_text, inspect_text

MAX_BYTES = 4 * 1024 * 1024
# Only ordinary spacing/layout artifacts individually confirmed by the editor.
# This is not a general carrier/mark removal allowlist.
REVIEWABLE = {"\u00a0": " ", "\u202f": " ", "\u00ad": "", "\u200b": ""}

def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()

def audit(value: str) -> dict:
    report = inspect_text(value).to_dict()
    # The upstream report describes capabilities outside this integration.
    report["notes"] = [
        "Yerel Unicode ve biçim denetimi; bulgu tek başına hata veya yazarlık kanıtı değildir.",
        "Anlamlı Unicode, açıklamalar, atıflar ve kaynak bilgileri korunur.",
        "İstatistiksel watermark, medya ve yazarlık tespiti bu aracın kapsamı dışındadır.",
    ]
    return report

def clean_copy(value: str, positions: list[int]) -> tuple[str, dict]:
    if len(set(positions)) != len(positions):
        raise ValueError("Aynı konum birden fazla kez onaylanamaz.")
    approved = {}
    for i in sorted(positions):
        if not 0 <= i < len(value) or value[i] not in REVIEWABLE:
            raise ValueError(f"Onaylı konum {i}: desteklenen olağan biçim kusuru değil.")
        # Use the vendored normalizer only for this specifically approved
        # character, never for the entire document or a provenance marker.
        ch = value[i]
        replacement, _ = clean_text(
            ch, nfkc=False, aggressive_homoglyphs=False,
            normalize_spaces=True, strip_emoji_glue=False, strip_bidi=False,
        )
        if replacement != REVIEWABLE[ch]:
            raise ValueError("Beklenmeyen upstream dönüşümü; dosya oluşturulmadı.")
        approved[i] = replacement
    leading_bom = value.startswith("\ufeff")
    # Remove the encoding signature only at the original start of the file.
    # A FEFF elsewhere, emoji glue, bidi, tags and all other text stay intact.
    result = "".join(approved.get(i, ch) for i, ch in enumerate(value)
                     if not (i == 0 and leading_bom))
    crlf = result.count("\r\n")
    result = result.replace("\r\n", "\n")
    return result, {
        "leading_bom_removed": leading_bom,
        "crlf_normalized": crlf,
        "approved_repairs": [
            {"offset": i, "codepoint": f"U+{ord(value[i]):04X}",
             "action": "space" if approved[i] else "remove_layout_artifact"}
            for i in sorted(approved)
        ],
    }

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", nargs="?", default="-")
    parser.add_argument("--temizle", action="store_true",
                        help="Onaylanmış biçim kusurlarını yeni bir UTF-8 dosyasında düzelt.")
    parser.add_argument("--out", type=Path, help="Yeni çıktı dosyası; üzerine yazılmaz.")
    parser.add_argument("--onayli-konum", action="append", type=int, default=[],
                        help="Elle doğrulanmış biçim kusurunun özgün metindeki 0 tabanlı karakter konumu.")
    parser.add_argument("--kaynak-sha256",
                        help="Konumların denetlendiği kaynak baytlarının SHA-256 değeri.")
    args = parser.parse_args()
    if args.temizle != bool(args.out):
        parser.error("--temizle ve --out birlikte kullanılmalı.")
    if args.onayli_konum and (not args.temizle or not args.kaynak_sha256):
        parser.error("Konum düzeltmesi için --temizle ve --kaynak-sha256 gerekli.")
    if args.kaynak_sha256 and not args.temizle:
        parser.error("--kaynak-sha256 yalnız temizleme kipinde kullanılır.")
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
        digest = sha(raw)
        if args.kaynak_sha256 and args.kaynak_sha256 != digest:
            raise ValueError("Kaynak SHA-256 eşleşmiyor; konumlar yeniden incelenmeli.")
        before = audit(value)
        if not args.temizle:
            result = {"mode": "read-only", "source_sha256": digest, "unicode": before}
        else:
            cleaned, repairs = clean_copy(value, args.onayli_konum)
            data = cleaned.encode("utf-8")
            # Exclusive creation: never overwrite an existing file, source, or symlink.
            after = audit(cleaned)
            with args.out.open("xb") as f:
                f.write(data)
            result = {
                "mode": "clean-copy", "source_sha256": digest, "output_sha256": sha(data),
                "changed": raw != data, "repairs": repairs, "unicode_before": before,
                "unicode_after": after,
            }
    except (OSError, ValueError) as exc:
        print(str(exc), file=sys.stderr)
        return 2
    print(json.dumps(result, ensure_ascii=False))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
