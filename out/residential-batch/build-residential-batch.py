#!/usr/bin/env python3
"""Residential deep-data batch merge — The Flat Rate Movers, 2026-10-29.
Merges the staged residential package into machine data + live site files.
No new page, no new pages.json entry, no sitemap count change (153),
no services.json count change (22). All edits verified after applying.
"""
import json, re, shutil, sqlite3, sys
from pathlib import Path

WS = Path('/home/hatch/workspace')
MACH = WS / 'the-flat-rate-machine'
PAGES = WS / 'the-flat-rate-movers-pages' / 'public'
FLAT = WS / 'theflatratemovers'
PKG = MACH / 'out' / 'pages' / 'residential-deep'
BATCH = MACH / 'out' / 'residential-batch'
BATCH.mkdir(parents=True, exist_ok=True)
BACKUP = BATCH / 'backup-2026-10-29'
BACKUP.mkdir(exist_ok=True)

FAIL = []
def ok(cond, msg):
    print(('PASS  ' if cond else 'FAIL  ') + msg)
    if not cond:
        FAIL.append(msg)

SITE = 'https://theflatratemovers.com'
ORG = SITE + '/#organization'
SAMEAS = [
    'https://www.instagram.com/theflatratemovers/',
    'https://www.threads.com/@theflatratemovers',
    'https://x.com/ratemovers',
    'https://www.youtube.com/@theflatratemovers',
    'https://github.com/TheFlatRateMovers',
    'https://medium.com/@ratemovers',
]
DIST = [
    {'@type': 'DataDownload', 'name': 'AI Sitemap', 'contentUrl': SITE + '/ai-sitemap.json', 'encodingFormat': 'application/json'},
    {'@type': 'DataDownload', 'name': 'Service Area GeoJSON', 'contentUrl': SITE + '/service-area.geojson', 'encodingFormat': 'application/geo+json'},
    {'@type': 'DataDownload', 'name': 'Entity Graph', 'contentUrl': SITE + '/entity-graph.json', 'encodingFormat': 'application/ld+json'},
    {'@type': 'DataDownload', 'name': 'Best JSON Entity Graph', 'contentUrl': SITE + '/best-json-entity-graph.json', 'encodingFormat': 'application/ld+json'},
]
CREATOR = {'@id': ORG, '@type': 'Organization', 'name': 'The Flat Rate Movers', 'sameAs': SAMEAS}
SPATIAL = [{'@id': SITE + '/#winchester'}, {'@id': SITE + '/#martinsburg'}]
ABOUT = [{'@id': SITE + '/#service-residential'}]
SAMEAS_PAGE = [SITE + '/residential-moving/']

def ds(id_suffix, name, desc, keywords):
    return {'@type': 'Dataset', '@id': SITE + '/#dataset-' + id_suffix, 'name': name,
            'description': desc, 'keywords': keywords, 'about': ABOUT,
            'spatialCoverage': SPATIAL, 'temporalCoverage': '2010/2026',
            'dateModified': '2026-10-29', 'creator': CREATOR,
            'license': 'https://creativecommons.org/licenses/by/4.0/',
            'distribution': DIST, 'sameAs': SAMEAS_PAGE}

