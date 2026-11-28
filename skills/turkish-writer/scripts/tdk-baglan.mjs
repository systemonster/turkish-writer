// Optional local TDK evidence; no network, no shell, no bundled dictionary.
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('./tdk-sozluk.py', import.meta.url))
// The private installation may contain the user's own snapshot. Never part of the public package.
export const TDK_YEREL_YOLU = fileURLToPath(new URL('./data/private/tdk.sqlite', import.meta.url))
export function tdkKaynak(explicit, env=process.env, privatePath=TDK_YEREL_YOLU) {
  return explicit || env.TW_TDK_KAYNAK || (existsSync(privatePath) ? privatePath : null)
}
export function tdkAra(source, terms, {examples=false}={}) {
  if (typeof source !== 'string' || !source.trim() || !Array.isArray(terms) || terms.length < 1 || terms.length > 8 || terms.some(t=>typeof t !== 'string' || !t.trim())) throw new Error('Yerel TDK kaynağı ve 1–8 açık madde başı gerekli')
  const args = [script, '--kaynak', source, ...terms.flatMap(t=>['--kelime',t]), ...(examples?['--ornek']:[])]
  const python = process.platform === 'win32' ? [['py','-3'],['python'],['python3']] : [['python3'],['python']]
  for (const [exe,...prefix] of python) {
    const r=spawnSync(exe,[...prefix,...args],{shell:false, encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024,env:{...process.env,PYTHONIOENCODING:'utf-8',PYTHONDONTWRITEBYTECODE:'1'}})
    if (r.error?.code==='ENOENT') continue
    if (r.error) throw new Error('Yerel TDK okuyucu: '+r.error.message)
    if (r.status!==0) throw new Error('Yerel TDK okuyucu: '+(r.stderr||'başarısız sorgu').trim().slice(0,1500))
    const data=JSON.parse(r.stdout)
    if (data.schema!==1 || data.source?.mode!=='read-only' || !Array.isArray(data.results) || data.results.length!==terms.length || data.results.some((x,i)=>x.kelime!==terms[i])) throw new Error('TDK okuyucu yanıtı doğrulanamadı')
    return data
  }
  throw new Error('İsteğe bağlı TDK sorgusu için Python 3.10+ gerekli; normal skill akışı Python gerektirmez')
}
