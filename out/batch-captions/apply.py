#!/usr/bin/env python3
"""Batch CAPTIONS (2026-10-30) — final scope:
  - Class A + B caption rewrites (captions_map.MAP) in index.html elements
    and per-page JSON image captions (lockstep).
  - MiniMovers piano image (img-09) REMOVED everywhere except the heavy
    page, where the figure is SWAPPED to Henry's supplied antique safe
    photo (img-22, produced from his media-library original image__3.png).
  - 5 other piano JSONs lose their WebPage image property; pageMeta img
    entries for technical-rigging + invisible-risk revert to default og.
  - service-area.geojson rubric R6 sentence + rubric.db R7 text updated.
  - img-09 asset files deleted.
Usage: apply.py [--apply]  (default dry-run prints the full change log)
"""
import json, re, sys, os, glob, sqlite3
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from captions_map import MAP

APPLY = '--apply' in sys.argv
PUB = '/home/hatch/workspace/the-flat-rate-movers-pages/public'
IDX = os.path.join(PUB, 'index.html')
SAFE_CAPTION = ("An antique Francis D. Mone commercial fireproof safe in a stone-foundation "
                "basement — the class of high-mass safe that is surveyed in place and "
                "engineered out under SIR, never forced. Photo supplied by The Flat Rate Movers.")
SAFE_URL = "https://theflatratemovers.com/assets/img-22-antique-fireproof-safe.webp"
PIANO = 'img-09-b676e12626df'
LOG = []
def log(*a): LOG.append(' '.join(str(x) for x in a))

def esc_html(t): return t.replace('&', '&amp;')
def unesc(t): return t.replace('&amp;', '&')

# ---------- index.html ----------
html = open(IDX, encoding='utf-8').read()
orig_html = html

# 1) caption rewrites inside caption elements (<b> titles preserved)
pat = re.compile(r'(<figcaption[^>]*>|<p class="phcap">)(.*?)(</figcaption>|</p>)', re.S)
changed = [0]
def do_repl(m):
    open_t, inner, close_t = m.groups()
    title, body = '', inner
    bm = re.match(r'(<b>.*?</b>)(.*)', inner, re.S)
    if bm: title, body = bm.group(1), bm.group(2)
    text = unesc(re.sub(r'<[^>]+>', '', body)).strip()
    if text in MAP:
        changed[0] += 1
        return open_t + title + esc_html(MAP[text]) + close_t
    return m.group(0)
html = pat.sub(do_repl, html)
log(f'HTML caption elements rewritten: {changed[0]} (expect 51)')

# 2) heavy page figure swap (exact raw block)
old_fig = re.search(r'<figure><img class="ph" src="/assets/img-09-b676e12626df\.webp".*?</figure>', html, re.S)
assert old_fig, 'heavy piano figure not found'
new_fig = ('<figure><img class="ph" src="/assets/img-22-antique-fireproof-safe.webp" '
           'alt="Antique Francis D. Mone commercial fireproof safe standing in a stone-foundation '
           'basement — a high-mass safe of the class surveyed in place and planned under SIR before it moves" '
           'loading="lazy" width="1160" height="870"><figcaption class="phcap">'
           + SAFE_CAPTION + '</figcaption></figure>')
html = html.replace(old_fig.group(0), new_fig, 1)
log('heavy figure swapped piano -> img-22 antique safe')

# 3) remove remaining piano figures (6), collapsing the blank line left behind
n = 0
for m in list(re.finditer(r'[ \t]*<figure[^>]*>(?:(?!</figure>).)*img-09-b676e12626df(?:(?!</figure>).)*</figure>\n?', html, re.S)):
    pass
def rm_fig(mo):
    global n; n += 1; return ''
html = re.sub(r'[ \t]*<figure[^>]*>(?:(?!</figure>).)*img-09-b676e12626df(?:(?!</figure>).)*</figure>\n?', rm_fig, html)
log(f'piano figures removed: {n} (expect 6)')
assert PIANO not in html.split('pageMeta')[0].split('</body>')[0] or True
body_part = html
assert 'img-09-b676e12626df.webp' not in body_part, 'webp piano ref remains in html'

# 4) pageMeta: drop the two img-09 og entries (revert to default og image)
cnt = html.count(', "img": "assets/img-09-b676e12626df.jpg"')
html = html.replace(', "img": "assets/img-09-b676e12626df.jpg"', '')
log(f'pageMeta img-09 entries removed: {cnt} (expect 2)')
assert 'img-09-b676e12626df' not in html, 'piano ref remains anywhere in index.html'
for bad in ('QShark', 'Thumbtack', 'Bright Mover', 'A Ray of Sunlight', 'Style example', 'MiniMovers'):
    assert bad not in html, f'{bad} still in index.html'
log('forbidden strings in index.html: 0 (QShark/Thumbtack/Bright Mover/A Ray of Sunlight/Style example/MiniMovers)')
if APPLY: open(IDX, 'w', encoding='utf-8').write(html)
else: assert html != orig_html

# ---------- per-page JSONs ----------
SWEEP = ('Wikimedia Commons', 'Thumbtack', 'QShark', 'Bright Mover', 'A Ray of Sunlight',
         'WV Living', 'Virginia Economic Development Partnership', 'MiniMovers', 'Famartin',
         'Doug Kerr', 'Karen Nutini', 'Sarah Stierch', 'Pollinator', 'Jenny DiCola',
         'Style example', 'Photo via the Winchester area')
files = []
for p in sorted(glob.glob(os.path.join(PUB, '*.json'))):
    try: d = json.load(open(p, encoding='utf-8'))
    except Exception: continue
    def caps_of(o, acc):
        if isinstance(o, dict):
            if isinstance(o.get('caption'), str): acc.append(o['caption'])
            for v in o.values(): caps_of(v, acc)
        elif isinstance(o, list):
            for v in o: caps_of(v, acc)
    acc = []; caps_of(d, acc)
    if any(any(s in c for s in SWEEP) for c in acc):
        files.append(os.path.basename(p))
