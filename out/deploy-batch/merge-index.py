#!/usr/bin/env python3
"""Deploy batch Stage 4: merge into public/index.html.
Every edit is anchored and asserted (anchor must occur exactly once unless noted).
Writes the merged file in place; keeps a pre-merge copy in out/deploy-batch/backup/.
"""
import json, re, sys
from pathlib import Path

M = Path.home() / "workspace" / "the-flat-rate-machine"
PUB = Path.home() / "workspace" / "the-flat-rate-movers-pages" / "public"
TODAY = "2026-10-29"
SITE = "https://theflatratemovers.com"

def fail(msg):
    print("STAGE4 FAILED:", msg); sys.exit(1)

def once(h, anchor, what):
    n = h.count(anchor)
    if n != 1:
        fail(f"anchor for {what} occurs {n}x (expected 1): {anchor[:120]}")

h = (PUB / "index.html").read_text()
orig_len = len(h)

# ---------- 1. page divs before <footer> ----------
once(h, "<footer>", "footer")
divs = ""
for slug in ["senior-moving", "warehouse-relocation", "transloading-winchester-va"]:
    d = (M / "out/deploy-batch/divs" / f"{slug}.html").read_text()
    if f'id="page-{slug}"' in h:
        fail(f"page div already exists: {slug}")
    divs += d + "  \n"
h = h.replace("<footer>", divs + "<footer>", 1)
print("page divs inserted")

# ---------- 2. pages array ----------
anchor = "'transloading-movers-martinsburg-wv'];"
once(h, anchor, "pages array tail")
h = h.replace(anchor, "'transloading-movers-martinsburg-wv','senior-moving','warehouse-relocation','transloading-winchester-va'];", 1)
print("pages array extended")

# ---------- 3. pageMeta entries + IT svc flip ----------
# IT svc flip (anchored on the IT entry prefix)
it_old = "'it-equipment-moving-data-center-logistics-services-virginia':{name:'IT Equipment Moving & Data Center Logistics — Virginia', svc:'https://theflatratemovers.com/#service-commercial'"
once(h, it_old, "IT pageMeta entry")
h = h.replace(it_old, "'it-equipment-moving-data-center-logistics-services-virginia':{name:'IT Equipment Moving & Data Center Logistics — Virginia', svc:'https://theflatratemovers.com/#service-it-relocation'", 1)
print("IT pageMeta svc flipped")

# find the Martinsburg transloading pageMeta entry end via brace matching
key = "'transloading-movers-martinsburg-wv':{"
ki = h.find(key)
if ki < 0:
    fail("MT pageMeta entry not found")
j = ki + len(key) - 1  # at the '{'
depth, instr, esc = 0, None, False
while j < len(h):
    c = h[j]
    if instr:
        if esc: esc = False
        elif c == "\\": esc = True
        elif c == instr: instr = None
    else:
        if c in ("'", '"'): instr = c
        elif c == "{": depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0: break
    j += 1
# j is at the closing '}' of the entry; next chars should be ','
if h[j + 1] != ",":
    fail("MT pageMeta entry not followed by comma")
new_entries = ""
for slug in ["senior-moving", "warehouse-relocation", "transloading-winchester-va"]:
    meta = json.loads((M / "out/pages" / slug / "meta.json").read_text())
    desc = meta["desc"]
    if "'" in desc or "\n" in desc:
        fail(f"meta desc for {slug} needs JS escaping")
    new_entries += (f"     '{slug}':{{name:'{meta['name']}', svc:'{meta['svc']}', "
                    f"canonical:'{meta['canonical']}', desc:'{desc}'}},")
h = h[:j + 2] + new_entries + h[j + 2:]
print("pageMeta entries added")

# ---------- 4. static head Service nodes ----------
si = h.find('<script type="application/ld+json">')
sj = h.find("</script>", si)
blk = h[si:sj]
# find all top-level Service node objects in the static block via brace counting
svc_spans = []
idx = 0
while True:
    k = blk.find('{"@type": "Service"', idx)
    if k < 0:
        break
    d, instr2, esc2 = 0, None, False
    p = k
    while p < len(blk):
        c = blk[p]
        if instr2:
            if esc2: esc2 = False
            elif c == "\\": esc2 = True
            elif c == instr2: instr2 = None
        else:
            if c in ("'", '"'): instr2 = c
            elif c == "{": d += 1
            elif c == "}":
                d -= 1
                if d == 0: break
        p += 1
    svc_spans.append((k, p))
    idx = p + 1