DATASETS = {'@context': 'https://schema.org', '@graph': [
    ds('residential-operations', 'The Flat Rate Movers — Household Move Operations Dataset',
       'Household move operations from The Flat Rate Movers: survey and written quote (Short Quick Quote by default, Detailed Project toggle preserving From, To, and What\'s moving; film-only video-walkthrough survey room with a human-made estimate), room-by-room packing (full, partial, or fragile-only, plus unpacking; client-packed loads moved and placed), inventory, protection, sequenced loading (heavy items low and first, boxes staged by room, fragile secured on top, everything strapped), transport on the planned route, room-by-room unloading and placement with reassembly of standard furniture planned up front, and a closing walkthrough. Company facts: one price agreed in writing before move day; no hourly meter. Domain facts (general industry practice): room-by-room labeling, inventory listing checked against the walkthrough, heavy-low loading order.',
       ['moving companies winchester va', 'movers winchester va', 'winchester movers', 'movers near me', 'residential moving', 'house moving', 'local moving']),
    ds('residential-dwelling-access', 'The Flat Rate Movers — Dwelling and Access Operations Dataset',
       'Dwelling and access operations from The Flat Rate Movers: apartments (studio through multi-bedroom), condos, townhomes, single-family houses, and estates; access inputs that change quote scope — stairs and walk-ups, elevator type and reservation windows, doorway and hallway width, parking and loading zones, long-carry distance, building hours, HOA rules, and certificates of insurance where managed buildings require them (domain consideration). Access items are planning inputs to the quote, not capability claims: no apartment-specific crew, equipment, or access capability is claimed beyond the published house/apartment scope, and townhome/condo coverage folds into a separate apartment follow-up package. Dispatch runs I-81, I-66, and I-70 from both branches.',
       ['apartment moves', 'apartment movers winchester va', 'movers martinsburg wv', 'local moving', 'moving companies near me']),
    ds('residential-item-taxonomy', 'The Flat Rate Movers — Home and Item Taxonomy Dataset',
       'Home and item taxonomy from The Flat Rate Movers: rooms (living, family, kitchen, dining, bedrooms, home office, bathrooms, laundry, garage, basement, attic, outdoor) mapped to box labels and destination placement; item classes (furniture, appliances, electronics, fragile, keepsakes, high-value pieces) with handling (blanket and stretch wrap, dish and mirror cartons, wardrobe cartons, mattress bags, disassembly of standard furniture); white-glove care for antiques and high-value pieces and custom crates when a piece needs more than padding. Specialty cross-references are links, not duplications: pianos to the piano-antique category, safes and high-mass assets 1,500–3,500 lbs to SIR/KIM-GS and gun-safe categories, crates to crating. No prohibited-items list is published, and none is invented here (domain guidance only).',
       ['residential moving', 'house moving', 'packing services winchester va', 'fragile packing', 'white glove moving']),
    ds('residential-dispatch-network', 'The Flat Rate Movers — Local and Regional Dispatch Network Dataset',
       'Local and regional dispatch network from The Flat Rate Movers: Winchester branch (116 W Piccadilly St Suite 11, Winchester VA 22601; Mon-Fri 8-6, Sat 8-4, Sun 9-4; Google 5.0 from 1 review) and Martinsburg branch (736 Williamsport Pike Suite 2, Martinsburg WV 25404; Mon-Fri 9-6, Sat 9-4, Sun 9-4; Google 4.7 from 6 reviews), branches distinct, ratings never blended; 52 service-area GeoJSON features (Winchester 31 areas, Martinsburg 35, 14 shared); corridors I-81, I-66, I-70. Local moves are typically under 50–100 miles and completed in one day (domain pattern); regional moves cover the Shenandoah Valley and Eastern Panhandle (published). Service areas are the coverage pool, never a claim that a listed town sits on a particular highway.',
       ['movers winchester va', 'winchester movers', 'moving companies winchester va', 'movers martinsburg wv', 'moving company winchester va', 'winchester moving companies']),
    ds('residential-commercial-terms', 'The Flat Rate Movers — Residential Commercial Terms and Cost Drivers Dataset',
       'Commercial terms and cost drivers for residential moving from The Flat Rate Movers. Company claim, only: one flat rate quoted in writing before move day; no hourly meter; quote toggle Short (Quick Quote) default / Detailed Project. Domain education (general industry knowledge, never company terms): hourly billing vs binding estimate (fixed total for listed scope) vs non-binding estimate (approximate; final follows actual weight and conditions) vs not-to-exceed (capped maximum); valuation as Full Value Protection (repair, replace, or cash to declared value; typical minimum $6/lb) vs Released Value Protection ($0.60/lb per article; valuation is not insurance, per FMCSA consumer guidance); booking windows (local 2–4 weeks, peak 6–8 weeks, domain guidance); cost drivers (inventory size, packing level, access, distance, specialty items as separate line items). No company price, deposit, discount, fee, or valuation offering is stated: the valuation offering is gated and unclaimed.',
       ['flat rate movers', 'flat rate moving quote winchester', 'moving companies winchester va', 'local moving', 'moving and storage']),
    ds('residential-personas-triggers', 'The Flat Rate Movers — Residential Buyer Personas and Trigger Events Dataset',
       'Buyer personas and trigger events for residential moving from The Flat Rate Movers: renters moving between apartments, first-home buyers, growing families, downsizers, job relocators within the region, and closing-driven movers; triggers (lease end, home purchase or sale closing, job transfer, household growth or shrinkage, school-calendar moves, estate settlement as domain). Seasonality is domain data: peak May–September at roughly 60–70% of US moves, June the busiest month, month-end peaks, Monday the most common moving day at about 19%; peak-season booking 6–8 weeks ahead for local moves (domain guidance). Demand evidence: movers near me 246 impressions at 5.0 with 11 clicks (the site\'s best click source), moving companies winchester va 727 at 11.6, residential-moving 1,997 at 78.5.',
       ['movers near me', 'moving companies winchester va', 'local moving', 'apartment moves', 'moving and storage']),
    ds('residential-protection-compliance', 'The Flat Rate Movers — Residential Protection, Handling and Building Compliance Dataset',
       'Protection, handling, and building compliance for residential moving from The Flat Rate Movers: furniture protection and careful placement; blanket wrap and stretch wrap end to end; floor runners and doorway protection; disassembly and reassembly of standard furniture planned up front; fragile-only packing; white-glove care for high-value pieces; custom crates; heavy pieces under SIR/KIM-GS conditionally (1,500–3,500 lbs, floor-deflection check to L/360). Building compliance items (elevator reservation, loading-zone reservation, move hours, advance notice, HOA rules, certificates of insurance where managed buildings require them) are domain planning inputs, never capability claims. Liability education: valuation is not insurance; Full Value vs Released Value is explained in the commercial-terms dataset; no company coverage is claimed. Survey-room rule: film only — never lift, move, open, or climb anything heavy or locked.',
       ['residential moving', 'white glove moving', 'fragile packing', 'furniture protection', 'movers winchester va']),
    ds('residential-areas-quote-path', 'The Flat Rate Movers — Residential Service Areas, Dispatch and Quote Path Dataset',
       'Service areas, dispatch, and quote path for residential moving from The Flat Rate Movers: 52 service-area features (Winchester 31, Martinsburg 35, 14 shared), branches distinct with their own hours, addresses, and Google ratings; dispatch on I-81, I-66, and I-70 from both branches; quote path via Get My Flat Rate Quote (Short Quick Quote default, Detailed Project toggle preserving From, To, and What\'s moving) plus the film-only video-walkthrough survey room with a human-made estimate; no quote test posts ever. Eleven pages carry the residential service: the residential-moving hub, 4 category pages, and 6 near-me/guide pages. Storage bridge: gated — no storage page, product, or terms are published in this dataset; storage terms are attested separately and ship in their own later batch.',
       ['movers near me', 'moving companies winchester va', 'movers winchester va', 'winchester movers', 'movers martinsburg wv', 'moving and storage']),
]}

