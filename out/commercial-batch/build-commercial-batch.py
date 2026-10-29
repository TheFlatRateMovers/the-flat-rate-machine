#!/usr/bin/env python3
"""Commercial deep batch builder — SECOND ATTEMPT, Q10a APPROVED by owner
2026-10-29 ~07:13 (widget tap "Yes, point it at the hub"): Option A.
#service-commercial points at the hub https://theflatratemovers.com/commercial-moving/
EVERYWHERE: entity fragment upgraded in place, best graph gains the fragment,
head node upgraded with hub url + Place chain + full footprint.

Edits (all verified, nothing hand-counted):
  1. datasets-commercial.json (8 Dataset nodes, CC BY 4.0, dateModified 2026-10-29)
     -> Pages public/ (+ batch copy)
  2. Machine graphs: entity node upgraded IN PLACE (url branch page -> hub,
     serviceType -> "Commercial Moving", alternateName + staged description added,
     areaServed -> #winchester-place / #martinsburg-place @ids); best graph GAINS
     the fragment node (was 0); Place nodes already 31/35 (verified, not changed).
     Copies -> local mirror + Pages public/, byte-identical. Entity 39 nodes,
     best 75 -> 76 nodes.
  3. Head graph nodes upgraded in place (still 24 nodes): commercial (serviceType
     casing, staged description, url = hub added, areaServed -> Place @ids
     #winchester / #martinsburg, head convention) + gun-safe CARRIED FOLLOW-UP
     (url = hub added, areaServed -> Place @ids; description/serviceType/name
     untouched; datasets/page copy/attestations NOT touched).
  4. Static Dataset JSON-LD block inside the commercial-moving page div.
  5. Developer-page "Commercial datasets" card after the Gun Safe card.
  6. llms.txt commercial services line refreshed (hub link + staged description
     + D1-D8 summary + datasets link) + dated update section.
  7. data txt dated update section appended (name list + SIR section untouched).
  8. ai-sitemap: commercial entry description refreshed in place (never duplicated);
     +3 real GSC queries (29 -> 32); services 22, hasPart 153.
  9. Hub per-page JSONs (NEW public files, verified serving path pattern):
     public/commercial-moving.json (staged schema, Place areas expanded to the
     DB footprint 31/35) + public/residential-moving.json (CARRIED FOLLOW-UP,
     residential-deep schema, Place areas expanded to the DB footprint 31/35).
 10. Rubric DB: 7 attestation rows added (evidence deliberately WITHOUT the
     string 'services.json id' so the verify constraint stays 22). NO edge rows,
     NO rubric_check row, NO service/opening_hours/service_area row changes.
     Registry rename + page-slug node consolidation stay FLAGGED, not taken.
NOT done: no new page, no pages/services registry change, no gun-safe
attestation content, no Winchester parity copy, no video page, no other
category, no GBP/DNS/track.sl, no quote tests, no ARD change, no gist-graph
touch (ai push uses data/entity-graph-full.json only).
"""
import json, re, shutil, sqlite3, subprocess, sys
from pathlib import Path

HOME = Path.home()
MACH = HOME / 'workspace/the-flat-rate-machine'
PAGES = HOME / 'workspace/the-flat-rate-movers-pages/public'
FLAT = HOME / 'workspace/theflatratemovers'
PKG = MACH / 'out/pages/commercial-deep'
RESPKG = MACH / 'out/pages/residential-deep'
BATCH = MACH / 'out/commercial-batch'
BACKUP = BATCH / 'backup-2026-10-29'
TODAY = '2026-10-29'
SITE = 'https://theflatratemovers.com'
ORG = SITE + '/#organization'
SVC = SITE + '/#service-commercial'
GSVC = SITE + '/#service-gun-safe'
HUB = SITE + '/commercial-moving/'
GHUB = SITE + '/gun-safe-movers/'
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

def replace_areaServed(span, items):
    """Replace the areaServed array in span. items: strings or @id dicts.
    Works for pretty (newline) and minified spans."""
    m = re.search(r'"areaServed": \[', span)
    if not m: fail('no areaServed in span')
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
    inner = span[m.end():i]
    if '\n' in inner:
        line_start = span.rfind('\n', 0, m.start()) + 1
        line_prefix = span[line_start:m.start()]
        field_indent = line_prefix[:len(line_prefix) - len(line_prefix.lstrip())]
        item_indent = field_indent + '  '
        rendered = []
        for it in items:
            if isinstance(it, dict):
                rendered.append(item_indent + '{"@id": "%s"}' % it['@id'])
            else:
                rendered.append(item_indent + json.dumps(it))
        new_arr = '"areaServed": [\n' + ',\n'.join(rendered) + '\n' + field_indent + ']'
    else:
        parts = []
        for it in items:
            if isinstance(it, dict):
                parts.append('{"@id": "%s"}' % it['@id'])
            else:
                parts.append(json.dumps(it))
        new_arr = '"areaServed": [' + ', '.join(parts) + ']'
    return span[:m.start()] + new_arr + span[i + 1:]

