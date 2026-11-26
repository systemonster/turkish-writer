#!/usr/bin/env python3
"""Bounded, offline, read-only lookup in a user-supplied Turkish dictionary snapshot."""
from __future__ import annotations
import argparse
from contextlib import contextmanager
import hashlib
import io
import json
import os
from pathlib import Path
import sqlite3
import sys
import tempfile
import unicodedata
import zipfile

MAX_SOURCE = 150 * 1024 * 1024
MAX_DB = 80 * 1024 * 1024
MAX_TERMS = 8
MAX_ENTRIES = 32
MAX_SENSES = 100
DB_ENTRY = 'res/raw/assets_testdb.db'
REQUIRED = {
    'madde': 'madde_id madde kac lisan telaffuz taki birlesikler ozel_mi',
    'anlamlar': 'anlam_id madde_id anlam_sira anlam fiil',
    'anlam_ozellik': 'anlam_id ozellik_id ozellik_id2 tur sira',
    'ozellikler': 'ozellik_id tam_adi kisa_adi tur',
    'ornekler': 'ornek_id anlam_id ornek_sira ornek yazar_id yazar_vd',
    'yazarlar': 'yazar_id tam_adi',
}

def tr(value):
    return unicodedata.normalize('NFC', str(value or '')).replace('I', 'ı').replace('İ', 'i').lower().strip()

def sha_file(path):
    with path.open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest() if hasattr(hashlib, 'file_digest') else hashlib.sha256(f.read()).hexdigest()

def member(archive, name, limit):
    hits = [x for x in archive.infolist() if x.filename == name]
    if len(hits) != 1 or hits[0].is_dir() or hits[0].flag_bits & 1 or not 0 < hits[0].file_size <= limit:
        raise ValueError('Beklenen açık paket öğesi yok, tekrarlı, şifreli veya boyut sınırı dışında: ' + name)
    with archive.open(hits[0]) as stream:
        data = stream.read(limit + 1)
    if len(data) != hits[0].file_size or len(data) > limit:
        raise ValueError('Paket öğesinin boyutu eşleşmiyor')
    return data

@contextmanager
def source_db(path):
    path = Path(path).expanduser().resolve(strict=True)
    if not path.is_file() or not 0 < path.stat().st_size <= MAX_SOURCE:
        raise ValueError('Yerel, sınırlı boyutta bir kaynak dosya gerekli')
    suffix = path.suffix.lower()
    if suffix in ('.db', '.sqlite', '.sqlite3'):
        if path.stat().st_size > MAX_DB:
            raise ValueError('SQLite boyut sınırı aşıldı')
        if Path(str(path) + '-wal').exists() or Path(str(path) + '-journal').exists():
            raise ValueError('Canlı veritabanı değil, kapalı ve tutarlı bir SQLite kopyası kullanın')
        yield path, {'kind': 'sqlite', 'database_sha256': sha_file(path)}
    elif suffix in ('.apk', '.apks'):
        # Read named archive members only; do not extract any paths or execute an APK.
        with zipfile.ZipFile(path) as outer:
            if suffix == '.apks':
                with zipfile.ZipFile(io.BytesIO(member(outer, 'base.apk', MAX_SOURCE))) as apk:
                    raw = member(apk, DB_ENTRY, MAX_DB)
            else:
                raw = member(outer, DB_ENTRY, MAX_DB)
        with tempfile.TemporaryDirectory(prefix='tw-tdk-') as d:
            db = Path(d) / 'snapshot.sqlite'
            db.write_bytes(raw)
            yield db, {'kind': suffix[1:], 'package_sha256': sha_file(path),
                       'database_sha256': hashlib.sha256(raw).hexdigest()}
    else:
        raise ValueError('Desteklenen kaynak: .db, .sqlite, .sqlite3, .apk veya .apks')

@contextmanager
def connect(path):
    with path.open('rb') as f:
        if f.read(16) != b'SQLite format 3\x00':
            raise ValueError('SQLite başlığı geçersiz')
    db = sqlite3.connect(path.as_uri() + '?mode=ro&immutable=1', uri=True)
    try:
        db.row_factory = sqlite3.Row
        db.execute('PRAGMA query_only=ON')
        db.execute('PRAGMA trusted_schema=OFF')
        db.create_function('tw_tr', 1, tr, deterministic=True)
        tables = {r['name']: r['type'] for r in db.execute('SELECT name,type FROM sqlite_master')}
        for table, columns in REQUIRED.items():
            if tables.get(table) != 'table':
                raise ValueError('Beklenen tablo bulunamadı: ' + table)
            actual = {r['name'] for r in db.execute('PRAGMA table_info(' + table + ')')}
            if not set(columns.split()) <= actual:
                raise ValueError('Beklenen şema değişmiş: ' + table)
        yield db
    finally:
        db.close()