if len(svc_spans) != 18:
    fail(f"static head Service nodes found: {len(svc_spans)} (expected 18)")
last_start, last_end = svc_spans[-1]
# last Service node is the final @graph entry (array close follows) or is
# followed by a comma — both handled at insertion time below.
after_last = blk[last_end + 1:].lstrip()
if not (after_last.startswith(",") or after_last.startswith("]")):
    fail("unexpected content after last static Service node")
services = json.loads((M / "data/services.json").read_text())["services"]
by_id = {s["id"]: s for s in services}
def head_node(svc_id, svc_type, areas):
    s = by_id[svc_id]
    node = {"@type": "Service", "@id": SITE + "/#" + svc_id, "name": s["name"],
            "serviceType": svc_type, "provider": {"@id": SITE + "/#organization"},
            "areaServed": areas, "description": s["description"]}
    return json.dumps(node, ensure_ascii=False, separators=(", ", ": "))
REG = ["Winchester, VA", "Martinsburg, WV", "Shenandoah Valley", "Eastern Panhandle"]
CORR = REG + ["I-81 corridor", "I-66 corridor", "I-70 corridor"]
new_nodes = ", ".join([
    head_node("service-senior-moving", "Senior Moving", REG),
    head_node("service-warehouse-relocation", "Warehouse Relocation", CORR),
    head_node("service-it-relocation", "IT Relocation & Setup", REG),
    head_node("service-transloading-winchester-va", "Transloading", CORR),
])
blk2 = blk[:last_end + 1] + ", " + new_nodes + blk[last_end + 1:]
h = h[:si] + blk2 + h[sj:]
print("static head Service nodes added (18 -> 22)")

# ---------- 5. services ItemList ----------
anchor = '["Route 81 Corridor Moving and Dispatch","#service-route81"]]'
once(h, anchor, "services ItemList route81 pair")
h = h.replace(anchor, anchor[:-1] + ',["Senior Moving","#service-senior-moving"],["Warehouse Relocation","#service-warehouse-relocation"],["IT Relocation & Setup","#service-it-relocation"],["Transloading Services — Winchester VA","#service-transloading-winchester-va"]]', 1)
print("services ItemList extended")

# ---------- 6. FAQ blocks ----------
faq = json.loads((M / "out/phase-a/faq-schema.json").read_text())
def faq_js(page):
    qs = []
    for q in page["mainEntity"]:
        qs.append('{"@type":"Question","name":' + json.dumps(q["name"], ensure_ascii=False) +
                  ',"acceptedAnswer":{"@type":"Answer","text":' + json.dumps(q["acceptedAnswer"]["text"], ensure_ascii=False) + "}}")
    return '{"@type":"FAQPage","@id":url+"#faq","mainEntity":[' + ",".join(qs) + "]}"
start = h.find("if(h==='faq') graph.push(")
if start < 0:
    fail("faq FAQPage block not found")
# the faq block is immediately followed by the services if-block; the array
# close sits on its own line, so anchor on the next block, not on "}]});"
end = h.find("if(h==='services')", start)
if end < 0:
    fail("services if-block after faq not found")
faq_page = next(p for p in faq["faqPages"] if p["pageDiv"] == "page-faq")
new_faq = "if(h==='faq') graph.push(" + faq_js(faq_page) + ");"
h = h[:start] + new_faq + "\n    " + h[end:]
# insert the two new page blocks right after the faq block
insert_at = start + len(new_faq)
add = ""
for div in ["page-local-regional-moving", "page-industrial-offices-moving"]:
    pg = next(p for p in faq["faqPages"] if p["pageDiv"] == div)
    slug = div[len("page-"):]
    add += f"     if(h==='{slug}') graph.push(" + faq_js(pg) + ");\n"
h = h[:insert_at] + "\n" + add + h[insert_at:]
print("FAQ blocks replaced + 2 pages added")

# ---------- 7. sitemap page totals + rows ----------
subs = [
    ("This index lists all 150 canonical pages", "This index lists all 153 canonical pages"),
    ("<h3>150 canonical pages</h3>", "<h3>153 canonical pages</h3>"),
    ("150 with a page, a route and structured data", "153 with a page, a route and structured data"),
    ("<h3>260 live URLs accounted for</h3>", "<h3>263 live URLs accounted for</h3>"),
    ("150 canonical pages + 2 consolidated pages + 107 tag URLs", "153 canonical pages + 2 consolidated pages + 107 tag URLs"),
    ("Canonical pages — 150", "Canonical pages — 153"),
]
for old, new in subs:
    once(h, old, f"sitemap text: {old[:50]}")
    h = h.replace(old, new, 1)
