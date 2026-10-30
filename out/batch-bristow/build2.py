#!/usr/bin/env python3
"""Batch Bristow part 2 — index.html, functions/head-data.js, llms.txt,
the-flat-rate-movers-data.txt. Same transforms as build.py, adapted to
each surface. Logs to changes-part2.json."""
import json, re, hashlib, shutil
from pathlib import Path

HOME = Path.home()
SITE = HOME / "workspace/the-flat-rate-movers-pages"
PUB = SITE / "public"
MACH = HOME / "workspace/the-flat-rate-machine"
BATCH = MACH / "out/batch-bristow"
BK = BATCH / "backup"
TODAY = "2026-10-30"
LOG = []

import sys
sys.path.insert(0, str(BATCH))
from build import text_subs, fix_route81_graph, backup, log as _log  # reuse

def log(kind, target, detail):
    LOG.append({"kind": kind, "target": str(target), "detail": detail})
    print(f"[{kind}] {target}: {detail}")

def qseg_md5(html: str) -> str:
    i = html.find('id="quoteForm"')
    fs = html.rfind('<form', 0, i)
    fe = html.find('</form>', i) + len('</form>')
    return hashlib.md5(html[fs:fe].encode()).hexdigest()

LDJSON_RE = re.compile(r'(<script type="application/ld\+json">)(.*?)(</script>)', re.S)

def block_spans(html):
    return [(m.start(2), m.end(2), m.group(2)) for m in LDJSON_RE.finditer(html)]

def dedent_block(text):
    lines = text.split('\n')
    indents = [len(re.match(r' *', ln).group(0)) for ln in lines[1:] if ln.strip()]
    base = min(indents) if indents else 0
    inner = None
    for ln in lines[1:]:
        if ln.strip():
            inner = len(re.match(r' *', ln).group(0)) - base
            break
    ded = '\n'.join([lines[0]] + [ln[base:] if ln.strip() else ln for ln in lines[1:]])
    return ded, base, (inner if inner and inner > 0 else 1)

def reindent_block(text, base):
    if base == 0:
        return text
    lines = text.split('\n')
    return '\n'.join([lines[0]] + [(' ' * base + ln) if ln.strip() else ln for ln in lines[1:]])

# ---------------------------------------------------------------- index.html
def fix_index():
    path = PUB / "index.html"
    backup(path, PUB)
    html = path.read_text(encoding="utf-8")
    q0 = qseg_md5(html)
    assert q0 == "4d8d49f05b22b129eac623a41370d9cb", q0
    # pre-state: block -> standalone-file parse-equality map, against the
    # PRE-batch backups of the standalone files (part 1 already fixed them)
    standalone = {}
    for f in (BK / "public").glob("*.json"):
        try:
            standalone[f.name] = json.loads(f.read_text(encoding="utf-8"))
        except Exception:
            pass
    pre_map = {}
    for bi, (_, _, btext) in enumerate(block_spans(html)):
        try:
            bj = json.loads(btext)
        except Exception:
            continue
        for name, doc in standalone.items():
            if bj == doc:
                pre_map[bi] = name
    log("index-pre", "index.html", f"quote md5 ok; {len(block_spans(html))} ld+json blocks; parse-equal map: {pre_map}")

    # (1) global text subs
    html, n1 = text_subs(html)
    # (2) prose insertions
    n2a = html.count("Berryville, VA, Clarke County")
    html = html.replace("Berryville, VA, Clarke County", "Berryville, VA, Bristow, VA, Clarke County")
    n2b = html.count("Woodstock, VA, Clarke County")
    html = html.replace("Woodstock, VA, Clarke County", "Woodstock, VA, Bristow, VA, Clarke County")
    # (4) dateModified restamp inside ld+json blocks — ONLY in blocks that
    # parse-equal a standalone file changed in part 1 (their embeds must
    # stay parse-equal; unchanged files' embeds, e.g. datasets-packing,
    # keep their dates). Unmapped blocks 0 (head graph) and 6 (FAQ) carry
    # no dateModified at all (verified).
    changed_set = set(json.loads((BATCH / "changed-site-jsons.json").read_text(encoding="utf-8")))
    n4 = 0
    block_counter = [0]
    def restamp_block(m):
        nonlocal n4
        bi = block_counter[0]
        block_counter[0] += 1
        if pre_map.get(bi) not in changed_set:
            return m.group(0)
        body, c = re.subn(r'("dateModified":\s*")\d{4}-\d{2}-\d{2}(")', r'\g<1>' + TODAY + r'\g<2>', m.group(2))
        n4 += c
        return m.group(1) + body + m.group(3)
    html = LDJSON_RE.sub(restamp_block, html)
    # (3) alpha list line-insert pass
    lines = html.split('\n')
    out = []
    n3 = 0
    i = 0
    while i < len(lines):
        out.append(lines[i])
        m = re.match(r'^(\s*)"Berryville, VA",$', lines[i])
        if m and i + 1 < len(lines) and re.match(r'^\s*"Clarke County",$', lines[i + 1]):
            out.append(f'{m.group(1)}"Bristow, VA",')
            n3 += 1
        i += 1
    html = '\n'.join(out)
    # (5) route81 blocks: parse-transform coverage
    n5 = 0
    def route81_block(m):
        nonlocal n5
        ded, base, inner = dedent_block(m.group(2))
        try:
            bj = json.loads(ded)
        except Exception:
            return m.group(0)
        graph = bj.get("@graph") if isinstance(bj, dict) else None
        if not graph or not any(str(n.get("@id", "")).endswith("#dataset-route81-coverage") for n in graph if isinstance(n, dict)):
            return m.group(0)
        # round-trip fidelity check before touching
        rt = json.dumps(bj, indent=inner, ensure_ascii=False)
        assert rt == ded.strip(), "route81 embed round-trip mismatch"
        assert fix_route81_graph(graph), "coverage node not changed"
        new = json.dumps(bj, indent=inner, ensure_ascii=False)
        n5 += 1
        return m.group(1) + reindent_block(new, base) + m.group(3)
    html = LDJSON_RE.sub(route81_block, html)
    path.write_text(html, encoding="utf-8")
    log("index", "index.html", f"text subs x{n1}; prose Berryville x{n2a}, Woodstock x{n2b}; block dateModified restamps x{n4}; alpha list inserts x{n3}; route81 embeds transformed x{n5}")
    # post checks
    assert qseg_md5(html) == q0, "quote-form segment changed!"
    post_map = {}
    nblocks = 0
    for bi, (_, _, btext) in enumerate(block_spans(html)):
        nblocks += 1
        bj = json.loads(btext)  # must parse
        for name, doc in standalone.items():
            pass
    # rebuild standalone from CURRENT files (they were already fixed in part 1)
    standalone2 = {}
    for f in PUB.glob("*.json"):
        try:
            standalone2[f.name] = json.loads(f.read_text(encoding="utf-8"))
        except Exception:
            pass
    for bi, (_, _, btext) in enumerate(block_spans(html)):
        try:
            bj = json.loads(btext)
        except Exception:
            continue
        for name, doc in standalone2.items():
            if bj == doc:
                post_map[bi] = name
    assert pre_map == post_map, f"embed equality map changed: pre {pre_map} vs post {post_map}"
    log("index-post", "index.html", f"quote md5 unchanged; all {nblocks} blocks parse; embed equality map preserved {post_map}")