def lookup(db, terms, examples=False):
    if not 1 <= len(terms) <= MAX_TERMS or any(not 1 <= len(tr(x)) <= 100 or not any(c.isalpha() for c in x) or any(ord(c) < 32 for c in x) for x in terms):
        raise ValueError('1–8 açık madde başı girin; her biri en çok 100 karakter')
    results = []
    for term in terms:
        # Preserve Turkish spelling and diacritics. Do not search madde_duz or guess a stem.
        rows = db.execute('SELECT madde_id,madde,kac,lisan,telaffuz,taki,birlesikler,ozel_mi FROM madde WHERE tw_tr(madde)=? ORDER BY kac,madde_id LIMIT ?', (tr(term), MAX_ENTRIES + 1)).fetchall()
        if len(rows) > MAX_ENTRIES:
            raise ValueError('Madde başı eşleşme sınırı aşıldı')
        entries = []
        for row in rows:
            entry = dict(row)
            senses = db.execute('SELECT anlam_id,anlam_sira,anlam,fiil FROM anlamlar WHERE madde_id=? ORDER BY anlam_sira,anlam_id LIMIT ?', (row['madde_id'], MAX_SENSES + 1)).fetchall()
            if len(senses) > MAX_SENSES:
                raise ValueError('Anlam sınırı aşıldı')
            entry['anlamlar'] = []
            for sense in senses:
                item = dict(sense)
                sid = sense['anlam_id']
                item['ozellikler'] = [dict(r) for r in db.execute('''SELECT a.ozellik_id,o.tam_adi,o.kisa_adi,o.tur AS ozellik_turu,a.tur AS iliski_turu,a.ozellik_id2,o2.tam_adi AS ikinci_etiket
                    FROM anlam_ozellik a LEFT JOIN ozellikler o ON a.ozellik_id=o.ozellik_id
                    LEFT JOIN ozellikler o2 ON a.ozellik_id2=o2.ozellik_id
                    WHERE a.anlam_id=? ORDER BY a.sira,a.ozellik_id LIMIT 40''', (sid,))]
                item['ornek_sayisi'] = db.execute('SELECT count(*) FROM ornekler WHERE anlam_id=?', (sid,)).fetchone()[0]
                if examples:
                    item['ornekler'] = [dict(r) for r in db.execute('''SELECT o.ornek_id,o.ornek,o.yazar_id,y.tam_adi AS yazar,o.yazar_vd
                        FROM ornekler o LEFT JOIN yazarlar y ON o.yazar_id=y.yazar_id
                        WHERE o.anlam_id=? ORDER BY o.ornek_sira,o.ornek_id LIMIT 2''', (sid,))]
                entry['anlamlar'].append(item)
            entries.append(entry)
        results.append({'kelime': term, 'durum': 'found' if entries else 'not-found', 'maddeler': entries})
    return results

def run(path, terms, examples=False, info=False):
    with source_db(path) as (file, meta), connect(file) as db:
        meta.update({'name': 'TDK Güncel Türkçe Sözlük — kullanıcı tarafından sağlanan yerel kopya',
                     'authenticity': 'not-independently-verified', 'mode': 'read-only',
                     'source_url': 'https://sozluk.gov.tr/', 'redistribution': 'not-included'})
        result = {'schema': 1, 'source': meta,
                  'note': 'Sözlük kayıtları bağlamsal eş anlamlılık onayı değildir. Eksik etiket/yazar alanı bilinmiyor olarak kalır. Sözlükte olmaması yazım hatası kanıtı değildir.'}
        if info:
            result['counts'] = {t: db.execute('SELECT count(*) FROM ' + t).fetchone()[0] for t in REQUIRED}
            result['quick_check'] = db.execute('PRAGMA quick_check').fetchone()[0]
        else:
            result['results'] = lookup(db, terms, examples)
        return result

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--kaynak', default=os.environ.get('TW_TDK_KAYNAK'))
    p.add_argument('--kelime', action='append', default=[])
    p.add_argument('--ornek', action='store_true', help='En çok iki kaynak örneği/anlam; yazar kaydı korunur')
    p.add_argument('--bilgi', action='store_true', help='Yalnız tablo sayıları ve bütünlük denetimi')
    a = p.parse_args()
    if not a.kaynak or (a.bilgi and a.kelime) or (not a.bilgi and not a.kelime):
        p.error('Yerel --kaynak (veya TW_TDK_KAYNAK) ve --kelime ya da --bilgi gerekli')
    try:
        print(json.dumps(run(a.kaynak, a.kelime, a.ornek, a.bilgi), ensure_ascii=False))
    except (OSError, ValueError, sqlite3.Error, zipfile.BadZipFile) as e:
        print(str(e), file=sys.stderr)
        return 2
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
