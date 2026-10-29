#!/usr/bin/env python3
"""Gun-safe deep batch builder — mirrors the residential deep batch pattern.

Edits (all verified, nothing hand-counted):
  1. datasets-gun-safe.json (8 Dataset nodes, CC BY 4.0, dateModified 2026-10-29)
     -> package dir + Pages public/
  2. Machine graphs: entity node upgraded IN PLACE (url -> hub, areaServed ->
     place @ids); best graph gains the fragment node; BOTH graphs' Place nodes
     expanded to the full footprint (DB service_area lists: Winchester 31,
     Martinsburg 35, shared 14) per brief s5 + merge-note s3.
     Copies -> local mirror + Pages public/, byte-identical.
  3. Head graph node upgraded in place (serviceType casing, areaServed pattern).
  4. Static Dataset JSON-LD block inside the gunsafe hub div.
  5. Developer-page "Gun Safe datasets" card after the Residential card.
  6. llms.txt gun-safe services line refreshed + dated update section.
  7. data txt dated update section appended (name list + SIR section untouched).
  8. ai-sitemap: +3 real GSC keywords only (26 -> 29); services 22, hasPart 153.
  9. Rubric DB: 2 attestation rows (evidence deliberately WITHOUT the string
     'services.json id' so the verify constraint stays 22). NO edge rows, NO
     rubric_check row, NO service/opening_hours/service_area row changes.
NOT done (brief governs over merge-note proposals): no per-page JSON
(follow-up), no edge rows, no rubric_check row, no ARD change (residential
datasets are not in ARD either), no live copy changes, no GBP/DNS/quote tests.
"""
import json, re, shutil, sqlite3, subprocess, sys
from pathlib import Path

HOME = Path.home()
MACH = HOME / 'workspace/the-flat-rate-machine'
PAGES = HOME / 'workspace/the-flat-rate-movers-pages/public'
FLAT = HOME / 'workspace/theflatratemovers'
PKG = MACH / 'out/pages/gun-safe-deep'
BATCH = MACH / 'out/gun-safe-batch'
BACKUP = BATCH / 'backup-2026-10-29'
TODAY = '2026-10-29'
SITE = 'https://theflatratemovers.com'
ORG = SITE + '/#organization'
SVC = SITE + '/#service-gun-safe'
HUB = SITE + '/gun-safe-movers/'
WIN_PLACE = SITE + '/#winchester-place'
MAR_PLACE = SITE + '/#martinsburg-place'
WIN_HEAD = SITE + '/#winchester'
MAR_HEAD = SITE + '/#martinsburg'
LICENSE = 'https://creativecommons.org/licenses/by/4.0/'
SAMEAS = ['https://www.instagram.com/theflatratemovers/',
          'https://www.threads.com/@theflatratemovers',
          'https://x.com/ratemovers',
          'https://www.youtube.com/@theflatratemovers',
          'https://github.com/TheFlatRateMovers',
          'https://medium.com/@ratemovers']
DIST = [{'contentUrl': SITE + '/ai-sitemap.json', 'encodingFormat': 'application/json'},
        {'contentUrl': SITE + '/service-area.geojson', 'encodingFormat': 'application/json'},
        {'contentUrl': SITE + '/entity-graph.json', 'encodingFormat': 'application/ld+json'},
        {'contentUrl': SITE + '/best-json-entity-graph.json', 'encodingFormat': 'application/ld+json'}]
BANNED = re.compile(r'temp labor|crew page|spearman|around town movers|USDOT|MC-\d{4}|subcontract', re.I)

def fail(msg):
    print('FAIL:', msg); sys.exit(1)

def span_of(text, idstr):
    """Return (start, end) of the JSON object containing "@id": idstr."""
    pos = text.find('"@id": "%s"' % idstr)
    if pos < 0: fail('id not found: ' + idstr)
    start = text.rfind('{', 0, pos)
    depth, i, in_str, esc = 0, start, False, False
    while i < len(text):
        ch = text[i]
        if in_str:
            if esc: esc = False
            elif ch == '\\': esc = True
            elif ch == '"': in_str = False
        else:
            if ch == '"': in_str = True
            elif ch == '{': depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0: return (start, i + 1)
        i += 1
    fail('unbalanced braces for ' + idstr)

def span_of_typed(text, idstr, typ):
    """Span of the object whose @id == idstr AND @type == typ (Place nodes share
    their @id with Service areaServed references, so a bare count misleads)."""
    start = 0
    while True:
        pos = text.find('"@id": "%s"' % idstr, start)
        if pos < 0: fail('typed id not found: ' + idstr + ' / ' + typ)
        s = text.rfind('{', 0, pos)
        depth, i, in_str, esc = 0, s, False, False
        while i < len(text):
            ch = text[i]
            if in_str:
                if esc: esc = False
                elif ch == '\\': esc = True
                elif ch == '"': in_str = False
            else:
                if ch == '"': in_str = True
                elif ch == '{': depth += 1
                elif ch == '}':
                    depth -= 1
                    if depth == 0: break
            i += 1
        if depth != 0: fail('unbalanced braces for ' + idstr)
        try:
            node = json.loads(text[s:i + 1])
        except Exception:
            node = {}
        if node.get('@type') == typ:
            return (s, i + 1)
        start = pos + 1