# ---------- 0. Backups ----------
for f in ['index.html', 'ai-sitemap.json', 'llms.txt', 'the-flat-rate-movers-data.txt']:
    shutil.copy2(PAGES / f, BACKUP / f)
for f in ['entity-graph.json', 'best-json-entity-graph.json']:
    shutil.copy2(MACH / 'data' / f, BACKUP / f)
shutil.copy2(FLAT / 'rubric.db', BACKUP / 'rubric.db')
print('backups written to', BACKUP)

# ---------- 1. Datasets file (package dir + live public/) ----------
ds_text = json.dumps(DATASETS, indent=2, ensure_ascii=False) + '\n'
(PKG / 'datasets-residential.json').write_text(ds_text, encoding='utf-8')
(PAGES / 'datasets-residential.json').write_text(ds_text, encoding='utf-8')
parsed = json.loads(ds_text)
ok(len(parsed['@graph']) == 8, 'datasets-residential.json: 8 Dataset nodes')
ok(all(n.get('license') == 'https://creativecommons.org/licenses/by/4.0/' for n in parsed['@graph']), 'all 8 datasets CC BY 4.0')
ok(all(n.get('dateModified') == '2026-10-29' for n in parsed['@graph']), 'all 8 datasets dateModified 2026-10-29')
ok(all(n.get('temporalCoverage') == '2010/2026' for n in parsed['@graph']), 'all 8 datasets temporalCoverage 2010/2026')
for bad in ['Spearman', 'Around Town', 'temp labor', 'crew page', 'subcontract', 'USDOT', 'MC-']:
    ok(bad not in ds_text, f'datasets contain no {bad!r}')
