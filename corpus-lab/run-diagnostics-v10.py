#!/usr/bin/env python3
"""Run bounded, versioned model experiments with vLLM. Final text only in result logs."""
from __future__ import annotations
import argparse
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import re
import subprocess
import time

def sha(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def extract_final(raw, model):
    if model.startswith('openai/gpt-oss'):
        marker = '<|channel|>final<|message|>'
        if marker in raw:
            final = raw.rsplit(marker, 1)[1]
        elif 'final<|message|>' in raw:
            final = raw.rsplit('final<|message|>', 1)[1]
        else:
            return '', 'missing_final_channel'
        final = re.split(r'<\|(?:return|end|start)\|>', final, maxsplit=1)[0]
        return final.strip(), None
    if '</think>' in raw:
        final = raw.rsplit('</think>', 1)[1]
        return re.split(r'<\|im_end\|>|<\|endoftext\|>', final, maxsplit=1)[0].strip(), None
    if '<think>' in raw or model.startswith('Qwen/'):
        return '', 'missing_thinking_terminator'
    return raw.strip(), None

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--manifest', required=True)
    p.add_argument('--model', required=True)
    p.add_argument('--revision', required=True)
    p.add_argument('--out', required=True)
    p.add_argument('--kinds', default='all')
    p.add_argument('--ids', default='')
    p.add_argument('--batch', type=int, default=4)
    p.add_argument('--max-model-len', type=int, default=32768)
    p.add_argument('--seed', type=int, default=1125)
    p.add_argument('--resume', action='store_true')
    args = p.parse_args()
    if not re.fullmatch('[0-9a-f]{40}', args.revision):
        p.error('Pin a complete model revision SHA')
    if not 1 <= args.batch <= 8:
        p.error('batch must be 1..8')
    from vllm import LLM, SamplingParams
    manifest_text = Path(args.manifest).read_text(encoding='utf-8')
    experiment = json.loads(manifest_text)
    task_by_id = {t['id']: t for t in experiment['tasks']}
    selected = experiment['tasks']
    if args.kinds != 'all':
        selected = [t for t in selected if t['kind'] in args.kinds.split(',')]
    if args.ids:
        requested_ids = set(args.ids.split(','))
        if not requested_ids.issubset(task_by_id):
            p.error('Unknown task ID')
        selected = [t for t in selected if t['id'] in requested_ids]
    if not selected:
        p.error('No tasks selected')
    # Add each dependency transitively; do not silently fabricate previous-pass text.
    required = {t['id'] for t in selected}
    for id in list(required):
        parent = task_by_id[id].get('depends_on')
        while parent:
            required.add(parent)
            parent = task_by_id[parent].get('depends_on')
    selected = [t for t in experiment['tasks'] if t['id'] in required]
    out = Path(args.out)
    if out.exists() and not args.resume:
        p.error('Output exists; use --resume only with the same manifest/model/revision')
    done = {}
    if out.exists():
        for line in out.read_text(encoding='utf-8').splitlines():
            row = json.loads(line)
            if row['model'] != args.model or row['model_revision'] != args.revision or row['manifest_sha256'] != sha(manifest_text):
                p.error('Resume provenance mismatch')
            if row['id'] in done:
                p.error('Duplicate saved task result')
            done[row['id']] = row
    t0 = time.time()
    kwargs = dict(model=args.model, revision=args.revision, tokenizer_revision=args.revision,
                  max_model_len=args.max_model_len, gpu_memory_utilization=0.88,
                  tensor_parallel_size=1, seed=args.seed, trust_remote_code=False,
                  max_num_seqs=args.batch, enable_prefix_caching=True)
    if args.model.startswith('openai/gpt-oss'):
        kwargs['dtype'] = 'auto'
    else:
        kwargs['dtype'] = 'bfloat16'
    llm = LLM(**kwargs)
    tok = llm.get_tokenizer()
    model_kind = 'gpt-oss-medium' if args.model.startswith('openai/gpt-oss') else 'qwen-thinking'
    template_kwargs = {'reasoning_effort': 'medium'} if args.model.startswith('openai/gpt-oss') else {'enable_thinking': True}
    common = {'model': args.model, 'model_revision': args.revision, 'manifest_sha256': sha(manifest_text),
              'git': subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(),
              'vllm_version': importlib.metadata.version('vllm'), 'reasoning': model_kind,
              'seed': args.seed, 'temperature': 0.6, 'top_p': 0.95,
              'top_k': -1 if args.model.startswith('openai/gpt-oss') else 20,
              'max_model_len': args.max_model_len, 'task_count': len(selected)}
    print('DIAGNOSTIC_RUN_INFO ' + json.dumps(common, ensure_ascii=False), flush=True)
    out.parent.mkdir(parents=True, exist_ok=True)
    pending = [t for t in selected if t['id'] not in done]
    with out.open('a', encoding='utf-8') as fp:
        def save(row):
            row = dict(common, **row)
            fp.write(json.dumps(row, ensure_ascii=False) + '\n')
            fp.flush()
            os.fsync(fp.fileno())
            done[row['id']] = row
            print('DIAGNOSTIC_RESULT ' + json.dumps(row, ensure_ascii=False), flush=True)
        while pending:
            ready = [t for t in pending if not t.get('depends_on') or t['depends_on'] in done][:args.batch]
            if not ready:
                raise RuntimeError('Unresolved/cyclic task dependencies')
            prompts, active, parameters = [], [], []
            for task in ready:
                user = task['user']
                if task.get('depends_on'):
                    previous = done[task['depends_on']]
                    if not previous['complete']:
                        save(dict(id=task['id'], kind=task['kind'], arm=task['arm'], source_id=task['source_id'],
                                  status='blocked_dependency', complete=False, final='', depends_on=task['depends_on']))
                        continue
                    user = json.dumps({'amac': task['purpose'], 'tur': task['genre'], 'kaynak': previous['final']}, ensure_ascii=False)
                system = experiment['judge_prompt'] if task['arm'] == 'judge' else experiment['bundles'][task['arm']]['prompt']
                messages = [{'role': 'system', 'content': system}, {'role': 'user', 'content': user}]
                rendered = tok.apply_chat_template(messages, tokenize=False, add_generation_prompt=True, **template_kwargs)
                input_ids = tok.encode(rendered, add_special_tokens=False)
                if len(input_ids) + task['max_tokens'] > args.max_model_len:
                    save(dict(id=task['id'], kind=task['kind'], arm=task['arm'], source_id=task['source_id'],
                              status='context_overflow', complete=False, final='', input_tokens=len(input_ids),
                              requested_output_tokens=task['max_tokens']))
                    continue
                prompts.append({'prompt_token_ids': input_ids})
                active.append((task, rendered, user))
                parameters.append(SamplingParams(temperature=common['temperature'], top_p=common['top_p'],
                                  top_k=common['top_k'], max_tokens=task['max_tokens'], seed=args.seed,
                                  skip_special_tokens=False))
            if prompts:
                start = time.time()
                results = llm.generate(prompts, parameters, use_tqdm=False)
                elapsed = time.time() - start
                for (task, rendered, user), result in zip(active, results):
                    completion = result.outputs[0]
                    raw = completion.text
                    final, parse_error = extract_final(raw, args.model)
                    # Keep hidden reasoning out of public artifacts; raw hash preserves identity.
                    complete = completion.finish_reason == 'stop' and not parse_error and bool(final)
                    save(dict(id=task['id'], kind=task['kind'], arm=task['arm'], source_id=task['source_id'],
                              status='complete' if complete else 'incomplete', complete=complete,
                              final=final, parse_error=parse_error, finish_reason=completion.finish_reason,
                              stop_reason=completion.stop_reason, output_tokens=len(completion.token_ids),
                              input_tokens=len(result.prompt_token_ids), requested_output_tokens=task['max_tokens'],
                              prompt_sha256=sha(rendered), source_payload_sha256=sha(user), raw_response_sha256=sha(raw),
                              final_sha256=sha(final), depends_on=task.get('depends_on'),
                              batch_elapsed_seconds=round(elapsed, 3), batch_size=len(active)))
                if all(done[task['id']].get('parse_error') for task, _, _ in active):
                    raise RuntimeError('Every response in this batch lacked a valid final channel; stop and inspect the runtime before continuing')
            selected_ready = {t['id'] for t in ready}
            pending = [t for t in pending if t['id'] not in selected_ready]
    print('DIAGNOSTIC_COMPLETE ' + json.dumps({'model': args.model, 'expected': len(selected),
          'recorded': sum(t['id'] in done for t in selected), 'complete': sum(done[t['id']]['complete'] for t in selected),
          'elapsed_seconds': round(time.time() - t0, 3)}, ensure_ascii=False), flush=True)

if __name__ == '__main__':
    main()