def replace_areaServed(span, items):
    """Replace the areaServed array inside span with items (strings or @id dicts)."""
    m = re.search(r'"areaServed": \[', span)
    if not m: fail('no areaServed in span')
    line_start = span.rfind('\n', 0, m.start()) + 1
    line_prefix = span[line_start:m.start()]
    field_indent = line_prefix[:len(line_prefix) - len(line_prefix.lstrip())]
    item_indent = field_indent + '  '
    depth, i, in_str, esc = 0, m.end() - 1, False, False
    while i < len(span):
        ch = span[i]
        if in_str:
            if esc: esc = False
            elif ch == '\\': esc = True
            elif ch == '"': in_str = False
        else:
            if ch == '"': in_str = True
            elif ch == '[': depth += 1
            elif ch == ']':
                depth -= 1
                if depth == 0: break
        i += 1
    if depth != 0: fail('unbalanced areaServed array')
    rendered = []
    for it in items:
        if isinstance(it, dict):
            rendered.append(item_indent + '{"@id": "%s"}' % it['@id'])
        else:
            rendered.append(item_indent + json.dumps(it))
    new_arr = '"areaServed": [\n' + ',\n'.join(rendered) + '\n' + field_indent + ']'
    return span[:m.start()] + new_arr + span[i + 1:]

# ---------- 0. backups ----------
BACKUP.mkdir(parents=True, exist_ok=True)
for src in [PAGES / 'index.html', PAGES / 'ai-sitemap.json', PAGES / 'llms.txt',
            PAGES / 'the-flat-rate-movers-data.txt',
            MACH / 'data/entity-graph.json', MACH / 'data/best-json-entity-graph.json',
            FLAT / 'rubric.db']:
    if not (BACKUP / src.name).exists():  # never overwrite the true pre-edit backup on re-runs
        shutil.copy2(src, BACKUP / src.name)
print('backups ->', BACKUP)

# ---------- pre-checks ----------
staged = json.loads((PKG / 'schema.json').read_text())
staged_svc = staged['@graph'][0]
staged_desc = staged_svc['description']
svc_reg = json.loads((MACH / 'data/services.json').read_text())
pages_reg = json.loads((MACH / 'data/pages.json').read_text())
gs = [s for s in svc_reg['services'] if s['id'] == 'service-gun-safe']
assert len(gs) == 1, 'service-gun-safe registry entries != 1'
refs = sum(1 for p in pages_reg['pages'] if 'service-gun-safe' in (p.get('services') or []))
print('registry: services=%d pages=%d gun-safe pageCount=%d refs=%d' % (
    len(svc_reg['services']), len(pages_reg['pages']), gs[0]['pageCount'], refs))
if gs[0]['pageCount'] != 9 or refs != 9: fail('gun-safe pageCount/refs != 9')

db = sqlite3.connect(str(FLAT / 'rubric.db'))
win_areas = [r[0] for r in db.execute(
    "SELECT area FROM service_area WHERE place_id=? ORDER BY area", (WIN_PLACE,))]
mar_areas = [r[0] for r in db.execute(
    "SELECT area FROM service_area WHERE place_id=? ORDER BY area", (MAR_PLACE,))]
print('DB footprint: winchester=%d martinsburg=%d shared=%d' % (
    len(win_areas), len(mar_areas), len(set(win_areas) & set(mar_areas))))
if (len(win_areas), len(mar_areas), len(set(win_areas) & set(mar_areas))) != (31, 35, 14):
    fail('DB footprint != 31/35/14')
canon_before = db.execute("SELECT COUNT(*) FROM service WHERE service_id LIKE '%#service-%'").fetchone()[0]
att22_before = db.execute("SELECT COUNT(*) FROM attestation WHERE evidence LIKE '%services.json id%'").fetchone()[0]
edge_before = db.execute("SELECT COUNT(*) FROM edge").fetchone()[0]
check_before = db.execute("SELECT COUNT(*) FROM rubric_check").fetchone()[0]
oh_before = db.execute("SELECT COUNT(*) FROM opening_hours").fetchone()[0]
sa_before = db.execute("SELECT COUNT(*) FROM service_area").fetchone()[0]
print('DB before: canon=%d att22=%d edge=%d rubric_check=%d opening_hours=%d service_area=%d' % (
    canon_before, att22_before, edge_before, check_before, oh_before, sa_before))
if (canon_before, att22_before, edge_before, check_before, oh_before, sa_before) != (22, 22, 40, 7, 14, 66):
    fail('DB baseline unexpected')

