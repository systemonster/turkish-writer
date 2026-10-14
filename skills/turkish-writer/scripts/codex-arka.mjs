// Codex arka ucu: istem OpenAI API yerine `codex exec` (ChatGPT/Codex aboneliği, API anahtarı ve ücret yok) ile gider.
// Elle yapılan işte (ölçüm, taslak, hakem) bu yol kullanılır; otomasyonlar (günlük blog, ilan hattı) API'de kalır.
// Açma: TW_SAGLAYICI=codex ortam değişkeni ya da openai-taslak.mjs / hakem-dongusu.mjs'e `--codex` bayrağı.
// Ayarlar: TW_CODEX_PARALEL (aynı süreçte en çok eşzamanlı çağrı, varsayılan 4), TW_CODEX_EFFORT (low|medium|high,
// varsayılan low). Model `-m` ile verilir (abonelikte olmayan modelde çağrı hata verir).
// Sınır (429/usage limit) çıkarsa bekleyip yeniden dener; API'ye dönmez. Kişisel veri ve sır bu yola da gönderilmez.
import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const codexAcik = () => process.env.TW_SAGLAYICI === 'codex';
export const codexAc = () => { process.env.TW_SAGLAYICI = 'codex'; };

const SINIR = /usage limit|rate limit|429|too many requests|try again in/i;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

let aktif = 0;
const kuyruk = [];
async function yer() {
  const sinir = Math.max(1, Number(process.env.TW_CODEX_PARALEL) || 4);
  if (aktif >= sinir) await new Promise((r) => kuyruk.push(r));
  aktif++;
}
function birak() { aktif--; kuyruk.shift()?.(); }

const GIRIS = 'Bu bir metin işleme görevidir. Araç kullanma, dosya okuma, komut çalıştırma, web arama yok. Yalnız <girdi> bölümündeki işi <talimat>a göre yap ve yalnız istenen çıktıyı yaz; ön söz, açıklama ya da kod çiti ekleme.';

export function codexIstemi({ sistem, kullanici }) {
  return `${GIRIS}\n\n<talimat>\n${sistem || ''}\n</talimat>\n\n<girdi>\n${kullanici}\n</girdi>\n`;
}

/** Tek `codex exec` çağrısı; son mesajın metnini döndürür. */
export async function codexSor({ sistem, kullanici, model, effort = process.env.TW_CODEX_EFFORT || 'low', zaman = 360000, deneme = 6 }) {
  const dizin = mkdtempSync(join(tmpdir(), 'tw-codex-'));
  const cikti = join(dizin, 'son.txt');
  const girdi = codexIstemi({ sistem, kullanici });
  const args = ['exec', '-s', 'read-only', '--skip-git-repo-check', '--ephemeral', '-C', dizin, '-c', `model_reasoning_effort=${effort}`, '-o', cikti, ...(model ? ['-m', model] : []), '-'];
  await yer();
  try {
    for (let d = 1; d <= deneme; d++) {
      const sonuc = await new Promise((coz) => {
        const p = execFile(process.platform === 'win32' ? 'codex.cmd' : 'codex', args, { timeout: zaman, maxBuffer: 1 << 24, shell: process.platform === 'win32', windowsHide: true }, (e, _o, err) => coz({ e, err: String(err || '') }));
        p.stdin.end(girdi);
      });
      let metin = '';
      try { metin = readFileSync(cikti, 'utf8').trim(); } catch { /* çıktı yazılmadı */ }
      if (!sonuc.e && metin) return metin;
      const sinir = SINIR.test(sonuc.err);
      if (d === deneme) throw new Error(`codex exec başarısız${sinir ? ' (abonelik sınırı)' : ''}: ${sonuc.err.split('\n').filter((l) => /error|ERROR/.test(l) && !/rmcp|mcp/i.test(l)).slice(-2).join(' | ').slice(0, 240) || (sonuc.e?.message || 'boş çıktı').slice(0, 160)}`);
      await bekle(sinir ? 60000 * d : 4000 * d);
    }
  } finally {
    birak();
    try { rmSync(dizin, { recursive: true, force: true }); } catch { /* geçici dizin */ }
  }
}

/** Metinden ilk JSON nesnesini ayıklar (çit ve ön/son metin atılır). */
export function jsonAyikla(metin) {
  const s = String(metin || '').replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a === -1 || b <= a) throw new Error('codex cevabında JSON bulunamadı');
  return JSON.parse(s.slice(a, b + 1));
}
