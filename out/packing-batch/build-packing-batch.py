#!/usr/bin/env python3
"""Packing & Unpacking deep refresh deploy batch — 2026-10-29.
Reconciles the packing-deep package against CURRENT live state (post
transloading-Winchester batch): canonical #service-packing node completed in
head + entity + best (hub url added where missing — entity + head; full
478-char package description everywhere; best graph GAINS the node, 80 -> 81 —
it held zero packing fragments). The merge-note's skew premise is partially
stale: the full-site redo already replaced the skewed node's 35 flat strings
and Martinsburg url with the branch Place chain in entity + head; what
remained was url + description completion and the best-graph absence.
Martinsburg merge-time read EXECUTED: the page's "Sources & verification"
section sources service name/description, audience, branch facts, footprint,
rating, image and terms — it answers NONE of attestation questions Q1-Q8, so
all eight stay UNCLAIMED (explicit non-claims only in the datasets).
Materials gate: the only packing-service file still carrying the Q2-gated
vocabulary (dish/mirror cartons, wardrobe cartons, mattress bags) as a
company claim was packing-movers-martinsburg-wv.json; its Service node is
surgically corrected (gated clause removed, nothing added; branch identity
and the expanded LocalBusiness/Place node preserved byte-for-byte). The same
terms inside the residential / local-regional datasets blocks are prior
batches' labeled industry-reference text — out of scope, untouched.
datasets-packing.json created under the RETYPE rule (D1 Service; D2, D3, D4,
D5, D8 Dataset; D6, D7 Article = 5 Dataset / 1 Service / 2 Article).
No new page, no new service: pages 155 / services 23 / sitemap 155.
No packing prices anywhere: the cost page owns price intent and publishes
no price list; this batch adds no figures.
"""
import json, re, shutil, sqlite3, sys
from pathlib import Path

HOME = Path.home()
PUB = HOME / "workspace/the-flat-rate-movers-pages/public"
MACHINE = HOME / "workspace/the-flat-rate-machine"
FLAT = HOME / "workspace/theflatratemovers"
PKG = MACHINE / "out/pages/packing-deep"
BATCH = MACHINE / "out/packing-batch"
BACKUP = BATCH / "backup-2026-10-29"
DB = FLAT / "rubric.db"
DATE = "2026-10-29"
SVC = "https://theflatratemovers.com/#service-packing"
HUB = "https://theflatratemovers.com/packing-unpacking-services-2/"
ORG = "https://theflatratemovers.com/#organization"
LIVE_DESC = ("Full, partial and fragile-only packing and unpacking, including loading and unloading "
             "— rooms packed and labelled in sequence, fragile and high-value pieces protected, "
             "so unpacking lands in order.")

def fail(msg):
    print("FAIL:", msg); sys.exit(1)

def rep(text, old, new, n=1, scope=""):
    c = text.count(old)
    if c != n:
        fail(f"replace anchor count {c} != {n} [{scope}]: {old[:80]!r}")
    return text.replace(old, new, n)

pkg_schema = json.loads((PKG / "schema.json").read_text(encoding="utf-8"))
pkg_svc = next(n for n in pkg_schema["@graph"] if n.get("@id") == SVC)
DESC = pkg_svc["description"]
if len(DESC) != 478:
    fail(f"package description drift: {len(DESC)} chars != 478")
if pkg_svc.get("url") != HUB or pkg_svc.get("name") != "Packing and Unpacking" or pkg_svc.get("serviceType") != "Packing and Unpacking":
    fail("package canonical node fields drift")
for bad in ["$", "attest", "Spearman", "Around Town", "Bristow", "USDOT", "DESIGN 6", "subcontract"]:
    if bad in DESC:
        fail(f"package description carries forbidden content: {bad}")
if "flat quote" in DESC.lower():
    fail("package description carries bare 'flat quote'")
CANON_KEYS = ["@id", "@type", "areaServed", "description", "name", "provider", "serviceType", "url"]
CANON = {k: pkg_svc[k] for k in CANON_KEYS}

# ---------- 0. Backups + preconditions ----------
BACKUP.mkdir(parents=True, exist_ok=True)
for src, name in [
    (PUB / "index.html", "index.html"), (PUB / "ai-sitemap.json", "pub-ai-sitemap.json"),
    (PUB / "llms.txt", "pub-llms.txt"), (PUB / "the-flat-rate-movers-data.txt", "pub-data.txt"),
    (PUB / "entity-graph.json", "pub-entity-graph.json"), (PUB / "best-json-entity-graph.json", "pub-best.json"),
    (PUB / "packing-movers-martinsburg-wv.json", "pub-packing-movers-martinsburg-wv.json"),
    (MACHINE / "data/entity-graph.json", "machine-entity-graph.json"),
    (MACHINE / "data/best-json-entity-graph.json", "machine-best.json"),
    (FLAT / "entity-graph.json", "flat-entity-graph.json"), (FLAT / "best-json-entity-graph.json", "flat-best.json"),
    (DB, "rubric.db"),
]:
    dst = BACKUP / name
    if dst.exists():
        fail(f"backup already exists: {name} (a prior run may have partially applied — reconcile manually)")
    shutil.copyfile(src, dst)
print("backups written to", BACKUP)

if (PUB / "datasets-packing.json").exists():
    fail("datasets-packing.json already exists — expected creation")
if (PUB / "dataset-node.json").exists():
    fail("held dataset-node.json present in public/ — must never ship")

# graph copies byte-identical across public / machine / flat before any write
import hashlib
def sha(p):
    return hashlib.sha1(p.read_bytes()).hexdigest()
