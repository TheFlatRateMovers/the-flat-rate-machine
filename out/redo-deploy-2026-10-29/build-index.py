#!/usr/bin/env python3
"""Redo deploy batch, Step 6: build the new public/index.html in work/.
- head ld+json block <- staged head-graph.json
- dataset script blocks (gun-safe/residential/commercial) <- final retyped files
- 42 Area C patches, each OLD snippet asserted to occur EXACTLY ONCE in its div
- Developer div: decision-10 node counts (37->32 nodes, 89->76 nodes)
- Developer div: decision-2 dataset-card rewording (datasets = Dataset nodes only)
ABORTS (exit 1) on any failed assertion; caller must not copy to public/ on abort.
"""
import json, re, sys, pathlib

ROOT = pathlib.Path('/home/hatch/workspace/the-flat-rate-machine/out/redo-deploy-2026-10-29')
S = pathlib.Path('/home/hatch/workspace/the-flat-rate-machine/out/full-site-redo-2026-10-29')
PUB = pathlib.Path('/home/hatch/workspace/the-flat-rate-movers-pages/public')

html = (PUB / 'index.html').read_text(encoding='utf-8')
orig = html

def fail(msg):
    print('ABORT:', msg); sys.exit(1)

# ---------- 1. head graph ----------
blocks = list(re.finditer(r'<script type="application/ld\+json">(.*?)</script>', html, re.S))
if len(blocks) != 5: fail(f'expected 5 ld+json blocks, found {len(blocks)}')
head_new = (S / 'graphs/head-graph.json').read_text(encoding='utf-8').strip()
json.loads(head_new)
b0 = blocks[0]
html = html[:b0.start(1)] + head_new + html[b0.end(1):]
print('head graph block replaced (24 nodes)')

# ---------- 2. dataset blocks ----------
def block_for(frag_prefix):
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try: doc = json.loads(m.group(1))
        except Exception: continue
        ids = [n.get('@id','') for n in doc.get('@graph',[])]
        if any(frag_prefix in i for i in ids):
            return m
    return None

for frag, fname in [('#dataset-gun-safe-', 'datasets-gun-safe.json'),
                    ('#dataset-residential-', 'datasets-residential.json'),
                    ('#dataset-commercial-', 'datasets-commercial.json')]:
    m = block_for(frag)
    if not m: fail(f'dataset block not found for {frag}')
    content = (S / 'jsons' / fname).read_text(encoding='utf-8').strip()
    json.loads(content)
    html = html[:m.start(1)] + content + html[m.end(1):]
    print(f'{fname} block replaced with retyped content')

# FAQ block sanity: still present, unchanged vs original
def faq_block(text):
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', text, re.S):
        if 'gun-safe-movers/#faq' in m.group(1): return m.group(1)
    return None
if faq_block(html) != faq_block(orig): fail('FAQ block changed unexpectedly')
print('gun-safe FAQ block unchanged')

# ---------- 3. div segmentation ----------
def segments(text):
    starts = [(m.start(), m.group(1)) for m in re.finditer(r'<div class="page" id="(page-[^"]+)">', text)]
    footer = text.find('<footer')
    segs = {}
    for i, (pos, did) in enumerate(starts):
        end = starts[i+1][0] if i+1 < len(starts) else len(text)
        if footer > pos: end = min(end, footer if did == starts[-1][1] else end)
        segs[did] = (pos, end)
    return segs

# ---------- 4. apply 42 patches ----------
patch_dir = S / 'visibility' / 'patches'
patch_files = sorted(patch_dir.glob('*.md'))
if len(patch_files) != 42: fail(f'expected 42 patch files, found {len(patch_files)}')
total_repl = 0
applied = []
for pf in patch_files:
    div_id = pf.name[:-3]  # strip .md -> page-xxx
    text = pf.read_text(encoding='utf-8')
    sections = re.split(r'^## Replacement \d+', text, flags=re.M)[1:]
    pairs = []
    for sec in sections:
        fences = re.findall(r'```html\n(.*?)```', sec, re.S)
        if len(fences) != 2: fail(f'{pf.name}: expected 2 fences per replacement, got {len(fences)}')
        old, new = fences[0], fences[1]
        # fence content ends with a newline before ```; strip exactly one trailing newline
        if old.endswith('\n'): old = old[:-1]
        if new.endswith('\n'): new = new[:-1]
        pairs.append((old, new))
    segs = segments(html)
    if div_id not in segs: fail(f'{pf.name}: div {div_id} not found')
    s0, s1 = segs[div_id]
    seg = html[s0:s1]
    for old, new in pairs:
        cnt = seg.count(old)
        if cnt != 1: fail(f'{pf.name}: OLD occurs {cnt}x in {div_id} (must be 1): {old[:80]!r}')
        seg = seg.replace(old, new, 1)
        total_repl += 1
    html = html[:s0] + seg + html[s1:]
    applied.append((div_id, len(pairs)))