ok('storage terms are attested separately' in ds_text, 'D8 storage bridge gated, no storage terms claimed')

# ---------- 2. Machine graphs: append residential node (text insertion, zero other changes) ----------
RES_DESC = 'Flat-rate residential moving from Winchester, VA and Martinsburg, WV — houses and apartments, packing, heavy pieces under SIR/KIM-GS, local, regional and long-distance, one price in writing before move day.'
def node_text(with_url):
    lines = [
        '    {',
        '      "@id": "' + SITE + '/#service-residential",',
        '      "@type": "Service",',
        '      "areaServed": [',
        '        {',
        '          "@id": "' + SITE + '/#winchester-place"',
        '        },',
        '        {',
        '          "@id": "' + SITE + '/#martinsburg-place"',
        '        }',
        '      ],',
        '      "description": ' + json.dumps(RES_DESC, ensure_ascii=False) + ',',
        '      "name": "Residential Moving",',
        '      "provider": {',
        '        "@id": "' + ORG + '"',
        '      },',
        '      "serviceType": "Residential Moving"' + (',' if with_url else ''),
    ]
    if with_url:
        lines.append('      "url": "' + SITE + '/residential-moving/"')
    lines.append('    }')
    return '\n'.join(lines)

for fname, with_url in [('entity-graph.json', False), ('best-json-entity-graph.json', True)]:
    p = MACH / 'data' / fname
    txt = p.read_text(encoding='utf-8')
    ok(txt.count('#service-residential') == 0, f'{fname}: zero #service-residential before merge')
    anchor = ('\n    }\n  ],\n  "@id": "https://theflatratemovers.com/entity-graph.json"' if fname == 'entity-graph.json'
              else '\n    }\n  ],\n  "_humanSummary"')
    ok(txt.count(anchor) == 1, f'{fname}: unique @graph closing anchor')
    idx = txt.find(anchor)
    new = txt[:idx] + '\n    },\n' + node_text(with_url) + txt[idx + len('\n    }'):]
    d = json.loads(new)
    ok(len(d['@graph']) == (39 if fname == 'entity-graph.json' else 74), f'{fname}: node count now {len(d["@graph"])}')
    res = [n for n in d['@graph'] if n.get('@id') == SITE + '/#service-residential']
    ok(len(res) == 1, f'{fname}: exactly one #service-residential node')
    ok(res[0].get('serviceType') == 'Residential Moving', f'{fname}: node serviceType Residential Moving')
    p.write_text(new, encoding='utf-8')
    # mirrors: machine mirror + live public copy, byte-identical
    shutil.copy2(p, FLAT / fname)
    shutil.copy2(p, PAGES / fname)
    ok((PAGES / fname).read_bytes() == (FLAT / fname).read_bytes() == p.read_bytes(), f'{fname}: data/mirror/public byte-identical')

