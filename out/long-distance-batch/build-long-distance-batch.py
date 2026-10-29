#!/usr/bin/env python3
"""Long-Distance Moving deploy batch — applies the long-distance-deep package
merge-note, adjusted to the CURRENT post-redo/post-videos live state
(reconciliation rule):
- entity graph already holds ONE #service-long-distance node with registry
  name/serviceType, Place chain and a two-branch short description (the redo
  already removed the build-time Martinsburg skew) but NO url -> upgrade in
  place (hub url + full package description); count stays 32
- best graph holds ZERO canonical nodes -> add the canonical node (78 -> 79)
- head graph node already carries registry serviceType + Place chain -> surgical
  upgrade in place (url after provider + full package description)
- pageMeta pointers: 17 registry pages vs 13 single-quote literal svc patterns
  at package build; recounting by canonical in BOTH pageMeta syntaxes gives
  17/17 already pointing at #service-long-distance -> no pointer edits
Authorization (Q1) ANSWERED by Henry 2026-10-29: interstate moves performed and
supported; satellite scope language stands; NO number published; NO
authority-mechanics copy. D3 proceeds on the confirmed branch.
Every step asserts its precondition and fails loudly rather than guessing.
"""
import json, re, shutil, sqlite3, pathlib

HOME = pathlib.Path.home()
PUB = HOME / "workspace/the-flat-rate-movers-pages/public"
MDATA = HOME / "workspace/the-flat-rate-machine/data"
MIRROR = HOME / "workspace/theflatratemovers"
PKG = HOME / "workspace/the-flat-rate-machine/out/pages/long-distance-deep"
BATCH = HOME / "workspace/the-flat-rate-machine/out/long-distance-batch"
BACKUP = BATCH / "backup-2026-10-29"
DB = MIRROR / "rubric.db"
DATE = "2026-10-29"
HUB = "https://theflatratemovers.com/long-distance-movers-winchester-va/"
SVC = "https://theflatratemovers.com/#service-long-distance"
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
    return pathlib.Path(path).read_bytes().endswith(b"\n")

# ---------- 0. Backups ----------
BACKUP.mkdir(parents=True, exist_ok=True)
for src in [PUB / "index.html", PUB / "entity-graph.json", PUB / "best-json-entity-graph.json",
            PUB / "ai-sitemap.json", PUB / "llms.txt", PUB / "the-flat-rate-movers-data.txt",
            MDATA / "entity-graph.json", MDATA / "best-json-entity-graph.json", DB]:
    shutil.copy2(src, BACKUP / (src.name if src != DB else "rubric.db"))
print("backups done ->", BACKUP)

# ---------- Package description (single source for node / ai-sitemap refresh) ----------
pkg_schema = load(PKG / "schema.json")
pkg_desc = pkg_schema["@graph"][0]["description"]
assert pkg_schema["@graph"][0]["@id"] == SVC and pkg_schema["@graph"][0]["url"] == HUB
assert pkg_schema["@graph"][0]["serviceType"] == "Long-Distance Moving"

