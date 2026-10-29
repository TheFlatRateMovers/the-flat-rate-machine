#!/usr/bin/env python3
"""Office Moving deploy batch — applies the office-deep package merge-note,
adjusted to the CURRENT post-redo live state (reconciliation rule):
- entity graph already holds ONE #service-office-moving node (redo dedupe) -> upgrade in place (url + full description)
- best graph holds ZERO -> add the canonical node (76 -> 77)
- head graph holds ONE thin node -> surgical upgrade in place (url + full description)
Every step asserts its precondition and fails loudly (SystemExit) rather than guessing.
"""
import json, re, shutil, sqlite3, pathlib, sys

HOME = pathlib.Path.home()
PUB = HOME / "workspace/the-flat-rate-movers-pages/public"
MDATA = HOME / "workspace/the-flat-rate-machine/data"
MIRROR = HOME / "workspace/theflatratemovers"
PKG = HOME / "workspace/the-flat-rate-machine/out/pages/office-deep"
BATCH = HOME / "workspace/the-flat-rate-machine/out/office-batch"
BACKUP = BATCH / "backup-2026-10-29"
DB = MIRROR / "rubric.db"
DATE = "2026-10-29"
HUB = "https://theflatratemovers.com/commercial-office-moving-2/"
SVC = "https://theflatratemovers.com/#service-office-moving"
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