# ---------- 3. Head graph: upgrade thin node (balanced-brace replace) ----------
idx_path = PAGES / 'index.html'
html = idx_path.read_text(encoding='utf-8')
m = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
head_raw = m.group(1)
head = json.loads(head_raw)
thin = [n for n in head['@graph'] if n.get('@id') == SITE + '/#service-residential']
ok(len(thin) == 1, 'head graph: exactly one thin #service-residential node before merge')
ok(thin[0].get('serviceType') == 'Residential moving', 'head graph: thin node confirmed (serviceType Residential moving, 6 broad areas)')
# locate node span by balanced braces
nid = '"' + SITE + '/#service-residential"'
pos = head_raw.find(nid)
start = head_raw.rfind('{', 0, pos)
depth = 0
end = None
for k in range(start, len(head_raw)):
    if head_raw[k] == '{':
        depth += 1
    elif head_raw[k] == '}':
        depth -= 1
        if depth == 0:
            end = k + 1
            break
assert end, 'balanced-brace scan failed'
new_node = ('{"@type": "Service", "@id": "' + SITE + '/#service-residential", "name": "Residential Moving", '
            '"serviceType": "Residential Moving", "provider": {"@id": "' + ORG + '"}, '
            '"areaServed": ["Winchester, VA", "Martinsburg, WV", "Shenandoah Valley", "Eastern Panhandle"], '
            '"description": ' + json.dumps(RES_DESC, ensure_ascii=False) + '}')
new_head_raw = head_raw[:start] + new_node + head_raw[end:]
head2 = json.loads(new_head_raw)
ok(len(head2['@graph']) == 24, 'head graph: still 24 nodes after upgrade')
res2 = [n for n in head2['@graph'] if n.get('@id') == SITE + '/#service-residential']
ok(len(res2) == 1, 'head graph: exactly one #service-residential node after upgrade')
ok(res2[0].get('serviceType') == 'Residential Moving', 'head graph: node serviceType now Residential Moving')
ok(res2[0].get('areaServed') == ['Winchester, VA', 'Martinsburg, WV', 'Shenandoah Valley', 'Eastern Panhandle'], 'head graph: node areaServed 4 broad strings (senior/IT pattern)')
html = html[:m.start(1)] + new_head_raw + html[m.end(1):]
ok(html.count('#service-residential') == 13, 'index.html: #service-residential occurrences now 13 (was 13; head node upgraded in place, no duplicate)')

# ---------- 4. Residential div: static Dataset script block before closing </div> ----------
di = html.find('id="page-residential"')
divstart = html.rfind('<div', 0, di)
tag_re = re.compile(r'<(/?)div(?=[\s>])')
depth = 0
close_start = None
for mm in tag_re.finditer(html[divstart:]):
    if mm.group(1) == '':
        depth += 1
    else:
        depth -= 1
        if depth == 0:
            close_start = divstart + mm.start()
            break
assert close_start, 'residential div close not found'
block = '\n  <script type="application/ld+json">\n' + ds_text.rstrip('\n') + '\n  </script>\n'
html = html[:close_start] + block + html[close_start:]
# verify inserted block parses and holds 8 datasets, and sits inside the residential div
pos_ds = html.find('#dataset-residential-operations')
ok(pos_ds != -1, 'residential div: Dataset @id present')
scr_start = html.rfind('<script type="application/ld+json">', 0, pos_ds)
scr_end = html.find('</script>', pos_ds)
ok(divstart < scr_start, 'residential div: Dataset block starts inside the residential div')
ok(scr_end < html.find('<!-- ================= COMMERCIAL MOVING', scr_start), 'residential div: Dataset block ends before the commercial div')
parsed_blk = json.loads(html[html.find('{', scr_start):scr_end].strip())
ok(len(parsed_blk['@graph']) == 8, 'residential div block: 8 Dataset nodes')

