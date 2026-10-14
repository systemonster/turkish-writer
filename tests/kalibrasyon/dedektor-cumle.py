# Cümle düzeyinde dedektör çıktısı (yerel, açık modeller; API yok). Girdi: {kimlik: dosya yolu} JSON.
# Çıktı (JSONL): her cümle için d1 (BERTurk dedektörü, p yapay), nll (gözlemci Qwen3-1.7B-Base ortalama -log p),
# bino (performer nll / çapraz entropi; düşük = "fazla tahmin edilebilir"), ntok ve metin içi konum.
# Ayrıca token düzeyi: en düşük sürprizli (en tahmin edilebilir) tokenlar için {tokenler} alanı.
# Kullanım: python dedektor-cumle.py girdi.json cikti.jsonl   (HF_HOME D:'de olmalı; GPU gerekir, RAM sınırı: ~6 GB)
import json, re, sys, os, torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, AutoModelForCausalLM

girdi = json.load(open(sys.argv[1], encoding='utf8'))
yol = sys.argv[2]
bitti = set()
if os.path.exists(yol):
    for l in open(yol, encoding='utf8'):
        bitti.add(json.loads(l)['id'])
dev = 'cuda'

def cumleler(metin):
    satirlar = [s for s in metin.replace('\r', '').split('\n')]
    out, pos = [], 0
    for s in satirlar:
        if s.startswith('#'):
            pos += len(s) + 1
            continue
        for m in re.finditer(r'[^.!?…]+[.!?…]+(?:["”’)]*)|[^.!?…]+$', s):
            c = m.group(0).strip()
            if len(c.split()) >= 5:
                out.append((pos + m.start() + (len(m.group(0)) - len(m.group(0).lstrip())), pos + m.end(), c))
        pos += len(s) + 1
    return out

d1tok = AutoTokenizer.from_pretrained('ads2009/turkish-ai-text-detector-berturk-v10')
d1m = AutoModelForSequenceClassification.from_pretrained('ads2009/turkish-ai-text-detector-berturk-v10').to(dev).half().eval()
ot = AutoTokenizer.from_pretrained('Qwen/Qwen3-1.7B-Base')
ob = AutoModelForCausalLM.from_pretrained('Qwen/Qwen3-1.7B-Base', torch_dtype=torch.float16).to(dev).eval()
pf = AutoModelForCausalLM.from_pretrained('Qwen/Qwen3-1.7B', torch_dtype=torch.float16).to(dev).eval()

with open(yol, 'a', encoding='utf8') as f:
    for kim, p in girdi.items():
        if kim in bitti:
            continue
        metin = open(p, encoding='utf8').read()
        cum = cumleler(metin)
        if not cum:
            continue
        enc = ot(metin, return_offsets_mapping=True, truncation=True, max_length=1536, return_tensors='pt')
        ids = enc['input_ids'].to(dev)
        off = enc['offset_mapping'][0].tolist()
        with torch.no_grad():
            la, lb = ob(ids).logits[0, :-1].float(), pf(ids).logits[0, :-1].float()
        hedef = ids[0, 1:]
        nll = -torch.log_softmax(la, -1).gather(-1, hedef[:, None])[:, 0]
        pnll = -torch.log_softmax(lb, -1).gather(-1, hedef[:, None])[:, 0]
        xent = -(torch.softmax(lb, -1) * torch.log_softmax(la, -1)).sum(-1)
        nll, pnll, xent = nll.cpu(), pnll.cpu(), xent.cpu()
        for i, (b, e, c) in enumerate(cum):
            idx = [t for t in range(1, len(off)) if off[t][0] >= b and off[t][1] <= e]
            if len(idx) < 4:
                continue
            ti = torch.tensor([t - 1 for t in idx])
            tokenler = [(ot.decode(ids[0, t]).strip(), round(float(nll[t - 1]), 2)) for t in idx]
            x = d1tok(c, add_special_tokens=False, truncation=True, max_length=500)['input_ids']
            xx = torch.tensor([[d1tok.cls_token_id] + x + [d1tok.sep_token_id]]).to(dev)
            with torch.no_grad():
                d1 = torch.softmax(d1m(input_ids=xx).logits.float(), -1)[0, 1].item()
            f.write(json.dumps({'id': kim, 'i': i, 'n': len(cum), 'metin': c, 'd1': d1, 'nll': float(nll[ti].mean()), 'bino': float(pnll[ti].mean() / xent[ti].mean()), 'ntok': len(idx), 'tokenler': tokenler}, ensure_ascii=False) + '\n')
        f.flush()
print('tamam')
