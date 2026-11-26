import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'skills/turkish-writer/scripts/tdk-sozluk.py'
if not SCRIPT.exists():
    SCRIPT = Path(__file__).with_name('tdk-sozluk.py')
spec = importlib.util.spec_from_file_location('tdk_sozluk', SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

def fixture(path):
    db = sqlite3.connect(path)
    db.executescript('''
    CREATE TABLE madde(madde_id INTEGER PRIMARY KEY,madde TEXT,kac INTEGER,lisan TEXT,telaffuz TEXT,taki TEXT,birlesikler TEXT,ozel_mi INTEGER,madde_duz TEXT);
    CREATE TABLE anlamlar(anlam_id INTEGER PRIMARY KEY,madde_id INTEGER,anlam_sira INTEGER,anlam TEXT,fiil INTEGER);
    CREATE TABLE anlam_ozellik(anlam_id INTEGER,ozellik_id INTEGER,ozellik_id2 INTEGER,tur INTEGER,sira INTEGER);
    CREATE TABLE ozellikler(ozellik_id INTEGER PRIMARY KEY,tam_adi TEXT,kisa_adi TEXT,tur INTEGER);
    CREATE TABLE ornekler(ornek_id INTEGER PRIMARY KEY,anlam_id INTEGER,ornek_sira INTEGER,ornek TEXT,yazar_id INTEGER,yazar_vd TEXT);
    CREATE TABLE yazarlar(yazar_id INTEGER PRIMARY KEY,tam_adi TEXT);
    INSERT INTO madde VALUES(1,'yüz',1,NULL,NULL,NULL,NULL,0,'yuz'),(2,'yüz',2,NULL,NULL,NULL,NULL,0,'yuz'),(3,'yuz',0,NULL,NULL,NULL,NULL,0,'yuz'),(4,'hâlâ',0,NULL,NULL,NULL,NULL,0,'hala'),(5,'hala',0,NULL,NULL,NULL,NULL,0,'hala'),(6,'ışık',0,NULL,NULL,NULL,NULL,0,'isik'),(7,'İzmir',0,NULL,NULL,NULL,NULL,1,'Izmir');
    INSERT INTO anlamlar VALUES(10,1,1,'Özgün test tanımı A',0),(11,2,1,'Özgün test tanımı B',0),(12,4,1,'Özgün test tanımı C',0),(13,5,1,'Özgün test tanımı D',0);
    INSERT INTO ozellikler VALUES(1,'Özgün etiket','et.',1);
    INSERT INTO anlam_ozellik VALUES(10,1,999,1,1);
    INSERT INTO yazarlar VALUES(1,'Test Yazarı');
    INSERT INTO ornekler VALUES(1,10,1,'Özgün örnek A',1,''),(2,10,2,'Özgün örnek B',999,''),(3,10,3,'Özgün örnek C',NULL,'');
    ''')
    db.commit(); db.close()

class TDKLocalTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.db = self.root / 'source.sqlite'
        fixture(self.db)
        self.digest = hashlib.sha256(self.db.read_bytes()).hexdigest()

    def tearDown(self):
        self.tmp.cleanup()

    def test_exact_senses_and_turkish_spelling(self):
        data = mod.run(self.db, ['YÜZ','yuz','hâlâ','hala','IŞIK','İZMİR'])
        rows = data['results']
        self.assertEqual([len(x['maddeler']) for x in rows], [2,1,1,1,1,1])
        self.assertEqual([m['anlamlar'][0]['anlam_id'] for m in rows[0]['maddeler']], [10,11])
        self.assertEqual(rows[2]['maddeler'][0]['madde'], 'hâlâ')
        self.assertEqual(rows[4]['maddeler'][0]['madde'], 'ışık')
        self.assertEqual(hashlib.sha256(self.db.read_bytes()).hexdigest(), self.digest)

    def test_optional_examples_attribution_and_missing_relationships(self):
        bare = mod.run(self.db,['yüz'])['results'][0]['maddeler'][0]['anlamlar'][0]
        self.assertNotIn('ornekler',bare)
        self.assertEqual(bare['ornek_sayisi'],3)
        full = mod.run(self.db,['yüz'],examples=True)['results'][0]['maddeler'][0]['anlamlar'][0]
        self.assertEqual(len(full['ornekler']),2)
        self.assertEqual(full['ornekler'][0]['yazar'],'Test Yazarı')
        self.assertIsNone(full['ornekler'][1]['yazar'])
        self.assertIsNone(full['ozellikler'][0]['ikinci_etiket'])

    def test_apks_and_apk_direct_read(self):
        apk = self.root / 'source.apk'
        with zipfile.ZipFile(apk,'w') as z:
            z.write(self.db,mod.DB_ENTRY)
        apks = self.root / 'source.apks'
        with zipfile.ZipFile(apks,'w') as z:
            z.write(apk,'base.apk')
        for p in [apk,apks]:
            before = hashlib.sha256(p.read_bytes()).hexdigest()
            data=mod.run(p,['yüz'])
            self.assertEqual(data['source']['database_sha256'], self.digest)
            self.assertEqual(len(data['results'][0]['maddeler']),2)
            self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),before)
        self.assertEqual(mod.run(apks,[],info=True)['quick_check'],'ok')

    def test_bad_schema_parameter_bound_and_missing(self):
        with self.assertRaises(ValueError): mod.run(self.db,['yüz']*9)
        self.assertEqual(mod.run(self.db,["yüz' OR 1=1 --"])['results'][0]['durum'],'not-found')
        self.assertEqual(mod.run(self.db,['olmayan madde'])['results'][0]['durum'],'not-found')
        bad=self.root/'bad.db'; sqlite3.connect(bad).close()
        with self.assertRaises(ValueError): mod.run(bad,['yüz'])
        with self.assertRaises(FileNotFoundError): mod.run(self.root/'missing.db',['yüz'])

    def test_reject_duplicate_archive_members(self):
        import warnings
        apk=self.root/'duplicate.apk'
        with warnings.catch_warnings(),zipfile.ZipFile(apk,'w') as z:
            warnings.simplefilter('ignore',UserWarning)
            z.write(self.db,mod.DB_ENTRY);z.write(self.db,mod.DB_ENTRY)
        with self.assertRaises(ValueError): mod.run(apk,['yüz'])

if __name__=='__main__': unittest.main()