for fname in ["entity-graph.json", "best-json-entity-graph.json"]:
    hs = {sha(PUB / fname), sha(MACHINE / "data" / fname), sha(FLAT / fname)}
    if len(hs) != 1:
        fail(f"{fname} copies diverge before build: {hs}")
print("graph copies byte-identical across public/machine/flat")

def load_graph(path):
    raw = path.read_text(encoding="utf-8")
    d = json.loads(raw)
    if json.dumps(d, indent=2, ensure_ascii=False) != raw.rstrip("\n"):
        fail(f"{path.name} not byte-stable at indent 2")
    return d

def svc_nodes(d, sid=SVC):
    return [n for n in d["@graph"] if isinstance(n, dict) and n.get("@id") == sid]

eg = load_graph(PUB / "entity-graph.json")
bg = load_graph(PUB / "best-json-entity-graph.json")
if len(eg["@graph"]) != 33 or len(bg["@graph"]) != 80:
    fail(f"graph baselines wrong: entity {len(eg['@graph'])}, best {len(bg['@graph'])}")
if len(svc_nodes(eg)) != 1:
    fail("entity packing node count != 1")
if len(svc_nodes(bg)) != 0:
    fail("best packing node count != 0 (merge-note: best gains the node)")
for d, lbl in ((eg, "entity"), (bg, "best")):
    places = {n["@id"].split("#")[-1]: len(n.get("areaServed", [])) for n in d["@graph"] if n.get("@type") == "Place"}
    if places != {"winchester": 31, "martinsburg": 35}:
        fail(f"{lbl} Place footprint drift: {places}")
en = svc_nodes(eg)[0]
if "url" in en:
    fail("entity packing node unexpectedly already carries url")
if en.get("description") != LIVE_DESC:
    fail("entity packing description baseline drift (expected the 196-char redo text)")
if en.get("areaServed") != [{"@id": "https://theflatratemovers.com/#winchester"}, {"@id": "https://theflatratemovers.com/#martinsburg"}]:
    fail("entity packing areaServed is not the branch Place chain (skew premise changed — reconcile)")

# per-page Martinsburg JSON: byte-stable, gated clause present exactly once, expanded branch node
pp_raw = (PUB / "packing-movers-martinsburg-wv.json").read_text(encoding="utf-8")
pp = json.loads(pp_raw)
if json.dumps(pp, indent=2, ensure_ascii=False) != pp_raw.rstrip("\n"):
    fail("packing-movers-martinsburg-wv.json not byte-stable at indent 2")
if len(pp["@graph"]) != 5:
    fail(f"martinsburg per-page nodes {len(pp['@graph'])} != 5")
pp_svc = svc_nodes(pp)
if len(pp_svc) != 1:
    fail("martinsburg per-page Service node count != 1")
GATED_CLAUSE = " in dish and mirror cartons, with wardrobe cartons and mattress bags where they fit"
if pp_svc[0].get("description", "").count(GATED_CLAUSE) != 1:
    fail("gated materials clause not found exactly once in martinsburg Service description")
pp_branch = [n for n in pp["@graph"] if n.get("@type") == "LocalBusiness"]
if len(pp_branch) != 1 or len(pp_branch[0].get("areaServed", [])) != 35:
    fail("martinsburg expanded branch node drift (expected LocalBusiness with 35 areas)")

con = sqlite3.connect(DB)
base = {t: con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        for t in ["service", "attestation", "edge", "opening_hours", "service_area", "rubric_check"]}
if base != {"service": 32, "attestation": 107, "edge": 40, "opening_hours": 14, "service_area": 66, "rubric_check": 7}:
    fail(f"DB baseline drift: {base}")
if con.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
    fail("DB integrity not ok")
canon = con.execute("SELECT COUNT(*) FROM service WHERE service_id LIKE '%#service-%'").fetchone()[0]
if canon != 23:
    fail(f"canonical service rows {canon} != 23")
if con.execute("SELECT COUNT(*) FROM service WHERE service_id=?", (SVC,)).fetchone()[0] != 1:
    fail("canonical packing service row missing or duplicated")
con.close()

def router_audit(html, label):
    m = re.search(r"var pages=\[(.*?)\];", html, re.S)
    if not m:
        fail(f"router pages array not found [{label}]")
    arr = re.findall(r"'([^']+)'", m.group(1))
    pm = html.find("pageMeta={")
    if pm < 0:
        fail(f"pageMeta not found [{label}]")
    seg = html[pm:pm + 400000]
    k1 = re.findall(r"(?:^|,)\s*'?([a-zA-Z0-9\-]+)'?\s*:\{name:", seg, re.M)
    k2 = re.findall(r'"([a-zA-Z0-9\-]+)":\{"name":', seg)
    keys = set(k1) | set(k2)
    if len(arr) != 155 or len(set(arr)) != 155:
        fail(f"router array count drift [{label}]: {len(arr)}/{len(set(arr))}")
    if keys != set(arr):
        fail(f"router audit mismatch [{label}]: pageMeta {len(keys)} vs array {len(set(arr))}; diff {keys ^ set(arr)}")
    print(f"router audit clean [{label}]: pageMeta 155 keys == router array 155 entries, sets exactly equal")
    return set(arr)

html_current = (PUB / "index.html").read_text(encoding="utf-8")
router_audit(html_current, "pre-build live index")
print("preconditions ok: graphs 33/80 (best packing 0), footprints 31/35, martinsburg per-page expanded, DB", base)