def canonical_office_node():
    # key order follows the refreshed-fragment convention (gun-safe node in entity graph)
    return {
        "@id": SVC,
        "@type": "Service",
        "name": "Office Moving",
        "description": pkg_desc,
        "serviceType": "Office Moving",
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
    fail(f"entity graph office nodes = {len(idx)}, expected exactly 1 (post-redo state)")
nodes[idx[0]] = canonical_office_node()
if len(nodes) != 32:
    fail(f"entity graph node count {len(nodes)} != 32")
tn = graph_style(eg_path)
for dest in [eg_path, MIRROR / "entity-graph.json", PUB / "entity-graph.json"]:
    dump_graph(dest, eg, tn)
print("entity graph: office node upgraded in place, 32 nodes, mirrored x3")

# ---------- 2. Best graph: add the canonical node ----------
bg_path = MDATA / "best-json-entity-graph.json"
bg = load(bg_path)
bnodes = bg["@graph"]
if any(isinstance(n, dict) and n.get("@id") == SVC for n in bnodes):
    fail("best graph already holds the office fragment — unexpected")
if len(bnodes) != 76:
    fail(f"best graph node count {len(bnodes)} != 76")
bnodes.append(canonical_office_node())
tn = graph_style(bg_path)
for dest in [bg_path, MIRROR / "best-json-entity-graph.json", PUB / "best-json-entity-graph.json"]:
    dump_graph(dest, bg, tn)
print("best graph: office node added, 76 -> 77 nodes, mirrored x3")

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
if (PUB / "commercial-office-moving-2.json").exists():
    fail("commercial-office-moving-2.json already exists — expected creation")
(PUB / "commercial-office-moving-2.json").write_text(
    json.dumps(hub, indent=2, sort_keys=True, ensure_ascii=True) + "\n", encoding="utf-8")
print("hub JSON created: commercial-office-moving-2.json (5 nodes, footprint 31/35)")

# ---------- 4. datasets-office.json (D1-D8 under the RETYPE rule) ----------
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
        "@id": f"https://theflatratemovers.com/#dataset-office-{slug}",
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
D.append(dnode("operations", "Service", "Office Move Operations",
    "Office move operations for complete office relocations, quoted flat and agreed in writing. The published scope is verbatim: Complete office relocations, quoted flat and agreed in writing: desks and workstations, files and records runs, and office equipment, moved in a planned order so your team can sit down and work at the new address. The operation chain runs survey, quote, plan order, label, pack, stage, sequenced move, place, systems check, and walkthrough. The plan spine is what moves first, what moves last, and what the team needs working on day one. Survey runs through the Detailed Project form, which captures rooms and facility size, and the quote toggle — Short (Quick Quote) default and Detailed Project, switching in place with inputs preserved. Packing is full or partial. When the dates do not line up neatly, freight and equipment stage at the warehouse and transload operation between truck, container, and warehouse on the same job, then place at the new site in the order the team needs it. One agreed price before move day, no hourly meter running over a weekend move. Systems checks cross-reference the IT relocation category, staging cross-references the industrial and commercial services category, and packing options cross-reference the packing category — cross-references are links, never duplicated claims.",
    ["office moving winchester va", "office movers winchester va", "commercial moving", "office relocation virginia", "business moving companies near me", "virginia flat rate office moving company"]))
D.append(dnode("types-sizes", "Dataset", "Office Types and Size Bands",
    "Office types and size bands for office relocations. Office types the company serves, as published: professional offices, shop offices, and industrial offices inside a plant, warehouse, or industrial facility; the industrial-office type cross-references the industrial offices category, and government offices cross-reference the government category. Corporate is the buyer's word for the same work — corporate movers is the search phrase — not a separate company type. Size bands are industry reference data, labeled as such and never a company scope claim: small offices plan on a 4 to 6 week lead time, medium on 6 to 10 weeks, large on 10 to 14 weeks, and enterprise programs on 14 to 20 weeks, with general planning windows of 8 to 12 weeks, 12 weeks for 20 or more workstations, and 4 to 6 months for a full floor. No size band, headcount, or square-footage scope is claimed for the company anywhere in this dataset; the Detailed Project form captures rooms and facility size as quote inputs, and the survey governs each office. Multi-site and enterprise programs appear only as industry bands, never as company scope.",
    ["corporate movers winchester va", "office moving winchester va", "office relocation virginia", "commercial moving"]))
D.append(dnode("taxonomy", "Dataset", "Workstation, Furniture and Equipment Taxonomy",
    "Workstation, furniture, and equipment taxonomy for office moves. Published item classes: desks, workstations, chairs, conference and meeting furniture, filing, files and records runs, and office equipment. Handling runs disassembly, labeling by department and floor plan, padding, reassembly to the floor plan, and crating where a piece needs it. Cross-references are links, not duplicated content: servers and IT gear belong to the IT relocation category, safes and high-mass pieces to the SIR heavy-asset category, crates to the custom crating category, and packing depth to the packing category — those categories own their claims. Industry taxonomy, labeled as such: cubicle and systems-furniture vocabulary belongs to the wider office-moving trade; the company's published scope is desks and workstations, and no cubicle or systems-furniture scope is claimed here. Color-coded department and floor-plan labeling is industry practice, labeled as such. Every published class maps to a sentence on the office hub page: Workstations & furniture, Files & records runs, Office equipment.",
    ["office moving winchester va", "office movers winchester va", "workstation movers", "office furniture moving", "office relocation virginia"]))
D.append(dnode("phasing-dayone", "Article", "Phasing Models and Day-One Planning",
    "Phasing models and day-one planning for office moves. The company's published rule is a sequence: asked whether the move happens in a sequence or all at once, the answer is in a sequence — what leaves first, what arrives first, and where each workstation, file run, and piece of equipment lands is planned with the client, and the commercial rule behind it is what the team needs working on day one. Phasing models are industry reference, labeled as such and never claimed as company practice: single-phase moves for small offices, department-phased moves across a weekend for medium offices, multi-night phased moves for large offices, and phased weekends for enterprise programs, phased by function and risk, with non-customer-facing departments midweek and support and finance on the weekend around a blackout period. Swing space and remote work are the industry's safety valves; a shadow-mode systems check in the first 24 to 48 hours cross-references the IT relocation category. First-week measures — tickets resolved same day, login success, daily stabilization updates — are industry practice, labeled as such, never a company service-level promise. The hub page's published line stands as written: no hourly meter running over a weekend move; scheduling scope beyond that sentence is not claimed.",
    ["corporate movers winchester va", "office relocation virginia", "office moving winchester va", "business moving companies near me"]))
D.append(dnode("terms", "Article", "Office Commercial Terms and Cost Drivers",
    "Commercial terms and cost drivers for office moves. The company's only pricing terms are the published ones: the move is quoted flat and agreed in writing before move day, one agreed price, no hourly meter, under the standing promise Guaranteed Flat Rate or Your Move is Free! No company price, rate, deposit, discount, or fee is stated anywhere in this dataset. Every figure below is industry market data, researched and labeled as such, never a company term: market size-band ranges run roughly $3,000 to $12,000 for small offices, $12,000 to $50,000 for mid-size, $50,000 to $150,000 for large, and $150,000 and up for enterprise programs; per-square-foot market guides run $6 to $10; access add-ons in market guides include elevator handling at $75 to $200, long carries at $50 to $200, and shuttle service at $200 to $500; after-hours premiums run 10 to 25 percent in market data; full packing runs $400 to $1,800 as a market add-on, and packing labor $50 to $100 an hour in market guides — the hourly figures are exactly the meter the flat rate removes. Downtime math is industry research, labeled as such: ITIC 2024 puts one hour of downtime above $300,000 for over 90 percent of mid-size and large enterprises, Gartner's widely cited figure is $5,600 a minute, and planning guides use $100 to $400 per employee per day. The fear the flat rate answers is the hourly meter, move-day variance, and the disputed invoice; the company answer is one agreed price before move day.",
    ["virginia flat rate office moving company", "flat rate movers", "corporate movers winchester va", "office moving winchester va", "business moving companies near me"]))
D.append(dnode("personas", "Article", "Office Buyer Personas and Trigger Events",
    "Buyer personas and trigger events for office moves. The personas: office managers, who plan from floor plans, seating charts, labeling, and a day-one checklist; business owners and owner-operators, whose fear is the hidden-costs invoice and the downtime bill; facility and building managers, who own elevator, dock, parking, and badging coordination; IT coordinators, whose cutover work cross-references the IT relocation category; and operations teams and department heads, who own continuity and phasing. The hub page names the audience the same way: office managers, business owners, and facility teams. Trigger events are industry research, labeled as such: lease end, expansion, consolidation, renovation, new premises, hybrid-work reshaping, and building sale. Planning windows are industry research: 8 to 12 weeks in general, 12 weeks for 20 or more workstations, 4 to 6 months for a full floor. Coordination runs on two fixed calendars — lease dates at both ends, and lead times for internet circuits, movers, and building elevators — with staff, clients, and vendors notified in advance. Buying criteria, as published: downtime kept short, day-one working order, a flat price in writing, a planned sequence, building access handled as quote inputs, and systems back up in order through the IT cross-reference. Office jobs quote through the Detailed Project form, which captures rooms and facility size.",
    ["corporate movers winchester va", "office moving winchester va", "business moving companies near me", "office relocation virginia", "commercial moving"]))
D.append(dnode("access-protection", "Service", "Building Access, Protection and Compliance",
    "Building access, protection, and compliance for office moves. The company's published position: for an industrial office inside a plant, warehouse, or industrial facility, access, floor space, staging, and equipment handling are planned around the site itself, and the warehouse and transload operation is the staging base behind the job. Every access item in this dataset is a quote input that changes quote scope — elevator reservations and windows, loading dock reservations, parking and loading zones, badging, and building move hours. No elevator-booking, dock, badging, or building-rule capability is claimed, and no certificate-of-insurance issuance is claimed: managed buildings commonly require a certificate of insurance, which is an industry requirement, labeled as such, confirmed as a quote input before move day. Industry practice, labeled as such: freight-elevator windows typically run 4 to 6 hours, dock reservations are mandatory in multi-tenant buildings, and moves in those buildings often run evenings or weekends under building rules; a standard timeline confirms building access, reserves freight elevators and docks, and distributes packing materials and labeling instructions 3 to 4 weeks out, has employees pack personal workstation items into labeled boxes and IT disconnect non-essential equipment 1 week out, and runs load, transport, unload, reassembly per floor plan, reconnection, and a walkthrough on move day. Protection on the path runs blanket and stretch wrap with floor and rail protection, and furniture is padded and reassembled to the floor plan. Sealed, numbered chain-of-custody handling for records is industry practice, labeled as such; the company's published scope is files and records runs, with no handling claim added here.",
    ["office moving winchester va", "corporate movers winchester va", "office relocation virginia", "commercial moving"]))
D.append(dnode("areas-quote", "Dataset", "Office Service Areas, Dispatch and Quote Path",
    "Service areas, dispatch, and quote path for office moving. Two branches, never merged: Winchester — The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester, VA 22601, hours Monday to Friday 8 to 6, Saturday 8 to 4, Sunday 9 to 4, Google rating 5.0 from 1 review; Martinsburg — Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg, WV 25404, hours Monday to Friday 9 to 6, Saturday 9 to 4, Sunday 9 to 4, Google rating 4.7 from 6 reviews. Phone +1-540-422-2153 at both branches; the company was founded in June 2010. The full service footprint is 52 GeoJSON features: Winchester serves 31 areas (16 published on its Google profile plus 15 extended), Martinsburg serves 35 (14 plus 21 extended), and 14 areas are shared. Dispatch runs the I-81, I-66, and I-70 corridor network from both branches, with warehouse and transload staging between truck, container, and warehouse on the same job. The quote path: Short (Quick Quote) default and Detailed Project toggle on the Get My Flat Rate Quote button, inputs preserved while switching; the Detailed Project form captures rooms and facility size so the quote is built from the real scope. Three pages carry this service: the office hub and the Winchester and Martinsburg office pages, with the commercial hub linking onward to Office Moving.",
    ["office moving winchester va", "office movers winchester va", "corporate movers winchester va", "moving companies winchester va", "movers martinsburg wv", "business moving companies near me"]))

datasets_obj = {"@context": "https://schema.org", "@graph": D}
datasets_txt = json.dumps(datasets_obj, indent=2, sort_keys=False, ensure_ascii=False) + "\n"
(PUB / "datasets-office.json").write_text(datasets_txt, encoding="utf-8")
print("datasets-office.json written: 8 nodes (Dataset 3 / Service 2 / Article 3)")

# ---------- 5. ai-sitemap: office description refresh + keyword additions ----------
ais_path = PUB / "ai-sitemap.json"
ais = load(ais_path)
off = [s for s in ais["services"] if isinstance(s, dict) and s.get("name") == "Office Moving"]
if len(off) != 1:
    fail(f"ai-sitemap office entries = {len(off)}")
off[0]["description"] = pkg_desc
new_kw = ["office moving company winchester va", "virginia flat rate office moving company"]
for k in new_kw:
    if k in ais["keywords"]:
        fail(f"keyword already present: {k}")
ais["keywords"].extend(new_kw)
dump_graph(ais_path, ais, graph_style(ais_path))
print(f"ai-sitemap: office description refreshed; keywords {len(ais['keywords'])-2} -> {len(ais['keywords'])}")

print("PART 1 OK")

# ---------- 6. index.html: head node upgrade + office div dataset block + Developer card ----------
idx_path = PUB / "index.html"
html = idx_path.read_text(encoding="utf-8")

# 6a. Head graph office node (surgical, head-block key order: url after provider, description last)
old_desc = "Complete office relocations — workstations, files and office equipment — planned around business hours and quoted flat in writing before move day."
i = html.find('"@id": "https://theflatratemovers.com/#service-office-moving"')
if i < 0:
    fail("head office node not found")
seg_start = html.rfind('"@type": "Service"', 0, i)
seg_end = html.find("\n    }", i)
seg = html[seg_start:seg_end]
if seg.count(old_desc) != 1:
    fail("head office description anchor not exactly once in its node")
if '"url"' in seg:
    fail("head office node already carries a url — unexpected")
provider_anchor = '''      "provider": {
        "@id": "https://theflatratemovers.com/#organization"
      },
'''
if seg.count(provider_anchor) != 1:
    fail("head office provider anchor mismatch")
new_seg = seg.replace(provider_anchor, provider_anchor + f'      "url": "{HUB}",\n', 1).replace(old_desc, pkg_desc, 1)
html = html[:seg_start] + new_seg + html[seg_end:]
print("head graph: office node upgraded (url + full description), still one node")

# 6b. Office hub div: dataset markup block before the page div's closing tag (gun-safe placement: after last </section>)
div_start = html.find('<div class="page" id="page-office">')
if div_start < 0:
    fail("page-office div not found")
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
    fail("page-office div bounds not found")
div_txt = html[div_start:div_end]
if "dataset-office" in div_txt:
    fail("office div already carries a dataset block")
insert_at = div_txt.rfind("</section>")
if insert_at < 0:
    fail("office div </section> anchor missing")
block = '\n<script type="application/ld+json">\n' + datasets_txt.rstrip("\n") + "\n</script>\n"
new_div = div_txt[:insert_at + len("</section>")] + block + div_txt[insert_at + len("</section>"):]
html = html[:div_start] + new_div + html[div_end:]
print("office div: dataset markup block inserted (parse-equal to datasets-office.json)")

# 6c. Developer card: Office data card immediately after the Commercial data card
comm_anchor = '<article class="card"><h3>Commercial data</h3>'
ci = html.find(comm_anchor)
if ci < 0:
    fail("developer Commercial data card not found")
cend = html.find("</article>", ci) + len("</article>")
office_card = ('<article class="card"><h3>Office data</h3><p><a href="/datasets-office.json" target="_blank" rel="noopener">'
               '<b>datasets-office.json →</b></a> — 8 published nodes about the office moving service, from both branches, never merged: '
               '3 as Datasets (CC BY 4.0) — office types and size bands, workstation, furniture and equipment taxonomy, service areas, dispatch and quote path; '
               '2 as Service data — office move operations, building access, protection and compliance; '
               '3 as Articles — phasing models and day-one planning, commercial terms and cost drivers (flat-rate-in-writing only; domain figures labeled), buyer personas and trigger events. '
               'Hub page: <a href="/commercial-office-moving-2/">Office Moving</a> · Hub JSON: '
               '<a href="/commercial-office-moving-2.json" target="_blank" rel="noopener"><b>commercial-office-moving-2.json →</b></a>.</p></article>')
if "Office data" in html:
    fail("developer Office data card already present")
html = html[:cend] + office_card + html[cend:]
idx_path.write_text(html, encoding="utf-8")
print("developer: Office data card inserted after Commercial data card")

# ---------- 7. llms.txt: office service line + dated entry ----------
llms_path = PUB / "llms.txt"
llms = llms_path.read_text(encoding="utf-8")
comm_line_end = "Full datasets: https://theflatratemovers.com/datasets-commercial.json\n"
if llms.count(comm_line_end) != 1:
    fail("llms commercial line anchor mismatch")
office_line = ("- [Office Moving](https://theflatratemovers.com/commercial-office-moving-2/): Complete office relocations, quoted flat and agreed in writing: desks and workstations, files and records runs, and office equipment, moved in a planned, phased sequence — what leaves first, what arrives first, and where each workstation, file run and piece of equipment lands — so your team can sit down and work at the new address. Professional, shop and industrial offices are served, with full or partial packing and staging when the dates do not line up neatly. One agreed price before move day, no hourly meter running over a weekend move. Datasets D1–D8 (CC BY 4.0): office move operations; office types and size bands; workstation, furniture and equipment taxonomy; phasing models and day-one planning; commercial terms (flat-rate-in-writing only; domain figures labeled); buyer personas and trigger events; building access, protection and compliance; service areas, dispatch and quote path. Full datasets: https://theflatratemovers.com/datasets-office.json · Hub JSON: https://theflatratemovers.com/commercial-office-moving-2.json\n")
if "[Office Moving](https://theflatratemovers.com/commercial-office-moving-2/)" in llms:
    fail("llms office line already present")
llms = llms.replace(comm_line_end, comm_line_end + office_line, 1)
llms_entry = """
## Update — 2026-10-29 (office deep batch)
- Canonical #service-office-moving Service node completed in both machine graphs and the head graph (same @id, exactly one node per graph): the entity graph already held one node after the full-site redo removed the duplicate; this batch gives it the hub url and the full description, the expanded graph gains the fragment node it never had, and the head node is upgraded with hub url + Place chain + full footprint. No new page (hub + Winchester + Martinsburg branch pages exist, 3 pages carry the service); counts unchanged at 153 pages and 22 services.
- Office datasets D1–D8 published at https://theflatratemovers.com/datasets-office.json (8 nodes: 3 Datasets under CC BY 4.0, 2 Service, 3 Articles; dateModified 2026-10-29), with page-level markup on the commercial-office-moving-2 hub page and a Developer-page collection entry. Fields without a verified company term are omitted, not guessed: after-hours or weekend scheduling scope, certificate-of-insurance issuance, a dedicated move coordinator, office size scope, IT coordination beyond the IT page, confidential files handling, cubicle and systems-furniture scope, debris scope, enterprise-program scope.
- Hub per-page JSON created: https://theflatratemovers.com/commercial-office-moving-2.json (5 nodes, Place areas at the full footprint 31/35, branches distinct). Branch per-page JSONs already live for both office branch pages; unchanged in this batch.
"""
if not llms.endswith("\n"):
    llms += "\n"
llms += llms_entry.lstrip("\n") if False else "\n" + llms_entry.strip("\n") + "\n"
llms_path.write_text(llms, encoding="utf-8")
print("llms.txt: office service line added + dated entry appended")

# ---------- 8. data txt: dated entry ----------
data_path = PUB / "the-flat-rate-movers-data.txt"
dtxt = data_path.read_text(encoding="utf-8")
data_entry = """
## Update 2026-10-29 — office deep batch
- Canonical #service-office-moving Service node completed in both machine graphs and the head graph (same @id, exactly one node per graph, hub url https://theflatratemovers.com/commercial-office-moving-2/ + full description + Place chain at the full footprint). No new page; counts unchanged at 153 pages and 22 services.
- Office datasets D1–D8 published as JSON-LD at https://theflatratemovers.com/datasets-office.json (8 nodes: 3 Datasets under CC BY 4.0, 2 Service, 3 Articles; dateModified 2026-10-29), with page-level markup on the hub page and a Developer-page collection entry. Fields without a verified company term are omitted, not guessed.
- Hub per-page JSON created: https://theflatratemovers.com/commercial-office-moving-2.json (5 nodes).
"""
if "office deep batch" in dtxt:
    fail("data txt office entry already present")
if not dtxt.endswith("\n"):
    dtxt += "\n"
dtxt += "\n" + data_entry.strip("\n") + "\n"
data_path.write_text(dtxt, encoding="utf-8")
print("data txt: dated entry appended")

# ---------- 9. Rubric DB: 5 attestation rows for facts this batch newly publishes ----------
con = sqlite3.connect(DB)
canon = con.execute("SELECT COUNT(*) FROM service WHERE service_id=?", (SVC,)).fetchone()[0]
if canon != 1:
    fail(f"canonical service-office-moving rows = {canon}, expected 1")
before = con.execute("SELECT COUNT(*) FROM attestation").fetchone()[0]
if before != 63:
    fail(f"attestation rows before = {before}, expected 63")
rows = [
    ("Office Moving published scope: complete office relocations — desks and workstations, files and records runs, office equipment — moved in a planned, phased sequence; professional, shop and industrial offices served; full or partial packing and staging when the dates do not line up; one agreed price before move day, no hourly meter",
     "office-deep package schema.json + live hub page (div page-office) extract 2026-10-29", DATE,
     "https://theflatratemovers.com/commercial-office-moving-2/ ; out/pages/office-deep/schema.json"),
    ("Office demand evidence: 'corporate movers winchester va' 123 impressions at position 32.1; 'virginia flat rate office moving company' at position 1.0; 'business moving companies near me' at position 1.0; office pack 3rd for 'office moving company Winchester VA'",
     "GSC 3-month pull to 2026-10-27 + SERP check, read 2026-10-29; office-deep-datasets-2026-10-29.md sections 2/6", DATE,
     "office-deep-datasets-2026-10-29.md"),
    ("Canonical #service-office-moving node completed: exactly one node in entity graph, best graph and head graph, same @id, hub url + full description + Place chain; the entity-graph duplicate had already been collapsed by the full-site redo; the best-graph fragment node was added in this batch",
     "office-deep package merge-note section 3, reconciled to the live graphs 2026-10-29", DATE,
     "data/entity-graph.json; data/best-json-entity-graph.json; index.html head graph"),
    ("Office datasets D1-D8 published: datasets-office.json, 8 nodes (3 Dataset CC BY 4.0, 2 Service, 3 Article), page-level markup on the hub page, Developer-page entry, dateModified 2026-10-29",
     "office-deep-datasets-2026-10-29.md section 6 (D1-D8)", DATE,
     "public/datasets-office.json"),
    ("Hub per-page JSON created: commercial-office-moving-2.json, 5 nodes, Places expanded to footprint 31/35",
     "office-deep package schema.json + live graph footprint check 2026-10-29", DATE,
     "public/commercial-office-moving-2.json"),
]
con.executemany("INSERT INTO attestation (claim, source, verified, evidence) VALUES (?,?,?,?)", rows)
con.commit()
after = con.execute("SELECT COUNT(*) FROM attestation").fetchone()[0]
integ = con.execute("PRAGMA integrity_check").fetchone()[0]
counts = {t: con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
          for t in ["service", "attestation", "edge", "opening_hours", "service_area", "rubric_check"]}
con.close()
if after != 68 or integ != "ok":
    fail(f"DB after-state wrong: attestation={after}, integrity={integ}")
print(f"rubric DB: +5 attestation rows (63 -> 68); counts {counts}; integrity ok")

print("BUILD OK")
