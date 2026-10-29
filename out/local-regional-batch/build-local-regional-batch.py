#!/usr/bin/env python3
"""Local and Regional Moving deploy batch — applies the local-regional-deep
package merge-note, adjusted to the CURRENT post-redo/post-office live state
(reconciliation rule):
- entity graph already holds ONE #service-local-regional node (redo dedupe
  collapsed the duplicate pair) -> upgrade in place (add hub url + full
  package description); count stays 32
- best graph holds ZERO fragment occurrences -> add the canonical node (77 -> 78)
- head graph holds ONE node (registry serviceType + Place chain already, no
  url, short description) -> surgical upgrade in place (url + full description)
Every step asserts its precondition and fails loudly (SystemExit) rather than guessing.
"""
import json, re, shutil, sqlite3, pathlib

HOME = pathlib.Path.home()
PUB = HOME / "workspace/the-flat-rate-movers-pages/public"
MDATA = HOME / "workspace/the-flat-rate-machine/data"
MIRROR = HOME / "workspace/theflatratemovers"
PKG = HOME / "workspace/the-flat-rate-machine/out/pages/local-regional-deep"
BATCH = HOME / "workspace/the-flat-rate-machine/out/local-regional-batch"
BACKUP = BATCH / "backup-2026-10-29"
DB = MIRROR / "rubric.db"
DATE = "2026-10-29"
HUB = "https://theflatratemovers.com/local-regional-moving/"
SVC = "https://theflatratemovers.com/#service-local-regional"
ORGID = "https://theflatratemovers.com/#organization"
WINID = "https://theflatratemovers.com/#winchester"
MARID = "https://theflatratemovers.com/#martinsburg"

def fail(msg):
    raise SystemExit("BUILD FAIL: " + msg)

def load(p):
    return json.loads(pathlib.Path(p).read_text(encoding="utf-8"))

def dump_graph(path, obj, trailing_newline):
    txt = json.dumps(obj, indent=2, sort_keys=False, ensure_ascii=False)
    if trailing_newline:
        txt += "\n"
    pathlib.Path(path).write_text(txt, encoding="utf-8")

def graph_style(path):
    raw = pathlib.Path(path).read_bytes()
    return raw.endswith(b"\n")

# ---------- 0. Backups ----------
BACKUP.mkdir(parents=True, exist_ok=True)
for src in [PUB / "index.html", PUB / "entity-graph.json", PUB / "best-json-entity-graph.json",
            PUB / "ai-sitemap.json", PUB / "llms.txt", PUB / "the-flat-rate-movers-data.txt",
            MDATA / "entity-graph.json", MDATA / "best-json-entity-graph.json", DB]:
    shutil.copy2(src, BACKUP / (src.name if src != DB else "rubric.db"))
print("backups done ->", BACKUP)

# ---------- Package description (single source for node/AIS refresh) ----------
pkg_schema = load(PKG / "schema.json")
pkg_desc = pkg_schema["@graph"][0]["description"]
assert pkg_schema["@graph"][0]["@id"] == SVC and pkg_schema["@graph"][0]["url"] == HUB
assert pkg_schema["@graph"][0]["serviceType"] == "Local and Regional Moving"

def canonical_lr_node():
    # key order follows the refreshed-fragment convention (office node in entity graph)
    return {
        "@id": SVC,
        "@type": "Service",
        "name": "Local and Regional Moving",
        "description": pkg_desc,
        "serviceType": "Local and Regional Moving",
        "provider": {"@id": ORGID},
        "url": HUB,
        "areaServed": [{"@id": WINID}, {"@id": MARID}],
    }

# ---------- 1. Entity graph: upgrade the single existing node in place ----------
eg_path = MDATA / "entity-graph.json"
eg = load(eg_path)
nodes = eg["@graph"]
idx = [i for i, n in enumerate(nodes) if isinstance(n, dict) and n.get("@id") == SVC]
if len(idx) != 1:
    fail(f"entity graph local-regional nodes = {len(idx)}, expected exactly 1 (post-redo state)")
old = nodes[idx[0]]
if old.get("url"):
    fail("entity local-regional node already carries a url — unexpected")
nodes[idx[0]] = canonical_lr_node()
if len(nodes) != 32:
    fail(f"entity graph node count {len(nodes)} != 32")