# ---------- 0. backups ----------
BACKUP.mkdir(parents=True, exist_ok=True)
for src in [PAGES / 'index.html', PAGES / 'ai-sitemap.json', PAGES / 'llms.txt',
            PAGES / 'the-flat-rate-movers-data.txt',
            MACH / 'data/entity-graph.json', MACH / 'data/best-json-entity-graph.json',
            FLAT / 'rubric.db']:
    if not (BACKUP / src.name).exists():
        shutil.copy2(src, BACKUP / src.name)
print('backups ->', BACKUP)

# ---------- pre-checks ----------
staged = json.loads((PKG / 'schema.json').read_text())
staged_svc = staged['@graph'][0]
staged_desc = staged_svc['description']
assert staged_svc['url'] == HUB and staged_svc['serviceType'] == 'Commercial Moving', 'staged schema mismatch'
assert staged_svc['name'] == 'Commercial and Office Moving' and staged_svc['alternateName'] == 'Commercial Moving', 'staged names mismatch'
svc_reg = json.loads((MACH / 'data/services.json').read_text())
pages_reg = json.loads((MACH / 'data/pages.json').read_text())
cm = [s for s in svc_reg['services'] if s['id'] == 'service-commercial']
assert len(cm) == 1, 'service-commercial registry entries != 1'
refs = sum(1 for p in pages_reg['pages'] if 'service-commercial' in (p.get('services') or []))
print('registry: services=%d pages=%d commercial pageCount=%d refs=%d' % (
    len(svc_reg['services']), len(pages_reg['pages']), cm[0]['pageCount'], refs))
if len(svc_reg['services']) != 22 or len(pages_reg['pages']) != 153 or cm[0]['pageCount'] != 6 or refs != 6:
    fail('registry counts != 22/153/6/6')
if (PAGES / 'residential-moving.json').exists(): fail('residential-moving.json already exists (refusing overwrite)')
if (PAGES / 'commercial-moving.json').exists(): fail('commercial-moving.json already exists (refusing overwrite)')
if (PAGES / 'datasets-commercial.json').exists(): fail('datasets-commercial.json already exists (refusing overwrite)')

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
att_before = db.execute("SELECT COUNT(*) FROM attestation").fetchone()[0]
print('DB before: canon=%d att=%d att22=%d edge=%d rubric_check=%d opening_hours=%d service_area=%d' % (
    canon_before, att_before, att22_before, edge_before, check_before, oh_before, sa_before))
if (canon_before, att22_before, edge_before, check_before, oh_before, sa_before) != (22, 22, 40, 7, 14, 66):
    fail('DB baseline unexpected')
canon_row = db.execute("SELECT COUNT(*) FROM service WHERE service_id=?", (SVC,)).fetchone()[0]
if canon_row != 1: fail('canonical service-commercial DB row != 1')

# ---------- 1. datasets file ----------
def ds(slug, name, desc, keywords):
    if not (50 <= len(desc) < 5000): fail('dataset description length: ' + slug + ' len=' + str(len(desc)))
    if BANNED.search(desc + ' ' + ' '.join(keywords)): fail('banned string in dataset: ' + slug)
    return {'@id': SITE + '/#dataset-' + slug, '@type': 'Dataset', 'name': name,
            'description': desc, 'keywords': keywords, 'about': [{'@id': SVC}],
            'spatialCoverage': [{'@id': WIN_HEAD}, {'@id': MAR_HEAD}],
            'temporalCoverage': '2010/2026', 'dateModified': TODAY,
            'creator': {'@id': ORG, 'sameAs': SAMEAS}, 'license': LICENSE,
            'distribution': DIST, 'sameAs': HUB}

