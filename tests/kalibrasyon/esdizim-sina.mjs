#!/usr/bin/env node
// Eş dizim denetiminin sınaması (SONUC-ESDIZIM.md'nin ham tabloları).
//   1. Bilinen çeviri eş dizimleri ve doğal denetim çiftleri: derlem ne diyor?
//   2. İnsan metinleri (LLM öncesi): yanlış pozitif oranı.
//   3. LLM metinleri: işaret oranı, AUC.
//   4. En sık işaretler.
//   5. Eşik taraması.
// Önce: node skills/turkish-writer/scripts/esdizim-derle.mjs
//   node tests/kalibrasyon/esdizim-sina.mjs [--tara]

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { esdizimDenetle, veriYukle, FIILLER, ESIK } from '../../skills/turkish-writer/scripts/esdizim.mjs'

const KOK = path.dirname(fileURLToPath(import.meta.url))
const v = veriYukle()
if (!v) {
  console.error('esdizim.json yok: önce esdizim-derle.mjs çalıştırın')
  process.exit(1)
}

// [isim, fiil (çekimli), eş dizim, beklenti]  hata: çeviri kalıbı, Türkçede
// yerleşik değil; dogal: yerleşik; ?: tartışmalı (yayılmış çeviri kalıbı ya da
// iki yöne de okunabilir). Beklenti derlem görülmeden yazıldı.
export const LISTE = [
  ['karar', 'yaptık', 'karar yapmak', 'hata'],
  ['aksiyon', 'aldık', 'aksiyon almak', 'hata'],
  ['dikkat', 'ödeyin', 'dikkat ödemek', 'hata'],
  ['fotoğraf', 'aldım', 'fotoğraf almak', 'hata'],
  ['para', 'yaptı', 'para yapmak', 'hata'],
  ['arkadaş', 'yaptım', 'arkadaş yapmak', 'hata'],
  ['sınav', 'aldım', 'sınav almak', 'hata'],
  ['kahvaltı', 'aldık', 'kahvaltı almak', 'hata'],
  ['anlam', 'yapıyor', 'anlam yapmak', 'hata'],
  ['ilerleme', 'yaptık', 'ilerleme yapmak', 'hata'],
  ['söz', 'yaptı', 'söz yapmak', 'hata'],
  ['toplantı', 'tuttuk', 'toplantı tutmak', 'hata'],
  ['ilgi', 'ödemedi', 'ilgi ödemek', 'hata'],
  ['adım', 'aldık', 'adım almak', 'hata'],
  ['ilişki', 'yaptı', 'ilişki yapmak', 'hata'],
  ['rüya', 'yaptım', 'rüya yapmak', 'hata'],
  ['kontrol', 'aldı', 'kontrol almak', 'hata'],
  ['başarı', 'yaptı', 'başarı yapmak', 'hata'],
  ['çözüm', 'sağlıyoruz', 'çözüm sağlamak', '?'],
  ['etki', 'yarattı', 'etki yaratmak', '?'],
  ['fark', 'yaratıyor', 'fark yaratmak', '?'],
  ['değer', 'katıyor', 'değer katmak', '?'],
  ['farkındalık', 'yaratmak', 'farkındalık yaratmak', '?'],
  ['şans', 'verin', 'şans vermek', '?'],
  ['duş', 'yaptım', 'duş yapmak', '?'],
  ['izlenim', 'yarattı', 'izlenim yaratmak', '?'],
  ['hizmet', 'sağlıyoruz', 'hizmet sağlamak', '?'],
  ['çözüm', 'sunuyoruz', 'çözüm sunmak', '?'],
  ['deneyim', 'yaşadım', 'deneyim yaşamak', '?'],
  ['yardım', 'yaptı', 'yardım yapmak', '?'],
  ['zaman', 'harcadım', 'zaman harcamak', 'dogal'],
  ['ders', 'veriyor', 'ders vermek', 'dogal'],
  ['rol', 'oynadı', 'rol oynamak', 'dogal'],
  ['soru', 'sordu', 'soru sormak', 'dogal'],
  ['hata', 'yaptım', 'hata yapmak', 'dogal'],
  ['karar', 'verdik', 'karar vermek', 'dogal'],
  ['karar', 'aldık', 'karar almak', 'dogal'],
  ['önlem', 'aldık', 'önlem almak', 'dogal'],
  ['risk', 'aldı', 'risk almak', 'dogal'],
  ['katkı', 'sağladı', 'katkı sağlamak', 'dogal'],
  ['yorum', 'yaptı', 'yorum yapmak', 'dogal'],
  ['destek', 'verdi', 'destek vermek', 'dogal'],
  ['iletişim', 'kurduk', 'iletişim kurmak', 'dogal'],
  ['performans', 'gösterdi', 'performans göstermek', 'dogal'],
  ['zaman', 'alıyor', 'zaman almak', 'dogal'],
  ['ders', 'aldım', 'ders almak', 'dogal'],
  ['sorumluluk', 'aldı', 'sorumluluk almak', 'dogal'],
  ['dikkat', 'edin', 'dikkat etmek', 'dogal'],
  ['fotoğraf', 'çektim', 'fotoğraf çekmek', 'dogal'],
  ['plan', 'yaptık', 'plan yapmak', 'dogal'],
  ['fark', 'etti', 'fark etmek', 'dogal'],
  ['fayda', 'sağlar', 'fayda sağlamak', 'dogal'],
  ['ödül', 'kazandı', 'ödül kazanmak', 'dogal'],
  ['duş', 'aldım', 'duş almak', 'dogal'],
  ['önem', 'veriyoruz', 'önem vermek', 'dogal'],
  ['araştırma', 'yaptı', 'araştırma yapmak', 'dogal'],
  ['mücadele', 'verdi', 'mücadele vermek', 'dogal'],
  ['fırsat', 'sunuyor', 'fırsat sunmak', 'dogal'],
]