tn = graph_style(eg_path)
for dest in [eg_path, MIRROR / "entity-graph.json", PUB / "entity-graph.json"]:
    dump_graph(dest, eg, tn)
print("entity graph: local-regional node upgraded in place, 32 nodes, mirrored x3")

# ---------- 2. Best graph: add the canonical node ----------
bg_path = MDATA / "best-json-entity-graph.json"
bg = load(bg_path)
bnodes = bg["@graph"]
if any(isinstance(n, dict) and n.get("@id") == SVC for n in bnodes):
    fail("best graph already holds the local-regional fragment — unexpected")
if len(bnodes) != 77:
    fail(f"best graph node count {len(bnodes)} != 77")
slug_before = [n.get("@id") for n in bnodes if isinstance(n, dict) and "local-regional" in str(n.get("@id", ""))]
bnodes.append(canonical_lr_node())
tn = graph_style(bg_path)
for dest in [bg_path, MIRROR / "best-json-entity-graph.json", PUB / "best-json-entity-graph.json"]:
    dump_graph(dest, bg, tn)
slug_after = [n.get("@id") for n in bnodes if isinstance(n, dict) and "local-regional" in str(n.get("@id", ""))]
assert slug_after[:len(slug_before)] == slug_before, "page-slug nodes disturbed"
print("best graph: local-regional node added, 77 -> 78 nodes, mirrored x3; page-slug nodes untouched")

# Live Place footprints (for hub JSON expansion — read from the updated entity graph)
places = {n["@id"]: n for n in eg["@graph"] if isinstance(n, dict) and n.get("@id") in (WINID, MARID)}
win_areas = places[WINID]["areaServed"]
mar_areas = places[MARID]["areaServed"]
if len(win_areas) != 31 or len(mar_areas) != 35:
    fail(f"footprint {len(win_areas)}/{len(mar_areas)} != 31/35")

# ---------- 3. Hub per-page JSON (create from package schema, Places expanded) ----------
hub = json.loads(json.dumps(pkg_schema))  # deep copy
for n in hub["@graph"]:
    if isinstance(n, dict) and n.get("@id") == WINID:
        n["areaServed"] = win_areas
    if isinstance(n, dict) and n.get("@id") == MARID:
        n["areaServed"] = mar_areas
if (PUB / "local-regional-moving.json").exists():
    fail("local-regional-moving.json already exists — expected creation")
(PUB / "local-regional-moving.json").write_text(
    json.dumps(hub, indent=2, sort_keys=True, ensure_ascii=True) + "\n", encoding="utf-8")
print("hub JSON created: local-regional-moving.json (5 nodes, footprint 31/35)")

# ---------- 4. datasets-local-regional.json (D1-D8 under the RETYPE rule) ----------
SOCIALS = ["https://www.instagram.com/theflatratemovers/", "https://www.threads.com/@theflatratemovers",
           "https://x.com/ratemovers", "https://www.youtube.com/@theflatratemovers",
           "https://github.com/TheFlatRateMovers", "https://medium.com/@ratemovers"]
DIST = [
    {"contentUrl": "https://theflatratemovers.com/ai-sitemap.json", "encodingFormat": "application/json"},
    {"contentUrl": "https://theflatratemovers.com/service-area.geojson", "encodingFormat": "application/json"},
    {"contentUrl": "https://theflatratemovers.com/entity-graph.json", "encodingFormat": "application/ld+json"},
    {"contentUrl": "https://theflatratemovers.com/best-json-entity-graph.json", "encodingFormat": "application/ld+json"},
]

def dnode(slug, typ, name, desc, keywords):
    n = {
        "@id": f"https://theflatratemovers.com/#dataset-local-regional-{slug}",
        "@type": typ,
        "name": name,
        "description": desc,
        "keywords": keywords,
        "about": [{"@id": SVC}],
        "spatialCoverage": [{"@id": WINID}, {"@id": MARID}],
        "temporalCoverage": "2010/2026",
        "dateModified": DATE,
        "creator": {"@id": ORGID, "sameAs": SOCIALS},
        "license": "https://creativecommons.org/licenses/by/4.0/",
        "distribution": DIST,
        "sameAs": HUB,
    }
    if typ == "Service":
        n["provider"] = {"@id": ORGID}
        n["publisher"] = {"@id": ORGID}
    if typ == "Article":
        n["headline"] = name
        n["author"] = {"@id": ORGID}
        n["publisher"] = {"@id": ORGID}
    return n

