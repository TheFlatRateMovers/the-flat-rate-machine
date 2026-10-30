#!/usr/bin/env python3
"""Batch 9 Item 5 — llms.txt + data txt consolidation (staged copies).
Appends a dated 2026-10-29 section in each file's own established style:
  - per-URL head resolution note (the Item 1 fact),
  - the COMPLETE page index: all 156 canonical pages grouped by registry
    service (registry names verbatim), each with its per-page JSON,
  - the authority book with its confirmed identifiers
    (Amazon ASIN B0GRBKR5DS; Barnes & Noble EAN 2940185300718),
  - the signed AI master index URL itself (the .jws was already named).
Nothing already in the files is edited; additions only, appended at the end.
"""
import json, os

H = os.path.expanduser('~')
M = f'{H}/workspace/the-flat-rate-machine'
ROOT = f'{M}/out/batch9-structural'
PUB = f'{H}/workspace/the-flat-rate-movers-pages/public'
reg = json.load(open(f'{M}/data/pages.json'))['pages']
services = json.load(open(f'{M}/data/services.json'))['services']
meta = json.load(open(f'{ROOT}/work/pageMeta.json'))
fmap = json.load(open(f'{ROOT}/work/slug-file-map.json'))
name_by_url = {m['canonical']: m['name'] for m in meta.values()}
svc_name = {s['id']: s['name'] for s in services}
svc_order = [s['id'] for s in services]

groups = {}
for p in reg:
    gid = (p.get('services') or [None])[0]
    groups.setdefault(gid, []).append(p)

def group_label(gid):
    return svc_name[gid] if gid else 'Site, Knowledge & Utility Pages'

ordered_gids = [g for g in svc_order if g in groups] + [None]

# ---------- llms.txt ----------
llms = open(f'{PUB}/llms.txt').read()
lines = []
lines.append('')
lines.append('## Update — 2026-10-29 (structural batch — per-URL heads, complete page index, authority book)')
lines.append('')
lines.append('- Per-URL head resolution is live: every one of the 156 canonical URLs now serves its own title, meta description, canonical URL, Open Graph set and page-specific JSON-LD (the page\'s WebPage graph plus its published per-page JSON) in the raw served HTML, generated from the same page data the site\'s router uses — crawlers and AI fetchers no longer need JavaScript to know which page a URL is. Page bodies, the router and the quote form are unchanged, and every URL still renders its own page.')
lines.append('- Signed AI master index: the signed index itself is published at https://theflatratemovers.com/ai-master-index.json (signature: https://theflatratemovers.com/ai-master-index.jws; verification key: https://theflatratemovers.com/.well-known/signing-keys.json). Every distribution entry carries a SHA-256 digest of the exact bytes served.')
lines.append('- Authority book: "The Strategic Integrator: A Professional Guide to Precision Moving and Digital Dominance in the AI Era" by Henry Pitts Jr. with Gem AI (Co-Producer). Amazon ASIN: B0GRBKR5DS. Barnes & Noble EAN: 2940185300718.')
lines.append('- Registry services (23, names verbatim): ' + '; '.join(s['name'] for s in services) + '.')
lines.append('- Complete page index — all 156 canonical pages, grouped by service under the registry\'s own service names, each page with its published per-page JSON:')
for gid in ordered_gids:
    lines.append(f'  - {group_label(gid)}:')
    for p in groups[gid]:
        nm = name_by_url[p['url']]
        lines.append(f'    - [{nm}]({p["url"]}) — per-page JSON: https://theflatratemovers.com/{fmap[p["slug"]]}')
llms_new = llms.rstrip('\n') + '\n' + '\n'.join(lines) + '\n'
open(f'{ROOT}/files/llms.txt', 'w').write(llms_new)

# ---------- the-flat-rate-movers-data.txt ----------
dt = open(f'{PUB}/the-flat-rate-movers-data.txt').read()
lines = []
lines.append('')
lines.append('## Update 2026-10-29 — structural batch: per-URL heads, complete page index, authority book')
lines.append('- Per-URL head resolution is live: every one of the 156 canonical URLs now serves its own title, meta description, canonical URL, Open Graph set and page-specific JSON-LD (the page\'s WebPage graph plus its published per-page JSON) in the raw served HTML, generated from the same page data the site\'s router uses. Page bodies, the router and the quote form are unchanged, and every URL still renders its own page.')
lines.append('- Signed AI master index: https://theflatratemovers.com/ai-master-index.json (signature: https://theflatratemovers.com/ai-master-index.jws; verification key: https://theflatratemovers.com/.well-known/signing-keys.json). Every distribution entry in the index carries a SHA-256 digest of the exact bytes served.')
lines.append('- AUTHORITY BOOK')
lines.append('  Title: The Strategic Integrator: A Professional Guide to Precision Moving and Digital Dominance in the AI Era')
lines.append('  Authors: Henry Pitts Jr. with Gem AI (Co-Producer)')
lines.append('  Amazon ASIN: B0GRBKR5DS')
lines.append('  Barnes & Noble EAN: 2940185300718')
lines.append('- REGISTRY SERVICES (23, names verbatim): ' + '; '.join(s['name'] for s in services) + '.')
lines.append('- COMPLETE PAGE INDEX — all 156 canonical pages, grouped by service under the registry service names; each page also publishes a per-page JSON (URL shown):')
for gid in ordered_gids:
    lines.append(f'  {group_label(gid)}:')
    for p in groups[gid]:
        nm = name_by_url[p['url']]
        lines.append(f'  - {nm} — {p["url"]} — JSON: https://theflatratemovers.com/{fmap[p["slug"]]}')
dt_new = dt.rstrip('\n') + '\n' + '\n'.join(lines) + '\n'
open(f'{ROOT}/files/the-flat-rate-movers-data.txt', 'w').write(dt_new)

# ---------- self-audit ----------
for label, text in [('llms', llms_new), ('data txt', dt_new)]:
    named = sum(1 for p in reg if p['url'] in text)
    print(f'{label}: pages named {named}/156; ASIN {"B0GRBKR5DS" in text}; EAN {"2940185300718" in text}; '
          f'index {"ai-master-index.json" in text}; datasets named {sum(1 for i in range(25) if True) if False else ""}')
    missing_svc = [s['name'] for s in services if s['name'] not in text]
    print(f'   services not named verbatim: {missing_svc}')
print('llms bytes:', len(llms), '->', len(llms_new), '| data txt bytes:', len(dt), '->', len(dt_new))