# ---------------------------------------------------------------- head-data.js
def fix_head_data():
    path = SITE / "functions/head-data.js"
    backup(path, SITE)
    t = path.read_text(encoding="utf-8")
    t2, n = text_subs(t)
    assert "South Riding" not in t2
    path.write_text(t2, encoding="utf-8")
    log("head-data", "functions/head-data.js", f"count phrases updated x{n} (descriptions only; no area lists present)")

# ---------------------------------------------------------------- llms.txt
BRISTOW_LLMS = ("- 2026-10-30 update \u2014 Bristow, VA (Prince William County, 20136) added to the Winchester "
    "branch footprint: Winchester is the closest branch and serves Bristow, by owner ruling 2026-10-30. "
    "The published footprint is now 53 GeoJSON features \u2014 Winchester 32 areas (16 Google Business Profile + 16 extended), "
    "Martinsburg 35 (14 + 21), 14 shared, the two branch lists kept separate and never merged. Bristow is an extended-footprint "
    "area, not a Google Business Profile service area; it appears in the Winchester lists only. The Route 81 coverage dataset "
    "traces it to its GeoJSON feature (place-bristow-va; 38.73258, -77.54573 via map geocoding 2026-10-30).")

def fix_llms():
    path = PUB / "llms.txt"
    backup(path, PUB)
    lines = path.read_text(encoding="utf-8").split('\n')
    touched = []
    for i, ln in enumerate(lines):
        if ln.startswith("- [Route 81 Corridor Moving and Dispatch]") or \
           ln.startswith("- [Service Area GeoJSON]") or \
           ln.startswith("24 new branch-specific service pages"):
            lines[i], n = text_subs(ln)
            touched.append((i + 1, n))
    # insert dated entry after the Signed machine data bullet
    for i, ln in enumerate(lines):
        if ln.startswith("- Signed machine data (2026-10-29)"):
            lines.insert(i + 1, BRISTOW_LLMS)
            log("llms", "llms.txt", f"current-state lines updated {touched}; Bristow dated entry inserted after line {i+1}")
            break
    else:
        raise AssertionError("Signed machine data bullet not found")
    path.write_text('\n'.join(lines), encoding="utf-8")

# ---------------------------------------------------------------- data txt
BRISTOW_DATATXT = ("\n2026-10-30 update \u2014 Bristow, VA joins the Winchester footprint. Bristow, VA (Prince William County, "
    "ZIP 20136; 38.73258, -77.54573 via map geocoding 2026-10-30) is served by the Winchester branch \u2014 the closest branch, "
    "by owner ruling 2026-10-30. Service footprint (53 areas): Winchester 32 areas (GBP 16 + extended 16), Martinsburg 35 areas "
    "(GBP 14 + extended 21), 14 areas shared and noted as shared. Bristow is an extended-footprint area from the live "
    "service-area.geojson feature branch properties (feature place-bristow-va); it is NOT a Google Business Profile service "
    "area. Martinsburg's list is unchanged, and the two branch lists stay separate.\n")

def fix_datatxt():
    path = PUB / "the-flat-rate-movers-data.txt"
    backup(path, PUB)
    lines = path.read_text(encoding="utf-8").split('\n')
    touched = []
    for i, ln in enumerate(lines):
        if ln.startswith("Service footprint (52 areas)") or ln.startswith("- Coverage discipline for the corridor package"):
            lines[i], n = text_subs(ln)
            touched.append((i + 1, n))
    assert len(touched) == 2, touched
    text = '\n'.join(lines)
    if not text.endswith('\n'):
        text += '\n'
    text += BRISTOW_DATATXT
    path.write_text(text, encoding="utf-8")
    log("data-txt", "the-flat-rate-movers-data.txt", f"current-state lines updated {touched}; dated Bristow section appended")

if __name__ == "__main__":
    fix_index()
    fix_head_data()
    fix_llms()
    fix_datatxt()
    (BATCH / "changes-part2.json").write_text(json.dumps(LOG, indent=1), encoding="utf-8")