D = []
D.append(dnode("operations", "Service", "Local & Regional Move Operations",
    "Local and regional move operations from survey to walkthrough. The operation chain runs survey, quote, pack, load, transport, unload, place, reassemble, unpack, and a final walkthrough. Survey runs through the quote form — Short (Quick Quote) default and Detailed Project, switching in place with the From, To and What's moving inputs preserved — or through the free film-only video walkthrough survey room, where the customer films and a person makes the estimate; nothing is auto-priced. The published scope is homes and businesses across the Shenandoah Valley and the Eastern Panhandle: packing and unpacking, loading and unloading, priced by the job, not by the hour, at one flat rate agreed in writing before move day. Load order runs heavy pieces low and first, room-staged boxes next, fragile items secured on top, everything strapped; placement is room by room by label, with reassembly of standard furniture. Transport follows the I-81, I-66 and I-70 corridors as the route fits. Both bases dispatch across the region — Winchester serves the Valley side, Martinsburg the Eastern Panhandle side, with overlap at Moorefield — and the quote form settles which crew and route fit the move. Where a move includes a high-mass piece of 1,500 to 3,500 lbs, that item moves under SIR Structural Integrity Relocation with the KIM-GS Protocol and L/360 floor-deflection analysis, as part of the same flat-rate move. Home depth cross-references the residential category, business depth the office category, and moves beyond the region the long-distance category — cross-references are links, never duplicated claims.",
    ["movers near me", "movers winchester va", "winchester movers", "winchester local moving company", "local moving", "moving companies winchester va", "movers martinsburg wv"]))
D.append(dnode("sizes-access", "Dataset", "Move Sizes & Access Operations",
    "Move sizes and access operations for local and regional moves: the size bands, dwelling types, and access conditions that shape a local quote. Size bands, as demand shapes rather than company products: studio and one-bedroom homes, small jobs and partial loads, two-to-three-bedroom homes, four-plus-bedroom homes, and small offices. Dwelling and premises types: apartments, condos, townhomes, houses, estates, offices, and shops. Access conditions are quote inputs, never capability claims: stairs, elevator type and reservation, doorway and hallway width, parking and loading zones, long carry distance, building hours, and HOA rules. Staging runs through the driveway, yard, garage, or loading zone. Market reference data, labeled as such and never company times or prices: market guides plan studio and one-bedroom moves at roughly 3 to 5 hours with 2 movers, two-to-three-bedroom homes at 5 to 8 hours with 2 to 3 movers, and four-plus-bedroom homes at 8 to 12 hours with 3 to 4 movers; walk-up stairs, tight turns, elevator reservation windows, parking permits, and building move windows are the access factors that move a quote. The company publishes homes and businesses, with homeowners, renters, families, and seniors named on the branch pages, and no size-specific crew, equipment, minimum, or access capability is claimed anywhere in this dataset — the survey governs each job. Small-job depth continues as FAQ material on the existing pages, not a separate page, and apartment depth cross-references the residential category.",
    ["movers near me", "local moving", "apartment moves", "movers winchester va", "winchester local moving company", "movers martinsburg wv"]))
D.append(dnode("taxonomy", "Dataset", "Local & Regional Service Taxonomy",
    "Local and regional service taxonomy: how the bands, job types, and scope of this category fit together. Bands: local, regional, and long-distance — long-distance is a cross-reference to its own category, not part of this service. Job types: residential local moves, commercial local moves, senior local moves (a cross-reference to the senior category), and specialty work inside a local move, where a heavy piece moves under the conditional SIR handling below. Published scope: residential and commercial moves within the local and regional area; packing and unpacking; loading and unloading; placement; reassembly of standard furniture; and, where the job includes a high-mass piece of 1,500 to 3,500 lbs, SIR Structural Integrity Relocation with L/360 floor-deflection analysis. Areas and corridors — not a mileage cutoff — define the region in the company's published framing. Industry reference, labeled as such: in the wider market, local usually means under roughly 50 to 100 miles, completed in one day with one crew and truck, regional means multi-county, and long-distance means over about 100 miles or across state lines, usually priced by weight and mileage; local moves are priced by the hour in the market, which is the norm the company's flat rate answers (see the commercial terms dataset). Cross-references are links, not duplicated content: residential, long-distance, office, commercial, senior, and the SIR heavy-asset and gun-safe categories own their own claims.",
    ["local moving", "movers near me", "winchester local moving company", "local and regional moving", "movers winchester va"]))