DATASETS = {'@context': 'https://schema.org', '@graph': [
    ds('commercial-operations', 'Commercial Move Operations',
       'Commercial move operations for business relocations, planned around the operation. The published hero framing is verbatim: Business moves, planned around your operation. Commercial relocations are quoted flat and agreed in writing before move day, planned around the hours, the site, and the equipment, with the warehouse and transload operation behind the job. The operation chain runs survey, quote, phased plan, pack and label, sequenced move, install and place, verify, and close-out, with a plan core of what moves first, what moves last, and what works on day one. Survey runs through the quote form Short (Quick Quote) default and Detailed Project toggle with inputs preserved, and a film-only video walkthrough where a walkthrough fits: film only, never lift, move, open, or climb anything heavy or locked, with a human-made estimate. The freight chain is container loading and unloading, transloading, and final-mile delivery; high-mass or sensitive devices to 3,500 lbs ride the SIR and KIM-GS method conditionally, with floor deflection analysis to L/360. Shops, professional offices, and commercial spaces are the published audience; industrial offices, government offices, and military households are cross-references to their own categories, never duplicated here. Gated and omitted, not guessed: after-hours or weekend as a named offering, a dedicated coordinator, crew sizing or minimums, debris scope, and client proof.',
       ['commercial moving', 'commercial movers winchester va', 'corporate movers winchester va', 'business moving companies near me', 'office moving winchester va']),
    ds('commercial-premises-access', 'Commercial Premises and Access Operations',
       'Premises and access operations for commercial moves. Premises in scope: shops, professional offices, and commercial spaces, with industrial offices and warehouses as cross-references to their own categories. Moves are two-building coordination: origin and destination, each with its own freight elevator and reservation window, loading dock or bay and hours, parking and permits, security protocol, move hours, floor and rail protection, and off-hours building services as budget lines. Access items are quote inputs that change quote scope and phasing, never capability claims: no elevator-booking capability, no after-hours capability, and no building-access promise is stated here. The warehouse and transload operation is the published staging base, with staggered furniture delivery as a domain model. Dispatch runs the I-81, I-66, and I-70 corridor network from both branches, and listed areas are the coverage pool, never a claim that a listed town sits on a particular highway. Domain patterns, labeled: most commercial buildings restrict moves to evenings or weekends; some buildings want building paperwork a week ahead; leases commonly turn on the 1st, so month-end and quarter-end fill first; Friday-evening and weekend mid-month windows are the preferred domain window. Whether the company issues building paperwork is gated and not stated.',
       ['commercial movers winchester va', 'corporate movers winchester va', 'office moving winchester va', 'business relocation virginia']),
    ds('commercial-asset-taxonomy', 'Business Asset Taxonomy',
       'Business asset taxonomy for commercial moves. Asset classes: desks and workstations, chairs, filing, files and records, IT gear, printers and copiers, commercial equipment, safes and sensitive devices, freight and pallets, and FF&E. Handling: disassembly and reassembly, department labeling, floor-plan placement, sealed and tracked containers for records as domain practice, anti-static packaging for IT as domain practice, blanket and stretch wrap, and the SIR conditional for high-mass assets. Cross-references are links, never duplicated content: office-moving owns office scope, industrial-offices owns industrial office scope, it-relocation owns IT scope, FF&E installation owns installation scope, warehouse-relocation owns warehouse goods, transloading and final-mile own freight, sir-heavy owns high-mass method, packing owns packing options, crating owns custom crates. No CWT pricing from the industrial service is borrowed into commercial pricing anywhere in this dataset. Every asset class maps to a commercial-page sentence or a labeled cross-reference.',
       ['commercial moving', 'office moving winchester va', 'business relocation', 'commercial equipment movers', 'corporate movers winchester va']),
    ds('commercial-dispatch', 'Commercial Branch Dispatch Network',
       'Branch dispatch network for commercial moves. Winchester: The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester VA 22601, hours Mon-Fri 8-6, Sat 8-4, Sun 9-4, Google rating 5.0 from 1 review. Martinsburg: Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg WV 25404, hours Mon-Fri 9-6, Sat 9-4, Sun 9-4, Google rating 4.7 from 6 reviews. Branches are never merged and ratings are never blended. Coverage is the full footprint of 52 GeoJSON service-area features: Winchester 31 areas, Martinsburg 35 areas, 14 shared, dispatched across the I-81, I-66, and I-70 corridor network from both branches. The freight chain runs warehouse and transload staging, then container and transload handling, then final-mile delivery, with an export and port chain via the Virginia Inland Port and Port of Virginia chain as published on the commercial page. Corridor pages attach to the route81 service node as a separate category, cross-referenced, not duplicated.',
       ['commercial movers winchester va', 'business relocation virginia', 'movers martinsburg wv', 'moving companies winchester va']),
    ds('commercial-terms', 'Commercial Terms and Cost Drivers',
       'Commercial terms and cost drivers. The only company pricing claim is one flat rate quoted and agreed in writing before move day, with no hourly meter on the company model, under the tagline Guaranteed Flat Rate or Your Move is Free. No company price, hourly rate, premium, discount, deposit, or fee is stated anywhere in this dataset. Domain education, labeled domain and never company terms: flat-rate-in-writing versus hourly labor by the hour versus binding estimate (a fixed total for listed scope and inventory) versus non-binding estimate (approximate, final follows actual conditions) versus not-to-exceed (a capped maximum); market domain rates of 90 to 150 dollars per hour for a 2 to 3-person team in mover guides, explicitly NOT this company rates; downtime-math examples used only to explain why downtime-first planning matters, including 80 employees at 50 dollars per hour loaded equal to 32,000 dollars per lost business day in an American Van Lines example, an after-hours premium example of 20 percent on a 60,000 dollar project equal to 12,000 dollars against avoided-downtime gain exceeding 20,000 dollars from the same source, industry estimates cited by relocation guides of 5,600 to 9,000 dollars per minute for smaller firms and 300,000 to 1,000,000 dollars per hour for larger firms, and a worksheet example of a 2,000,000 dollar sales firm at 10 percent profit at about 450 dollars per hour of IT downtime, 10 hours about 4,500 dollars. Domain budget lines, labeled: labor differentials for off-hours teams, IT, and security; building fees for elevator reservations, dock access, and HVAC outside normal hours; parking, permits, and building paperwork; packing and crating materials and specialty services; temporary storage to bridge lease gaps; coverage levels. Coverage education, domain: Full Value Protection versus Released Value at 0.60 dollars per pound; any company coverage offering is gated and NOT claimed. Domain booking windows, labeled: plan 8 to 12 weeks out for most business relocations, 3 to 6 months for larger offices, more lead time in peak season May through September.',
       ['commercial moving', 'corporate movers winchester va', 'business moving companies near me', 'flat rate office moving', 'office relocation cost']),
    ds('commercial-personas', 'Commercial Buyer Personas and Trigger Events',
       'Buyer personas and trigger events for commercial moves. Personas: business owners, operations managers, facility managers, project managers, and office managers. Triggers: lease end or renewal, expansion, consolidation, renovation or build-out gap, new-premises opening, growth beyond the current space, and multi-site rationalization. Buying criteria in order: downtime first, hidden-cost fear second, coordination gaps third (movers versus IT versus building management, the pattern the commercial page planning sentence answers), price certainty fourth (flat in writing), and one accountable plan fifth (what moves first, what moves last, what works on day one). Timing, domain: leases turn on the 1st so month-end and quarter-end fill first; Friday-evening and weekend mid-month windows are preferred; plan 8 to 12 weeks out, 3 to 6 months for larger offices; peak season May through September. Audience framing on the commercial page covers business owners, office managers, and operations teams relocating a shop, office, or commercial space, including industrial offices, government offices, and military households on the same basis as cross-references. Quote path per persona: the quote toggle plus the film-only survey room where a walkthrough fits, verified on the pattern, never by test post.',
       ['commercial moving', 'corporate movers winchester va', 'business moving companies near me', 'office relocation virginia', 'business relocation']),
    ds('commercial-protection-compliance', 'Commercial Protection, IT Coordination and Building Compliance',
       'Protection, IT coordination, and building compliance for commercial moves. Protection: blanket wrap, stretch wrap, floor and rail protection on the path, padded transport, and custom crating for pieces that need it as a cross-reference to crating. IT coordination is a domain pattern, labeled, and company IT scope is NEVER claimed here: IT as its own workstream, backup before disconnection, cable photos and labels, anti-static packaging, no flat stacking, new-site network, power, and internet ready before moving day, and old internet overlap of at least 2 weeks as domain guidance; the separate IT category owns IT scope. Building compliance items are planning inputs or domain requirements, labeled: freight-elevator reservation, dock access, move hours, advance notice, security protocol, building paperwork where buildings require it (company issuance gated, not stated), parking and permits, and HVAC off-hours as a domain budget line. Sensitive material practice, domain: files and records in sealed, tracked containers with chain of custody as domain practice, with no company chain-of-custody claim, and confidential disposal of unnecessary documents as a domain option. Liability education, domain: valuation is not insurance; Full Value Protection versus Released Value is explained in the commercial terms dataset; no company coverage claim is made here. Survey walkthroughs follow the film-only rule: never lift, move, open, or climb anything heavy or locked. The commercial page photos are honestly described: a credited Downtown Winchester photo and a company-supplied warehouse and transload staging photo, never mislabeled as job photos they are not; the node package uses the approved logo as brand image.',
       ['commercial moving', 'office relocation', 'business moving companies near me', 'IT equipment moving', 'corporate movers winchester va']),
    ds('commercial-areas-quote', 'Commercial Service Areas, Dispatch and Quote Path',
       'Service areas, dispatch, and quote path for commercial moves. Full footprint at merge, branches distinct: 52 GeoJSON service-area features, Winchester 31 areas, Martinsburg 35 areas, 14 shared. Winchester branch: The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester VA 22601, Mon-Fri 8-6, Sat 8-4, Sun 9-4, Google 5.0 from 1 review. Martinsburg branch: Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg WV 25404, Mon-Fri 9-6, Sat 9-4, Sun 9-4, Google 4.7 from 6 reviews. Phone +1-540-422-2153. Founded June 2010. Dispatch across the I-81, I-66, and I-70 corridor network from both branches, with warehouse and transload staging, the freight chain, and the export and port chain as published. Six pages carry the service: the commercial-moving hub, the commercial-movers-winchester-va branch page, the category index, the docs data-center-logistics page, the IT page, and the Martinsburg guide. Quote path: Short (Quick Quote) default and Detailed Project toggle with inputs preserved, main call to action Get My Flat Rate Quote and pill Get a flat rate quote, film-only video walkthrough where a walkthrough fits with a human-made estimate, and no test posts ever. Search demand behind this category: commercial-moving at 2,013 impressions at position 53.4 with AI-feature 34, and the single clearest upside query corporate movers winchester va at 123 impressions at position 32.1.',
       ['commercial moving', 'commercial movers winchester va', 'business moving companies near me', 'corporate movers winchester va', 'movers martinsburg wv']),
]}
ds_text = json.dumps(DATASETS, indent=2) + '\n'
(PAGES / 'datasets-commercial.json').write_text(ds_text)
(BATCH / 'datasets-commercial.json').write_text(ds_text)
print('datasets: 8 nodes written to public + batch copy')

