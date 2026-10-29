#!/usr/bin/env python3
"""Gun-safe full-page hub update — DEPLOY builder, 2026-10-29.
Next batch after commercial (deployed + verified live 2026-10-29).
Staged package: out/pages/gun-safe-attestation-update/ (parent-verified).
Deploy decisions (parent, do not re-open):
  - Datasets: UPDATE public/datasets-gun-safe.json IN PLACE with staged 18-node
    file (same @ids for existing 8, new @ids for 10 new), dateModified stamped
    to DEPLOY DATE 2026-10-29 on all 18 nodes. No new file, no duplicates.
  - Head node: DO NOT TOUCH. Commercial already shipped gun-safe head url +
    Place chain live; this script verifies head unchanged (hash) and head node
    (exactly one, url = hub, Place @ids) but never edits it.
  - Hub div page-gunsafe replaced with hub-div-draft.html (comments stripped,
    div id/order/router preserved); trailing Dataset script replaced with
    stamped 18-node content; FAQPage script (schema.json, 36 Q) placed inside
    the div after the Dataset script, per dataset-status placement note.
  - Winchester div: parity draft sections inserted before the Start here card;
    hero/photo/Surveyed/Discreet/branch/Start here/Service-area preserved.
  - Hub JSON: CREATE public/gun-safe-movers.json from staged 5-node file,
    Place areas expanded to DB footprint 31/35 (commercial pattern).
  - Machine graphs: DESCRIPTION-ONLY refresh of #service-gun-safe node to the
    powerful schema.json description (same @id/url/Place chain/serviceType).
    NO regeneration (build-graph.js would revert 31/35 Place expansion).
    Mirrored byte-identical to local mirror + Pages public/ (commercial pattern).
  - Visibility in place: ai-sitemap gun-safe description + keywords from
    qa-bank verbatim questions; llms.txt line + dated section; data txt dated
    section; Developer Gun Safe card merged in place (listed once).
  - ARD unchanged. DB: canonical description refresh (if stale) + 13 new
    attestation rows ONLY. NO rubric_check row, NO edge rows.
  - NO new page/slug (incl. never /gun-safe-moving/), sitemap 153, services 22.
Exclusions: no FBI/named federal or private client, no private-job detail,
no USDOT/MC/price/testimonial/contract/clearance claims, no placeholders,
no 'attest'/'gated' hedging in published copy, branches distinct,
CTAs 'Get My Flat Rate Quote' / 'Get a flat rate quote'. No quote test.
"""
import html as HTML, json, re, shutil, sqlite3, subprocess, sys
from pathlib import Path

HOME = Path.home()
MACH = HOME / 'workspace/the-flat-rate-machine'
PAGES = HOME / 'workspace/the-flat-rate-movers-pages/public'
FLAT = HOME / 'workspace/theflatratemovers'
PKG = MACH / 'out/pages/gun-safe-attestation-update'
BATCH = MACH / 'out/gun-safe-attestation-update'
BACKUP = BATCH / 'backup-2026-10-29'
TODAY = '2026-10-29'
SITE = 'https://theflatratemovers.com'
ORG = SITE + '/#organization'
GSVC = SITE + '/#service-gun-safe'
GHUB = SITE + '/gun-safe-movers/'
WIN_PLACE = SITE + '/#winchester-place'
MAR_PLACE = SITE + '/#martinsburg-place'
WIN_HEAD = SITE + '/#winchester'
MAR_HEAD = SITE + '/#martinsburg'
BANNED = re.compile(r'temp labor|crew page|spearman|around town movers|USDOT|MC-\d{4}|subcontract|\bfbi\b|federal bureau', re.I)
HEDGE = re.compile(r'attest|gated', re.I)

def fail(msg):
    print('FAIL:', msg); sys.exit(1)

def strip_comments(t):
    return re.sub(r'<!--.*?-->', '', t, flags=re.S)

def page_spans(text):
    pages = [(m.start(), m.group(1)) for m in re.finditer(r'<div class="page" id="([^"]+)"', text)]
    spans = {}
    for i, (pos, did) in enumerate(pages):
        end = pages[i + 1][0] if i + 1 < len(pages) else len(text)
        spans[did] = (pos, end)
    return spans, len(pages)