const yuzde = (x) => (x * 100).toFixed(x < 0.01 ? 2 : 1).replace('.', ',')
const vir = (x, n = 2) => x.toFixed(n).replace('.', ',')
function ciftBilgi(isim, fiilAd) {
  const fi = FIILLER.findIndex((f) => f.m === fiilAd)
  const s = v.isimler.get(isim)
  if (!s) return { yok: true }
  const o = s.fiil.get(fi) || 0
  const e = s.toplam * v.fiilPay[fi]
  const ilk = [...s.fiil.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([j, c]) => `${FIILLER[j].m.replace(/m[ae]k$/, '')} %${Math.round((c / s.toplam) * 100)}`)
  return { o, e, oe: o / e, pay: o / s.toplam, toplam: s.toplam, siklik: s.siklik, ilk }
}

function pozitif(esik) {
  const satir = []
  for (const [isim, fiil, ifade, beklenti] of LISTE) {
    const lemma = ifade.split(' ')[1]
    const b = esdizimDenetle(`Geçen hafta ${isim} ${fiil}.`, { esik })
    const isaret = b.some((x) => x.fiil === lemma)
    satir.push({ isim, ifade, beklenti, isaret, bilgi: ciftBilgi(isim, lemma), oneri: b[0]?.oneriler || [] })
  }
  return satir
}

const oku = (d) => fs.readdirSync(d).filter((f) => f.endsWith('.txt')).map((f) => ({ ad: path.basename(path.dirname(path.dirname(d))) === 'kalibrasyon' ? path.relative(KOK, path.join(d, f)) : f, metin: fs.readFileSync(path.join(d, f), 'utf8') }))
const GRUPLAR = {
  insan: [path.join(KOK, 'derlem', 'insan'), path.join(KOK, 'derlem-site', 'insan')],
  llm: [path.join(KOK, 'derlem', 'llm'), path.join(KOK, 'derlem-site', 'llm'), path.join(KOK, 'derlem-site', 'llm-dogal')],
}
const metinler = Object.fromEntries(Object.entries(GRUPLAR).map(([g, ds]) => [g, ds.filter((d) => fs.existsSync(d)).flatMap(oku)]))
const kelimeSay = (t) => (t.match(/\S+/g) || []).length

function olc(esik) {
  const r = {}
  for (const [g, ms] of Object.entries(metinler)) {
    let isaret = 0
    let kelime = 0
    const oran = []
    const sik = new Map()
    let isaretli = 0
    for (const { metin } of ms) {
      const b = esdizimDenetle(metin, { esik })
      const n = kelimeSay(metin)
      isaret += b.length
      kelime += n
      if (b.length) isaretli++
      oran.push((b.length / n) * 100)
      for (const x of b) {
        const k = `${x.isim} + ${x.fiil}`
        const s = sik.get(k) || { n: 0, ornek: x.ifade, oneri: x.oneriler }
        s.n++
        sik.set(k, s)
      }
    }
    r[g] = { metin: ms.length, isaret, kelime, yuzKelime: (isaret / kelime) * 100, metinBasina: isaret / ms.length, isaretli, oran, sik }
  }
  // AUC = P(LLM oranı > insan oranı), eşitlik yarım
  let a = 0
  for (const l of r.llm.oran) for (const h of r.insan.oran) a += l > h ? 1 : l === h ? 0.5 : 0
  r.auc = a / (r.llm.oran.length * r.insan.oran.length)
  return r
}