# ---------- 1. datasets-packing.json (D1–D8 under the RETYPE rule) ----------
CREATOR = {"@id": ORG, "sameAs": [
    "https://www.instagram.com/theflatratemovers/",
    "https://www.threads.com/@theflatratemovers",
    "https://x.com/ratemovers",
    "https://www.youtube.com/@theflatratemovers",
    "https://github.com/TheFlatRateMovers",
    "https://medium.com/@ratemovers"]}
DIST = [
    {"contentUrl": "https://theflatratemovers.com/ai-sitemap.json", "encodingFormat": "application/json"},
    {"contentUrl": "https://theflatratemovers.com/service-area.geojson", "encodingFormat": "application/json"},
    {"contentUrl": "https://theflatratemovers.com/entity-graph.json", "encodingFormat": "application/ld+json"},
    {"contentUrl": "https://theflatratemovers.com/best-json-entity-graph.json", "encodingFormat": "application/ld+json"}]
SPATIAL = [{"@id": "https://theflatratemovers.com/#winchester"}, {"@id": "https://theflatratemovers.com/#martinsburg"}]

def node(slug, typ, name, desc, keywords, extra=None):
    n = {"@id": f"https://theflatratemovers.com/#dataset-packing-{slug}", "@type": typ,
         "name": name, "description": desc, "keywords": keywords,
         "about": [{"@id": SVC}], "spatialCoverage": SPATIAL,
         "temporalCoverage": "2010/2026", "dateModified": DATE,
         "creator": CREATOR, "license": "https://creativecommons.org/licenses/by/4.0/",
         "distribution": DIST, "sameAs": HUB}
    if extra:
        n.update(extra)
    return n