# ---------- 0. backups ----------
BACKUP.mkdir(parents=True, exist_ok=True)
html0 = (PAGES / 'index.html').read_text()
m_head = re.search(r'<script type="application/ld\+json">(.*?)</script>', html0, re.S)
head_before = m_head.group(0)
for src in [PAGES / 'index.html', PAGES / 'datasets-gun-safe.json', PAGES / 'ai-sitemap.json',
            PAGES / 'llms.txt', PAGES / 'the-flat-rate-movers-data.txt',
            MACH / 'data/entity-graph.json', MACH / 'data/best-json-entity-graph.json',
            FLAT / 'rubric.db']:
    dst = BACKUP / src.name
    if not dst.exists():
        shutil.copy2(src, dst)
(BACKUP / 'head-graph.json').write_text(head_before)
print('backups ->', BACKUP)

# ---------- pre-checks ----------
schema = json.loads((PKG / 'schema.json').read_text())
svc_staged = [n for n in schema['@graph'] if n.get('@id') == GSVC]
assert len(svc_staged) == 1, 'staged schema service nodes != 1'
POWER = svc_staged[0]['description']
assert svc_staged[0]['url'] == GHUB and svc_staged[0]['serviceType'] == 'Gun Safe Moving', 'staged schema mismatch'
hub_json_staged = json.loads((PKG / 'gun-safe-movers.json').read_text())
hj_svc = [n for n in hub_json_staged['@graph'] if n.get('@id') == GSVC]
assert len(hj_svc) == 1 and hj_svc[0]['description'] == POWER and hj_svc[0]['url'] == GHUB, 'hub JSON service mismatch'
qa = json.loads((PKG / 'qa-bank.json').read_text())
questions = qa['questions']
assert len(questions) == 36, 'qa-bank questions != 36'
faq = [n for n in schema['@graph'] if n.get('@type') == 'FAQPage']
assert len(faq) == 1 and len(faq[0]['mainEntity']) == 36, 'schema FAQ != 36'
for qq, fq in zip(questions, faq[0]['mainEntity']):
    assert fq['@type'] == 'Question' and fq['name'] == qq['question'] and fq['acceptedAnswer']['text'] == qq['answer'], 'FAQ != qa-bank: ' + qq['question'][:60]
print('staged schema FAQ == qa-bank exactly (36/36)')
hub_draft = strip_comments((PKG / 'hub-div-draft.html').read_text()).strip()
assert hub_draft.startswith('<div class="page" id="page-gunsafe">'), 'hub draft div start unexpected'
assert hub_draft.endswith('</div>'), 'hub draft div end unexpected'
plain = HTML.unescape(re.sub(r'<[^>]+>', ' ', hub_draft))
for qq in questions:
    if qq['question'] not in hub_draft and qq['question'] not in plain:
        fail('hub draft missing question: ' + qq['question'])
print('hub draft contains all 36 questions')
for f in ['hub-div-draft.html', 'winchester-parity-draft.html', 'gun-safe-movers.json', 'datasets-gun-safe-updated.json', 'schema.json']:
    txt = (PKG / f).read_text()
    if BANNED.search(txt): fail('banned string in staged file: ' + f)
    if HEDGE.search(txt): fail('hedging word in staged customer-facing file: ' + f)
