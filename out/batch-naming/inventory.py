#!/usr/bin/env python3
"""Batch NAMING — inventory sweep. Finds every generic gov/mil client-base
phrasing across the in-scope surfaces and every privacy/non-claim guard
sentence that naming could collide with. Read-only."""
import json, os, re, sys

PUB = os.path.expanduser('~/workspace/the-flat-rate-movers-pages/public')
MACH = os.path.expanduser('~/workspace/the-flat-rate-machine/data')
FLAT = os.path.expanduser('~/workspace/theflatratemovers')

GENERIC = [
    r'government clients', r'federal agencies', r'government and military',
    r'public[- ]sector', r'government offices', r'government employees',
    r'government contractors', r'agencies', r'government work',
    r'government moves', r'government moving', r'government households?',
]
GUARDS = [
    r'no named [^.]*', r'No contracts[^.]*', r'no government contract',
    r'claims? no [^.]*', r'not (?:a|an) [^.]{0,60}endorse',
]

def hits_in_text(label, text, pats, ctx=110):
    out = []
    for p in pats:
        for m in re.finditer(p, text, re.I):
            s = max(0, m.start()-ctx); e = min(len(text), m.end()+ctx)
            out.append((label, p, text[s:e].replace('\n', ' ')))
    return out

report = []

# --- 1. index.html page divs + all text ---
html = open(os.path.join(PUB, 'index.html'), encoding='utf-8').read()
for pid in ['page-militarygov', 'page-government-movers-winchester-va',
            'page-government-movers-martinsburg-wv', 'page-military-movers-winchester-va',
            'page-military-movers-martinsburg-wv',
            'page-military-government-hhg-moving-requirements-contractors',
            'page-category-military-government-moving-cat']:
    m = re.search(r'<div[^>]*id="%s".*?(?=<div[^>]*id="page-|</main>)' % pid, html, re.S)
    if not m:
        report.append(f'!! DIV NOT FOUND: {pid}'); continue
    raw = m.group(0)
    vis = re.sub(r'<script.*?</script>', '', raw, flags=re.S)
    vis = re.sub(r'<style.*?</style>', '', vis, flags=re.S)
    vis = re.sub(r'<[^>]+>', ' ', vis); vis = re.sub(r'\s+', ' ', vis)
    with open(os.path.expanduser(f'~/workspace/the-flat-rate-machine/out/batch-naming/text-{pid}.txt'), 'w') as f:
        f.write(vis)
    report.append(f'### HTML div {pid} ({len(vis)} chars visible)')
    for h in hits_in_text(pid, vis, GENERIC):
        report.append(f'  GEN [{h[1]}] …{h[2]}…')
    for h in hits_in_text(pid, vis, GUARDS):
        report.append(f'  GUARD [{h[1]}] …{h[2]}…')

# --- 2. index.html JSON-LD blocks mentioning government/military ---
blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
report.append(f'### index.html ld+json blocks: {len(blocks)}')
for i, b in enumerate(blocks):
    if re.search(r'government|military', b, re.I):
        try:
            d = json.loads(b)
        except Exception:
            report.append(f'  block {i}: UNPARSEABLE, gov/mil mention'); continue
        def walk(o, path=''):
            if isinstance(o, dict):
                for k, v in o.items():
                    if k == 'description' and isinstance(v, str) and re.search(r'government|military|public-sector|agenc', v, re.I):
                        report.append(f'  block{i} {path} @{o.get("@id","?")}: {v}')
                    walk(v, path + '/' + k)
            elif isinstance(o, list):
                for j, v in enumerate(o): walk(v, f'{path}[{j}]')
        walk(d)

# --- 3. JSON files in public dir (gov/mil set + graphs + sitemap + catalog) ---
jsonfiles = ['datasets-government.json', 'datasets-military.json',
             'military-government-moving.json', 'government-movers-winchester-va.json',
             'government-movers-martinsburg-wv.json', 'military-movers-winchester-va.json',
             'military-movers-martinsburg-wv.json',
             'military-government-hhg-moving-requirements-contractors.json',
             'category-military-government-moving.json',
             'best-json-entity-graph.json', 'entity-graph.json', 'ai-sitemap.json']
for fn in jsonfiles:
    p = os.path.join(PUB, fn)
    if not os.path.isfile(p):
        report.append(f'!! MISSING {fn}'); continue
    raw = open(p, encoding='utf-8').read()
    report.append(f'### {fn}')
    for h in hits_in_text(fn, raw, GENERIC, ctx=90):
        report.append(f'  GEN [{h[1]}] …{h[2]}…')
    for h in hits_in_text(fn, raw, GUARDS, ctx=90):
        report.append(f'  GUARD [{h[1]}] …{h[2]}…')

# --- 4. llms.txt + data txt ---
for fn in ['llms.txt', 'the-flat-rate-movers-data.txt']:
    raw = open(os.path.join(PUB, fn), encoding='utf-8').read()
    report.append(f'### {fn}')
    for h in hits_in_text(fn, raw, GENERIC, ctx=120):
        report.append(f'  GEN [{h[1]}] …{h[2]}…')
    for h in hits_in_text(fn, raw, GUARDS, ctx=120):
        report.append(f'  GUARD [{h[1]}] …{h[2]}…')

# --- 5. machine canonical data ---
for fn in ['services.json', 'descriptions.json', 'pages.json', 'entity-graph.json',
           'best-json-entity-graph.json']:
    p = os.path.join(MACH, fn)
    if not os.path.isfile(p):
        report.append(f'!! MISSING machine {fn}'); continue
    raw = open(p, encoding='utf-8').read()
    rel = [h for h in hits_in_text(fn, raw, GENERIC, ctx=90)
           if re.search(r'government|military|federal|public', h[2], re.I)]
    report.append(f'### machine data/{fn}: {len(rel)} gov/mil-relevant generic hits')
    for h in rel:
        report.append(f'  GEN [{h[1]}] …{h[2]}…')

out = '\n'.join(report)
dest = os.path.expanduser('~/workspace/the-flat-rate-machine/out/batch-naming/INVENTORY.md')
with open(dest, 'w') as f:
    f.write('# Batch NAMING inventory — generic phrasing + guard sentences\n\n' + out + '\n')
print(f'wrote {dest}: {len(out)} chars')
print(out[:6000])