# ---------- 1. datasets file ----------
def ds(slug, name, desc, keywords):
    if not (50 <= len(desc) < 5000): fail('dataset description length: ' + slug)
    if BANNED.search(desc + ' ' + ' '.join(keywords)): fail('banned string in dataset: ' + slug)
    return {'@id': SITE + '/#dataset-' + slug, '@type': 'Dataset', 'name': name,
            'description': desc, 'keywords': keywords, 'about': [{'@id': SVC}],
            'spatialCoverage': [{'@id': WIN_HEAD}, {'@id': MAR_HEAD}],
            'temporalCoverage': '2010/2026', 'dateModified': TODAY,
            'creator': {'@id': ORG, 'sameAs': SAMEAS}, 'license': LICENSE,
            'distribution': DIST, 'sameAs': HUB}

DATASETS = {'@context': 'https://schema.org', '@graph': [
    ds('gun-safe-operations', 'Gun Safe Move Operations',
       'Gun safe and high-mass safe moving under SIR Structural Integrity Relocation and the KIM-GS Protocol, for safes of 1,500 to 3,500 lbs. The published operation chain runs quote intake (make, model, or approximate weight; pickup and delivery addresses; access at both ends) to route and clearance survey, floor deflection analysis to L/360 with a load-spreading plan, floor protection, controlled move, secured upright transport, and verified placement exactly where the owner wants it, quoted at one flat rate in writing before move day. The protocol page states the same five steps in order: survey and floor check, protect and move, place and verify. Quote intake runs through the Short (Quick Quote) default and Detailed Project toggle, inputs preserved, and a film-only video walkthrough where a walkthrough fits: film only, never lift, move, open, or climb anything heavy or locked, with a human-made estimate. Sub-band handling for safes below 1,500 lbs, stairs policy limits, emptying instruction, equipment deployment, re-anchoring, vault installation scope, calibration classes, wider long-distance safe scope, and locksmith services are gated attestation questions and are omitted, not guessed.',
       ['gun safe movers', 'gun safe movers winchester va', 'gun safe moving', 'safe movers', 'heavy safe moving']),
    ds('gun-safe-weight-access', 'Gun Safe Weight Bands and Access Operations',
       'Weight bands and access operations for gun safe moving. The published SIR band covers safes of 1,500 to 3,500 lbs; the hub notes most gun safes it is called about land in that band. Domain weight context, labeled: quick-access pistol safes 15 to 100 lbs, entry-level rifle safes 200 to 600 lbs, mid-range 600 to 1,000 lbs, large and high-end 1,000 to 1,600 plus lbs, commercial and vault units 1,500 to 5,000 lbs; manufacturer specs govern each safe, never size-class guesses. Handling for safes below 1,500 lbs and units above the band is a survey question, gated, not a published claim. Access operations are quote inputs, not capability claims: ground floor and garage, basement down-stairs descent, upper-floor up-stairs ascent, elevator-served upper floors where the elevator is rated for the weight, tight turns and narrow doorways including handle and hinge footprint, truck-to-door carry distance, and floor type (concrete slab versus wood joist upper floors). The published floor check is deflection analysis to L/360 with load spreading; domain context, labeled: typical living areas designed for a 40 pounds-per-square-foot live load with a 300-pound concentrated load on a six-inch square, and domain placement guidance to set the safe perpendicular across joists near a load-bearing wall with a plywood pad. Stairs are the highest-risk step in any safe move in domain consensus; the company stairs policy limits are gated and not stated here.',
       ['gun safe movers', 'heavy gun safe moving', 'gun safe moving stairs', 'basement gun safe moving', 'safe movers winchester va']),
    ds('gun-safe-taxonomy', 'Gun Safe and Access Taxonomy',
       'Safe and access taxonomy for gun safe moving. Safe types: home gun safes (the core category), commercial safes (published via high-mass safe moving and the 3,500 lb case), vaults and vault doors (relocation under SIR on the technical-rigging page; installation scope gated), calibration-sensitive safes and precision equipment (SIR-method handling on the calibration page; equipment classes gated), and fire safes as a domain class only with no dedicated company page. Access types: stairs, basements, upper floors, elevator-served routes, doorways and hallways, parking and loading zones, floor types, and floor transitions. Equipment taxonomy is domain inventory only, labeled: heavy-duty appliance dollies, stair-climbing dollies and motorized stair climbers, safe jacks, J-bars, pipe rollers, furniture sliders, ratchet and lifting straps, ramps, Masonite floor protection, door-jamb guards, moving blankets, plywood sheets, and rubber mats. No equipment in that list is claimed as company-deployed; equipment actually deployed is a gated attestation question. Cross-references, never duplications: piano moving, whole-home moves with a safe inside, custom crating where a piece needs more, and SIR method authority.',
       ['gun safe moving', 'gun safe movers winchester va', 'vault relocation', 'safe moving', 'heavy safe movers']),
    ds('gun-safe-dispatch', 'Gun Safe Branch Dispatch Network',
       'Branch dispatch network for gun safe moving. Winchester: The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester VA 22601, hours Mon-Fri 8-6, Sat 8-4, Sun 9-4, Google rating 5.0 from 1 review. Martinsburg: Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg WV 25404, hours Mon-Fri 9-6, Sat 9-4, Sun 9-4, Google rating 4.7 from 6 reviews. Branches are never merged and ratings are never blended. Coverage is the full footprint of 52 GeoJSON service-area features: Winchester 31 areas, Martinsburg 35 areas, 14 shared, dispatched across the I-81, I-66, and I-70 corridor network from both branches; listed areas are the coverage pool, never a claim that a listed town sits on a particular highway. Long-distance safe scope published today is the Winchester to Las Vegas case pages (1,600 lb and long-distance versions); wider corridor scope for safe moves is gated. This node refresh fixes the prior Martinsburg skew: both branches carry equal weight in the refreshed node.',
       ['gun safe movers winchester va', 'gun safe movers martinsburg wv', 'gun safe moving virginia', 'safe movers near me']),
    ds('gun-safe-commercial-terms', 'Gun Safe Commercial Terms and Cost Drivers',
       'Commercial terms and cost drivers for gun safe moving. The only company pricing claim is one flat rate quoted in writing before move day, with no hourly clock, under the tagline Guaranteed Flat Rate or Your Move is Free. No company price, discount, deposit, fee, surcharge, or stair charge is stated anywhere in this dataset. Domain market markers, labeled domain and never company prices: bulky-item handling 150 to 400 dollars per item in mover pricing data; stairs and long carries 75 to 500 plus dollars in domain guides; local hourly crews 135 to 225 dollars for two to four movers in domain guides; a standard local safe move range of 175 to 1,000 plus dollars by complication in a domain guide. Domain cost drivers, labeled: weight and size, distance, stairs, tight doorways, long carry, access at both ends, surface protection, and whether the safe moves as part of a larger move. Risk transfer in the published model: the price is settled before move day, so the customer does not pay for every slow stair, parking hunt, or delay; in the hourly domain model the customer does. Sub-band pricing basis is gated and not assumed to match the SIR band. Historical figures from private threads are never published and appear nowhere here.',
       ['gun safe movers', 'gun safe moving cost', 'flat rate gun safe moving', 'safe movers winchester va']),
    ds('gun-safe-personas', 'Gun Safe Buyer Personas and Trigger Events',
       'Buyer personas and trigger events for gun safe moving. Personas: homeowners with a heavy safe already in the home (the core buyer, usually a single-item job), collectors and high-value households, new-purchase buyers needing dealer delivery and placement, home movers with a safe in the inventory (the residential category owns the move, this category owns the safe), renovators moving a safe out and back, estate handlers, and long-distance relocators. Triggers: new safe purchase or delivery, home purchase or sale, renovation, estate settlement, job relocation, and dealer delivery. Buying criteria: method over muscle (survey and floor check before anything lifts), discretion (strangers in the home, exact placement, no public review afterward), exact placement in the chosen room and spot verified, one flat price in writing, and no damage to floors, stairs, or trim. Review asymmetry, stated as mechanism: high-value clients do not post public reviews for privacy, so pack position trails on review volume while organic and AI strength hold; pack position is never a quality signal here. The actual searcher asks three questions in order: will my floor hold it, will my stairs carry it, and can I trust strangers in my home with it.',
       ['gun safe movers', 'gun safe movers winchester va', 'safe movers', 'gun safe moving winchester va']),
    ds('gun-safe-compliance', 'Gun Safe Floor, Protection and Handling Compliance',
       'Floor, protection, and handling compliance for gun safe moving. Published company checks: floor deflection analysis to L/360, load spreading, floor protection, and verified placement, with route, stairs, and floor checked before the safe moves. Domain context, labeled: International Residential Code typical living areas designed for a 40 pounds-per-square-foot live load with a 300-pound concentrated load on a six-inch square; concrete slab foundations support virtually any residential safe in domain guidance; domain placement guidance sets the safe perpendicular across joists near a load-bearing wall with a plywood pad. Domain handling process, labeled: straps and rated dollies secure the safe, no risky free-lifting, stairs taken one step at a time with a spotter and constant communication, stopping immediately if the safe shifts or tilts, secured upright transport, and placement adjusted so the owner can re-anchor or have a specialist secure it. Protection materials in domain practice: floor protection, corner and doorway guards, blankets, and runners. Gated and omitted: the emptying instruction (domain practice empties the safe completely before move day, firearms, ammunition, documents, and valuables out and transported separately; the company instruction is unattested), re-anchoring offer (unbolt and re-bolt versus referral versus owner), and calibration equipment classes. No engineering certification is claimed. Survey walkthroughs follow the film-only rule: never lift, move, open, or climb anything heavy or locked.',
       ['gun safe moving', 'safe floor check', 'gun safe stairs', 'safe movers winchester va', 'vault relocation']),
    ds('gun-safe-areas-quote', 'Gun Safe Service Areas, Dispatch and Quote Path',
       'Service areas, dispatch, and quote path for gun safe moving. Full footprint at merge, branches distinct: 52 GeoJSON service-area features, Winchester 31 areas, Martinsburg 35 areas, 14 shared. Winchester branch: The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester VA 22601, Mon-Fri 8-6, Sat 8-4, Sun 9-4, Google 5.0 from 1 review. Martinsburg branch: Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg WV 25404, Mon-Fri 9-6, Sat 9-4, Sun 9-4, Google 4.7 from 6 reviews. Phone +1-540-422-2153. Founded June 2010. Dispatch across the I-81, I-66, and I-70 corridor network from both branches. Nine pages carry the service: the gun-safe-movers hub, two branch pages, the safe-moving-protocol page, two case pages, the long-distance Winchester to Las Vegas page, the vault-moving category page, and the technical-rigging vault relocation page, with SIR method docs and the heavy hub as authority cross-references. Quote path: Short (Quick Quote) default and Detailed Project toggle with inputs preserved, main call to action Get My Flat Rate Quote and pill Get a flat rate quote, intake asking make, model, or approximate weight, film-only video walkthrough where a walkthrough fits, and no test posts ever.',
       ['gun safe movers', 'gun safe movers winchester va', 'gun safe movers martinsburg wv', 'safe movers near me', 'gun safe moving virginia']),
]}
ds_text = json.dumps(DATASETS, indent=2) + '\n'
(PKG / 'datasets-gun-safe.json').write_text(ds_text)
(PAGES / 'datasets-gun-safe.json').write_text(ds_text)
print('datasets: 8 nodes written to package + public')