# ---------- 2. machine graphs ----------
def edit_graph(path, is_best):
    text = path.read_text()
    if text.count('"@id": "%s"' % SVC) != (0 if is_best else 1):
        fail('unexpected commercial occurrences in %s' % path.name)
    if is_best:
        anchor = '\n    }\n  ],\n  "_humanSummary"'
        if text.count(anchor) != 1: fail('best-graph append anchor != 1')
        node = {'@id': SVC, '@type': 'Service', 'name': 'Commercial and Office Moving',
                'alternateName': 'Commercial Moving', 'serviceType': 'Commercial Moving',
                'description': staged_desc,
                'provider': {'@id': ORG}, 'url': HUB,
                'areaServed': [{'@id': WIN_PLACE}, {'@id': MAR_PLACE}]}
        lines = json.dumps(node, indent=2).split('\n')
        indented = '\n'.join('    ' + ln for ln in lines)
        text = text.replace(anchor, '\n    },\n' + indented + '\n  ],\n  "_humanSummary"', 1)
    else:
        s, e = span_of(text, SVC)
        span = text[s:e]
        if '"serviceType": "Commercial and Office Moving"' not in span: fail('entity serviceType shape unexpected')
        span = span.replace('"serviceType": "Commercial and Office Moving"', '"serviceType": "Commercial Moving"', 1)
        if '"url": "%s"' % HUB not in span:
            span2 = re.sub(r'"url": "[^"]*"', '"url": "%s"' % HUB, span, count=1)
            if span2 == span: fail('entity url replacement failed')
            span = span2
        if '"name": "Commercial and Office Moving"' not in span: fail('entity name shape unexpected')
        span = span.replace('"name": "Commercial and Office Moving"',
                            '"name": "Commercial and Office Moving",\n    "alternateName": "Commercial Moving",\n    "description": %s' % json.dumps(staged_desc), 1)
        span = replace_areaServed(span, [{'@id': WIN_PLACE}, {'@id': MAR_PLACE}])
        text = text[:s] + span + text[e:]
    obj = json.loads(text)
    nodes = obj['@graph']
    cn = [n for n in nodes if n.get('@id') == SVC]
    if len(cn) != 1: fail('graph %s commercial nodes != 1' % path.name)
    gn = cn[0]
    if gn.get('url') != HUB: fail('graph %s commercial url != hub' % path.name)
    if gn.get('serviceType') != 'Commercial Moving': fail('graph %s serviceType' % path.name)
    if gn.get('alternateName') != 'Commercial Moving': fail('graph %s alternateName' % path.name)
    if gn.get('description') != staged_desc: fail('graph %s description != staged' % path.name)
    if gn.get('areaServed') != [{'@id': WIN_PLACE}, {'@id': MAR_PLACE}]:
        fail('graph %s areaServed != place @ids' % path.name)
    for pid, areas in ((WIN_PLACE, win_areas), (MAR_PLACE, mar_areas)):
        pn = [n for n in nodes if n.get('@id') == pid]
        if len(pn) != 1 or pn[0].get('areaServed') != areas:
            fail('graph %s place %s != footprint' % (path.name, pid))
    path.write_text(text)
    print('graph %s: nodes=%d commercial=1 url=hub places=31/35' % (path.name, len(nodes)))
    return len(nodes)

