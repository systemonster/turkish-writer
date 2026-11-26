#!/usr/bin/env python3
"""Optional VNLP adapter. No automatic rewriting or installation."""
import argparse
import json
from pathlib import Path
import sys

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("path")
    p.add_argument("--evaluate", action="store_true")
    args = p.parse_args()
    path = Path(args.path)
    if not path.is_file() or path.stat().st_size > 2 * 1024 * 1024:
        p.error("En çok 2 MiB düz dosya gerekli.")
    text = path.read_text(encoding="utf-8")
    try:
        from vnlp import DependencyParser, NamedEntityRecognizer, PoSTagger, SentenceSplitter
    except ImportError as exc:
        print(f"İsteğe bağlı VNLP kurulumu gerekli: {exc}", file=sys.stderr)
        return 2
    splitter = SentenceSplitter()
    pos = PoSTagger(evaluate=args.evaluate)
    dep = DependencyParser(evaluate=args.evaluate)
    ner = NamedEntityRecognizer(evaluate=args.evaluate)
    partial = False
    for sentence in splitter.split_sentences(text):
        try:
            result = {"sentence": sentence, "pos": pos.predict(sentence),
                      "dependencies": dep.predict(sentence), "entities": ner.predict(sentence)}
        except ValueError as exc:
            partial = True
            result = {"sentence": sentence, "error": str(exc)}
        print(json.dumps(result, ensure_ascii=False))
    return 1 if partial else 0

if __name__ == "__main__":
    raise SystemExit(main())