# ---------- 2. machine graphs ----------
def edit_graph(path, is_best):
    text = path.read_text()
    if is_best:
        n_occ = text.count('"@id": "%s"' % SVC)
        if n_occ == 1:
            # idempotent re-run: verify the existing node already matches, skip append
            pre = json.loads(text)
            gn = [n for n in pre['@graph'] if n.get('@id') == SVC][0]
            if gn.get('url') != HUB or gn.get('serviceType') != 'Gun Safe Moving' or \
               gn.get('areaServed') != [{'@id': WIN_PLACE}, {'@id': MAR_PLACE}]:
                fail('best graph existing gun-safe node does not match intended node')
        elif n_occ == 0:
            anchor = '\n    }\n  ],\n  "_humanSummary"'
            if text.count(anchor) != 1: fail('best-graph append anchor != 1')
            node = {'@id': SVC, '@type': 'Service', 'name': 'Gun Safe Moving',
                    'serviceType': 'Gun Safe Moving',
                    'provider': {'@id': ORG}, 'url': HUB,
                    'areaServed': [{'@id': WIN_PLACE}, {'@id': MAR_PLACE}]}
            lines = json.dumps(node, indent=2).split('\n')
            indented = '\n'.join('    ' + ln for ln in lines)
            text = text.replace(anchor, '\n    },\n' + indented + '\n  ],\n  "_humanSummary"', 1)
        else:
            fail('unexpected gun-safe occurrences in %s' % path.name)
    elif text.count('"@id": "%s"' % SVC) != 1:
        fail('unexpected gun-safe occurrences in %s' % path.name)
    else:
        s, e = span_of(text, SVC)
        span = text[s:e]
        if '"url": "%s"' % HUB not in span:
            span2 = re.sub(r'"url": "[^"]*"', '"url": "%s"' % HUB, span, count=1)
            if span2 == span: fail('entity url replacement failed')
            span = span2
        span = replace_areaServed(span, [{'@id': WIN_PLACE}, {'@id': MAR_PLACE}])
        text = text[:s] + span + text[e:]
    # (best-graph append lives in the is_best branch above; entity branch above)
    # Place expansion in both graphs (typed span: @id also appears in references)
    for pid, areas in ((WIN_PLACE, win_areas), (MAR_PLACE, mar_areas)):
        s, e = span_of_typed(text, pid, 'Place')
        span = replace_areaServed(text[s:e], areas)
        text = text[:s] + span + text[e:]
    obj = json.loads(text)
    nodes = obj['@graph']
    gs_nodes = [n for n in nodes if n.get('@id') == SVC]
    if len(gs_nodes) != 1: fail('graph %s gun-safe nodes != 1' % path.name)
    gn = gs_nodes[0]
    if gn.get('url') != HUB: fail('graph %s gun-safe url != hub' % path.name)
    if gn.get('serviceType') != 'Gun Safe Moving': fail('graph %s serviceType' % path.name)
    if gn.get('areaServed') != [{'@id': WIN_PLACE}, {'@id': MAR_PLACE}]:
        fail('graph %s areaServed != place @ids' % path.name)
    for pid, areas in ((WIN_PLACE, win_areas), (MAR_PLACE, mar_areas)):
        pn = [n for n in nodes if n.get('@id') == pid]
        if len(pn) != 1 or pn[0].get('areaServed') != areas:
            fail('graph %s place %s != footprint' % (path.name, pid))
    path.write_text(text)
    print('graph %s: nodes=%d gun-safe=1 url=hub places=31/35' % (path.name, len(nodes)))
    return len(nodes)