D.append(dnode("dispatch", "Dataset", "Dispatch Network & Corridor Chain",
    "Dispatch network and corridor chain for local and regional moving. Two branches, never merged: Winchester — The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester, VA 22601, hours Monday to Friday 8 to 6, Saturday 8 to 4, Sunday 9 to 4, Google rating 5.0 from 1 review; Martinsburg — Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg, WV 25404, hours Monday to Friday 9 to 6, Saturday 9 to 4, Sunday 9 to 4, Google rating 4.7 from 6 reviews. Phone +1-540-422-2153 at both branches. The service footprint is 52 published GeoJSON features: Winchester serves 31 areas (16 published on its Google profile plus 15 extended), Martinsburg serves 35 areas (14 plus 21 extended), and 14 areas are shared, including Moorefield 26836, which both branches serve. Dispatch runs the three-corridor network — Interstate 81, Interstate 66, and Interstate 70 — from both branches; the published service areas are the coverage pool, and no listed town is claimed to sit on a particular highway. The published assignment rule: Winchester serves the Valley side, Martinsburg serves the Eastern Panhandle side, the two overlap at Moorefield, and the quote form settles which crew and route fit the move. In the wider market, labeled as such, local moves typically run under 50 to 100 miles in one day and regional moves run multi-county; the company's region is the Shenandoah Valley and the Eastern Panhandle as published.",
    ["movers winchester va", "winchester movers", "moving companies winchester va", "movers martinsburg wv", "moving company winchester va", "winchester moving companies", "local moving"]))
D.append(dnode("terms", "Article", "Commercial Terms & Cost Drivers",
    "Commercial terms and cost drivers for local and regional moves. The company's only pricing term is the published one: a flat rate quoted in writing before move day, priced by the job, not by the hour — no hourly clock, ever — under the standing promise Guaranteed Flat Rate or Your Move is Free! No company price, minimum, deposit, discount, fee, or surcharge is stated anywhere in this dataset. Every figure below is industry market data, researched and labeled as such, never a company term: local moves are priced by the hour in the market, typically a crew rate around $100 an hour for a two-person crew, often with two-to-four-hour minimums, plus travel and truck fees and extras; market totals in published guides run roughly $400 to $750 for a studio or one-bedroom home, $850 to $1,750 for two-to-three bedrooms, and $1,700 to $3,400 for four-plus bedrooms. The pricing models in the market: hourly (crew times hours, where the customer pays for every slow elevator, parking hunt, and delay), binding estimates (a fixed total for a listed scope and inventory), and flat-fee pricing (one guaranteed price set in advance from inventory, access, and distance). Under a flat or binding price the mover assumes the timing risk once the scope is locked; under hourly pricing the customer carries it. Cost drivers: inventory size, packing level, access — stairs, elevator, long carry — distance, and specialty items priced as separate line items. Booking windows in market guides: local moves book 2 to 4 weeks out off-peak and 4 to 8 weeks out in peak season, May through September with June busiest and month-ends and weekends tightest. The fear the flat rate answers is the hourly meter on a short local move; the company answer is one price in writing before the truck is loaded.",
    ["flat rate movers", "flat rate moving quote winchester", "local moving", "movers near me", "moving companies winchester va"]))
D.append(dnode("personas", "Article", "Buyer Personas & Trigger Events",
    "Buyer personas and trigger events for local and regional moves. The personas: renters moving at a lease end, where apartment access and near-me search intent dominate; homeowners buying or selling inside the Shenandoah Valley and the Eastern Panhandle; families whose household is growing or shrinking; seniors relocating locally, cross-referenced to the senior category, which owns its claims; small-business owners changing premises, cross-referenced to the office and commercial categories; and closing-driven movers whose dates are set by a home purchase or sale. Trigger events: lease end, a home closing, a job transfer, household growth, household shrinkage, school-calendar timing, and a business premises change. Seasonality is industry research, labeled as such: peak season runs May through September, June is the most common moving month — one market dataset puts 41 percent of US moves in May through August — and month-end dates and weekends are the tightest; market guides put local booking windows at 2 to 4 weeks off-peak and 4 to 8 weeks in peak season. No availability promise is made anywhere in this dataset: the published branch hours are the hours, in every season. Search behavior from the company's own Search Console record: near-me intent is shared across the local and residential categories and converts fastest — 'movers near me' holds 246 impressions at position 5.0 with 11 clicks, the site's best click source — and Winchester-cluster searchers compare on price certainty and local presence. Every persona plans through the same quote path: the Short or Detailed quote form, or the film-only video walkthrough survey room with a human-made estimate.",
    ["movers near me", "moving companies winchester va", "local moving", "winchester local moving company", "movers martinsburg wv"]))