ORGREF = {"@id": ORG}
nodes = [
    node("levels", "Service", "Packing Service Levels",
         "Packing service levels from The Flat Rate Movers, quoted inside the one flat rate in writing before move day. Full packing: the whole home, every room, packed by the crew. Partial packing: the rooms or item classes the customer chooses. Fragile-only packing: just the fragile pieces. Unpacking and placement: boxes unpacked and items placed at destination so rooms come back together in order. The published audiences are residential, commercial, senior, and estate clients, served from Winchester, VA and Martinsburg, WV. Not published and not claimed: a standalone unpacking-only service; a pack-only service without a move; and a pack-for-storage scope. Those are industry patterns, not company offers, and they stay unpublished until the company publishes them.",
         ["packing services winchester va", "packing and unpacking services", "packing services for moving", "full packing service", "partial packing service", "unpacking services"],
         {"provider": ORGREF, "publisher": ORGREF}),
    node("materials", "Dataset", "Packing Material Classes",
         "Packing material classes, split exactly as the company's published record splits them. Published wrap standard: furniture fully covered in blue padded moving blankets and sealed with clear stretch wrap, staged cleanly in the room. Published escalation: custom wooden crates for high-value, oversized, or fragile pieces, with export pieces packed to ISPM 15. Industry reference, labeled as such and never a company supply list: small, medium, and large cartons; dish barrels and dish packs with dividers; wardrobe boxes; unprinted packing paper; bubble wrap and foam pouches; packing tape; mirror and picture cartons; TV boxes; mattress bags; corner protectors. In the company's published service copy those industry terms are absent — dish packs, wardrobe boxes, bubble wrap, and packing paper appear nowhere in it — and this dataset does not present any of them as supplied. Not published and not claimed: any material beyond blankets, stretch wrap, and custom crates as company-supplied; and whether materials are bundled into the flat rate or itemized separately.",
         ["packing materials", "moving blankets", "stretch wrap", "dish pack", "wardrobe box", "bubble wrap", "packing paper"]),
    node("room-item-classes", "Dataset", "Room and Item Classes for Scoping",
         "Room and item classes used to scope a packing job. The published method: the estimator scopes the job room by room. Room classes: kitchen, primary bedroom, secondary bedrooms, living room, dining room, home office, bathroom, garage, basement, attic. Item classes with their handling class: furniture moves in the published blanket-and-stretch-wrap class; boxed household goods pack room by room in labeled cartons; heavy smalls — books, tools, canned goods, records — belong in small boxes only; light bulky goods — linens, bedding, pillows, lampshades — belong in large boxes; hanging clothing travels on a rail. The taxonomy is scoping data; the weight and size discipline inside it is industry practice, labeled as such, and the only handling standard claimed anywhere in it is the published wrap standard.",
         ["packing estimator", "room by room packing", "packing scope", "moving box sizes"]),
    node("fragile-classes", "Dataset", "Fragile and High-Value Classes",
         "Fragile and high-value classes and how each is handled. The published anchor: fragile-only packing is a published service level, and high-value or fragile pieces escalate to white-glove handling or a custom crate, with export pieces packed to ISPM 15. The classes, ordered by breakage risk: dishes, glassware, and stemware — individually wrapped, with cell dividers as the industry technique; art, mirrors, and glass tabletops — corner protection and mirror cartons as industry technique, and custom crates for oversized or high-value pieces as the published escalation; electronics — padding and cable management, with setup photos before disassembly as industry technique; antiques and collectibles — individual assessment, cross-referenced to the piano, antique, and white-glove services and never duplicated here; lamps, lampshades, and ceramics — double-boxing for ceramics as industry technique; high-value and sentimental pieces — flagged before packing day and planned specifically. Techniques labeled industry practice are reference data, not company method claims.",
         ["fragile packing", "packing glassware", "packing artwork", "antique packing", "high-value item packing"]),
    node("process-chain", "Dataset", "Packing Process Chain",
         "The packing process chain, step by step. Step 1, scope up front: the packing level is scoped with the client and quoted inside the one flat rate — published. Step 2, quote: the Short (Quick Quote) form is the default, and the Detailed Project form switches in place, preserving From, To, and What's moving — published. Step 3, room-by-room pack: wrapped right, room by room, the way the estimator scoped it — published. Step 4, wrap standard: furniture fully covered in blue padded blankets, sealed with clear stretch wrap, staged cleanly in the room — published. Step 5, fragile escalation: high-value and fragile pieces get white-glove handling or a custom crate, and export pieces are packed to ISPM 15 — published. Step 6, labeling and inventory discipline: room and contents on every box, FRAGILE and THIS SIDE UP markings, a box-number inventory on larger moves — recorded as industry planning practice, not published company scope. Step 7, load: packed and wrapped items leave the room for loading — published. Step 8, unpack and place: at destination, unpack and place so rooms come back together in order — published. Step 9, debris handling: NOT published and not claimed — cartons and paper removed after unpacking appear nowhere in the company's published scope, and no removal service is claimed.",
         ["packing process", "how movers pack", "packing day", "unpacking and placement"]),
    node("personas", "Article", "Packing Buyer Personas & Trigger Events",
         "Packing buyer personas and trigger events — who buys packing, and what starts the conversation. The closing-driven mover: a closing date sets a hard pack deadline, and the fit is full packing. The downsizing senior or estate executor: a downsizing or an estate clearance, and the fit is full packing with unpacking and placement — the senior and estate audiences are published on the service pages. The renovation mover: rooms emptied and restored in order, and the fit is partial packing with unpacking and placement. The time-poor professional or busy household: no time to pack, wants it handled as a system, and the fit is full-service packing and unpacking — the audience is published on the full-service article. The business or office mover: packing as one phase of an office move, and the fit is partial or full packing inside the move — the commercial audience is published on the hub page. The interstate self-packer: wants to pack correctly themselves, and is served by the published guide as advice, not by a packing service level. Personas and triggers are buyer logic recorded as data; no client is named, no testimonial is quoted, and no outcome is promised.",
         ["packing services for moving", "senior packing services", "estate packing", "office packing services"],
         {"headline": "Packing Buyer Personas & Trigger Events", "author": ORGREF, "publisher": ORGREF}),
    node("terms", "Article", "Packing Commercial Terms",
         "Packing commercial terms — the complete published position, with no dollar figure anywhere in it. Packing is quoted inside the one flat rate in writing before move day: not hourly, and not a price list. The cost page states it directly: the company does not publish a packing price list, because honest packing cost depends on what is actually being packed. The published scope drivers are rooms, fragile pieces, and crates — they change the scope, and the scope sets the quote. The estimator is a scoping tool, not a price calculator: it scopes the packing room by room, and the quote follows. Industry price research — per-room and per-home packing ranges, hourly packer rates, materials costs — was reviewed for this dataset and deliberately excluded: no figure from it is a company term. Not published and not claimed: whether packing materials are bundled into the flat rate or itemized separately; and any valuation or liability difference between crew-packed and owner-packed boxes — industry practice treats them differently for breakage claims, but the company publishes no such offer, and none is invented here.",
         ["packing cost winchester va", "cost of packing services", "packing services prices"],
         {"headline": "Packing Commercial Terms", "author": ORGREF, "publisher": ORGREF}),
    node("labeling-inventory-access", "Dataset", "Labeling, Inventory & Access Discipline",
         "Labeling, inventory, and access discipline for packing — planning inputs, recorded as data and never as capability claims. Room and contents on every box, because unpacking is guesswork without it and load order follows room order. FRAGILE marking, so breakables are visible to every handler. THIS SIDE UP orientation for orientation-sensitive pieces. A box-number inventory on larger moves, so nothing is misplaced across multiple handlings — essential on long-distance and storage moves. A first-night essentials box that stays accessible at destination. Photos of electronics setups before disassembly, so reassembly matches the original setup. Access detail in the Detailed Project form — the published guide's instruction is to tell the form the truth, because access detail is what the detailed quote runs on. Two industry no-pack conventions are recorded as planning inputs only — valuables such as jewelry, cash, and papers ride with the customer, and hazardous items are not packed — and the boundary is explicit: the company publishes no no-pack list, and none is claimed here.",
         ["packing labels", "moving inventory list", "box labeling system", "first night box"]),
]
datasets_obj = {"@context": "https://schema.org", "@graph": nodes}
datasets_txt = json.dumps(datasets_obj, indent=2, ensure_ascii=False) + "\n"
from collections import Counter
split = Counter(n["@type"] for n in nodes)
if split != {"Dataset": 5, "Service": 1, "Article": 2}:
    fail(f"retype split wrong: {split}")
for n in nodes:
    if not (50 <= len(n["description"]) < 5000):
        fail(f"description length out of band: {n['@id']} {len(n['description'])}")
    if n["@type"] == "Dataset" and n["license"] != "https://creativecommons.org/licenses/by/4.0/":
        fail("Dataset license missing")
print("datasets-packing.json built: 8 nodes, split", dict(split))

# ---------- 2. Machine graphs: entity completed in place; best GAINS the canonical node ----------
def upgrade_entity_node(d):
    n = svc_nodes(d)[0]
    out = {}
    for k, v in n.items():
        out[k] = DESC if k == "description" else v
    out["url"] = HUB
    if {k: out[k] for k in CANON_KEYS} != CANON:
        fail("entity node does not equal the canonical package node after upgrade")
    d["@graph"][d["@graph"].index(n)] = out
    return out

