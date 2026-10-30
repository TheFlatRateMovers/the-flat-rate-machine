#!/usr/bin/env python3
"""Batch 9 Item 3 — derive a truthful per-URL <lastmod> from evidence only.
Classes of evidence for a 2026-10-29 change (all dates America/New_York):
  G1 the page's own per-page JSON carries dateModified 2026-10-29
  G2 slug in Batch 8a build list (per-page JSON created 2026-10-29)
  G3 slug in Batch 8b deepened list (page div edited 2026-10-29)
  G4 slug in photo-batch placements (page div edited 2026-10-29)
  G5 the page's per-page JSON is in Batch 7d's touched set (edited 2026-10-29)
  G6 registry pages.json already marks lastmod 2026-10-29 (new/changed pages)
  G7 developer page: P1 inserted the Signed-machine-data card 2026-10-29
Everything else: 2026-10-28 — the estate build + Cloudflare cutover date,
which pages.json records as the attestation date for the untouched pages.
Outputs: work/lastmod-map.json, files/sitemap.xml (staged), summary print.
"""
import json, os, re
from collections import Counter

H = os.path.expanduser('~')
M = f'{H}/workspace/the-flat-rate-machine'
ROOT = f'{M}/out/batch9-structural'
PUB = f'{H}/workspace/the-flat-rate-movers-pages/public'
reg = json.load(open(f'{M}/data/pages.json'))['pages']
fmap = json.load(open(f'{ROOT}/work/slug-file-map.json'))
meta = json.load(open(f'{ROOT}/work/pageMeta.json'))
key2slug = {}
for p in reg:
    for k, m in meta.items():
        if m.get('canonical') == p['url']:
            key2slug[k] = p['slug']

b8a = set(json.load(open(f'{M}/out/batch8a-pagejson/work/build-list.json')))
_b8b_raw = {s['slug'] for s in json.load(open(f'{M}/out/batch8b-stubdepth/work/stub-list.json'))}
b8b = {key2slug.get(s, s) for s in _b8b_raw}  # stub list mixes slugs + router keys
photo_keys = ['export', 'exportpacking', 'it-equipment-moving-data-center-logistics-services-virginia',
              'industrial-commercial-services']
photo = {key2slug.get(k, k) for k in photo_keys}
b7d_files = set(re.findall(r'[a-z0-9-]+\.json', open(f'{M}/out/batch7d-phrasefix/parsed-diff-log.txt').read()))
file2slug = {v: k for k, v in fmap.items()}
b7d = {file2slug[f] for f in b7d_files if f in file2slug}

result = {}
for p in reg:
    slug = p['slug']
    srcs = []
    jf = fmap[slug]
    txt = open(os.path.join(PUB, jf)).read()
    if '"dateModified": "2026-10-29"' in txt or '"dateModified":"2026-10-29"' in txt:
        srcs.append('G1 per-page JSON dateModified 2026-10-29')
    if slug in b8a: srcs.append('G2 Batch 8a created per-page JSON 2026-10-29')
    if slug in b8b: srcs.append('G3 Batch 8b deepened page div 2026-10-29')
    if slug in photo: srcs.append('G4 photo batch placed photos 2026-10-29')
    if slug in b7d: srcs.append('G5 Batch 7d edited per-page JSON 2026-10-29')
    if p.get('lastmod') == '2026-10-29': srcs.append('G6 registry lastmod already 2026-10-29')
    if slug == 'developer': srcs.append('G7 Batch P1 Developer card insert 2026-10-29')
    date = '2026-10-29' if srcs else '2026-10-28'
    if not srcs: srcs = ['build: estate build + Cloudflare cutover 2026-10-28 (registry attestation date)']
    result[slug] = {'url': p['url'], 'lastmod': date, 'sources': srcs}

json.dump(result, open(f'{ROOT}/work/lastmod-map.json', 'w'), indent=1)
dist = Counter(v['lastmod'] for v in result.values())
print('distribution:', dict(dist))
bysrc = Counter()
for v in result.values():
    for s in v['sources']: bysrc[s.split(' ')[0] if s[0] == 'G' else 'build'] += 1
print('evidence class hits:', dict(bysrc))

# staged sitemap: preserve order + exact loc strings from the live file
xml = open(f'{PUB}/sitemap.xml').read()
urls = re.findall(r'<url><loc>(.*?)</loc><lastmod>(.*?)</lastmod></url>', xml)
assert len(urls) == 156, len(urls)
by_url = {v['url']: v['lastmod'] for v in result.values()}
out = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for loc, _old in urls:
    out.append(f'  <url><loc>{loc}</loc><lastmod>{by_url[loc]}</lastmod></url>')
out.append('</urlset>')
open(f'{ROOT}/files/sitemap.xml', 'w').write('\n'.join(out) + '\n')
changed = sum(1 for loc, old in urls if by_url[loc] != old)
print('sitemap staged: 156 urls, lastmod changed vs current file:', changed)