D.append(dnode("protection-compliance", "Service", "Protection, Handling & Building Compliance",
    "Protection, handling, and building compliance for local and regional moves. The published practice: loading and unloading with furniture protection on the path — blanket wrap and stretch wrap on the furniture, floor runners, and doorway and rail protection as the route requires; packing and unpacking as part of the service; disassembly and reassembly of standard furniture, planned up front; and, where a move includes a high-mass piece of 1,500 to 3,500 lbs, SIR Structural Integrity Relocation under the KIM-GS Protocol with L/360 floor-deflection analysis. The survey room is film-only by rule: customers film their rooms and pieces, and never lift, move, open, or climb anything heavy or locked. Building conditions are planning inputs that shape the quote, never capability claims: elevator reservations and their windows, loading-zone reservations, building move hours, advance notice, HOA rules, and the certificate-of-insurance requirement that managed buildings commonly impose — an industry requirement, labeled as such. Industry reference, labeled as such: protection materials in the wider trade include boxes, dish barrels, wardrobe cartons, mattress bags, bubble wrap, stretch wrap, blankets, and labels, and standard market equipment includes dollies, ramps, and straps — an industry inventory, with no deployment claimed for the company. Liability education, labeled as such: valuation is not insurance, and the market's Full Value and Released Value ($0.60 per pound) options are explained in the commercial terms dataset as industry education only; no company coverage is claimed anywhere in this dataset. Heavy assets cross-reference the SIR heavy-asset category, custom crates the crating category, packing depth the packing category, and home-move protection depth the residential category.",
    ["local moving", "movers near me", "furniture protection", "movers winchester va", "white glove moving"]))
D.append(dnode("areas-quote", "Dataset", "Service Areas, Dispatch & Quote Path",
    "Service areas, dispatch, and quote path for local and regional moving. Two branches, never merged: Winchester — The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester, VA 22601, hours Monday to Friday 8 to 6, Saturday 8 to 4, Sunday 9 to 4, Google rating 5.0 from 1 review; Martinsburg — Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg, WV 25404, hours Monday to Friday 9 to 6, Saturday 9 to 4, Sunday 9 to 4, Google rating 4.7 from 6 reviews. Phone +1-540-422-2153 at both branches; the company was founded in June 2010 and works under the promise Guaranteed Flat Rate or Your Move is Free! The full service footprint is 52 published GeoJSON features — Winchester 31 areas, Martinsburg 35 areas, 14 shared — carried on each branch's own record, never merged into one list. Dispatch runs Interstate 81, Interstate 66, and Interstate 70 from both branches; in the wider market, labeled as such, local moves typically complete in one day and regional moves run multi-county, and the published assignment rule is that the quote form settles which crew and route fit the move. The quote path: Get My Flat Rate Quote with the Short (Quick Quote) form by default and the Detailed Project form one toggle away, From, To and What's moving preserved while switching, or the free film-only video walkthrough survey room with a human-made estimate. Three pages carry this service: the local and regional hub and the Winchester and Martinsburg branch pages.",
    ["movers near me", "moving companies winchester va", "movers winchester va", "winchester movers", "movers martinsburg wv", "winchester local moving company", "local moving"]))

datasets_obj = {"@context": "https://schema.org", "@graph": D}
datasets_txt = json.dumps(datasets_obj, indent=2, sort_keys=False, ensure_ascii=False) + "\n"
(PUB / "datasets-local-regional.json").write_text(datasets_txt, encoding="utf-8")
print("datasets-local-regional.json written: 8 nodes (Dataset 4 / Service 2 / Article 2)")

# ---------- 5. ai-sitemap: local-regional description refresh + keyword additions ----------
ais_path = PUB / "ai-sitemap.json"
ais = load(ais_path)
lr = [s for s in ais["services"] if isinstance(s, dict) and s.get("name") == "Local and Regional Moving"]
if len(lr) != 1:
    fail(f"ai-sitemap local-regional entries = {len(lr)}")