function rapor() {
  const out = []
  out.push(`# Eş dizim sınaması, ham çıktı\n`)
  out.push(`Derlem: ${v.kaynak}; ${v.kelime.toLocaleString('tr-TR')} kelime, ${v.belge.toLocaleString('tr-TR')} belge; ${v.isimler.size.toLocaleString('tr-TR')} isim.`)
  out.push(`Eşikler: ${JSON.stringify(ESIK)}\n`)
  out.push('## 1. Pozitif ve denetim listesi\n')
  out.push('| çift | beklenti | isim toplamı | çift sıklığı | beklenen | O/E | pay | karar | ismin ilk fiilleri |')
  out.push('|---|---|---|---|---|---|---|---|---|')
  const p = pozitif()
  for (const s of p) {
    const b = s.bilgi
    out.push(b.yok
      ? `| ${s.ifade} | ${s.beklenti} | (isim yok) | | | | | ${s.isaret ? 'İŞARET' : 'geçti'} | |`
      : `| ${s.ifade} | ${s.beklenti} | ${b.toplam} | ${b.o} | ${Math.round(b.e)} | ${vir(b.oe)} | %${yuzde(b.pay)} | ${s.isaret ? '**İŞARET**' : 'geçti'} | ${b.ilk.join(', ')} |`)
  }
  const say = (bk, is) => p.filter((s) => s.beklenti === bk && s.isaret === is).length
  const top = (bk) => p.filter((s) => s.beklenti === bk).length
  out.push(`\nhata: ${say('hata', true)}/${top('hata')} yakalandı; ?: ${say('?', true)}/${top('?')} işaretlendi; dogal: ${say('dogal', true)}/${top('dogal')} yanlışlıkla işaretlendi.\n`)

  const r = olc()
  out.push('## 2-3. İnsan ve LLM metinleri\n')
  out.push('| grup | metin | kelime | işaret | 100 kelimede | metin başına | işaretli metin |')
  out.push('|---|---|---|---|---|---|---|')
  for (const g of ['insan', 'llm']) {
    const x = r[g]
    out.push(`| ${g} | ${x.metin} | ${x.kelime} | ${x.isaret} | ${vir(x.yuzKelime, 3)} | ${vir(x.metinBasina)} | ${x.isaretli} |`)
  }
  out.push(`\nAUC (LLM oranı > insan oranı): ${vir(r.auc, 3)}\n`)
  out.push('## 4. En sık işaretler\n')
  for (const g of ['insan', 'llm']) {
    out.push(`### ${g}\n`)
    out.push('| isim + fiil | sayı | örnek | öneri |')
    out.push('|---|---|---|---|')
    for (const [k, s] of [...r[g].sik.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 20)) {
      out.push(`| ${k} | ${s.n} | ${s.ornek} | ${s.oneri.map((o) => `${o.fiil} %${Math.round(o.pay * 100)}`).join(', ')} |`)
    }
    out.push('')
  }
  if (process.argv.includes('--tara')) {
    out.push('## 5. Eşik taraması\n')
    out.push('| ORAN | MIN_BEKLENEN | PAY | MIN_TOPLAM | hata yakalanan | dogal işaretli | ? işaretli | insan /100 k | LLM /100 k | AUC |')
    out.push('|---|---|---|---|---|---|---|---|---|---|')
    for (const ORAN of [0.05, 0.1, 0.15, 0.2])
      for (const MIN_BEKLENEN of [5, 8, 15, 30])
        for (const PAY of [0, 0.001])
          for (const MIN_TOPLAM of [50, 200]) {
            const esik = { ORAN, MIN_BEKLENEN, PAY, MIN_TOPLAM }
            const pp = pozitif(esik)
            const rr = olc(esik)
            const c = (bk) => pp.filter((s) => s.beklenti === bk && s.isaret).length
            out.push(`| ${ORAN} | ${MIN_BEKLENEN} | ${PAY} | ${MIN_TOPLAM} | ${c('hata')}/${top('hata')} | ${c('dogal')}/${top('dogal')} | ${c('?')}/${top('?')} | ${vir(rr.insan.yuzKelime, 3)} | ${vir(rr.llm.yuzKelime, 3)} | ${vir(rr.auc, 3)} |`)
          }
  }
  return out.join('\n')
}

const metin = rapor()
fs.writeFileSync(path.join(KOK, 'derlem-site', 'esdizim-ham.md'), metin)
console.log(metin)