print(f'42 patch files applied: {total_repl} replacements across {len(applied)} divs')

# ---------- 5. developer decision-10 counts ----------
segs = segments(html)
s0, s1 = segs['page-developer']
seg = html[s0:s1]
for old, new in [('37 chained @ids', '32 nodes'), ('89 chained @ids', '76 nodes')]:
    if seg.count(old) != 1: fail(f'developer count snippet {old!r} occurs {seg.count(old)}x')
    seg = seg.replace(old, new, 1)
print('developer graph counts -> 32 nodes / 76 nodes')

# ---------- 6. developer dataset-card rewording ----------
def replace_article(seg, heading, new_article):
    pat = re.compile(r'<article class="card"><h3>' + re.escape(heading) + r'</h3>.*?</article>', re.S)
    m = pat.search(seg)
    if not m: fail(f'developer article {heading!r} not found')
    if len(pat.findall(seg)) != 1: fail(f'developer article {heading!r} not unique')
    return seg[:m.start()] + new_article + seg[m.end():], m.group(0)

res_new = ('<article class="card"><h3>Residential data</h3><p><a href="/datasets-residential.json" target="_blank" rel="noopener">'
           '<b>datasets-residential.json →</b></a> — 8 published nodes about the residential service, from both branches, never merged: '
           '3 as Datasets (CC BY 4.0) — item taxonomy, dispatch network, service areas and quote path; '
           '3 as Service data — household move operations, dwelling and access, protection and compliance; '
           '2 as Articles — commercial terms, personas and triggers.</p></article>')
seg, _ = replace_article(seg, 'Residential datasets', res_new)

gs_old_pat = re.compile(r'<article class="card"><h3>Gun Safe datasets</h3>.*?</article>', re.S)
m = gs_old_pat.search(seg)
if not m or len(gs_old_pat.findall(seg)) != 1: fail('gun safe developer article not unique')
old_gs = m.group(0)
tail_at = old_gs.find(' Hub page:')
if tail_at < 0: fail('gun safe article hub tail not found')
tail = old_gs[tail_at:]
gs_new = ('<article class="card"><h3>Gun Safe data</h3><p><a href="/datasets-gun-safe.json" target="_blank" rel="noopener">'
          '<b>datasets-gun-safe.json →</b></a> — 18 published nodes about the gun-safe service, from both branches, never merged: '
          '5 as Datasets (CC BY 4.0) — weight bands and access, safe and access taxonomy, branch dispatch network, service areas, '
          'dispatch and quote path, standard safe classes; 9 as Service data — safe move operations, floor, protection and handling '
          'compliance, and the service details: safes under 1,500 lb handled the same careful way, customers always empty the safe '
          'first, stairs up and down, equipment matched to the project, re-anchoring on request, vault work any size, no locksmith '
          'services; 4 as Articles — commercial terms, buyer personas and triggers, Winchester page parity, long-distance published runs.'
          + tail)
seg = seg[:m.start()] + gs_new + seg[m.end():]

com_new = ('<article class="card"><h3>Commercial data</h3><p><a href="/datasets-commercial.json" target="_blank" rel="noopener">'
           '<b>datasets-commercial.json →</b></a> — 8 published nodes about the commercial service, from both branches, never merged: '
           '3 as Datasets (CC BY 4.0) — business asset taxonomy, branch dispatch network, service areas, dispatch and quote path; '
           '3 as Service data — commercial move operations, premises and access, protection, IT coordination and building compliance; '
           '2 as Articles — commercial terms and cost drivers (flat-rate-in-writing only; domain figures labeled), buyer personas and triggers.</p></article>')
seg, _ = replace_article(seg, 'Commercial datasets', com_new)
html = html[:s0] + seg + html[s1:]
print('developer dataset cards reworded (datasets = Dataset nodes only)')

# ---------- 7. global invariants ----------
if html.count('<div class="page" id="page-') != orig.count('<div class="page" id="page-'):
    fail('page div count changed')
for token in ['Guaranteed Flat Rate or Your Move is Free!', 'Get My Flat Rate Quote', 'heroQuote', 'quoteForm', 'hqWalk', 'qWalk']:
    if token not in html: fail(f'missing token {token}')
if 'DESIGN 6' in html: fail('DESIGN 6 present')
out = ROOT / 'work' / 'index.html'
out.write_text(html, encoding='utf-8')
print(f'built work/index.html: {len(html)} chars (orig {len(orig)})')
print('OK')