eg_n = edit_graph(MACH / 'data/entity-graph.json', False)
best_n = edit_graph(MACH / 'data/best-json-entity-graph.json', True)
if (eg_n, best_n) != (39, 75): fail('graph node counts != 39/75')
for fname in ('entity-graph.json', 'best-json-entity-graph.json'):
    for dest in (FLAT / fname, PAGES / fname):
        shutil.copy2(MACH / 'data' / fname, dest)
    for dest in (FLAT / fname, PAGES / fname):
        if dest.read_bytes() != (MACH / 'data' / fname).read_bytes():
            fail('mirror copy mismatch: ' + str(dest))
print('graphs mirrored byte-identical to local mirror + public')

# ---------- 3. head graph + div block + developer card ----------
html = (PAGES / 'index.html').read_text()
if 'datasets-gun-safe.json' in html or 'gun-safe deep batch' in html:
    fail('index.html already contains gun-safe batch artifacts (refusing double-insert)')
m = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
head = json.loads(m.group(1))
head_nodes = head['@graph']
head_gs = [n for n in head_nodes if n.get('@id') == SVC]
if len(head_gs) != 1: fail('head gun-safe nodes != 1')
if head_gs[0].get('description') != staged_desc:
    print('NOTE: head description differs from staged; upgrading to staged text')