print('staged customer-facing files: banned 0, hedging 0')
win_draft = strip_comments((PKG / 'winchester-parity-draft.html').read_text())
assert '736 Williamsport' not in win_draft, 'winchester draft contains Martinsburg address'
assert 'What it includes' in win_draft and 'Questions, answered' in win_draft, 'winchester draft sections missing'
datasets_staged = json.loads((PKG / 'datasets-gun-safe-updated.json').read_text())
ds_nodes = datasets_staged['@graph']
assert len(ds_nodes) == 18 and len({n['@id'] for n in ds_nodes}) == 18, 'datasets != 18 unique'
assert sum(1 for n in ds_nodes if 'creativecommons.org/licenses/by/4.0' in json.dumps(n)) == 18, 'datasets CC BY != 18'
live_ds = json.loads((PAGES / 'datasets-gun-safe.json').read_text())['@graph']
live_ids = [n['@id'] for n in live_ds]
assert live_ids[:8] == [n['@id'] for n in ds_nodes[:8]], 'staged first 8 @ids != live first 8'
assert len(live_ids) in (8, 18), 'live datasets neither 8 (pre-edit) nor 18 (prior partial run)'
print('datasets: staged 18 (first 8 == live 8 @ids), all CC BY 4.0')
# NOTE: hub JSON write is idempotent (deterministic from staged + DB footprint);
# a prior partial run may already have created it — overwriting with identical content is safe.
svc_reg = json.loads((MACH / 'data/services.json').read_text())
pages_reg = json.loads((MACH / 'data/pages.json').read_text())
gs = [s for s in svc_reg['services'] if s['id'] == 'service-gun-safe']
assert len(gs) == 1, 'service-gun-safe registry entries != 1'
refs = sum(1 for p in pages_reg['pages'] if 'service-gun-safe' in (p.get('services') or []))
print('registry: services=%d pages=%d gun-safe pageCount=%d refs=%d' % (len(svc_reg['services']), len(pages_reg['pages']), gs[0]['pageCount'], refs))
if len(svc_reg['services']) != 22 or len(pages_reg['pages']) != 153 or gs[0]['pageCount'] != 9 or refs != 9:
    fail('registry counts != 22/153/9/9')
db = sqlite3.connect(str(FLAT / 'rubric.db'))
win_areas = [r[0] for r in db.execute("SELECT area FROM service_area WHERE place_id=? ORDER BY area", (WIN_PLACE,))]
mar_areas = [r[0] for r in db.execute("SELECT area FROM service_area WHERE place_id=? ORDER BY area", (MAR_PLACE,))]
print('DB footprint: winchester=%d martinsburg=%d shared=%d' % (len(win_areas), len(mar_areas), len(set(win_areas) & set(mar_areas))))
if (len(win_areas), len(mar_areas), len(set(win_areas) & set(mar_areas))) != (31, 35, 14):
    fail('DB footprint != 31/35/14')
canon_before = db.execute("SELECT COUNT(*) FROM service WHERE service_id LIKE '%#service-%'").fetchone()[0]
att22_before = db.execute("SELECT COUNT(*) FROM attestation WHERE evidence LIKE '%services.json id%'").fetchone()[0]
edge_before = db.execute("SELECT COUNT(*) FROM edge").fetchone()[0]
check_before = db.execute("SELECT COUNT(*) FROM rubric_check").fetchone()[0]
oh_before = db.execute("SELECT COUNT(*) FROM opening_hours").fetchone()[0]
sa_before = db.execute("SELECT COUNT(*) FROM service_area").fetchone()[0]
att_before = db.execute("SELECT COUNT(*) FROM attestation").fetchone()[0]
print('DB before: canon=%d att=%d att22=%d edge=%d rubric_check=%d opening_hours=%d service_area=%d' % (canon_before, att_before, att22_before, edge_before, check_before, oh_before, sa_before))
if (canon_before, att22_before, edge_before, check_before, oh_before, sa_before) != (22, 22, 40, 7, 14, 66):
    fail('DB baseline unexpected')
canon_row = db.execute("SELECT description FROM service WHERE service_id=?", (GSVC,)).fetchone()
assert canon_row is not None, 'canonical service-gun-safe DB row missing'
print('DB canonical gun-safe description stale (pre-update):', canon_row[0] != POWER)

# ---------- 1. datasets file (stamped) ----------
for n in ds_nodes:
    n['dateModified'] = TODAY
ds_text = json.dumps(datasets_staged, indent=2) + '\n'
(PAGES / 'datasets-gun-safe.json').write_text(ds_text)
chk = json.loads(ds_text)
assert len(chk['@graph']) == 18 and all(n.get('dateModified') == TODAY for n in chk['@graph']), 'stamped datasets check failed'
print('datasets: public/datasets-gun-safe.json replaced, 18 nodes, dateModified 2026-10-29 on all')

