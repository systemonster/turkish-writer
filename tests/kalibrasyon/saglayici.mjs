// Kalibrasyon betiklerinin ortak koruması (kurucu kararı K-0166: otomasyon olmayan iş API'yle yapılmaz).
// Bu dosya her kalibrasyon betiğinin İLK import'udur. `--api` bayrağı açıkça verilmedikçe bütün model çağrıları
// `codex exec` (abonelik) yolundan gider; API'ye hiçbir istek ve API anahtarı okuması olmaz. `--api` verilirse bayrak
// argv'den çıkarılır ve API yolu kullanılır (yalnız kurucu onayıyla; gerekçesi komut satırında görünür).
import { codexAc } from '../../skills/turkish-writer/scripts/codex-arka.mjs';

const i = process.argv.indexOf('--api');
if (i > -1) {
  process.argv.splice(i, 1);
  delete process.env.TW_SAGLAYICI;
  console.error('UYARI: --api verildi, OpenAI API kullanılacak (elle yapılan işte yalnız kurucu onayıyla).');
} else {
  codexAc();
}

// Doğrudan fetch kullanan eski betiklere karşı son kapı: codex kipinde api.openai.com'a istek atılamaz.
if (i === -1) {
  const asil = globalThis.fetch;
  globalThis.fetch = (url, ...r) => {
    if (String(url?.url || url).includes('api.openai.com')) throw new Error('OpenAI API çağrısı engellendi: kalibrasyon betikleri varsayılan olarak codex kullanır; API için --api ver (K-0166).');
    return asil(url, ...r);
  };
}
