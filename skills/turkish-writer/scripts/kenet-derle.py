#!/usr/bin/env python3
"""Build a local, separately licensed KeNet sense index; no upstream code is imported."""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import tempfile
import urllib.request
import xml.etree.ElementTree as ET

REV = "09ebb811b08eedaedc4abb9cfde2d08eadfe71e4"
BLOB = "2cdf2a59e524764cfe2c11a03fa9623495df21bb"
SIZE = 31285446
URL = f"https://raw.githubusercontent.com/StarlangSoftware/TurkishWordNet-Py/{REV}/WordNet/data/turkish_wordnet.xml"
LICENSE = "https://creativecommons.org/licenses/by-sa/4.0/"
DEFAULT = Path.home() / ".cache" / "turkish-writer" / f"kenet-{REV}.json"

def lower_tr(value):
    return value.strip().replace("I", "ı").replace("İ", "i").lower()

def read_index(xml_path):
    senses, entries = {}, {}
    for event, node in ET.iterparse(xml_path, events=("end",)):
        if node.tag != "SYNSET":
            continue
        ident = (node.findtext("ID") or "").strip()
        pos = (node.findtext("POS") or "").strip()
        if not ident or ident in senses:
            raise ValueError("Missing or duplicate synset identifier")
        members = []
        seen = set()
        # Both the documented direct LITERAL and nested SYNONYM layout are supported.
        for literal in node.findall("LITERAL") + node.findall("./SYNONYM/LITERAL"):
            lemma = (literal.text or "").strip()
            number = (literal.findtext("SENSE") or "").strip()
            if not lemma or len(lemma) > 200:
                continue
            key = (lower_tr(lemma), number)
            if key in seen:
                continue
            seen.add(key)
            members.append({"lemma": lemma, "sense": number})
        if members:
            # Definitions for sense selection only. Examples, interlingual and
            # other semantic relations are deliberately not synonym candidates.
            gloss = (node.findtext("DEF") or "").strip()
            senses[ident] = {"pos": pos, "gloss": gloss, "members": members}
            for key in {lower_tr(m["lemma"]) for m in members}:
                entries.setdefault(key, []).append(ident)
        node.clear()
    if not senses or not entries:
        raise ValueError("No synsets read; upstream layout may have changed")
    return {"schema": 1, "source": {
        "name": "Turkish WordNet / KeNet",
        "authors": "StarlangSoftware, Olcay Taner Yıldız and KeNet contributors",
        "revision": REV, "blob": BLOB, "url": URL,
        "license": "CC BY-SA 4.0", "license_url": LICENSE,
        "changes": "Local index of synset IDs, lemmas, sense numbers, POS and definitions; examples and relations omitted."
    }, "senses": senses, "entries": entries}

def checked_input(path):
    raw = path.read_bytes()
    if len(raw) != SIZE or hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest() != BLOB:
        raise ValueError("Pinned KeNet Git blob/size mismatch; use the documented revision")
    # Do not parse a different XML input or any entity declarations.
    if b"<!DOCTYPE" in raw.upper() or b"<!ENTITY" in raw.upper():
        raise ValueError("Unexpected XML declarations")
    return hashlib.sha256(raw).hexdigest()

def write_index(src, out):
    if out.exists():
        raise FileExistsError("Output exists; choose a new path")
    digest = checked_input(src)
    index = read_index(src)
    index["source"]["sha256"] = digest
    out.parent.mkdir(parents=True, exist_ok=True)
    # Keep local derived data separate from the MIT skill distribution.
    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=out.parent, delete=False) as fp:
        tmp = Path(fp.name)
        try:
            json.dump(index, fp, ensure_ascii=False, separators=(",", ":"))
        except BaseException:
            tmp.unlink(missing_ok=True)
            raise
    try:
        # Exclusive destination creation, without overwriting any existing file.
        with out.open("xb") as dest, tmp.open("rb") as source:
            import shutil
            shutil.copyfileobj(source, dest)
    finally:
        tmp.unlink(missing_ok=True)
    return {"synsets": len(index["senses"]), "lemmas": len(index["entries"]),
            "source_sha256": digest, "output": str(out), "license": "CC BY-SA 4.0"}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--xml", type=Path, help="Local XML from the pinned revision")
    source.add_argument("--indir", action="store_true", help="Explicitly download pinned CC BY-SA data (31 MB)")
    parser.add_argument("--out", type=Path, default=DEFAULT)
    args = parser.parse_args()
    if args.xml:
        result = write_index(args.xml, args.out)
    else:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "kenet.xml"
            request = urllib.request.Request(URL, headers={"User-Agent": "TurkishWriterLexicon/1.0"})
            with urllib.request.urlopen(request, timeout=60) as response, path.open("wb") as out:
                data = response.read(SIZE + 1)
                out.write(data)
            result = write_index(path, args.out)
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()