lr[0]["description"] = pkg_desc
new_kw = ["winchester local moving company", "movers winchester va"]
for k in new_kw:
    if k in ais["keywords"]:
        fail(f"keyword already present: {k}")
ais["keywords"].extend(new_kw)
dump_graph(ais_path, ais, graph_style(ais_path))
print(f"ai-sitemap: local-regional description refreshed; keywords {len(ais['keywords'])-2} -> {len(ais['keywords'])}")

print("PART 1 OK")

# ---------- 6. index.html: head node upgrade + hub div dataset block + Developer card ----------
idx_path = PUB / "index.html"
html = idx_path.read_text(encoding="utf-8")
if html.count("#service-local-regional") != 5:
    fail(f"pre-build #service-local-regional occurrences = {html.count('#service-local-regional')}, expected 5")

# 6a. Head graph local-regional node (surgical, head-block key order: url after provider, description last)
old_desc = "Local and regional moves across the Shenandoah Valley and Eastern Panhandle along the I-81, I-66 and I-70 corridors, surveyed and quoted at one flat rate in writing before move day."
i = html.find('"@id": "https://theflatratemovers.com/#service-local-regional"')
if i < 0:
    fail("head local-regional node not found")
seg_start = html.rfind('"@type": "Service"', 0, i)
seg_end = html.find("\n    }", i)
seg = html[seg_start:seg_end]
if seg.count(old_desc) != 1:
    fail("head local-regional description anchor not exactly once in its node")
if '"url"' in seg:
    fail("head local-regional node already carries a url — unexpected")
provider_anchor = '''      "provider": {
        "@id": "https://theflatratemovers.com/#organization"
      },
'''
if seg.count(provider_anchor) != 1:
    fail("head local-regional provider anchor mismatch")
new_seg = seg.replace(provider_anchor, provider_anchor + f'      "url": "{HUB}",\n', 1).replace(old_desc, pkg_desc, 1)
html = html[:seg_start] + new_seg + html[seg_end:]
print("head graph: local-regional node upgraded (url + full description), still one node")

# 6b. Hub div: dataset markup block before the page div's closing tag (after last </section>)
div_start = html.find('<div class="page" id="page-local-regional-moving">')
if div_start < 0:
    fail("page-local-regional-moving div not found")
depth = 0
div_end = -1
for m in re.finditer(r"<div\b|</div>", html[div_start:]):
    if m.group(0) == "<div":
        depth += 1
    else:
        depth -= 1
        if depth == 0:
            div_end = div_start + m.end()
            break
if div_end < 0:
    fail("hub div bounds not found")
div_txt = html[div_start:div_end]
if "dataset-local-regional" in div_txt:
    fail("hub div already carries a local-regional dataset block")
insert_at = div_txt.rfind("</section>")
if insert_at < 0:
    fail("hub div </section> anchor missing")
block = '\n<script type="application/ld+json">\n' + datasets_txt.rstrip("\n") + "\n</script>\n"
new_div = div_txt[:insert_at + len("</section>")] + block + div_txt[insert_at + len("</section>"):]
html = html[:div_start] + new_div + html[div_end:]
print("hub div: dataset markup block inserted (parse-equal to datasets-local-regional.json)")

# 6c. Developer card: Local & Regional data card immediately after the Office data card
off_anchor = '<article class="card"><h3>Office data</h3>'
ci = html.find(off_anchor)
if ci < 0:
    fail("developer Office data card not found")
cend = html.find("</article>", ci) + len("</article>")
lr_card = ('<article class="card"><h3>Local &amp; Regional data</h3><p><a href="/datasets-local-regional.json" target="_blank" rel="noopener">'
           '<b>datasets-local-regional.json →</b></a> — 8 published nodes about the local and regional moving service, from both branches, never merged: '
           '4 as Datasets (CC BY 4.0) — move sizes and access operations, local and regional service taxonomy, dispatch network and corridor chain, service areas, dispatch and quote path; '
           '2 as Service data — local &amp; regional move operations, protection, handling and building compliance; '
           '2 as Articles — commercial terms and cost drivers (flat-rate-in-writing only; domain figures labeled), buyer personas and trigger events. '
           'Hub page: <a href="/local-regional-moving/">Local &amp; Regional Moving</a> · Hub JSON: '
           '<a href="/local-regional-moving.json" target="_blank" rel="noopener"><b>local-regional-moving.json →</b></a>.</p></article>')