# ---------- 2. hub div replacement + dataset + FAQ scripts ----------
html = html0
spans, npages = page_spans(html)
assert npages == 153, 'page divs != 153 before edit'
gs_start, gs_end = spans['page-gunsafe']
ds_script = '\n<script type="application/ld+json">' + json.dumps(datasets_staged, indent=2) + '</script>'
faq_doc = {'@context': 'https://schema.org', '@graph': [faq[0]]}
faq_script = '\n<script type="application/ld+json">' + json.dumps(faq_doc, indent=2) + '</script>'
draft = hub_draft.rstrip()
assert draft.endswith('</div>')
new_div = draft[:-len('</div>')] + ds_script + faq_script + '\n</div>'
html = html[:gs_start] + new_div + html[gs_end:]
spans2, npages2 = page_spans(html)
assert npages2 == 153 and spans2['page-gunsafe'][0] == gs_start, 'page div count/order changed'
seg = html[spans2['page-gunsafe'][0]:spans2['page-gunsafe'][1]]
assert seg.count('#dataset-gun-safe-') >= 18, 'hub segment dataset ids missing'
assert seg.count('"@type": "Question"') == 36, 'hub segment FAQ questions != 36'
print('hub div: replaced, dataset (18) + FAQPage (36) scripts inside div')

# ---------- 3. Winchester insertion ----------
spans, _ = page_spans(html)
w_start, w_end = spans['page-gun-safe-movers-winchester-va']
wseg = html[w_start:w_end]
anchor = '<div class="card" style="margin-top:18px"><h3>📞 Start here</h3>'
assert wseg.count(anchor) == 1, 'winchester Start here anchor != 1'
for keep in ['Surveyed before it moves', 'Discreet by default', 'Winchester branch', 'Start here', 'Service area, published data']:
    assert keep in wseg, 'winchester preserved string missing before edit: ' + keep
pos = html.find(anchor, w_start)
html = html[:pos] + win_draft + '\n' + html[pos:]
spans, _ = page_spans(html)
wseg2 = html[spans['page-gun-safe-movers-winchester-va'][0]:spans['page-gun-safe-movers-winchester-va'][1]]
for keep in ['Surveyed before it moves', 'Discreet by default', 'Winchester branch', 'Start here', 'Service area, published data']:
    assert keep in wseg2, 'winchester preserved string missing after edit: ' + keep
for new in ['What it includes', 'Questions, answered', 'Sources and method note']:
    assert new in wseg2, 'winchester new section missing: ' + new
assert wseg2.count('736 Williamsport') == wseg.count('736 Williamsport'), 'winchester page Martinsburg-address count changed (parity draft itself is 0; the preserved Start here card lists both branches)'
print('winchester div: parity sections inserted before Start here, preserved cards intact')

# ---------- 4. head untouched check ----------
m_after = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
assert m_after.group(0) == head_before, 'head graph changed (FORBIDDEN)'
h = json.loads(m_after.group(1))
hn = [n for n in h['@graph'] if n.get('@id') == GSVC]
assert len(hn) == 1 and hn[0].get('url') == GHUB and hn[0].get('areaServed') == [{'@id': WIN_HEAD}, {'@id': MAR_HEAD}], 'head gun-safe node != commercial state'
print('head graph: byte-identical, gun-safe exactly one, url hub, Place chain')

# ---------- 5. Developer card (merged in place, listed once) ----------
h3 = html.find('<h3>Gun Safe datasets</h3>')
assert h3 > 0, 'gun safe card not found'
card_end = html.find('</article>', h3) + len('</article>')
dev_start = html.find('id="page-developer"')
dev_next = html.find('<div class="page"', dev_start + 1)
assert dev_start < h3 < card_end < dev_next, 'gun safe card not inside developer div'
assert html.count('<h3>Gun Safe datasets</h3>') == 1, 'gun safe card duplicated before edit'
new_card = ('<article class="card"><h3>Gun Safe datasets</h3><p><a href="/datasets-gun-safe.json" target="_blank" rel="noopener">'
            '<b>datasets-gun-safe.json →</b></a> — the full gun-safe-moving datasets as Dataset JSON-LD (CC BY 4.0), '
            'now 18 nodes: safe move operations, weight bands and access, safe and access taxonomy, branch dispatch network, '
            'commercial terms, buyer personas and triggers, floor, protection, and handling compliance, service areas, dispatch, '
            'and quote path, plus 10 service-detail nodes — safes under 1,500 lb handled the same careful way, customers always '
            'empty the safe first, stairs up and down, equipment matched to the project, re-anchoring on request, vault work any '
            'size, standard safe classes, Winchester page parity, long-distance published runs, no locksmith services — about the '
            'gun-safe service, from both branches, never merged. Hub page: <a href="/gun-safe-movers/">Gun Safe Moving</a> · '
            'Hub JSON: <a href="/gun-safe-movers.json" target="_blank" rel="noopener"><b>gun-safe-movers.json →</b></a>.</p></article>')