before = [json.dumps(x, sort_keys=True) for x in eg["@graph"]]
upgrade_entity_node(eg)
after = [json.dumps(x, sort_keys=True) for x in eg["@graph"]]
if sum(1 for a, b in zip(before, after) if a != b) != 1:
    fail("entity graph: expected exactly 1 node changed")
eg_txt = json.dumps(eg, indent=2, ensure_ascii=False) + "\n"
for path in [PUB / "entity-graph.json", MACHINE / "data/entity-graph.json", FLAT / "entity-graph.json"]:
    path.write_text(eg_txt, encoding="utf-8")
print("entity graph: packing node completed in place (url added + 478-char description; Place chain kept); all 3 copies byte-identical")

canon_node = {k: CANON[k] for k in CANON_KEYS}
bg["@graph"].append(canon_node)
if len(bg["@graph"]) != 81 or len(svc_nodes(bg)) != 1:
    fail("best graph: packing node addition wrong")
if svc_nodes(bg)[0] != canon_node:
    fail("best graph: added node is not canonical")
bg_txt = json.dumps(bg, indent=2, ensure_ascii=False) + "\n"
for path in [PUB / "best-json-entity-graph.json", MACHINE / "data/best-json-entity-graph.json", FLAT / "best-json-entity-graph.json"]:
    path.write_text(bg_txt, encoding="utf-8")
print("best graph: canonical packing node ADDED (80 -> 81 nodes, first packing fragment); all 3 copies byte-identical")

# ---------- 3. Per-page Martinsburg JSON: surgical Service-node correction (gated clause out) ----------
pp_before = [json.dumps(x, sort_keys=True) for x in pp["@graph"]]
psn = pp_svc[0]
new_desc = psn["description"].replace(GATED_CLAUSE, "", 1)
if new_desc == psn["description"] or "dish" in new_desc or "wardrobe" in new_desc or "mattress" in new_desc:
    fail("martinsburg per-page surgical correction failed")
out = {}
for k, v in psn.items():
    out[k] = new_desc if k == "description" else v
if out.get("provider") != {"@id": "https://theflatratemovers.com/#martinsburg"} or out.get("url") != "https://theflatratemovers.com/packing-movers-martinsburg-wv/":
    fail("martinsburg per-page branch identity drift in swap")
pp["@graph"][pp["@graph"].index(psn)] = out
pp_after = [json.dumps(x, sort_keys=True) for x in pp["@graph"]]
if sum(1 for a, b in zip(pp_before, pp_after) if a != b) != 1:
    fail("martinsburg per-page JSON: expected exactly 1 node changed")
pp_branch_after = [n for n in pp["@graph"] if n.get("@type") == "LocalBusiness"][0]
if len(pp_branch_after.get("areaServed", [])) != 35:
    fail("martinsburg expanded branch node changed by the swap")