if "Local &amp; Regional data" in html or "Local & Regional data" in html:
    fail("developer Local & Regional data card already present")
html = html[:cend] + lr_card + html[cend:]
idx_path.write_text(html, encoding="utf-8")
print("developer: Local & Regional data card inserted after Office data card")

# ---------- 7. llms.txt: local-regional service line + dated entry ----------
llms_path = PUB / "llms.txt"
llms = llms_path.read_text(encoding="utf-8")
office_line_end = "Full datasets: https://theflatratemovers.com/datasets-office.json · Hub JSON: https://theflatratemovers.com/commercial-office-moving-2.json\n"
if llms.count(office_line_end) != 1:
    fail("llms office line anchor mismatch")
lr_line = ("- [Local and Regional Moving](https://theflatratemovers.com/local-regional-moving/): Local and regional moves along the I-81, I-66 and I-70 corridors, from our two home bases in Winchester, VA and Martinsburg, WV — homes and businesses across the Shenandoah Valley and the Eastern Panhandle, at a flat rate agreed in writing before move day. Packing and unpacking, loading and unloading, priced by the job, not by the hour. Where a move includes a high-mass piece, that item moves under SIR Structural Integrity Relocation with L/360 floor-deflection analysis, as part of the same flat-rate move. Datasets D1–D8 (CC BY 4.0): local & regional move operations; move sizes & access operations; local/regional service taxonomy; dispatch network & corridor chain; commercial terms (flat-rate-in-writing only; domain figures labeled); buyer personas & trigger events; protection, handling & building compliance; service areas, dispatch & quote path. Full datasets: https://theflatratemovers.com/datasets-local-regional.json · Hub JSON: https://theflatratemovers.com/local-regional-moving.json\n")
if "[Local and Regional Moving](https://theflatratemovers.com/local-regional-moving/)" in llms:
    fail("llms local-regional line already present")
llms = llms.replace(office_line_end, office_line_end + lr_line, 1)
llms_entry = """
## Update — 2026-10-29 (local-regional deep batch)
- Canonical #service-local-regional Service node completed in both machine graphs and the head graph (same @id, exactly one node per graph): the entity graph already held one node after the full-site redo removed the duplicate branch-flavored pair; this batch gives the surviving node the hub url and the full description, the expanded graph gains the fragment node it never had, and the head node is upgraded with hub url + full description (its serviceType already carried the registry name Local and Regional Moving). No new page (hub + Winchester + Martinsburg branch pages exist, 3 pages carry the service); counts unchanged at 153 pages and 22 services.
- Local and Regional datasets D1–D8 published at https://theflatratemovers.com/datasets-local-regional.json (8 nodes: 4 Datasets under CC BY 4.0, 2 Service, 2 Articles; dateModified 2026-10-29), with page-level markup on the local-regional-moving hub page and a Developer-page collection entry. Fields without a verified company term are omitted, not guessed: same-day or next-day availability, a local-versus-regional mileage boundary, small-job minimums or a small-job product, a valuation offering, debris scope, a prohibited-items list, apartment-specific capability, and any local pricing beyond the flat rate in writing.
- Hub per-page JSON created: https://theflatratemovers.com/local-regional-moving.json (5 nodes, Place areas at the full footprint 31/35, branches distinct). Branch per-page JSONs already live for both local-regional branch pages; unchanged in this batch.
"""
if "local-regional deep batch" in llms:
    fail("llms local-regional entry already present")
if not llms.endswith("\n"):
    llms += "\n"
llms += "\n" + llms_entry.strip("\n") + "\n"
llms_path.write_text(llms, encoding="utf-8")
print("llms.txt: local-regional service line added + dated entry appended")

# ---------- 8. data txt: dated entry ----------
data_path = PUB / "the-flat-rate-movers-data.txt"
dtxt = data_path.read_text(encoding="utf-8")
data_entry = """
## Update 2026-10-29 — local-regional deep batch
- Canonical #service-local-regional Service node completed in both machine graphs and the head graph (same @id, exactly one node per graph, hub url https://theflatratemovers.com/local-regional-moving/ + full description + Place chain at the full footprint). No new page; counts unchanged at 153 pages and 22 services.
- Local and Regional datasets D1–D8 published as JSON-LD at https://theflatratemovers.com/datasets-local-regional.json (8 nodes: 4 Datasets under CC BY 4.0, 2 Service, 2 Articles; dateModified 2026-10-29), with page-level markup on the hub page and a Developer-page collection entry. Fields without a verified company term are omitted, not guessed.
- Hub per-page JSON created: https://theflatratemovers.com/local-regional-moving.json (5 nodes).
"""
if "local-regional deep batch" in dtxt:
    fail("data txt local-regional entry already present")