# ---------- 5. Developer div: datasets collection card ----------
anchor = 'no loose copies, no invented entities.</p></article>'
ok(html.count(anchor) == 1, 'developer div: Entity graphs article anchor unique')
card = ('<article class="card"><h3>Residential datasets</h3><p><a href="/datasets-residential.json" target="_blank" rel="noopener"><b>datasets-residential.json →</b></a> — the full residential-moving datasets D1–D8 as Dataset JSON-LD (CC BY 4.0): household move operations, dwelling and access, item taxonomy, dispatch network, commercial terms, personas and triggers, protection and compliance, service areas and quote path — about the residential service, from both branches, never merged.</p></article>')
html = html.replace(anchor, anchor + card, 1)
ok('/datasets-residential.json' in html, 'developer div: datasets card inserted')

idx_path.write_text(html, encoding='utf-8')
print('index.html rewritten, bytes:', len(html))

# ---------- 6. llms.txt: services line refresh + dated update section ----------
llms_p = PAGES / 'llms.txt'
llms = llms_p.read_text(encoding='utf-8')
old_line = '- [Residential Moving](https://theflatratemovers.com/): Residential, local and regional moves at a guaranteed flat rate'
ok(llms.count(old_line) == 1, 'llms.txt: old residential line found once')
new_line = ('- [Residential Moving](https://theflatratemovers.com/residential-moving/): Flat-rate residential moving from Winchester, VA and Martinsburg, WV — houses and apartments, packing, heavy pieces under SIR/KIM-GS, local, regional and long-distance, one price in writing before move day. Full datasets D1–D8: household move operations, dwelling and access, item taxonomy, dispatch network, commercial terms (domain-labeled), personas and triggers, protection and compliance, service areas and quote path — Dataset JSON-LD at /datasets-residential.json, CC BY 4.0.')
llms = llms.replace(old_line, new_line, 1)
if not llms.endswith('\n'):
    llms += '\n'
llms += ('\n## Update — 2026-10-29 (residential deep batch)\n'
         '- Full #service-residential node added to both machine graphs (entity-graph.json, best-json-entity-graph.json) and the thin head-graph node upgraded to the same chain (same @id, no duplicate); the machine graphs previously held zero occurrences. Counts unchanged: 153 pages, 22 services, no new page (residential-moving exists, 1,997 impressions at 78.5 — position problem, not existence problem).\n'
         '- Residential datasets D1–D8 published as Dataset JSON-LD (/datasets-residential.json, CC BY 4.0, creator organization @id, dateModified 2026-10-29), with page-level markup on the residential-moving page and a Developer-page collection entry. Gated fields omitted, not guessed: storage terms, valuation offering, apartment-specific capability, same-day availability, debris scope, prohibited-items list, pricing beyond flat-rate-in-writing.\n')
llms_p.write_text(llms, encoding='utf-8')
ok('residential-moving/' in llms and 'datasets-residential.json' in llms, 'llms.txt: residential line + update section')

# ---------- 7. data txt: dated update section appended ----------
data_p = PAGES / 'the-flat-rate-movers-data.txt'
data = data_p.read_text(encoding='utf-8')
if not data.endswith('\n'):
    data += '\n'
data += ('\n## Update 2026-10-29 — residential deep batch\n'
         '- Full #service-residential Service node added to both machine graphs and the thin head-graph node upgraded to the same chain (same @id, no duplicate); the machine graphs previously held zero occurrences of service-residential. No new page (residential-moving already exists); counts unchanged at 153 pages and 22 services.\n'
         '- Residential datasets D1–D8 published as Dataset JSON-LD at https://theflatratemovers.com/datasets-residential.json (CC BY 4.0, dateModified 2026-10-29), with page-level markup on the residential-moving page and a Developer-page collection entry. Gated fields omitted, not guessed: storage terms, valuation offering, apartment-specific capability, same-day availability, debris scope, prohibited-items list, pricing beyond flat-rate-in-writing.\n')