(PUB / "packing-movers-martinsburg-wv.json").write_text(json.dumps(pp, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("martinsburg per-page JSON: Service node surgically corrected (Q2-gated materials clause removed, nothing added); branch identity + expanded 35-area node preserved")

# ---------- 4. index.html: head graph + hub datasets block + Developer card ----------
html = (PUB / "index.html").read_text(encoding="utf-8")
mb = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
if not mb:
    fail("head ld+json block not found")
head_raw = mb.group(1)
head = json.loads(head_raw)
if json.dumps(head, indent=2, ensure_ascii=False) != head_raw.rstrip("\n"):
    fail("head graph not byte-stable at indent 2")
if len(head["@graph"]) != 25:
    fail(f"head graph nodes {len(head['@graph'])} != 25")
hpn = svc_nodes(head)
if len(hpn) != 1:
    fail("head packing node count != 1")
hn = hpn[0]
if "url" in hn:
    fail("head packing node unexpectedly already carries url")
if hn.get("description") != LIVE_DESC:
    fail("head packing description baseline drift")
hp_before = [json.dumps(x, sort_keys=True) for x in head["@graph"]]
upd = {}
for k, v in hn.items():
    upd[k] = DESC if k == "description" else v
    if k == "provider":
        upd["url"] = HUB
if {k: upd[k] for k in CANON_KEYS} != CANON:
    fail("head node does not equal the canonical package node after upgrade")
head["@graph"][head["@graph"].index(hn)] = upd
hp_after = [json.dumps(x, sort_keys=True) for x in head["@graph"]]
if sum(1 for a, b in zip(hp_before, hp_after) if a != b) != 1:
    fail("head graph: expected exactly 1 node changed")
head_new = json.dumps(head, indent=2, ensure_ascii=False)
html = html[:mb.start(1)] + head_new + html[mb.end(1):]
print("head graph: packing node completed in place (url added + 478-char description); exactly 1 of 25 nodes changed")

def div_span(doc, div_id):
    start = doc.find(f'<div class="page" id="{div_id}"')
    if start < 0:
        fail(f"div not found: {div_id}")
    nxt = doc.find('<div class="page"', start + 10)
    foot = doc.find("<footer", start)
    end = min([x for x in [nxt, foot] if x > 0])
    return start, end

s, e = div_span(html, "page-packing-unpacking-services-2")
seg = html[s:e]
if "application/ld+json" in seg or "datasets-packing" in seg:
    fail("hub div unexpectedly already carries a datasets block")
if seg.count("</section>\n</div>") != 1:
    fail("hub div tail anchor count != 1")
block = '</section>\n  <script type="application/ld+json">\n' + datasets_txt.rstrip("\n") + "\n  </script>\n</div>"
html = html[:s] + seg.replace("</section>\n</div>", block, 1) + html[e:]

s, e = div_span(html, "page-developer")
seg = html[s:e]
if "Packing data" in seg:
    fail("developer card already present")
anchor = '<b>datasets-ocean-container.json →</b></a>.</p></article>'
if seg.count(anchor) != 1:
    fail("developer after-anchor count != 1")
card = (
    '<article class="card"><h3>Packing data</h3><p>Published with the authority graphs (CC BY 4.0 where a Dataset applies): '
    'packing service levels, packing material classes, room and item classes for scoping, fragile and high-value classes, the packing process chain, '
    'packing buyer personas and trigger events, packing commercial terms, and labeling, inventory and access discipline — five Datasets, one Service data node, and two Articles. '
    'Published materials are the blanket-and-stretch-wrap standard, custom crates, and ISPM 15 export packing; industry-only materials and every unconfirmed scope question are recorded as explicit non-claims, never as company offers. '
    'No packing prices appear anywhere: the one flat rate is quoted in writing before move day. '
    'Served as one JSON-LD dataset file, embedded in the packing hub page and the authority graphs. '
    'Canonical service node: <a href="#/packing-unpacking-services-2"><b>Packing and Unpacking</b></a>. '
    'File: <a href="datasets-packing.json"><b>datasets-packing.json →</b></a>.</p></article>')
html = html[:s] + seg.replace(anchor, anchor + card, 1) + html[e:]
print("developer card 'Packing data' inserted after the Transloading — Winchester card")
(PUB / "index.html").write_text(html, encoding="utf-8")

# hub div block parse-equal to the datasets file
html = (PUB / "index.html").read_text(encoding="utf-8")
s, e = div_span(html, "page-packing-unpacking-services-2")
m2 = re.search(r'<script type="application/ld\+json">(.*?)</script>', html[s:e], re.S)
if not m2 or json.loads(m2.group(1)) != datasets_obj:
    fail("hub div datasets block is not parse-equal to datasets-packing.json")
(PUB / "datasets-packing.json").write_text(datasets_txt, encoding="utf-8")
print("hub div datasets block embedded, parse-equal to datasets-packing.json (8 nodes, 5 Dataset / 1 Service / 2 Article)")

router_audit(html, "post-build")

# ---------- 5. ai-sitemap ----------
ai = json.loads((PUB / "ai-sitemap.json").read_text(encoding="utf-8"))
if len(ai.get("services", [])) != 23 or len(ai.get("hasPart", [])) != 155:
    fail(f"ai-sitemap baseline drift: services {len(ai.get('services', []))}, hasPart {len(ai.get('hasPart', []))}")
hit = [x for x in ai["services"] if x.get("name") == "Packing and Unpacking"]
if len(hit) != 1:
    fail("ai-sitemap packing entry count != 1")
if hit[0].get("description") != "Full, partial and fragile-only packing and unpacking, including loading and unloading.":
    fail("ai-sitemap packing description baseline drift")
hit[0]["description"] = DESC
kw_before = list(ai.get("keywords", []))
if len(kw_before) != 66:
    fail(f"keyword baseline {len(kw_before)} != 66")
kw_add = []
# ai-sitemap keywords grow by the canonical SERVICE node's keyword forms only
# (the package schema's keyword set — the precedent of every prior batch:
# senior +2, warehouse +5, IT +6, transloading +6). Per-dataset keywords stay
# inside datasets-packing.json; they are not ai-sitemap keywords.
for k in nodes[0].get("keywords", []):
    kl = k.lower()
    if kl not in [x.lower() for x in kw_before] and kl not in kw_add:
        kw_add.append(kl)
ai["keywords"] = kw_before + kw_add
(PUB / "ai-sitemap.json").write_text(json.dumps(ai, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"ai-sitemap: packing description updated to canonical (86 -> 478 chars); keywords 66 -> {len(ai['keywords'])} (+{len(kw_add)}: {kw_add}); services 23, hasPart 155")

# ---------- 6. llms.txt ----------
llms = (PUB / "llms.txt").read_text(encoding="utf-8")
old_line = "- [Packing and Export Crating](https://theflatratemovers.com/): Packing, custom crates, ISPM 15 export packing, loading, transloading, final mile delivery, high-value protection"
if llms.count(old_line) != 1:
    fail("llms combined packing/export line anchor not found exactly once")
dedicated = ("- [Packing and Unpacking](https://theflatratemovers.com/packing-unpacking-services-2/): Packing and unpacking services from Winchester, VA and Martinsburg, WV — full, partial and fragile-only packing, furniture fully covered in blue padded blankets and sealed with clear stretch wrap, staged cleanly in the room, plus unpacking and placement at destination, quoted inside one flat rate in writing before move day. High-value and fragile pieces receive white-glove handling or a custom crate, and export pieces are packed to ISPM 15 when the journey crosses a border. "
             "Datasets D1–D8 published: packing service levels, packing material classes, room and item classes for scoping, fragile and high-value classes, the packing process chain, packing buyer personas and trigger events, packing commercial terms, and labeling, inventory and access discipline — 5 Datasets, 1 Service data node, and 2 Articles, CC BY 4.0 where a Dataset applies. Published wrap standard is blankets and stretch wrap with custom crates and ISPM 15 as the escalation; every other material and scope question stays an explicit non-claim. "
             "Full datasets: https://theflatratemovers.com/datasets-packing.json")
if dedicated in llms:
    fail("llms dedicated packing line already present")
llms = llms.replace(old_line, old_line + "\n" + dedicated, 1)
entry = (
    "\n\n## Update — 2026-10-29 (packing and unpacking deep refresh)\n"
    "- The packing deep research package (packing-deep) has been MERGED into the live authority data; the deep refresh touches the packing hub, the Winchester packing page, the Martinsburg packing page, and the packing cost page, which owns price intent for the category.\n"
    "- Canonical service node https://theflatratemovers.com/#service-packing is now identical across the head graph, entity-graph.json, and best-json-entity-graph.json: name \"Packing and Unpacking\", url https://theflatratemovers.com/packing-unpacking-services-2/, the 478-character package description, provider #organization, and areaServed chain to the Winchester (31) and Martinsburg (35) Place nodes. The entity and head graphs held the branch chain already but no url and a thin 196-character description; best-json-entity-graph.json held no packing node at all and gains the canonical node (80 → 81 nodes).\n"
    "- Datasets D1–D8 published as https://theflatratemovers.com/datasets-packing.json (8 nodes under the retype rule: D1 Service — packing service levels; D2 Dataset — packing material classes; D3 Dataset — room and item classes for scoping; D4 Dataset — fragile and high-value classes; D5 Dataset — packing process chain; D6 Article — packing buyer personas and trigger events; D7 Article — packing commercial terms; D8 Dataset — labeling, inventory and access discipline). Dataset nodes carry CC BY 4.0, temporalCoverage 2010/2026, dateModified 2026-10-29; the identical @graph is embedded in the packing hub page and linked from the Developer page (\"Packing data\").\n"
    "- Materials gate honored: the Martinsburg packing page's \"Sources & verification\" section was read at merge time and compared against open questions Q1–Q8 (debris removal, materials beyond blankets and stretch wrap, pack-only service, pack timing, packing for storage, crew-packed valuation, no-pack list, unpacking depth). It sources the service name and description, audience, branch facts, service footprint, rating, image, and terms — and answers none of the eight. All eight therefore stay UNCLAIMED: they appear in the datasets only as explicit non-claims, and no material or scope claim is published from industry sources alone. Published materials remain blankets, stretch wrap, custom crates, and ISPM 15 export packing.\n"
    "- Per-page correction: packing-movers-martinsburg-wv.json's Service node previously described fragile-only packing as using dish and mirror cartons, wardrobe cartons, and mattress bags — vocabulary no published answer supports. The gated clause was surgically removed (nothing added); the branch identity and the expanded Martinsburg branch node were preserved byte-for-byte. Packing prices are not invented anywhere: the cost page owns price intent and publishes no price list, and none was added.\n"
    "- ai-sitemap.json: the Packing and Unpacking service entry carries the canonical description; keywords grew with the package forms (none dropped). Counts unchanged: pages 155, services 23, sitemap 155. Router audit (pageMeta keys == router pages array) clean before and after the build.")
if "## Update — 2026-10-29 (packing and unpacking deep refresh)" in llms:
    fail("llms packing entry already present")
llms += entry
(PUB / "llms.txt").write_text(llms, encoding="utf-8")
print("llms.txt: dedicated Packing and Unpacking line inserted (the combined Packing and Export Crating line untouched) + dated packing refresh entry appended; history byte-identical")

# ---------- 7. data txt ----------
data = (PUB / "the-flat-rate-movers-data.txt").read_text(encoding="utf-8")
dentry = (
    "\n## Update 2026-10-29 — packing and unpacking deep refresh\n"
    "Merged the packing-deep research package into the live authority data. Canonical node https://theflatratemovers.com/#service-packing (\"Packing and Unpacking\", url https://theflatratemovers.com/packing-unpacking-services-2/) is now identical in the head graph, entity-graph.json, and best-json-entity-graph.json, with the 478-character package description and the areaServed chain to the Winchester (31 areas) and Martinsburg (35 areas) Place nodes; the best graph gains the node (80 -> 81). "
    "New public dataset file datasets-packing.json: 8 nodes — D1 packing service levels (Service), D2 packing material classes (Dataset), D3 room and item classes for scoping (Dataset), D4 fragile and high-value classes (Dataset), D5 packing process chain (Dataset), D6 packing buyer personas and trigger events (Article), D7 packing commercial terms (Article), D8 labeling, inventory and access discipline (Dataset); Dataset nodes CC BY 4.0, dateModified 2026-10-29; the same @graph is embedded in the packing hub page and linked from the Developer page. "
    "Materials gate: the Martinsburg page's Sources & verification section was read at merge time; it confirms service name and description, audience, branch facts, footprint, rating, image, and terms, and answers none of open questions Q1-Q8 (debris removal; materials beyond blankets and stretch wrap; pack-only service; pack timing; packing for storage; crew-packed valuation; no-pack list; unpacking depth) — all eight stay unclaimed and appear in the datasets only as explicit non-claims. Published materials: blue padded blankets, clear stretch wrap, custom crates, ISPM 15 export packing. "
    "One surgical correction: packing-movers-martinsburg-wv.json's Service description lost its dish/mirror-carton, wardrobe-carton, and mattress-bag clause (vocabulary no source supports); its branch node is unchanged. No packing prices anywhere — the cost page owns price intent and publishes no price list. Counts unchanged: pages 155, services 23, sitemap URLs 155.")
if "## Update 2026-10-29 — packing and unpacking deep refresh" in data:
    fail("data txt packing entry already present")
data += "\n" + dentry + "\n"
(PUB / "the-flat-rate-movers-data.txt").write_text(data, encoding="utf-8")
print("data txt: dated packing refresh entry appended; history byte-identical")

# ---------- 8. Rubric DB (in place) ----------
# REAL schema (verified against the live DB and rows 105-108 of prior batches):
# service(service_id, name, url, description, provider_id);
# attestation(claim, source, verified, evidence). The graph/DB columns assumed
# by the package-era script draft do not exist in this DB.
con = sqlite3.connect(DB)
cur = con.execute("UPDATE service SET description=? WHERE service_id=?", (DESC, SVC))
if cur.rowcount != 1:
    fail("DB service description update rowcount != 1")
claims = [
    ("Packing canonical node completed: #service-packing upgraded in place in the head graph and the entity graph — exactly one node per graph — gaining the hub url https://theflatratemovers.com/packing-unpacking-services-2/ and the full 478-character package description; best-json-entity-graph.json held no packing node at all and gains the canonical node (80 -> 81 nodes); areaServed chain to #winchester / #martinsburg at the full footprint 31/35 unchanged. The live entity and head nodes already carried the branch Place chain from the full-site redo, so the package merge-note's Martinsburg skew premise was partially stale: the remaining work was url + description completion and the best-graph addition, not a footprint repair.",
     "Packing deep package 2026-10-29 (schema.json, merge-note.md)",
     "public/index.html (head graph); public/entity-graph.json; public/best-json-entity-graph.json"),
    ("Packing datasets D1-D8 published: datasets-packing.json, 8 nodes under the retype rule (D1 Service — packing service levels; D2, D3, D4, D5, D8 Dataset CC BY 4.0 — material classes, room and item classes, fragile and high-value classes, process chain, labeling/inventory/access; D6, D7 Article — personas, commercial terms), the identical @graph embedded in the packing hub page, a Packing data card on the Developer page, dateModified 2026-10-29. The materials gate was honored end to end: published materials are only blue padded blankets, clear stretch wrap, custom crates, and ISPM 15 export packing; industry materials (dish packs, wardrobe boxes, bubble wrap, packing paper and the rest) appear only labeled as industry reference or inside explicit non-claims, never as company supplies; pack-only service, pack-for-storage scope, unpacking-only service, debris removal, unpacking depth, crew-packed valuation, and the no-pack list likewise stay explicit non-claims. No packing prices appear anywhere in the batch — the cost page owns price intent and publishes no price list.",
     "packing-deep-datasets-2026-10-29.md section 6 (D1-D8)",
     "public/datasets-packing.json"),
    ("Packing per-page correction: packing-movers-martinsburg-wv.json's Service node description previously asserted dish and mirror cartons, wardrobe cartons, and mattress bags for fragile-only packing — vocabulary gated on package question Q2 with no published answer. The clause was surgically removed and nothing added; the per-page node's branch identity (provider #martinsburg, url the Martinsburg packing page) and the expanded Martinsburg LocalBusiness node (35 areas) were preserved byte-for-byte; exactly one node changed in the file.",
     "Packing deep package merge-note + live-state comparison 2026-10-29",
     "public/packing-movers-martinsburg-wv.json"),
    ("Packing merge-time read executed: the Martinsburg packing page's Sources & verification section sources the service name and description (head graph, 2026-10-28), audience, both branch facts (GBP), the service footprint, the 4.7/6 rating, the logo image, the flat-rate terms and tagline, and the page slug. Compared against the package's open questions Q1-Q8 it answers none of them, so debris removal, materials beyond blankets and stretch wrap, pack-only service, pack timing, packing for storage, crew-packed valuation, the no-pack list, and unpacking depth all remain unclaimed; R7 stays 2 and the package's open questions carry forward unchanged; the cost-page FAQ treatment (package Phase E) stays gated on those same answers.",
     "packing-movers-martinsburg-wv Sources & verification + packing-deep package open questions Q1-Q8",
     "public/index.html (page-packing-movers-martinsburg-wv); packing-deep package dataset-status.md"),
]
for claim, src, ev in claims:
    con.execute("INSERT INTO attestation (claim, source, verified, evidence) VALUES (?,?,?,?)",
                (claim, src, "2026-10-29", ev))
con.commit()
counts = {t: con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
          for t in ["service", "attestation", "edge", "opening_hours", "service_area", "rubric_check"]}
if counts != {"service": 32, "attestation": 111, "edge": 40, "opening_hours": 14, "service_area": 66, "rubric_check": 7}:
    fail(f"DB post counts wrong: {counts}")
if con.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
    fail("DB integrity failed post-write")
con.close()
print("DB: service row description set to canonical; attestation 107 -> 111 (+4); all other counts unchanged; integrity ok")

# ---------- 9. Forbidden scans ----------
new_blocks = datasets_txt + card + dedicated + entry + dentry + json.dumps(claims)
for bad in ["attest", "$", "Spearman", "Around Town", "DESIGN 6", "Bristow", "subcontract", "crew page"]:
    if bad in new_blocks:
        fail(f"forbidden content in new blocks: {bad}")
if "flat quote" in new_blocks.lower():
    fail("bare 'flat quote' in new blocks")
for pat in [r"USDOT", r"\bMC[- ]?\d{4,}", r"\b\d{6,7}\s*(USDOT|MC)\b"]:
    if re.search(pat, new_blocks):
        fail(f"authority-number pattern in new blocks: {pat}")
html_new = (PUB / "index.html").read_text(encoding="utf-8")
for probe in ["attest", "USDOT", "Spearman", "Around Town", "DESIGN 6", "Bristow", "subcontract"]:
    a, b = html_current.lower().count(probe.lower()), html_new.lower().count(probe.lower())
    if a != b:
        fail(f"index-wide delta for {probe}: {a} -> {b}")
print("forbidden scans: new blocks clean; index-wide deltas all zero")
print("BUILD COMPLETE — packing batch applied locally (not yet deployed)")