if not dtxt.endswith("\n"):
    dtxt += "\n"
dtxt += "\n" + data_entry.strip("\n") + "\n"
data_path.write_text(dtxt, encoding="utf-8")
print("data txt: dated entry appended")

# ---------- 9. Rubric DB: 5 attestation rows for facts this batch newly publishes ----------
con = sqlite3.connect(DB)
canon = con.execute("SELECT COUNT(*) FROM service WHERE service_id=?", (SVC,)).fetchone()[0]
if canon != 1:
    fail(f"canonical service-local-regional rows = {canon}, expected 1")
before = con.execute("SELECT COUNT(*) FROM attestation").fetchone()[0]
if before != 68:
    fail(f"attestation rows before = {before}, expected 68")
rows = [
    ("Local and Regional Moving published scope: local and regional moves along the I-81, I-66 and I-70 corridors from Winchester VA and Martinsburg WV — residential and commercial moves within the local and regional area, packing and unpacking, loading and unloading, one flat rate agreed in writing before move day, no hourly clock; high-mass pieces of 1,500 to 3,500 lbs move under SIR Structural Integrity Relocation with the KIM-GS Protocol and L/360 floor-deflection analysis inside the same flat-rate move",
     "local-regional-deep package schema.json + live hub page (div page-local-regional-moving) extract 2026-10-29", DATE,
     "https://theflatratemovers.com/local-regional-moving/ ; out/pages/local-regional-deep/schema.json"),
    ("Local demand evidence: 'movers near me' 246 impressions at position 5.0 with 11 clicks (the site's best click source; intent shared with the residential category); 'winchester local moving company' 181 at 20.0; 'movers winchester va' 424 at 12.9; 'winchester movers' 408 at 18.0; 'moving companies winchester va' 727 at 11.6; 'movers martinsburg wv' 123 at 8.9; 'local moving' 4 at 1.0",
     "GSC 3-month pull to 2026-10-27, read 2026-10-29; local-regional-deep-datasets-2026-10-29.md sections 2/6", DATE,
     "local-regional-deep-datasets-2026-10-29.md"),
    ("Canonical #service-local-regional node completed: exactly one node in entity graph, best graph and head graph, same @id, hub url + full description + Place chain; the entity-graph duplicate pair had already been collapsed by the full-site redo (the surviving node was upgraded in place); the best-graph fragment node was added in this batch; serviceType carries the registry name Local and Regional Moving",
     "local-regional-deep package merge-note section 3, reconciled to the live graphs 2026-10-29", DATE,
     "data/entity-graph.json; data/best-json-entity-graph.json; index.html head graph"),
    ("Local and Regional datasets D1-D8 published: datasets-local-regional.json, 8 nodes (4 Dataset CC BY 4.0, 2 Service, 2 Article), page-level markup on the hub page, Developer-page entry, dateModified 2026-10-29",
     "local-regional-deep-datasets-2026-10-29.md section 6 (D1-D8)", DATE,
     "public/datasets-local-regional.json"),
    ("Hub per-page JSON created: local-regional-moving.json, 5 nodes, Places expanded to footprint 31/35",
     "local-regional-deep package schema.json + live graph footprint check 2026-10-29", DATE,
     "public/local-regional-moving.json"),
]
con.executemany("INSERT INTO attestation (claim, source, verified, evidence) VALUES (?,?,?,?)", rows)
con.commit()
after = con.execute("SELECT COUNT(*) FROM attestation").fetchone()[0]
integ = con.execute("PRAGMA integrity_check").fetchone()[0]
counts = {t: con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
          for t in ["service", "attestation", "edge", "opening_hours", "service_area", "rubric_check"]}
con.close()
if after != 73 or integ != "ok":
    fail(f"DB after-state wrong: attestation={after}, integrity={integ}")
print(f"rubric DB: +5 attestation rows (68 -> 73); counts {counts}; integrity ok")

print("BUILD OK")