data_p.write_text(data, encoding='utf-8')
ok('datasets-residential.json' in data, 'data txt: residential update section appended')

# ---------- 8. ai-sitemap: residential description refresh + GSC query keywords ----------
ai_p = PAGES / 'ai-sitemap.json'
ai = ai_p.read_text(encoding='utf-8')
old_desc = '"Flat-rate house and apartment moving, local, regional and long-distance."'
ok(ai.count(old_desc) == 1, 'ai-sitemap: old residential description found once')
ai = ai.replace(old_desc, json.dumps(RES_DESC, ensure_ascii=False), 1)
aij = json.loads(ai)
ok(len(aij['services']) == 22, 'ai-sitemap: still 22 services')
for kw in ['movers near me', 'moving companies winchester va', 'winchester movers', 'movers martinsburg wv']:
    if kw not in aij['keywords']:
        aij['keywords'].append(kw)
# write back preserving style: re-dump check — instead do text-level keyword insert
# (aij already modified in memory; dump with indent 2 and compare key order preserved)
ai_new = json.dumps(aij, indent=2, ensure_ascii=False) + '\n'
aij2 = json.loads(ai_new)
ok(len(aij2['keywords']) == 26, 'ai-sitemap: keywords now 26 (22 service names + 4 GSC queries)')
res_entry = [s for s in aij2['services'] if s['name'] == 'Residential Moving']
ok(len(res_entry) == 1 and res_entry[0]['description'] == RES_DESC, 'ai-sitemap: residential entry refreshed, not duplicated')
ok(aij2['dateModified'] == '2026-10-29', 'ai-sitemap: dateModified already 2026-10-29, unchanged')
ai_p.write_text(ai_new, encoding='utf-8')

# ---------- 9. Rubric DB: attestation rows for the new facts (no 'services.json id' evidence) ----------
db_path = FLAT / 'rubric.db'
db = sqlite3.connect(str(db_path))
canon = db.execute("SELECT COUNT(*) FROM service WHERE service_id LIKE '%#service-%'").fetchone()[0]
ok(canon == 22, f'rubric.db: canonical service rows already 22 (residential fragment row exists)')
oh = db.execute('SELECT COUNT(*) FROM opening_hours').fetchone()[0]
sa = db.execute('SELECT COUNT(*) FROM service_area').fetchone()[0]
ok(oh == 14 and sa == 66, f'rubric.db: opening_hours 14, service_area 66 (full footprint already covered, no new rows)')
rows = [
    ('Residential Moving full Service node #service-residential added to both machine graphs 2026-10-29; thin head node upgraded to the same chain; machine graphs previously held zero occurrences',
     'residential-deep package 2026-10-29, schema.json + research doc §6', '2026-10-29', SITE + '/residential-moving/'),
    ('Residential Moving datasets D1–D8 published as Dataset JSON-LD 2026-10-29, CC BY 4.0, creator organization @id, dateModified 2026-10-29; gated fields (storage terms, valuation offering, apartment capability, same-day availability, debris scope, prohibited list, pricing beyond flat-rate-in-writing) omitted',
     'residential-deep package 2026-10-29, datasets-residential.json', '2026-10-29', SITE + '/datasets-residential.json'),
]
for r in rows:
    exists = db.execute('SELECT COUNT(*) FROM attestation WHERE claim = ?', (r[0],)).fetchone()[0]
    if not exists:
        db.execute('INSERT INTO attestation (claim, source, verified, evidence) VALUES (?, ?, ?, ?)', r)
db.commit()
att = db.execute("SELECT COUNT(*) FROM attestation WHERE evidence LIKE '%services.json id%'").fetchone()[0]
ok(att == 22, f'rubric.db: services.json-id attestations still 22 (new rows use different evidence)')
db.close()

print()
if FAIL:
    print('MERGE FAILURES:', len(FAIL))
    for f in FAIL:
        print(' -', f)
    sys.exit(1)
print('MERGE OK — all checks passed')
