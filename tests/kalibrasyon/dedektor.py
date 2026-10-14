# Dış AI dedektörleri (açık modeller, yerelde; hesap ve ücret yok). Girdi: {kimlik: dosya yolu} JSON.
# Çıktı: kimlik -> {d1, d2, bino, fdg}; yüksek = "yapay" yönünde (d1/d2 sınıf-1 olasılığı, bino = -Binoculars skoru).
# Kullanım: python dedektor.py girdi.json cikti.json [d1,d2,bino]   (önbellekli: cikti.json'daki puan yeniden hesaplanmaz)
import json, sys, os, torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, AutoModelForCausalLM

girdi = json.load(open(sys.argv[1], encoding='utf8'))
yol = sys.argv[2]
secim = (sys.argv[3] if len(sys.argv) > 3 else 'd1,d2,bino').split(',')
sonuc = json.load(open(yol, encoding='utf8')) if os.path.exists(yol) else {}
metin = {k: open(v, encoding='utf8').read() for k, v in girdi.items()}
dev = 'cuda'

def siniflayici(ad, anahtar):
    tok = AutoTokenizer.from_pretrained(ad); m = AutoModelForSequenceClassification.from_pretrained(ad).to(dev).half().eval()
    for k, t in metin.items():
        if anahtar in sonuc.get(k, {}): continue
        ids = tok(t, add_special_tokens=False)['input_ids']
        parcalar = [ids[i:i + 500] for i in range(0, len(ids), 500)] or [[]]
        ps = []
        for p in parcalar:
            if len(p) < 30 and ps: continue
            x = torch.tensor([[tok.cls_token_id] + p + [tok.sep_token_id]]).to(dev)
            with torch.no_grad(): ps.append(torch.softmax(m(input_ids=x).logits.float(), -1)[0, 1].item())
        sonuc.setdefault(k, {})[anahtar] = sum(ps) / len(ps)
    del m; torch.cuda.empty_cache()

def binoculars(obs='Qwen/Qwen2.5-3B', per='Qwen/Qwen2.5-3B-Instruct', ust=1024):
    tok = AutoTokenizer.from_pretrained(obs)
    a = AutoModelForCausalLM.from_pretrained(obs, torch_dtype=torch.float16).to(dev).eval()
    b = AutoModelForCausalLM.from_pretrained(per, torch_dtype=torch.float16).to(dev).eval()
    for k, t in metin.items():
        if 'bino' in sonuc.get(k, {}) and 'fdg' in sonuc.get(k, {}): continue
        ids = tok(t, return_tensors='pt', truncation=True, max_length=ust)['input_ids'].to(dev)
        with torch.no_grad():
            la, lb = a(ids).logits[0, :-1].float(), b(ids).logits[0, :-1].float()
        hedef = ids[0, 1:]
        ppl = torch.nn.functional.cross_entropy(lb, hedef)          # performer log-ppl
        xent = -(torch.softmax(lb, -1) * torch.log_softmax(la, -1)).sum(-1).mean()  # çapraz entropi
        sonuc.setdefault(k, {})['bino'] = -(ppl / xent).item()
        # Fast-DetectGPT (analitik): örnekleme = gözlemci (la), puanlama = performer (lb); yüksek = yapay
        lp = torch.log_softmax(lb, -1); pr = torch.softmax(la, -1)
        ll = lp.gather(-1, hedef[:, None]).sum()
        mu = (pr * lp).sum(-1).sum(); var = ((pr * lp ** 2).sum(-1) - (pr * lp).sum(-1) ** 2).sum()
        sonuc[k]['fdg'] = ((ll - mu) / var.sqrt()).item()
    del a, b; torch.cuda.empty_cache()

if 'd1' in secim: siniflayici('ads2009/turkish-ai-text-detector-berturk-v10', 'd1')
# SAKLI dedektörler (v1.1): ayar sırasında hiç bakılmadı, yalnız son ölçümde çalıştırılır
if 'cb8' in secim: siniflayici('ads2009/turkish-ai-text-detector-convbert-v8-balanced', 'cb8')
if 'bt8' in secim: siniflayici('ads2009/turkish-ai-text-detector-berturk-v8-balanced', 'bt8')
if 'd2' in secim: siniflayici('bibbbu/multilingual-ai-human-detector_xlm-roberta-base', 'd2')
if 'bino' in secim or 'fdg' in secim: binoculars()
json.dump(sonuc, open(yol, 'w', encoding='utf8'), indent=1)
print('tamam', len(sonuc))