head_block = m.group(0)
s, e = span_of(head_block, SVC)
span = head_block[s:e]
if '"serviceType": "Gun Safe Moving"' not in span:
    span2 = re.sub(r'"serviceType": "[^"]*"', '"serviceType": "Gun Safe Moving"', span, count=1)
    if span2 == span: fail('head serviceType replacement failed')
    span = span2
span = replace_areaServed(span, ['Winchester, VA', 'Martinsburg, WV',
                                 'Shenandoah Valley', 'Eastern Panhandle of West Virginia'])
span = re.sub(r'"description": "(?:[^"\\]|\\.)*"',
              lambda m: '"description": %s' % json.dumps(staged_desc), span, count=1)
new_head_block = head_block[:s] + span + head_block[e:]
html = html[:m.start()] + new_head_block + html[m.end():]
# re-verify head block parses with exactly one gun-safe node, 24 nodes
m2 = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
h2 = json.loads(m2.group(1))
if len(h2['@graph']) != 24: fail('head nodes != 24 after edit')
if sum(1 for n in h2['@graph'] if n.get('@id') == SVC) != 1: fail('head gun-safe != 1 after edit')
gs2 = [n for n in h2['@graph'] if n.get('@id') == SVC][0]
if gs2.get('serviceType') != 'Gun Safe Moving' or gs2.get('description') != staged_desc:
    fail('head node fields wrong after edit')
if gs2.get('areaServed') != ['Winchester, VA', 'Martinsburg, WV', 'Shenandoah Valley',
                             'Eastern Panhandle of West Virginia']:
    fail('head areaServed != 4 broad strings')
print('head graph: 24 nodes, gun-safe upgraded (serviceType casing + areaServed pattern)')

# gunsafe div block
di = html.find('id="page-gunsafe"')
if di < 0: fail('gunsafe div not found')
divstart = html.rfind('<div', 0, di)
tag_re = re.compile(r'<(/?)div(?=[\s>])')
depth = 0; divclose = None
for mm in tag_re.finditer(html[divstart:]):
    depth += -1 if mm.group(1) else 1
    if depth == 0:
        divclose = divstart + mm.start(); break
if divclose is None: fail('gunsafe div close not found')
nxt = html.find('<div class="page" id="page-residential"', divstart)
block = '\n<script type="application/ld+json">' + json.dumps(DATASETS, indent=2) + '</script>\n'
html = html[:divclose] + block + html[divclose:]
# post-insertion positions: block must end before the (shifted) residential div
blk_id = html.find('"@id": "https://theflatratemovers.com/#dataset-gun-safe-operations"', divclose)
blk_end = html.find('</script>', divclose) + len('</script>')
nxt_new = html.find('<div class="page" id="page-residential"', divstart)
if not (divclose < blk_id < blk_end < nxt_new):
    fail('dataset block not inside gunsafe div / before residential div')
print('gunsafe div: dataset block inserted inside div, before residential div')