html = html[:html.rfind('<article class="card">', 0, h3)] + new_card + html[card_end:]
assert html.count('<h3>Gun Safe datasets</h3>') == 1, 'gun safe card duplicated after edit'
print('developer card: Gun Safe card merged in place (18 nodes + hub JSON), listed once')

# ---------- 6. hub per-page JSON (Places expanded to footprint) ----------
obj = json.loads((PKG / 'gun-safe-movers.json').read_text())
for n in obj['@graph']:
    if n.get('@type') == 'Place':
        if n['@id'] == WIN_HEAD: n['areaServed'] = win_areas
        elif n['@id'] == MAR_HEAD: n['areaServed'] = mar_areas
        else: fail('hub JSON unexpected Place @id: ' + n['@id'])
text = json.dumps(obj, indent=2) + '\n'
(PAGES / 'gun-safe-movers.json').write_text(text)
chk = json.loads(text)
assert len(chk['@graph']) == 5, 'hub JSON nodes != 5'
for n in chk['@graph']:
    if n.get('@type') == 'Place':
        exp = 31 if n['@id'] == WIN_HEAD else 35
        assert len(n.get('areaServed', [])) == exp, 'hub JSON place areas != %d' % exp
    if n.get('@id') == GSVC:
        assert n.get('url') == GHUB and n.get('description') == POWER, 'hub JSON service wrong'
print('hub JSON: public/gun-safe-movers.json created (5 nodes, places 31/35)')

# ---------- 7. machine graphs: description-only refresh + mirrors ----------
def edit_graph(path):
    _chk = json.loads(path.read_text())
    _gn = [n for n in _chk['@graph'] if n.get('@id') == GSVC]
    if len(_gn) == 1 and _gn[0].get('description') == POWER:
        assert _gn[0].get('url') == GHUB and _gn[0].get('areaServed') == [{'@id': WIN_PLACE}, {'@id': MAR_PLACE}], 'graph %s already-applied node wrong' % path.name
        print('graph %s: description already applied (prior partial run), verified, skipping edit' % path.name)
        return len(_chk['@graph'])
    t = path.read_text()
    occ = t.count('"@id": "%s"' % GSVC)
    assert occ == 1, 'graph %s gun-safe occurrences != 1' % path.name
    pos = t.find('"@id": "%s"' % GSVC)
    name_line = '"name": "Gun Safe Moving",'
    nl = t.find(name_line, pos)
    assert nl > 0, 'graph %s gun-safe name line not found' % path.name
    ins = nl + len(name_line)
    if '"description":' in t[pos:pos + 2000].split('"serviceType"')[0]:
        fail('graph %s gun-safe already has description' % path.name)
    t = t[:ins] + '\n      "description": %s,' % json.dumps(POWER) + t[ins:]
    o = json.loads(t)
    nodes = o['@graph']
    gn = [n for n in nodes if n.get('@id') == GSVC]
    assert len(gn) == 1 and gn[0].get('description') == POWER and gn[0].get('url') == GHUB, 'graph %s gun-safe wrong after edit' % path.name
    assert gn[0].get('areaServed') == [{'@id': WIN_PLACE}, {'@id': MAR_PLACE}], 'graph %s Place chain changed' % path.name
    path.write_text(t)
    print('graph %s: nodes=%d gun-safe description added, url/Place chain unchanged' % (path.name, len(nodes)))
    return len(nodes)