def canonical_ld_node():
    return {
        "@id": SVC,
        "@type": "Service",
        "name": "Long-Distance Moving",
        "description": pkg_desc,
        "serviceType": "Long-Distance Moving",
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
    fail(f"entity graph long-distance nodes = {len(idx)}, expected exactly 1 (post-redo state)")
old = nodes[idx[0]]
if old.get("url"):
    fail("entity long-distance node already carries a url — unexpected")
nodes[idx[0]] = canonical_ld_node()
if len(nodes) != 32:
    fail(f"entity graph node count {len(nodes)} != 32")
tn = graph_style(eg_path)
for dest in [eg_path, MIRROR / "entity-graph.json", PUB / "entity-graph.json"]:
    dump_graph(dest, eg, tn)
print("entity graph: long-distance node upgraded in place, 32 nodes, mirrored x3")

# ---------- 2. Best graph: add the canonical node ----------
bg_path = MDATA / "best-json-entity-graph.json"
bg = load(bg_path)
bnodes = bg["@graph"]
if any(isinstance(n, dict) and n.get("@id") == SVC for n in bnodes):
    fail("best graph already holds the long-distance fragment — unexpected")
if len(bnodes) != 78:
    fail(f"best graph node count {len(bnodes)} != 78")
slug_before = [n.get("@id") for n in bnodes if isinstance(n, dict) and "long-distance" in str(n.get("@id", ""))]
bnodes.append(canonical_ld_node())
tn = graph_style(bg_path)
for dest in [bg_path, MIRROR / "best-json-entity-graph.json", PUB / "best-json-entity-graph.json"]:
    dump_graph(dest, bg, tn)
slug_after = [n.get("@id") for n in bnodes if isinstance(n, dict) and "long-distance" in str(n.get("@id", ""))]
assert slug_after[:len(slug_before)] == slug_before, "page-slug nodes disturbed"
print(f"best graph: long-distance node added, 78 -> 79 nodes, mirrored x3; {len(slug_before)} page-slug nodes untouched")

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
if (PUB / "long-distance-movers-winchester-va.json").exists():
    fail("long-distance-movers-winchester-va.json already exists — expected creation")
(PUB / "long-distance-movers-winchester-va.json").write_text(
    json.dumps(hub, indent=2, sort_keys=True, ensure_ascii=True) + "\n", encoding="utf-8")
print("hub JSON created: long-distance-movers-winchester-va.json (5 nodes, footprint 31/35)")

# ---------- 4. datasets-long-distance.json (D1-D8 under the RETYPE rule) ----------
# Retype mapping: D1 operations -> Service; D2 bands -> Dataset; D3 network ->
# Dataset; D4 delivery windows -> Article (domain models only, no company
# practice — prose education); D5 terms -> Article; D6 personas -> Article;
# D7 protection/compliance -> Service; D8 areas/quote -> Dataset.
# Totals: Dataset 3 / Service 2 / Article 3. No FAQPage (no discrete Q&A pairs).
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
        "@id": f"https://theflatratemovers.com/#dataset-long-distance-{slug}",
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
D.append(dnode("operations", "Service", "Long-Distance Move Operations",
    "Long-distance move operations from survey to walkthrough, in eight steps. Survey and quote: a room-by-room survey in person or through the free film-only video walkthrough survey room, where the customer films and a person makes the estimate — nothing is auto-priced — and one flat price agreed in writing before the truck rolls. Inventory: itemized, room by room (published process education: items worth more than $100 per pound are declared in writing under the federal high-value rule — a domain standard, labeled as such). Pack: full or partial packing with furniture fully covered, cross-referenced to the packing category and the interstate pack guide. Load: sequenced loading with blanket and stretch wrap protection; where a move includes a high-mass piece of 1,500 to 3,500 lbs, that piece moves under SIR Structural Integrity Relocation with the KIM-GS Protocol and L/360 floor-deflection analysis. Linehaul: transport along the published I-81, I-66 and I-70 corridor dispatch network from both branches (domain practice, labeled: certified scale weights and consolidated or exclusive-use routing shape the run). Delivery: handled inside a delivery window — the window models are published as domain education in the delivery windows dataset; no company delivery spread, date, or tracking practice is published. Placement: room-by-room placement on the residential pattern, cross-referenced. Walkthrough and claims: a final walkthrough with damage noted on the delivery paperwork, and the valuation level governing any claim — domain education, with no company claims procedure published. Shipment size sets the linehaul inputs (distance bands dataset), the delivery step uses a window model (delivery windows dataset), and the quote step rests on the estimate terms explained in the commercial terms dataset.",
    ["winchester long distance moving company", "long distance movers", "cross country moving company", "cross country movers", "cross country moving services"]))
D.append(dnode("distance-bands-sizes", "Dataset", "Distance Bands & Shipment Sizes",
    "Distance bands and shipment sizes for long-distance moving — the reference taxonomy every long-distance quote is built from. Distance bands: local (same area, same day — the local and regional category, not this service); regional (beyond local, inside the corridor network — cross-referenced to the local and regional and corridor pages); interstate (across a state line, where federal household-goods rules under 49 CFR Part 375 apply — the company's pages publish interstate scope from both branches, and the destination lanes in the route network dataset run on it); cross-country (coast-to-coast or multi-day linehaul, typically 1,500+ miles — defended at positions 4.0 to 7.1 in the company's Search Console record); and destination-lane (a named origin-to-destination lane, such as Virginia to Florida). Shipment size bands, as typical weights from published mover guides, labeled domain reference and never company figures: studio and one-bedroom homes at 2,000 to 3,500 lbs, where consolidation economics dominate; two-bedroom homes at 4,000 to 6,000 lbs, the most common long-distance band; three-bedroom homes at 6,000 to 9,000 lbs, where accessorials — stairs, long carry, shuttle — start to dominate the variance; four-plus-bedroom homes at 9,000 lbs and up, often 11,000 to 15,000 lbs, where weight accuracy and delivery-window planning dominate. A single heavy piece is not a household shipment band at all: pieces of 1,500 to 3,500 lbs move under the published SIR band, cross-referenced to the SIR heavy-asset and gun-safe categories. Weight times distance is the linehaul basis, and every band feeds the cost drivers in the commercial terms dataset; the survey governs each move.",
    ["interstate moving winchester va", "virginia to florida movers", "virginia to texas movers", "virginia to california movers"]))
D.append(dnode("route-corridor-network", "Dataset", "Route, Corridor & Destination Network",
    "Route, corridor, and destination network for long-distance moving. Dispatch runs from both branches, never merged: Winchester, where I-81 meets I-66, and Martinsburg, the Eastern Panhandle origin — over the three-corridor network of Interstate 81, Interstate 66, and Interstate 70. The destination lanes are published pages, each carrying its own scope wording: Virginia to Florida, Virginia to Texas, Virginia to California, Virginia to Nevada, and Virginia to New York; Virginia and West Virginia to Miami; and the Winchester to Las Vegas run, published on the gun-safe category as a cross-reference. Every lane is an interstate or cross-country move quoted at one flat rate in writing before the truck rolls, dispatched from whichever branch the lane runs from. The corridor rule, published on the corridor pages and carried here in full: the published service areas are the audience and coverage pool — no listed town is claimed to sit on a particular highway, and no exit, stop, or ramp claim is made anywhere in this dataset. Routes chain to dispatch and the quote path in the service areas dataset, and each lane is a distance band in the bands dataset. Corridor depth lives on the Interstate 81, Interstate 66, and Interstate 70 corridor pages and the interstate moving network page.",
    ["interstate moving network", "interstate 66 corridor", "interstate 70 corridor", "route 81 moving"]))
D.append(dnode("delivery-windows", "Article", "Delivery Windows & Transit Operations",
    "Delivery windows and transit operations for long-distance moving — published as domain education only: no delivery window, spread, date, or tracking practice is published for the company, and nothing in this dataset promises one. The standard model is the delivery spread: a range of dates — commonly 7 to 21 days in van-line practice and 3 to 14 days in published mover ranges — that widens with distance and peak season, is written into the bill of lading, and ends with the driver calling 24 to 48 hours ahead. Exclusive-use and expedited models put one shipment on one truck for tighter dates at a premium. A guaranteed date is a contractual commitment, a different instrument entirely. Consolidation sets the order: route order sets delivery order, and small shipments fill around large ones. Delay factors are structural: weather, federal hours-of-service rules, traffic, and route stops. Client preparation for any window: an essentials kit kept with the client, not on the truck — clothes, toiletries, medications, documents, laptops, and first-night kitchen and bedding. Carrier updates during transit are a domain expectation in the wider market; they are recorded here as education, never as a company tracking claim. The window question is the buyer's top unanswered question on a long-distance move; the company's answer is given per move at quote time, from the client's own dates.",
    ["long distance moving delivery window", "how long does long distance moving take", "moving delivery spread"]))
D.append(dnode("terms", "Article", "Commercial Terms & Cost Drivers",
    "Commercial terms and cost drivers for long-distance moving. The company's only pricing term is the published one: one flat rate agreed in writing before the truck rolls — no hourly meter, and no company price, fee, deposit, or discount stated anywhere in this dataset. Everything else here is domain education, researched and labeled, with the federal rules cited to the FMCSA and 49 CFR Part 375. Estimate types (domain): a binding estimate fixes the price when the inventory is unchanged, with a revised written estimate if items or services are added; a binding-not-to-exceed estimate sets a ceiling, and the customer pays less when the shipment weighs less; a non-binding estimate lets the actual weight govern, with delivery-day collection capped at 110 percent of the estimate and the balance billed within 30 days — the federal 110 percent rule. Valuation (domain, FMCSA): Full Value Protection means the mover repairs, replaces, or pays the current replacement value of a lost or damaged item, with a minimum declared value of $6 per pound of shipment weight and a written declaration required for items worth more than $100 per pound; Released Value Protection is free and caps liability at $0.60 per pound per article — $15 for a 25-pound television — and is chosen only by a signed waiver on the bill of lading. Valuation is not insurance; it is a tariff-based level of carrier liability. Cost drivers (domain): weight on certified scales, with a plus-or-minus 10 percent estimate variance an industry-standard tolerance; mileage and distance brackets, which are not linear; fuel surcharges, commonly 8 to 15 percent in published guides; accessorials — stairs per flight, elevator reservation, long carry beyond roughly 75 feet, a shuttle when the truck cannot reach the home, packing, crating, and specialty handling — published as domain ranges only, never company fees; and seasonality, with peak season May through September commonly 20 to 40 percent higher in published guides, month-end premiums, and interstate booking 6 to 8 weeks ahead.",
    ["flat rate long distance moving", "binding vs non-binding estimate", "full value protection vs released value", "long distance moving cost"]))
D.append(dnode("personas", "Article", "Buyer Personas & Trigger Events",
    "Buyer personas and trigger events for long-distance moving. Job relocators: a fixed start date makes the delivery window the central risk, on a 6-to-8-week planning horizon (domain). Families moving states: closings drive the dates, month-end and peak-season collisions drive the stress, and room-by-room placement is the need at the far end. Cross-country researchers: they compare estimate types, valuation, and delivery spreads before committing — the researchers behind the cross-country queries already ranking 4.0 to 7.1. Downsizers and retirees: trust and handling decide, cross-referenced to the senior category, which owns its claims. Destination-lane movers: lane confidence and one flat lane price decide. Heavy-asset long-distance clients: a household move with an SIR piece inside it — a safe, a piano, a medical device — cross-referenced to the SIR, gun-safe, piano, and medical categories. Military-adjacent households: timing and inventory discipline, cross-referenced to the military category only — no military service is claimed in this dataset. The seasonal pattern is industry research, labeled as such: roughly 60 to 70 percent of US moves happen May through September, June is the busiest month, and month-ends peak — the pattern that widens delivery windows and stretches booking lead times. Every persona plans through the same quote path: the Short or Detailed quote form, or the film-only video walkthrough survey room with a human-made estimate.",
    ["moving for a new job", "cross country move planning", "long distance movers", "cross country moving company"]))
D.append(dnode("protection-compliance", "Service", "Protection, Inventory & Compliance",
    "Protection, inventory, and compliance for long-distance moving. Published practice, cross-referenced from the residential and packing categories: blanket and stretch wrap and full furniture protection on every piece; disassembly and reassembly planned as part of the move. Where a move includes a high-mass piece of 1,500 to 3,500 lbs, SIR Structural Integrity Relocation applies — L/360 floor-deflection analysis and load spreading — for heavy pieces only. Inventory discipline is published process education (domain, labeled): an itemized inventory with condition notes, room by room, and a written declaration for items worth more than $100 per pound. The bill of lading is the contract and the receipt (domain education, FMCSA): take a copy before the truck leaves, and never sign a blank one — education for the client, stated as the federal standard, not dressed as company procedure. Valuation is not insurance (domain, FMCSA's own distinction): the levels are explained in the commercial terms dataset as education, and no company valuation offering is claimed here. Prohibited-items guidance is domain education only — no company prohibited-items list is published and none is invented. Building compliance at the destination — elevator booking, parking, building move hours, and the certificate-of-insurance requirement that managed buildings commonly impose, an industry requirement, labeled as such — is recorded as planning inputs that shape the quote, never as capability claims. Heavy pieces cross-reference the SIR heavy-asset category; their long-distance runs are published on the gun-safe hub.",
    ["moving valuation vs insurance", "bill of lading moving", "long distance movers", "winchester long distance moving company"]))
D.append(dnode("areas-quote", "Dataset", "Service Areas, Dispatch & Quote Path",
    "Service areas, dispatch, and quote path for long-distance moving. Two branches, never merged: Winchester — The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester, VA 22601, hours Monday to Friday 8 to 6, Saturday 8 to 4, Sunday 9 to 4, Google rating 5.0 from 1 review; Martinsburg — Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg, WV 25404, hours Monday to Friday 9 to 6, Saturday 9 to 4, Sunday 9 to 4, Google rating 4.7 from 6 reviews. Phone +1-540-422-2153 at both branches; the company was founded in June 2010 and works under the promise Guaranteed Flat Rate or Your Move is Free! The full service footprint is 52 published GeoJSON features — Winchester 31 areas (16 published on its Google profile plus 15 extended), Martinsburg 35 areas (14 plus 21 extended), 14 shared, including Moorefield 26836, which both branches serve — carried on each branch's own record, never merged into one list. Long-distance dispatch runs the I-81, I-66 and I-70 corridor network from both branches, and the destination lanes run from the branch each lane is published under. The quote path: Get My Flat Rate Quote with the Short (Quick Quote) form by default and the Detailed Project form one toggle away, From, To and What's moving preserved while switching, or the free film-only video walkthrough survey room with a human-made estimate. Seventeen pages carry this service: the Winchester hub and the Martinsburg branch page, the cross-country page, the interstate Winchester page and the interstate moving guide, the long-distance Winchester guide, the interstate network page, five Virginia-to-destination lanes, Miami, two category indexes, and two long-form articles. Cross-references: residential, local and regional, packing, SIR heavy-asset, gun-safe, piano and antique, military, and storage — links, never duplicated claims.",
    ["movers winchester va", "movers martinsburg wv", "moving companies winchester va"]))

datasets_obj = {"@context": "https://schema.org", "@graph": D}
datasets_txt = json.dumps(datasets_obj, indent=2, sort_keys=False, ensure_ascii=False) + "\n"
if (PUB / "datasets-long-distance.json").exists():
    fail("datasets-long-distance.json already exists — expected creation")
(PUB / "datasets-long-distance.json").write_text(datasets_txt, encoding="utf-8")
print("datasets-long-distance.json written: 8 nodes (Dataset 3 / Service 2 / Article 3)")

# ---------- 5. ai-sitemap: long-distance description refresh + keyword additions ----------
ais_path = PUB / "ai-sitemap.json"
ais = load(ais_path)
ld = [s for s in ais["services"] if isinstance(s, dict) and s.get("name") == "Long-Distance Moving"]
if len(ld) != 1:
    fail(f"ai-sitemap long-distance entries = {len(ld)}")
ld[0]["description"] = pkg_desc
new_kw = ["winchester long distance moving company", "cross country moving company",
          "cross country movers", "long distance movers"]
for k in new_kw:
    if k in ais["keywords"]:
        fail(f"keyword already present: {k}")
ais["keywords"].extend(new_kw)
dump_graph(ais_path, ais, graph_style(ais_path))
print(f"ai-sitemap: long-distance description refreshed; keywords {len(ais['keywords'])-4} -> {len(ais['keywords'])}")

# ---------- 6. pageMeta pointer reconciliation (verify only — no edits expected) ----------
html_pre = (PUB / "index.html").read_text(encoding="utf-8")
mi = html_pre.find("pageMeta={")
mend = html_pre.find("\n};", mi)
mblock = html_pre[mi:mend]
pairs = []
for m in re.finditer(r"svc:\s*'([^']+)'\s*,\s*canonical:\s*'([^']+)'", mblock):
    pairs.append((m.group(2), m.group(1)))
for m in re.finditer(r'"svc":\s*"([^"]+)"\s*,\s*"canonical":\s*"([^"]+)"', mblock):
    pairs.append((m.group(2), m.group(1)))
svc_by_canon = dict(pairs)
registry = load(MDATA / "pages.json")["pages"]
reg_ld = sorted("https://theflatratemovers.com/" + p["slug"] + "/"
                for p in registry if "service-long-distance" in (p.get("services") or []))
if len(reg_ld) != 17:
    fail(f"registry long-distance pages = {len(reg_ld)}, expected 17")
missing = [c for c in reg_ld if svc_by_canon.get(c) != SVC]
if missing:
    fail(f"pageMeta pointers missing/wrong for: {missing}")
ld_pointers = sorted(c for c, s in svc_by_canon.items() if s == SVC)
print(f"pageMeta reconciliation: 17/17 registry pages point at #service-long-distance "
      f"(13 single-quote style + 4 JSON style); total LD pointers parsed = {len(ld_pointers)}; no edits")

# ---------- 7. index.html: head node upgrade + hub div dataset block + Developer card ----------
idx_path = PUB / "index.html"
html = idx_path.read_text(encoding="utf-8")

# 7a. Head graph long-distance node (surgical, head-block key order preserved)
old_desc = "Flat-rate long-distance moving from Winchester, VA and Martinsburg, WV along the I-81, I-66 and I-70 corridors, planned door to door and quoted at one price in writing before move day."
i = html.find('"@id": "https://theflatratemovers.com/#service-long-distance"')
if i < 0:
    fail("head long-distance node not found")
seg_start = html.rfind('"@type": "Service"', 0, i)
seg_end = html.find("\n    }", i)
seg = html[seg_start:seg_end]
if seg.count(old_desc) != 1:
    fail("head long-distance description anchor not exactly once in its node")
if '"url"' in seg:
    fail("head long-distance node already carries a url — unexpected")
provider_anchor = '''      "provider": {
        "@id": "https://theflatratemovers.com/#organization"
      },
'''
if seg.count(provider_anchor) != 1:
    fail("head long-distance provider anchor mismatch")
new_seg = seg.replace(provider_anchor, provider_anchor + f'      "url": "{HUB}",\n', 1).replace(old_desc, pkg_desc, 1)
html = html[:seg_start] + new_seg + html[seg_end:]
print("head graph: long-distance node upgraded (url + full description), still one node")

# 7b. Hub div: dataset markup block before the page div's closing tag (after last </section>)
div_start = html.find('<div class="page" id="page-longdistance">')
if div_start < 0:
    fail("page-longdistance div not found")
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
if "dataset-long-distance" in div_txt:
    fail("hub div already carries a long-distance dataset block")
insert_at = div_txt.rfind("</section>")
if insert_at < 0:
    fail("hub div </section> anchor missing")
block = '\n<script type="application/ld+json">\n' + datasets_txt.rstrip("\n") + "\n</script>\n"
new_div = div_txt[:insert_at + len("</section>")] + block + div_txt[insert_at + len("</section>"):]
html = html[:div_start] + new_div + html[div_end:]
print("hub div: dataset markup block inserted (parse-equal to datasets-long-distance.json)")

# 7c. Developer card: Long-Distance data card immediately after the Videos data card
vid_anchor = '<article class="card"><h3>Videos data</h3>'
ci = html.find(vid_anchor)
if ci < 0:
    fail("developer Videos data card not found")
cend = html.find("</article>", ci) + len("</article>")
ld_card = ('<article class="card"><h3>Long-Distance data</h3><p><a href="/datasets-long-distance.json" target="_blank" rel="noopener">'
           '<b>datasets-long-distance.json →</b></a> — 8 published nodes about the long-distance moving service, from both branches, never merged: '
           '3 as Datasets (CC BY 4.0) — distance bands &amp; shipment sizes, route, corridor &amp; destination network, service areas, dispatch &amp; quote path; '
           '2 as Service data — long-distance move operations, protection, inventory &amp; compliance; '
           '3 as Articles — delivery windows &amp; transit operations (domain models only, no company delivery practice), commercial terms &amp; cost drivers (flat-rate-in-writing only; FMCSA-cited domain education labeled), buyer personas &amp; trigger events. '
           'Hub page: <a href="/long-distance-movers-winchester-va/">Long-Distance Movers — Winchester, VA</a> · Hub JSON: '
           '<a href="/long-distance-movers-winchester-va.json" target="_blank" rel="noopener"><b>long-distance-movers-winchester-va.json →</b></a>.</p></article>')
if "Long-Distance data" in html:
    fail("developer Long-Distance data card already present")
html = html[:cend] + ld_card + html[cend:]
idx_path.write_text(html, encoding="utf-8")
print("developer: Long-Distance data card inserted after Videos data card")

# ---------- 8. llms.txt: stub service line refreshed to hub + full text; dated entry appended ----------
llms_path = PUB / "llms.txt"
llms = llms_path.read_text(encoding="utf-8")
stub = "- [Long-Distance Moving](https://theflatratemovers.com/): Long-distance moving, I-81, I-66, and I-70 corridors, Shenandoah Valley and Eastern Panhandle\n"
if llms.count(stub) != 1:
    fail("llms long-distance stub line anchor mismatch")
ld_line = ("- [Long-Distance Moving](https://theflatratemovers.com/long-distance-movers-winchester-va/): " + pkg_desc +
           " Datasets D1–D8 (CC BY 4.0): long-distance move operations; distance bands & shipment sizes; route, corridor & destination network; "
           "delivery windows & transit operations (domain models only); commercial terms & cost drivers (flat-rate-in-writing only; FMCSA-cited domain education labeled); "
           "buyer personas & trigger events; protection, inventory & compliance; service areas, dispatch & quote path. "
           "Full datasets: https://theflatratemovers.com/datasets-long-distance.json · Hub JSON: https://theflatratemovers.com/long-distance-movers-winchester-va.json\n")
llms = llms.replace(stub, ld_line, 1)
llms_entry = """
## Update — 2026-10-29 (long-distance deep batch)
- Canonical #service-long-distance Service node completed in both machine graphs and the head graph (same @id, exactly one node per graph): hub url and the full description added in place, and the expanded graph gains the fragment node it never had. No new page (17 pages carry the service: the Winchester hub, the Martinsburg branch page, the cross-country page, two interstate pages, the interstate network page, two guides, five Virginia-to-destination lanes, Miami, two category indexes, and two long-form articles); counts unchanged at 154 pages and 22 services.
- Long-Distance datasets D1–D8 published at https://theflatratemovers.com/datasets-long-distance.json (8 nodes: 3 Datasets under CC BY 4.0, 2 Service, 3 Articles; dateModified 2026-10-29), with page-level markup on the long-distance-movers-winchester-va hub page and a Developer-page collection entry. Fields without a verified company term are omitted, not guessed: a company delivery window or spread, a valuation offering, an estimate-type mapping for the company's own flat rate, shipment tracking, storage-in-transit terms, endpoint access scope, and vehicle transport. Delivery-window models, estimate types, and valuation figures appear as labeled domain education (FMCSA-cited), never as company practice or prices.
- Hub per-page JSON created: https://theflatratemovers.com/long-distance-movers-winchester-va.json (5 nodes, Place areas at the full footprint 31/35, branches distinct). The Martinsburg branch per-page JSON was already live; unchanged in this batch.
- pageMeta service pointers reconciled against the registry: all 17 long-distance pages carry the #service-long-distance pointer (13 in the original single-quote style and 4 in the JSON style); no pointer changes were needed.
"""
if "long-distance deep batch" in llms:
    fail("llms long-distance entry already present")
if not llms.endswith("\n"):
    llms += "\n"
llms += "\n" + llms_entry.strip("\n") + "\n"
llms_path.write_text(llms, encoding="utf-8")
print("llms.txt: long-distance service line refreshed + dated entry appended")

# ---------- 9. data txt: dated entry ----------
data_path = PUB / "the-flat-rate-movers-data.txt"
dtxt = data_path.read_text(encoding="utf-8")
data_entry = """
## Update 2026-10-29 — long-distance deep batch
- Canonical #service-long-distance Service node completed in both machine graphs and the head graph (same @id, exactly one node per graph, hub url https://theflatratemovers.com/long-distance-movers-winchester-va/ + full description + Place chain at the full footprint). No new page; counts unchanged at 154 pages and 22 services.
- Long-Distance datasets D1–D8 published as JSON-LD at https://theflatratemovers.com/datasets-long-distance.json (8 nodes: 3 Datasets under CC BY 4.0, 2 Service, 3 Articles; dateModified 2026-10-29), with page-level markup on the hub page and a Developer-page collection entry. Fields without a verified company term are omitted, not guessed.
- Hub per-page JSON created: https://theflatratemovers.com/long-distance-movers-winchester-va.json (5 nodes).
"""
if "long-distance deep batch" in dtxt:
    fail("data txt long-distance entry already present")
if not dtxt.endswith("\n"):
    dtxt += "\n"
dtxt += "\n" + data_entry.strip("\n") + "\n"
data_path.write_text(dtxt, encoding="utf-8")
print("data txt: dated entry appended")

# ---------- 10. Rubric DB: attestation rows for facts this batch newly publishes ----------
con = sqlite3.connect(DB)
canon = con.execute("SELECT COUNT(*) FROM service WHERE service_id=?", (SVC,)).fetchone()[0]
if canon != 1:
    fail(f"canonical service-long-distance rows = {canon}, expected 1")
before = con.execute("SELECT COUNT(*) FROM attestation").fetchone()[0]
if before != 81:
    fail(f"attestation rows before = {before}, expected 81")
rows = [
    ("Canonical #service-long-distance node completed: exactly one node in entity graph, best graph and head graph, same @id, hub url https://theflatratemovers.com/long-distance-movers-winchester-va/ + full two-branch description + Place chain; the best-graph fragment node was added in this batch; the entity and head nodes were upgraded in place (the full-site redo had already removed the build-time Martinsburg skew and set the registry serviceType and Place chain)",
     "long-distance-deep package merge-note section 3, reconciled to the live graphs 2026-10-29", DATE,
     "data/entity-graph.json; data/best-json-entity-graph.json; index.html head graph"),
    ("Long-distance demand evidence: hub page 1,984 impressions at position 49.4; interstate Winchester page 2,900 at 71.7; 'winchester long distance moving company' 256 at 15.1; 'cross country moving company' 166 at 4.0; 'cross country movers' 161 at 4.9; 'cross country moving services' 133 at 7.1; 'long distance movers' 115 at 8.0",
     "GSC 3-month pull to 2026-10-27, read 2026-10-29; long-distance-deep-datasets-2026-10-29.md sections 2/6/7", DATE,
     "long-distance-deep-datasets-2026-10-29.md"),
    ("Long-Distance datasets D1-D8 published: datasets-long-distance.json, 8 nodes (3 Dataset CC BY 4.0, 2 Service, 3 Article), page-level markup on the hub page, Developer-page entry, dateModified 2026-10-29; delivery-window models, estimate types and valuation figures published as labeled FMCSA-cited domain education only",
     "long-distance-deep-datasets-2026-10-29.md section 6 (D1-D8)", DATE,
     "public/datasets-long-distance.json"),
    ("Hub per-page JSON created: long-distance-movers-winchester-va.json, 5 nodes, Places expanded to footprint 31/35, per-branch ratings distinct",
     "long-distance-deep package schema.json + live graph footprint check 2026-10-29", DATE,
     "public/long-distance-movers-winchester-va.json"),
    ("Interstate scope confirmed by the owner 2026-10-29: the company performs interstate and long-distance moves, and the destination-lane and cross-country scope published on the satellite pages stands as published scope; D3 route network published on that confirmed basis; no carrier number is published in any file",
     "Owner statement 2026-10-29 (operating model: leased trucks; interstate work performed with contractors holding their own authority and equipment — internal record, not site copy)", DATE,
     "long-distance-deep-datasets-2026-10-29.md section 6 D3; datasets-long-distance.json"),
]
con.executemany("INSERT INTO attestation (claim, source, verified, evidence) VALUES (?,?,?,?)", rows)
con.commit()
after = con.execute("SELECT COUNT(*) FROM attestation").fetchone()[0]
integ = con.execute("PRAGMA integrity_check").fetchone()[0]
counts = {t: con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
          for t in ["service", "attestation", "edge", "opening_hours", "service_area", "rubric_check"]}
con.close()
if after != 86 or integ != "ok":
    fail(f"DB after-state wrong: attestation={after}, integrity={integ}")
print(f"rubric DB: +5 attestation rows (81 -> 86); counts {counts}; integrity ok")

print("BUILD OK")
