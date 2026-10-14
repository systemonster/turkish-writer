// Ölçüm betikleri elle çalışır; elle yapılan iş OpenAI API'yle yapılmaz (lovefengis K-0166).
// Her ölçüm betiğinin İLK import'u budur: codex kipi (TW_SAGLAYICI=codex) ya da açık API onayı (TW_API_ONAY=1) yoksa durur.
export function apiKilidi(env = process.env, argv = process.argv) {
  if (env.TW_SAGLAYICI === 'codex' || argv.includes('--codex') || env.TW_API_ONAY === '1') return null;
  return 'Ölçüm API ile çalışmaz (K-0166). Abonelikle: TW_SAGLAYICI=codex. API için kurucu onayıyla: TW_API_ONAY=1.';
}

const hata = apiKilidi();
if (hata && !process.env.TW_KILIT_TEST) { console.error(hata); process.exit(3); }