eg_n = edit_graph(MACH / 'data/entity-graph.json')
best_n = edit_graph(MACH / 'data/best-json-entity-graph.json')
assert (eg_n, best_n) == (39, 76), 'graph node counts != 39/76'
for fname in ('entity-graph.json', 'best-json-entity-graph.json'):
    for dest in (FLAT / fname, PAGES / fname):
        shutil.copy2(MACH / 'data' / fname, dest)
    for dest in (FLAT / fname, PAGES / fname):
        assert dest.read_bytes() == (MACH / 'data' / fname).read_bytes(), 'mirror copy mismatch: ' + str(dest)
print('graphs mirrored byte-identical to local mirror + public')

# ---------- 8. ai-sitemap (description + qa-bank keywords, diff-checked) ----------
ai_p = PAGES / 'ai-sitemap.json'
ai_raw = ai_p.read_text()
ai = json.loads(ai_raw)
gs_entry = [s for s in ai.get('services', []) if s.get('name') == 'Gun Safe Moving']
assert len(gs_entry) == 1, 'ai-sitemap gun-safe entries != 1'
assert gs_entry[0].get('description') != POWER, 'ai-sitemap gun-safe description already powerful (unexpected)'
gs_entry[0]['description'] = POWER
kw_topics = ['T1 Sub-band', 'T2 Emptying', 'T3 Stairs', 'T10 Locksmith']
new_kw = []
for topic in kw_topics:
    hit = [qq['question'] for qq in questions if qq.get('topic', '').startswith(topic)]
    assert len(hit) >= 1, 'qa topic missing: ' + topic
    if hit[0] not in ai['keywords']:
        ai['keywords'].append(hit[0]); new_kw.append(hit[0])
ai_new = json.dumps(ai, indent=2, ensure_ascii=False)
if ai_raw.endswith('\n'): ai_new += '\n'
ai_p.write_text(ai_new)
ai2 = json.loads(ai_p.read_text())
old = json.loads(ai_raw)
assert (len(ai2['services']), len(ai2['hasPart']), len(ai2['keywords'])) == (22, 153, len(old['keywords']) + len(new_kw)), 'ai-sitemap counts wrong'
old_kw = old['keywords']
assert old_kw == [k for k in ai2['keywords'] if k not in new_kw], 'ai-sitemap keywords changed beyond additions'
old.pop('keywords'); ai2.pop('keywords')
old_svcs = old.pop('services'); new_svcs = ai2.pop('services')
assert old == ai2, 'ai-sitemap diff beyond keywords/services'
for o, n in zip(old_svcs, new_svcs):
    if o['name'] == 'Gun Safe Moving':
        assert n['description'] == POWER, 'ai-sitemap gun-safe entry wrong'
    else:
        assert o == n, 'ai-sitemap non-gun-safe service changed: ' + o['name']
print('ai-sitemap: services 22, hasPart 153, keywords +%d (diff = gun-safe description + keywords only)' % len(new_kw))
print('  new keywords:', new_kw)

# ---------- 9. llms.txt ----------
llms = PAGES / 'llms.txt'
ll = llms.read_text()
assert 'gun-safe service detail' not in ll, 'llms already has gun-safe update section'
old_line_start = '- [Gun Safe Moving](https://theflatratemovers.com/gun-safe-movers/): '
i = ll.find(old_line_start)
assert i >= 0, 'llms gun-safe line not found'
j = ll.find('\n', i)
old_line = ll[i:j]
assert 'Full datasets: https://theflatratemovers.com/datasets-gun-safe.json' in old_line, 'llms gun-safe line shape unexpected'
new_line = ('- [Gun Safe Moving](https://theflatratemovers.com/gun-safe-movers/): ' + POWER +
            ' Datasets now 18 nodes (CC BY 4.0): safe move operations; weight bands and access; safe and access taxonomy; '
            'branch dispatch network; commercial terms (flat-rate-in-writing only; domain markers labeled); buyer personas and '
            'triggers; floor, protection, and handling compliance; service areas, dispatch, and quote path; plus 10 service-detail '
            'nodes on the ten service topics. Full datasets: https://theflatratemovers.com/datasets-gun-safe.json · '
            'Hub JSON: https://theflatratemovers.com/gun-safe-movers.json · Winchester branch page expanded to matching depth.')