eg_n = edit_graph(MACH / 'data/entity-graph.json', False)
best_n = edit_graph(MACH / 'data/best-json-entity-graph.json', True)
if (eg_n, best_n) != (39, 76): fail('graph node counts != 39/76')
for fname in ('entity-graph.json', 'best-json-entity-graph.json'):
    for dest in (FLAT / fname, PAGES / fname):
        shutil.copy2(MACH / 'data' / fname, dest)
    for dest in (FLAT / fname, PAGES / fname):
        if dest.read_bytes() != (MACH / 'data' / fname).read_bytes():
            fail('mirror copy mismatch: ' + str(dest))
print('graphs mirrored byte-identical to local mirror + public')

# ---------- 3. head graph (commercial + gun-safe follow-up) ----------
html = (PAGES / 'index.html').read_text()
if 'datasets-commercial.json' in html or 'commercial deep batch' in html:
    fail('index.html already contains commercial batch artifacts (refusing double-insert)')
m = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
head_block = m.group(0)
# commercial node
s, e = span_of(head_block, SVC)
span = head_block[s:e]
if '"serviceType": "Commercial moving"' not in span: fail('head commercial serviceType shape unexpected')
span = span.replace('"serviceType": "Commercial moving"', '"serviceType": "Commercial Moving"', 1)
if '"url":' in span: fail('head commercial already has url (unexpected)')
prov = '"provider": {"@id": "%s"}' % ORG
if prov not in span: fail('head commercial provider shape unexpected')
span = span.replace(prov, prov + ', "url": "%s"' % HUB, 1)
span = replace_areaServed(span, [{'@id': WIN_HEAD}, {'@id': MAR_HEAD}])
span = re.sub(r'"description": "(?:[^"\\]|\\.)*"',
              lambda mm: '"description": %s' % json.dumps(staged_desc), span, count=1)