mt_row_anchor = '<div class="smap-row"><a href="#/transloading-movers-martinsburg-wv">'
once(h, mt_row_anchor, "MT sitemap row")
# find the end of that row's div: '</div>' after the anchor start
ri = h.find(mt_row_anchor)
re_ = h.find("</div>", ri) + len("</div>")
new_rows = ""
for slug, nm in [("senior-moving", "Senior Moving — Winchester VA &amp; Martinsburg WV"),
                 ("warehouse-relocation", "Warehouse Relocation — Winchester VA &amp; Martinsburg WV"),
                 ("transloading-winchester-va", "Transloading Services — Winchester VA")]:
    new_rows += (f'<div class="smap-row"><a href="#/{slug}"><b>{nm}</b></a><span class="smap-type">Page</span>'
                 f'<span class="smap-url">{SITE}/{slug}/</span></div>')
h = h[:re_] + new_rows + h[re_:]
print("sitemap page totals + rows updated")

# ---------- 8. all-pages chips ----------
chip_anchor = '<a class="chip" href="#/transloading-movers-martinsburg-wv">Loading, Transloading &amp; Container Services — Martinsburg WV</a>'
once(h, chip_anchor, "all-pages MT chip")
h = h.replace(chip_anchor, chip_anchor +
    '<a class="chip" href="#/senior-moving">Senior Moving — Winchester VA &amp; Martinsburg WV</a>'
    '<a class="chip" href="#/warehouse-relocation">Warehouse Relocation — Winchester VA &amp; Martinsburg WV</a>'
    '<a class="chip" href="#/transloading-winchester-va">Transloading Services — Winchester VA</a>', 1)
print("all-pages chips added")

# ---------- 9. warehouse parent link in industrial div ----------
ii = h.find('id="page-industrial-commercial-services"')
if ii < 0:
    fail("industrial div not found")
# div extent: next page div after ii
mm = re.search(r'<div class="page" id="page-', h[ii + 10:])
ij = ii + 10 + mm.start()
seg = h[ii:ij]
btn = '<a class="btn btn-orange" href="#/quote">Get My Flat Rate Quote →</a>'
if seg.count(btn) != 1:
    fail(f"industrial quote button count in div: {seg.count(btn)}")
seg2 = seg.replace(btn, '<p>New dedicated page: <a href="#/warehouse-relocation"><b>Warehouse Relocation — Winchester VA &amp; Martinsburg WV</b></a> — flat-rate warehouse moves, load-outs, inbound unloads, transload staging, and restacking.</p>       ' + btn, 1)
h = h[:ii] + seg2 + h[ij:]
print("warehouse parent link added to industrial div")

# ---------- assertions ----------
checks = []
def chk(name, cond):
    checks.append((name, cond))
    print(("PASS  " if cond else "FAIL  ") + name)
chk("page divs 153", h.count('<div class="page" id="page-') == 153)
chk("no DESIGN 6", "DESIGN 6" not in h)
chk("senior div present", 'id="page-senior-moving"' in h)
chk("warehouse div present", 'id="page-warehouse-relocation"' in h)
chk("transloading-winchester div present", 'id="page-transloading-winchester-va"' in h)
chk("IT svc flipped", "#service-it-relocation" in h and "'it-equipment-moving-data-center-logistics-services-virginia':{name:'IT Equipment Moving & Data Center Logistics — Virginia', svc:'https://theflatratemovers.com/#service-it-relocation'" in h)
chk("IT page div untouched marker (no new IT div)", h.count('id="page-it-equipment-moving-data-center-logistics-services-virginia"') == 1)
chk("quote form ids intact", all(x in h for x in ["heroQuote", "quoteForm", "hqWalk", "qWalk"]))
chk("no dataset node refs in index", "dataset-node" not in h)
chk("no track.sl change", "track.sl" not in h)
chk("smap rows canonical 153", h.count('<div class="smap-row"') == 153 + 108)
if not all(c for _, c in checks):
    fail("post-merge assertions failed")
(PUB / "index.html").write_text(h)
print(f"index.html merged: {orig_len} -> {len(h)} chars")
print("STAGE4 OK")