log(f'per-page JSONs carrying target captions: {len(files)} (expect 41)')
rewritten, img_deleted, img_swapped = [], [], []
for fn in files:
    p = os.path.join(PUB, fn)
    raw = open(p, encoding='utf-8').read()
    d = json.loads(raw)
    caps = []
    def find_caps(o):
        if isinstance(o, dict):
            if 'caption' in o and isinstance(o.get('caption'), str): caps.append(o['caption'])
            for v in o.values(): find_caps(v)
        elif isinstance(o, list):
            for v in o: find_caps(v)
    find_caps(d)
    assert len(caps) == 1, (fn, len(caps))
    cap = caps[0]
    if PIANO.split('-')[0] in raw and 'img-09-b676e12626df' in raw:
        if fn == 'heavy.json':
            for ea in (True, False):
                jo, jn = json.dumps(cap, ensure_ascii=ea), json.dumps(SAFE_CAPTION, ensure_ascii=ea)
                if jo in raw: break
            assert jo in raw, 'heavy caption raw not found'
            raw = raw.replace(jo, jn, 1).replace('assets/img-09-b676e12626df.webp', 'assets/img-22-antique-fireproof-safe.webp', 1)
            assert 'img-09' not in raw and json.loads(raw), fn
            img_swapped.append(fn)
        else:
            i = raw.find('"image"')
            assert i > 0, fn
            ls = raw.rfind('\n', 0, i) + 1
            j = raw.find('{', i); depth = 0; k = j; instr = False; esc = False
            while True:
                c = raw[k]
                if instr:
                    if esc: esc = False
                    elif c == '\\': esc = True
                    elif c == '"': instr = False
                else:
                    if c == '"': instr = True
                    elif c == '{': depth += 1
                    elif c == '}':
                        depth -= 1
                        if depth == 0: break
                k += 1
            end = k + 1
            if raw[end] == ',': end += 1
            if raw[end] == '\n': end += 1
            raw = raw[:ls] + raw[end:]
            dd = json.loads(raw)
            def has_img09(o):
                if isinstance(o, dict): return any(has_img09(v) for v in o.values()) or 'img-09' in json.dumps(o.get('url',''))
                if isinstance(o, list): return any(has_img09(v) for v in o)
                return False
            assert 'img-09' not in raw, fn
            img_deleted.append(fn)
    else:
        assert cap in MAP, (fn, cap[:80])
        for ea in (True, False):
            jo, jn = json.dumps(cap, ensure_ascii=ea), json.dumps(MAP[cap], ensure_ascii=ea)
            if jo in raw: break
        assert jo in raw, ('raw form not found', fn)
        raw = raw.replace(jo, jn, 1)
        assert json.loads(raw), fn
        rewritten.append(fn)
    if APPLY: open(p, 'w', encoding='utf-8').write(raw)
log(f'JSON caption rewrites: {len(rewritten)} (expect 35); image deleted: {len(img_deleted)} (expect 5); image swapped: {img_swapped} (expect heavy.json)')

# ---------- service-area.geojson rubric sentence (3 byte-identical copies) ----------
R6_OLD = "3 — warehouse photos are Henry-supplied, faces blurred, captions say so; wrapped-furniture style examples labelled Style example with credit"
R6_NEW = ("3 — warehouse photos and the antique safe photo are Henry-supplied, faces blurred where people appear, "
          "captions say so; wrapped-furniture reference photos labelled Reference photo, with no third-party mover "
          "named in any caption (owner orders 2026-10-30)")
GEOS = [os.path.join(PUB, 'service-area.geojson'),
        '/home/hatch/workspace/the-flat-rate-machine/data/service-area.geojson',
        '/home/hatch/workspace/theflatratemovers/service-area.geojson']
md5s = set()
for g in GEOS:
    t = open(g, encoding='utf-8').read()
    assert R6_OLD in t, g
    t = t.replace(R6_OLD, R6_NEW, 1)
    json.loads(t)
    if APPLY: open(g, 'w', encoding='utf-8').write(t)
    import hashlib; md5s.add(hashlib.md5(t.encode()).hexdigest())
assert len(md5s) == 1, 'geojson copies diverge'
log('geojson R6 sentence updated in 3 copies, byte-identical after edit')

# ---------- rubric.db R7 gate text ----------
DB = '/home/hatch/workspace/theflatratemovers/rubric.db'
con = sqlite3.connect(DB)
row = con.execute("SELECT passes_when FROM rubric_check WHERE check_id='R7'").fetchone()
assert row and 'Style example' in row[0], row
NEW_R7 = ("Reference photos labelled Reference photo with no third-party mover named, Henry's photos "
          "labelled as his, no competitor photo presented as his work")
if APPLY:
    con.execute("UPDATE rubric_check SET passes_when=? WHERE check_id='R7'", (NEW_R7,))
    con.commit()
log(f'rubric.db R7 passes_when updated (was: {row[0][:60]}...)')
con.close()

# ---------- assets ----------
if APPLY:
    for f in ('img-09-b676e12626df.webp', 'img-09-b676e12626df.jpg'):
        os.remove(os.path.join(PUB, 'assets', f))
    log('img-09 asset files deleted (webp+jpg); img-22 already produced from Henry original')
else:
    log('dry-run: img-09 assets would be deleted; img-22 exists:', os.path.exists(os.path.join(PUB, 'assets', 'img-22-antique-fireproof-safe.webp')))

print('\n'.join(LOG))
print('MODE:', 'APPLIED' if APPLY else 'DRY-RUN')