head_block = head_block[:s] + span + head_block[e:]
# gun-safe node: url + Place chain ONLY
s, e = span_of(head_block, GSVC)
span = head_block[s:e]
if '"url":' in span: fail('head gun-safe already has url (unexpected)')
if prov not in span: fail('head gun-safe provider shape unexpected')
span = span.replace(prov, prov + ', "url": "%s"' % GHUB, 1)
span = replace_areaServed(span, [{'@id': WIN_HEAD}, {'@id': MAR_HEAD}])
head_block = head_block[:s] + span + head_block[e:]
html = html[:m.start()] + head_block + html[m.end():]
m2 = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
h2 = json.loads(m2.group(1))
if len(h2['@graph']) != 24: fail('head nodes != 24 after edit')
for sid, surl, sdesc in ((SVC, HUB, staged_desc), (GSVC, GHUB, None)):
    nodes = [n for n in h2['@graph'] if n.get('@id') == sid]
    if len(nodes) != 1: fail('head %s != 1 after edit' % sid)
    if nodes[0].get('url') != surl: fail('head %s url != hub' % sid)
    if nodes[0].get('areaServed') != [{'@id': WIN_HEAD}, {'@id': MAR_HEAD}]:
        fail('head %s areaServed != place @ids' % sid)
    if sdesc is not None:
        if nodes[0].get('serviceType') != 'Commercial Moving' or nodes[0].get('description') != sdesc:
            fail('head commercial fields wrong after edit')
print('head graph: 24 nodes, commercial upgraded (url+Place chain+description), gun-safe url+Place chain only')

# ---------- 4. commercial div dataset block ----------
di = html.find('id="page-commercial"')
if di < 0: fail('commercial div not found')
divstart = html.rfind('<div', 0, di)
tag_re = re.compile(r'<(/?)div(?=[\s>])')
depth = 0; divclose = None
for mm in tag_re.finditer(html[divstart:]):
    depth += -1 if mm.group(1) else 1
    if depth == 0:
        divclose = divstart + mm.start(); break
if divclose is None: fail('commercial div close not found')
block = '\n<script type="application/ld+json">' + json.dumps(DATASETS, indent=2) + '</script>\n'
html = html[:divclose] + block + html[divclose:]
blk_id = html.find('"@id": "https://theflatratemovers.com/#dataset-commercial-operations"', divclose)
blk_end = html.find('</script>', divclose) + len('</script>')
nxt_new = html.find('<div class="page" id="page-office"', divstart)
if not (divclose < blk_id < blk_end < nxt_new):
    fail('dataset block not inside commercial div / before office div')
print('commercial div: dataset block inserted inside div, before office div')

# ---------- 5. developer card ----------
h3 = html.find('<h3>Gun Safe datasets</h3>')
if h3 < 0: fail('gun safe card not found')
card_end = html.find('</article>', h3)
if card_end < 0: fail('gun safe card close not found')
card_end += len('</article>')
dev_start = html.find('id="page-developer"')
dev_next = html.find('<div class="page"', dev_start + 1)
if not (dev_start < card_end < dev_next): fail('gun safe card not inside developer div')
card = ('<article class="card"><h3>Commercial datasets</h3><p>'
        '<a href="/datasets-commercial.json" target="_blank" rel="noopener">'
        '<b>datasets-commercial.json \u2192</b></a> \u2014 the full commercial-moving datasets '
        'D1\u2013D8 as Dataset JSON-LD (CC BY 4.0): commercial move operations; premises and access; '
        'business asset taxonomy; branch dispatch network; commercial terms and cost drivers '
        '(flat-rate-in-writing only; domain figures labeled); buyer personas and triggers; '
        'protection, IT coordination, and building compliance; service areas, dispatch, and quote path '
        '\u2014 about the commercial service, from both branches, never merged.</p></article>')
html = html[:card_end] + card + html[card_end:]
print('developer card: Commercial datasets inserted after Gun Safe card')

# ---------- 6. llms.txt ----------
llms = PAGES / 'llms.txt'
ll = llms.read_text()
if 'commercial deep batch' in ll: fail('llms.txt already has commercial update section')
old_line = ('- [Commercial and Office Moving](https://theflatratemovers.com/): '
            'Commercial, office moving, industrial offices, government, and military moves')
if ll.count(old_line) != 1: fail('llms old commercial line != 1')
new_line = ('- [Commercial and Office Moving](https://theflatratemovers.com/commercial-moving/): ' + staged_desc +
            ' Datasets D1\u2013D8 (CC BY 4.0): commercial move operations; premises and access; '
            'business asset taxonomy; branch dispatch network; commercial terms (flat-rate-in-writing only; domain figures labeled); '
            'buyer personas and triggers; protection, IT coordination, and building compliance; service areas, dispatch, and quote path. '
            'Full datasets: https://theflatratemovers.com/datasets-commercial.json')
ll = ll.replace(old_line, new_line, 1)
if 'residential deep batch' not in ll or 'gun-safe deep batch' not in ll: fail('llms history lost')
ll += ('\n## Update \u2014 2026-10-29 (commercial deep batch)\n'
       '- Full #service-commercial Service node shipped in both machine graphs and the head graph (same @id, no duplicate): entity fragment upgraded in place from the Winchester branch page url to the commercial-moving hub url, best graph gained the fragment node, head node upgraded with hub url + Place chain + full footprint. The fragment url move was approved by the owner 2026-10-29 (Q10a, Option A, hub everywhere); the registry name stays Commercial and Office Moving and page-slug nodes are untouched (consolidation stays flagged, not taken). No new page (hub + branch + index + freight + IT + guide pages exist, 6 pages carry the service); counts unchanged at 153 pages and 22 services.\n'
       '- Commercial datasets D1\u2013D8 published as Dataset JSON-LD at https://theflatratemovers.com/datasets-commercial.json (CC BY 4.0, dateModified 2026-10-29), with page-level markup on the commercial-moving hub page and a Developer-page collection entry. Gated fields omitted, not guessed: after-hours or weekend as a named offering, building-paperwork issuance, dedicated coordinator, IT scope boundary, FF&E boundary, crew sizing or minimums, coverage offering, phasing as a named offering, client proof.\n'
       '- Carried follow-ups shipped in this batch: hub per-page JSONs https://theflatratemovers.com/commercial-moving.json and https://theflatratemovers.com/residential-moving.json (Place areas expanded to the full footprint, branches distinct), and the gun-safe head node upgraded to carry url + Place chain under the same @id (url and Place chain only; gun-safe datasets, page copy, and attestations untouched).\n')