ll = ll[:i] + new_line + ll[j:]
assert 'gun-safe deep batch' in ll and 'commercial deep batch' in ll, 'llms history lost'
ll += ('\n## Update — 2026-10-29 (gun-safe full-page hub update)\n'
       '- Gun-safe hub page https://theflatratemovers.com/gun-safe-movers/ updated in place with the full service detail: '
       'safes under 1,500 lb handled the same careful way, customers always empty the safe first, stairs up and down, equipment '
       'matched to the project, re-anchoring on request, vault work any size, standard safe classes, long-distance published runs '
       '(Winchester to Las Vegas), no locksmith services — stated plainly with industry-standard research behind each point, '
       'plus 36 likely-search questions and answers on the hub (39 total with the 3 preserved entries). No new page, no new slug; '
       'counts unchanged at 153 pages and 22 services.\n'
       '- Datasets updated in place at https://theflatratemovers.com/datasets-gun-safe.json: 8 nodes → 18 nodes (CC BY 4.0, '
       'dateModified 2026-10-29), with page-level markup on the hub page and a merged Developer-page collection entry. '
       'Hub per-page JSON created: https://theflatratemovers.com/gun-safe-movers.json (5 nodes). Winchester branch page expanded '
       'to matching depth. Head node untouched in this batch (commercial batch already shipped its hub url + Place chain); machine '
       'graphs refreshed description-only (no regeneration, Place footprint 31/35 preserved).\n')
llms.write_text(ll)
print('llms.txt: gun-safe line refreshed + dated update section')

# ---------- 10. data txt ----------
dt = PAGES / 'the-flat-rate-movers-data.txt'
tx = dt.read_text()
assert 'gun-safe full-page hub update' not in tx, 'data txt already has gun-safe update section'
tx += ('\n## Update 2026-10-29 — gun-safe full-page hub update\n'
       '- Gun-safe hub page https://theflatratemovers.com/gun-safe-movers/ updated in place with the full service detail: '
       'safes under 1,500 lb handled the same careful way, customers always empty the safe first, stairs up and down, equipment '
       'matched to the project, re-anchoring on request, vault work any size, standard safe classes, long-distance published runs '
       '(Winchester to Las Vegas), no locksmith services — stated plainly with industry-standard research behind each point, '
       'plus 36 likely-search questions and answers on the hub (39 total with the 3 preserved entries). No new page, no new slug; '
       'counts unchanged at 153 pages and 22 services.\n'
       '- Datasets updated in place at https://theflatratemovers.com/datasets-gun-safe.json: 8 nodes → 18 nodes (CC BY 4.0, '
       'dateModified 2026-10-29), with page-level markup on the hub page and a merged Developer-page collection entry. '
       'Hub per-page JSON created: https://theflatratemovers.com/gun-safe-movers.json (5 nodes). Winchester branch page expanded '
       'to matching depth. Head node untouched in this batch (commercial batch already shipped its hub url + Place chain); machine '
       'graphs refreshed description-only (Place footprint 31/35 preserved).\n')
dt.write_text(tx)
print('data txt: dated update section appended')

# ---------- 11. rubric DB ----------
if canon_row[0] != POWER:
    db.execute("UPDATE service SET description=? WHERE service_id=?", (POWER, GSVC))
    print('DB canonical gun-safe description refreshed to powerful version')