# developer card after Residential card
h3 = html.find('<h3>Residential datasets</h3>')
if h3 < 0: fail('residential card not found')
card_end = html.find('</article>', h3)
if card_end < 0: fail('residential card close not found')
card_end += len('</article>')
dev_start = html.find('id="page-developer"')
dev_next = html.find('<div class="page"', dev_start + 1)
if not (dev_start < card_end < dev_next): fail('residential card not inside developer div')
card = ('<article class="card"><h3>Gun Safe datasets</h3><p>'
        '<a href="/datasets-gun-safe.json" target="_blank" rel="noopener">'
        '<b>datasets-gun-safe.json \u2192</b></a> \u2014 the full gun-safe-moving datasets '
        'D1\u2013D8 as Dataset JSON-LD (CC BY 4.0): safe move operations, weight bands and access, '
        'safe and access taxonomy, branch dispatch network, commercial terms, buyer personas and '
        'triggers, floor, protection, and handling compliance, service areas, dispatch, and quote path '
        '\u2014 about the gun-safe service, from both branches, never merged.</p></article>')
html = html[:card_end] + card + html[card_end:]
print('developer card: Gun Safe datasets inserted after Residential card')

# ---------- 6. llms.txt ----------
llms = PAGES / 'llms.txt'
ll = llms.read_text()
if 'gun-safe deep batch' in ll: fail('llms.txt already has gun-safe update section')
old_line = ('- [Gun Safe Moving](https://theflatratemovers.com/gun-safe-movers/): '
            'Gun safe moving, SIR and KIM-GS, high-mass assets up to 3,500 lbs, L/360 floor deflection analysis')
if ll.count(old_line) != 1: fail('llms old gun-safe line != 1')
new_line = ('- [Gun Safe Moving](https://theflatratemovers.com/gun-safe-movers/): ' + staged_desc +
            ' Datasets D1\u2013D8 (CC BY 4.0): safe move operations; weight bands and access; safe and access '
            'taxonomy; branch dispatch network; commercial terms (flat-rate-in-writing only; domain markers labeled); '
            'buyer personas and triggers; floor, protection, and handling compliance; service areas, dispatch, and quote path. '
            'Full datasets: https://theflatratemovers.com/datasets-gun-safe.json')
ll = ll.replace(old_line, new_line, 1)
if 'residential deep batch' not in ll: fail('llms history lost')
ll += ('\n## Update \u2014 2026-10-29 (gun-safe deep batch)\n'
       '- Full #service-gun-safe Service node refreshed in both machine graphs and the thin head-graph node upgraded to the same chain (same @id, no duplicate); the entity-graph node was Martinsburg-skewed (url = Martinsburg page, areaServed = Martinsburg areas) and the best graph held no fragment node. No new page (hub + branch + protocol + case pages exist, 9 pages carry the service); counts unchanged at 153 pages and 22 services.\n'
       '- Gun-safe datasets D1\u2013D8 published as Dataset JSON-LD at https://theflatratemovers.com/datasets-gun-safe.json (CC BY 4.0, dateModified 2026-10-29), with page-level markup on the gun-safe-movers hub page and a Developer-page collection entry. Gated fields omitted, not guessed: sub-band handling, stairs policy, emptying instruction, equipment deployment, re-anchoring, vault installation scope, calibration classes, long-distance safe scope, locksmith services, crew size and truck claims.\n')
llms.write_text(ll)
print('llms.txt: gun-safe line refreshed + dated update section')

# ---------- 7. data txt ----------
dt = PAGES / 'the-flat-rate-movers-data.txt'
tx = dt.read_text()
if 'gun-safe deep batch' in tx: fail('data txt already has gun-safe update section')
if 'Gun Safe Moving' not in tx: fail('data txt missing Gun Safe Moving name')
tx += ('\n## Update 2026-10-29 \u2014 gun-safe deep batch\n'
       '- Full #service-gun-safe Service node refreshed in both machine graphs and the head-graph node upgraded to the same chain (same @id, no duplicate); entity node was Martinsburg-skewed, best graph held no fragment node. No new page; counts unchanged at 153 pages and 22 services.\n'
       '- Gun-safe datasets D1\u2013D8 published as Dataset JSON-LD at https://theflatratemovers.com/datasets-gun-safe.json (CC BY 4.0, dateModified 2026-10-29), with page-level markup on the gun-safe hub page and a Developer-page collection entry. Gated fields omitted, not guessed: sub-band handling, stairs policy, emptying instruction, equipment deployment, re-anchoring, vault installation scope, calibration classes, long-distance safe scope, locksmith services, crew size and truck claims.\n')
dt.write_text(tx)
print('data txt: dated update section appended (name list + SIR section untouched)')