llms.write_text(ll)
print('llms.txt: commercial line refreshed + dated update section')

# ---------- 7. data txt ----------
dt = PAGES / 'the-flat-rate-movers-data.txt'
tx = dt.read_text()
if 'commercial deep batch' in tx: fail('data txt already has commercial update section')
if 'Commercial Moving' not in tx: fail('data txt missing commercial name')
tx += ('\n## Update 2026-10-29 \u2014 commercial deep batch\n'
       '- Full #service-commercial Service node shipped in both machine graphs and the head graph (same @id, no duplicate): entity fragment upgraded in place from the Winchester branch page url to the commercial-moving hub url (owner-approved Q10a, Option A), best graph gained the fragment node, head node upgraded with hub url + Place chain + full footprint. Registry name stays Commercial and Office Moving; page-slug nodes untouched. No new page; counts unchanged at 153 pages and 22 services.\n'
       '- Commercial datasets D1\u2013D8 published as Dataset JSON-LD at https://theflatratemovers.com/datasets-commercial.json (CC BY 4.0, dateModified 2026-10-29), with page-level markup on the commercial hub page and a Developer-page collection entry. Gated fields omitted, not guessed: after-hours or weekend as a named offering, building-paperwork issuance, dedicated coordinator, IT scope boundary, FF&E boundary, crew sizing or minimums, coverage offering, phasing as a named offering, client proof.\n'
       '- Carried follow-ups shipped in this batch: hub per-page JSONs https://theflatratemovers.com/commercial-moving.json and https://theflatratemovers.com/residential-moving.json, and the gun-safe head node upgraded to carry url + Place chain under the same @id (url and Place chain only).\n')
dt.write_text(tx)
print('data txt: dated update section appended (name list + SIR section untouched)')

# ---------- 8. ai-sitemap ----------
ai_p = PAGES / 'ai-sitemap.json'
ai_raw = ai_p.read_text()
ai = json.loads(ai_raw)
cm_entry = [s for s in ai.get('services', []) if s.get('name') == 'Commercial and Office Moving']
if len(cm_entry) != 1: fail('ai-sitemap commercial entries != 1')
if cm_entry[0].get('description') == staged_desc: fail('ai-sitemap commercial description already staged (unexpected)')
cm_entry[0]['description'] = staged_desc
new_kw = ['corporate movers winchester va', 'business moving companies near me', 'commercial movers winchester va']
for kw in new_kw:
    if kw not in ai['keywords']: ai['keywords'].append(kw)
ai_new = json.dumps(ai, indent=2, ensure_ascii=False)
if ai_raw.endswith('\n'): ai_new += '\n'
ai_p.write_text(ai_new)
ai2 = json.loads(ai_p.read_text())
old = json.loads(ai_raw)
if (len(ai2['services']), len(ai2['hasPart']), len(ai2['keywords'])) != (22, 153, 32):
    fail('ai-sitemap counts != 22/153/32')
old_kw = old['keywords']; new_kw2 = ai2['keywords']
if old_kw != [k for k in new_kw2 if k not in new_kw]:
    fail('ai-sitemap keywords changed beyond the 3 additions')
cm2 = [s for s in ai2['services'] if s.get('name') == 'Commercial and Office Moving'][0]
old_cm = [s for s in old['services'] if s.get('name') == 'Commercial and Office Moving'][0]
if old_cm.get('description') == cm2.get('description'): fail('ai-sitemap commercial description unchanged')
old.pop('keywords'); ai2.pop('keywords')
old_svcs = old.pop('services'); new_svcs = ai2.pop('services')
if old != ai2: fail('ai-sitemap diff beyond keywords/services')
if len(old_svcs) != len(new_svcs): fail('ai-sitemap services length changed')
for o, n in zip(old_svcs, new_svcs):
    if o['name'] == 'Commercial and Office Moving':
        if o['name'] != n['name'] or n['description'] != staged_desc: fail('ai-sitemap commercial entry wrong')
    elif o != n: fail('ai-sitemap non-commercial service changed: ' + o['name'])
print('ai-sitemap: services 22, hasPart 153, keywords 29 -> 32 (diff = commercial description + keywords only)')