ROWS = [
    ('Safes under 1,500 lb handled the same careful way as the 1,500 to 3,500 lb SIR band, under standard heavy care',
     'owner answers 2026-10-29 + gun-safe research doc sections 3-4', 'hub page What we move + service-detail dataset, gun-safe update 2026-10-29'),
    ('Customers always empty the safe first, before move day',
     'owner answers 2026-10-29 + gun-safe research doc section 5', 'hub page Before move day section + service-detail dataset, gun-safe update 2026-10-29'),
    ('Stairs go up and down; staircases and landings planned step by step',
     'owner answers 2026-10-29 + gun-safe research doc section 6', 'hub page Stairs section + service-detail dataset, gun-safe update 2026-10-29'),
    ('Equipment matched to the project; industry equipment taxonomy is background only, no company inventory claim',
     'owner answers 2026-10-29 + gun-safe research doc section 7', 'hub page Equipment section + service-detail dataset, gun-safe update 2026-10-29'),
    ('Re-anchoring at the destination available on request, not automatic',
     'owner answers 2026-10-29 + gun-safe research doc section 8', 'hub page Re-anchoring section + service-detail dataset, gun-safe update 2026-10-29'),
    ('Vault work covers any size',
     'owner answers 2026-10-29 + gun-safe research doc section 9', 'hub page Vaults section + service-detail dataset, gun-safe update 2026-10-29'),
    ('Standard safe classes stated plainly as service scope; class spectrum is industry background; specific TL coverage neither claimed nor denied',
     'owner answers 2026-10-29 + gun-safe research doc section 10 (internal note: standard-classes meaning + TL coverage pending owner clarification, internal only)',
     'hub page Safe classes section + service-detail dataset, gun-safe update 2026-10-29'),
    ('Winchester branch page expanded to matching depth (parity approved and shipped as branch update, Winchester-only facts)',
     'owner approval 2026-10-29 + gun-safe research doc section 11', 'Winchester branch page new sections, gun-safe update 2026-10-29'),
    ('Long-distance published runs Winchester to Las Vegas only; audience research covers collectors, dealers, estates, households and high-value households; no broader scope published',
     'owner answers 2026-10-29 + gun-safe research doc section 12 + published case pages', 'hub page Long distance section + service-detail dataset, gun-safe update 2026-10-29'),
    ('No locksmith services: combination changes, lock opening and lock replacement are not part of the move',
     'owner answers 2026-10-29 + gun-safe research doc section 13', 'hub page Locksmith section + service-detail dataset, gun-safe update 2026-10-29'),
    ('Gun safes moved since 2010; company founded June 2010',
     'owner confirmation 2026-10-27 + owner statement 2026-10-29', 'hub page What we move + schema, gun-safe update 2026-10-29'),
    ('Hub per-page JSON created (follow-up closed in this batch): gun-safe-movers.json, 5 nodes, Places expanded to footprint 31/35',
     'live sitemap + public-file check 2026-10-29', 'public/gun-safe-movers.json, gun-safe update 2026-10-29'),
    ('Gun-safe datasets file updated in place: 8 nodes to 18 nodes, same @ids for existing 8, 10 new service-detail nodes, all CC BY 4.0, dateModified 2026-10-29',
     'gun-safe datasets file + research doc', 'public/datasets-gun-safe.json, gun-safe update 2026-10-29'),
]
for claim, source, evidence in ROWS:
    assert 'services.json id' not in claim and 'services.json id' not in evidence, 'attestation contains forbidden string'
    exists = db.execute("SELECT COUNT(*) FROM attestation WHERE claim=?", (claim,)).fetchone()[0]
    if not exists:
        db.execute("INSERT INTO attestation (claim, source, verified, evidence) VALUES (?,?,?,?)", (claim, source, TODAY, evidence))
        print('attestation row added:', claim[:60], '...')
db.commit()
att22_after = db.execute("SELECT COUNT(*) FROM attestation WHERE evidence LIKE '%services.json id%'").fetchone()[0]
canon_after = db.execute("SELECT COUNT(*) FROM service WHERE service_id LIKE '%#service-%'").fetchone()[0]
edge_after = db.execute("SELECT COUNT(*) FROM edge").fetchone()[0]
check_after = db.execute("SELECT COUNT(*) FROM rubric_check").fetchone()[0]
oh_after = db.execute("SELECT COUNT(*) FROM opening_hours").fetchone()[0]
sa_after = db.execute("SELECT COUNT(*) FROM service_area").fetchone()[0]
att_after = db.execute("SELECT COUNT(*) FROM attestation").fetchone()[0]
print('DB after: att=%d att22=%d canon=%d edge=%d rubric_check=%d opening_hours=%d service_area=%d' % (att_after, att22_after, canon_after, edge_after, check_after, oh_after, sa_after))
if (att_after, att22_after, canon_after, edge_after, check_after, oh_after, sa_after) != (att_before + 13, 22, 22, 40, 7, 14, 66):
    fail('DB constraints changed')
db.close()

# ---------- 12. write index.html + node --check ----------
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