# ---------- 8. ai-sitemap ----------
ai_p = PAGES / 'ai-sitemap.json'
ai_raw = ai_p.read_text()
ai = json.loads(ai_raw)
gs_entry = [s for s in ai.get('services', []) if 'gun-safe' in json.dumps(s).lower() or 'Gun Safe' in json.dumps(s)]
if len(gs_entry) != 1: fail('ai-sitemap gun-safe entries != 1')
if gs_entry[0].get('description') != staged_desc:
    print('NOTE: ai-sitemap gun-safe description differs from staged; keeping live text (update-in-place only for keywords)')
new_kw = ['gun safe movers', 'gun safe movers winchester va', 'gun safe movers martinsburg wv']
for kw in new_kw:
    if kw not in ai['keywords']: ai['keywords'].append(kw)
ai_new = json.dumps(ai, indent=2)
if ai_raw.endswith('\n'): ai_new += '\n'
ai_p.write_text(ai_new)
ai2 = json.loads(ai_p.read_text())
old = json.loads(ai_raw)
if (len(ai2['services']), len(ai2['hasPart']), len(ai2['keywords'])) != (22, 153, 29):
    fail('ai-sitemap counts != 22/153/29')
old_kw = old['keywords']; new_kw2 = ai2['keywords']
if old_kw != [k for k in new_kw2 if k not in ('gun safe movers', 'gun safe movers winchester va', 'gun safe movers martinsburg wv')]:
    fail('ai-sitemap keywords changed beyond the 3 additions')
old.pop('keywords'); ai2.pop('keywords')
if old != ai2: fail('ai-sitemap diff beyond keywords')
print('ai-sitemap: services 22, hasPart 153, keywords 26 -> 29 (diff = keywords only)')

# ---------- 9. rubric DB ----------
for claim, source, evidence in [
    ('Gun-safe Service node refreshed to full two-branch chain in both machine graphs and head graph: entity node upgraded in place from Martinsburg-skewed node (url and areaServed replaced), best-graph fragment node added, head node upgraded (serviceType casing, areaServed pattern), Place areaServed expanded to full footprint Winchester 31 / Martinsburg 35, branches distinct',
     'out/pages/gun-safe-deep/schema.json + gun-safe-deep-datasets-2026-10-29.md',
     'machine graphs + live index head graph, gun-safe deep batch 2026-10-29'),
    ('Gun-safe datasets D1-D8 published as Dataset JSON-LD (CC BY 4.0, dateModified 2026-10-29) at /datasets-gun-safe.json with hub-div markup and Developer-page collection entry; gated fields omitted',
     'gun-safe-deep-datasets-2026-10-29.md section 6',
     'datasets-gun-safe.json + hub div page-gunsafe + Developer card, gun-safe deep batch 2026-10-29')]:
    if 'services.json id' in evidence: fail('attestation evidence contains forbidden string')
    exists = db.execute("SELECT COUNT(*) FROM attestation WHERE claim=?", (claim,)).fetchone()[0]
    if not exists:
        db.execute("INSERT INTO attestation (claim, source, verified, evidence) VALUES (?,?,?,?)",
                   (claim, source, TODAY, evidence))
        print('attestation row added:', claim[:60], '...')
db.commit()
att22_after = db.execute("SELECT COUNT(*) FROM attestation WHERE evidence LIKE '%services.json id%'").fetchone()[0]
canon_after = db.execute("SELECT COUNT(*) FROM service WHERE service_id LIKE '%#service-%'").fetchone()[0]
edge_after = db.execute("SELECT COUNT(*) FROM edge").fetchone()[0]
check_after = db.execute("SELECT COUNT(*) FROM rubric_check").fetchone()[0]
oh_after = db.execute("SELECT COUNT(*) FROM opening_hours").fetchone()[0]
sa_after = db.execute("SELECT COUNT(*) FROM service_area").fetchone()[0]
print('DB after: att22=%d canon=%d edge=%d rubric_check=%d opening_hours=%d service_area=%d' % (
    att22_after, canon_after, edge_after, check_after, oh_after, sa_after))
if (att22_after, canon_after, edge_after, check_after, oh_after, sa_after) != (22, 22, 40, 7, 14, 66):
    fail('DB constraints changed')
db.close()

# ---------- 10. write index.html + node --check ----------
(PAGES / 'index.html').write_text(html)
scripts = []
for mm in re.finditer(r'<script(?![^>]*ld\+json)[^>]*>(.*?)</script>', html, re.S):
    scripts.append(mm.group(1))
print('plain inline scripts found:', len(scripts))
if len(scripts) != 2: fail('expected exactly 2 plain inline scripts')
for i, body in enumerate(scripts):
    p = Path('/tmp/gunsafe-script-%d.js' % i)
    p.write_text(body)
    r = subprocess.run(['node', '--check', str(p)], capture_output=True, text=True)
    if r.returncode != 0: fail('node --check failed script %d: %s' % (i, r.stderr))
    print('node --check script %d: OK (%d chars)' % (i, len(body)))
print('BUILD OK — run verify.js next (must be 71/71) before deploying')