# ---------- 9. hub per-page JSONs (staged schema + footprint expansion) ----------
def per_page_json(src_pkg, out_name, svc_id):
    obj = json.loads((src_pkg / 'schema.json').read_text())
    svc_nodes = [n for n in obj['@graph'] if n.get('@id') == svc_id]
    if len(svc_nodes) != 1: fail('per-page schema service nodes != 1: ' + out_name)
    for n in obj['@graph']:
        if n.get('@type') == 'Place':
            if n['@id'] == WIN_HEAD: n['areaServed'] = win_areas
            elif n['@id'] == MAR_HEAD: n['areaServed'] = mar_areas
            else: fail('per-page schema unexpected Place @id: ' + n['@id'])
    text = json.dumps(obj, indent=2) + '\n'
    (PAGES / out_name).write_text(text)
    (BATCH / out_name).write_text(text)
    chk = json.loads(text)
    for n in chk['@graph']:
        if n.get('@type') == 'Place':
            exp = 31 if n['@id'] == WIN_HEAD else 35
            if len(n.get('areaServed', [])) != exp: fail('per-page %s place areas != %d' % (out_name, exp))
    print('per-page JSON: %s (service url=%s, places 31/35)' % (out_name, svc_nodes[0].get('url')))

per_page_json(PKG, 'commercial-moving.json', SVC)
per_page_json(RESPKG, 'residential-moving.json', SITE + '/#service-residential')

# ---------- 10. rubric DB ----------
for claim, source, evidence in [
    ('Commercial Service node shipped to full two-branch chain in both machine graphs and head graph: entity fragment upgraded in place from Winchester branch page url to commercial-moving hub url (owner-approved Q10a Option A 2026-10-29), best-graph fragment node added, head node upgraded with hub url and Place chain and full footprint, branches distinct',
     'out/pages/commercial-deep/schema.json + commercial-deep-datasets-2026-10-29.md',
     'machine graphs + live index head graph, commercial deep batch 2026-10-29'),
    ('Commercial branch facts Winchester (address, geo, hours Mon-Fri 8-6 Sat 8-4 Sun 9-4, rating 5.0 from 1 review) distinct from Martinsburg (address, geo, hours Mon-Fri 9-6 Sat 9-4 Sun 9-4, rating 4.7 from 6 reviews), never blended',
     'Places 2026-10-27 + GBP check 2026-10-28',
     'commercial-deep schema Place nodes + live index head graph, commercial deep batch 2026-10-29'),
    ('Commercial GBP areas Winchester 16 + Martinsburg 14 as the published area base, expanded at merge to the full footprint Winchester 31 + Martinsburg 35, shared 14',
     'GBP screenshots 2026-10-27, confirmed 2026-10-28',
     'rubric DB service_area rows + GeoJSON 52 features, commercial deep batch 2026-10-29'),
    ('Commercial search demand: commercial-moving page 2,013 impressions at position 53.4 with AI-feature 34; corporate movers winchester va 123 at 32.1; business moving companies near me at 1.0',
     'GSC 3-month pull to 2026-10-27, read 2026-10-29',
     'commercial-deep-datasets-2026-10-29.md sections 1 and 6, commercial deep batch 2026-10-29'),
    ('Commercial page scope: planning sentence, freight chain, SIR conditional for high-mass devices, FAQs, branch card, quote toggle',
     'live page div extract 2026-10-29',
     'commercial-moving page div + staged schema description, commercial deep batch 2026-10-29'),
    ('Commercial graph fragmentation finding: thin head node, string-area fragment node at branch page url, best-graph page-slug-only coverage, corrected to one canonical hub node in all three graphs',
     'graph inspection 2026-10-29',
     'machine graphs + live index head graph, commercial deep batch 2026-10-29'),
    ('Commercial domain research: phasing models, downtime math, building and paperwork practice, IT checklist, market rates, all labeled domain and never company terms',
     'web research 2026-10-29, cited in research doc',
     'commercial-deep-datasets-2026-10-29.md sections 3 and 6, commercial deep batch 2026-10-29')]:
    if 'services.json id' in claim or 'services.json id' in evidence: fail('attestation contains forbidden string')
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
att_after = db.execute("SELECT COUNT(*) FROM attestation").fetchone()[0]
print('DB after: att=%d att22=%d canon=%d edge=%d rubric_check=%d opening_hours=%d service_area=%d' % (
    att_after, att22_after, canon_after, edge_after, check_after, oh_after, sa_after))
if (att_after, att22_after, canon_after, edge_after, check_after, oh_after, sa_after) != (att_before + 7, 22, 22, 40, 7, 14, 66):
    fail('DB constraints changed')
db.close()

# ---------- 11. write index.html + node --check ----------
(PAGES / 'index.html').write_text(html)
scripts = []
for mm in re.finditer(r'<script(?![^>]*ld\+json)[^>]*>(.*?)</script>', html, re.S):
    scripts.append(mm.group(1))
print('plain inline scripts found:', len(scripts))
if len(scripts) != 2: fail('expected exactly 2 plain inline scripts')
for i, body in enumerate(scripts):
    p = Path('/tmp/commercial-script-%d.js' % i)
    p.write_text(body)
    r = subprocess.run(['node', '--check', str(p)], capture_output=True, text=True)
    if r.returncode != 0: fail('node --check failed script %d: %s' % (i, r.stderr))
    print('node --check script %d: OK (%d chars)' % (i, len(body)))
print('BUILD OK — run verify.js next (must be 71/71) before deploying')
