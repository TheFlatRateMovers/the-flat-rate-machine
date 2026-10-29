#!/usr/bin/env python3
"""IT Relocation deep refresh batch — 2026-10-29.
Refresh (no new page/service): canonical #service-it-relocation node completed
(url added where missing; live entity/best description carried everywhere),
datasets-it.json D1-D8 under the retype rule, per-page JSON Service node swap,
ai-sitemap refresh + keywords, llms/data-txt refresh + dated entries, Developer card.
"""
import json, pathlib, re, sqlite3, shutil, sys

HOME = pathlib.Path.home()
PUB = HOME/"workspace/the-flat-rate-movers-pages/public"
STG = HOME/"workspace/theflatratemovers"
MAC = HOME/"workspace/the-flat-rate-machine/data"
DATE = "2026-10-29"
HUB = "https://theflatratemovers.com/it-equipment-moving-data-center-logistics-services-virginia/"
FRAG = "https://theflatratemovers.com/#service-it-relocation"
# Canonical description = the LIVE entity/best graph text (kept per standing rule;
# the staged package schema carries a longer variant that was NOT adopted).
DESC = ("IT equipment and data center logistics from The Flat Rate Movers: servers, racks, workstations, and network equipment "
        "moved in a planned, labelled sequence so systems come back up in order, as part of commercial and office relocations "
        "across the Shenandoah Valley and Eastern Panhandle. Commercial moves are planned around the operation: what moves first, "
        "what moves last, and what must be working on day one. Flat rate quoted in writing before move day. Heavy racks and cabinets "
        "in the 1,500\u20133,500 lb band are surveyed under SIR/KIM-GS with an L/360 floor check, like any high-mass asset.")
print("canonical description chars:", len(DESC))

def load(p): return json.loads(pathlib.Path(p).read_text())
def save(p, d): pathlib.Path(p).write_text(json.dumps(d, indent=2, ensure_ascii=False)+"\n")

CANON = {"@id": FRAG, "@type": "Service",
         "areaServed": [{"@id": "https://theflatratemovers.com/#winchester"}, {"@id": "https://theflatratemovers.com/#martinsburg"}],
         "description": DESC, "name": "IT Relocation & Setup",
         "provider": {"@id": "https://theflatratemovers.com/#organization"},
         "serviceType": "IT Relocation & Setup", "url": HUB}

# ---------- 1. entity graphs (public + staging + machine data): add url, assert desc ----------
for base in [PUB, STG, MAC]:
    p = base/"entity-graph.json"
    d = load(p)
    its = [n for n in d["@graph"] if n.get("@id") == FRAG]
    assert len(its) == 1, (p, len(its))
    n = its[0]
    assert n["description"] == DESC, "entity description mismatch vs canonical"
    n["url"] = HUB
    save(p, d)
    print("entity-graph updated:", p)
# best graphs: assert already canonical, no write
for base in [PUB, STG, MAC]:
    d = load(base/"best-json-entity-graph.json")
    its = [n for n in d["@graph"] if n.get("@id") == FRAG]
    assert len(its) == 1 and its[0] == CANON, ("best not canonical", base)
    print("best graph already canonical (verified, untouched):", base)

# ---------- 2. per-page JSON: replace ONLY the Service node ----------
p = PUB/"it-equipment-moving-data-center-logistics-services-virginia.json"
d = load(p)
before_places = [json.dumps(n, sort_keys=True) for n in d["@graph"] if n.get("@type") == "Place"]
assert len(before_places) == 2
for i, n in enumerate(d["@graph"]):
    if n.get("@id") == FRAG:
        assert n["@type"] == "Service"
        d["@graph"][i] = dict(CANON)
after_places = [json.dumps(n, sort_keys=True) for n in d["@graph"] if n.get("@type") == "Place"]
assert before_places == after_places, "Place nodes changed!"
save(p, d)
print("per-page JSON Service node replaced; Place nodes preserved")

# ---------- 3. ai-sitemap: description refresh + keyword additions ----------
p = PUB/"ai-sitemap.json"
d = load(p)
svc = [s for s in d["services"] if s.get("name") == "IT Relocation & Setup"]
assert len(svc) == 1
svc[0]["description"] = DESC
NEWKW = ["IT equipment moving", "IT relocation winchester va", "data center logistics virginia",
         "server rack movers", "office IT relocation", "IT equipment moving setup Winchester VA"]
for k in NEWKW:
    assert k not in d["keywords"], k
    d["keywords"].append(k)
save(p, d)
print("ai-sitemap: IT description refreshed; keywords", len(d["keywords"])-len(NEWKW), "->", len(d["keywords"]))

# ---------- 4. index.html: head node, in-div datasets block, Developer card ----------
hp = PUB/"index.html"
html = hp.read_text()
# 4a head graph block 0
m = next(re.finditer(r'<script type="application/ld\+json">(.*?)</script>', html, re.S))
blk = m.group(1)
d = json.loads(blk)
its = [n for n in d["@graph"] if n.get("@id") == FRAG]
assert len(its) == 1
n = its[0]
# head-style ordered canonical node
head_node = {"@type": "Service", "@id": FRAG, "name": "IT Relocation & Setup",
             "serviceType": "IT Relocation & Setup",
             "provider": {"@id": "https://theflatratemovers.com/#organization"},
             "url": HUB,
             "areaServed": [{"@id": "https://theflatratemovers.com/#winchester"}, {"@id": "https://theflatratemovers.com/#martinsburg"}],
             "description": DESC}
idx = d["@graph"].index(n)
d["@graph"][idx] = head_node
newblk = json.dumps(d, indent=2, ensure_ascii=False)
assert blk == json.dumps(json.loads(blk), indent=2, ensure_ascii=False), "head block roundtrip drift"
html = html[:m.start(1)] + newblk + html[m.end(1):]
print("head graph IT node upgraded in place (url + canonical description)")
# 4b in-div datasets block on the IT page (parse-equal to datasets-it.json)
datasets_text = (PUB/"datasets-it.json").read_text().rstrip("\n")
anchor = "</div>\n\n<!-- ================= BATCH 4: docs ================= -->"
assert html.count(anchor) == 1
# confirm the div right before the anchor is the IT page div
pre = html[:html.find(anchor)]
assert 'id="page-it-equipment-moving-data-center-logistics-services-virginia"' in pre[pre.rfind('<div class="page"'):]
insert = "  <script type=\"application/ld+json\">\n" + datasets_text + "\n</script>\n" + anchor
html = html.replace(anchor, insert, 1)
print("in-div datasets block inserted on IT page")
# 4c Developer card (single occurrence)
wcard_end = '<a href="/warehouse-relocation.json" target="_blank" rel="noopener"><b>warehouse-relocation.json →</b></a>.</p></article>'
assert html.count(wcard_end) == 1
itcard = ('<article class="card"><h3>IT data</h3><p><a href="/datasets-it.json" target="_blank" rel="noopener"><b>datasets-it.json →</b></a> '
 '— 8 published nodes about the IT relocation service, from both branches, never merged: 4 as Datasets (CC BY 4.0) — equipment &amp; site operations, '
 'equipment &amp; workstream taxonomy, dispatch network &amp; corridor chain, service areas, dispatch &amp; quote path; 2 as Service data — IT relocation operations, '
 'protection, handling &amp; building compliance; 2 as Articles — commercial terms &amp; cost drivers (flat-rate-in-writing only; domain figures labeled), '
 'buyer personas &amp; trigger events. Hub page: <a href="/it-equipment-moving-data-center-logistics-services-virginia/">IT Equipment Moving &amp; Data Center Logistics — Virginia</a> '
 '· Hub JSON: <a href="/it-equipment-moving-data-center-logistics-services-virginia.json" target="_blank" rel="noopener"><b>it-equipment-moving-data-center-logistics-services-virginia.json →</b></a>.</p></article>')
html = html.replace(wcard_end, wcard_end + itcard, 1)
print("Developer IT data card added")
hp.write_text(html)

# ---------- 5. llms.txt: refresh service line in place + dated entry ----------
lp = PUB/"llms.txt"
llms = lp.read_text()
old_line = "- [IT Relocation & Setup](https://theflatratemovers.com/it-equipment-moving-data-center-logistics-services-virginia/): IT equipment and data center logistics from The Flat Rate Movers: servers, racks, workstations, and network equipment moved in a planned, labelled sequence so systems come back up in order, as part of commercial and office relocations across the Shenandoah Valley and Eastern Panhandle. Flat rate quoted in writing before move day."
assert llms.count(old_line) == 1
new_line = ("- [IT Relocation & Setup](https://theflatratemovers.com/it-equipment-moving-data-center-logistics-services-virginia/): " + DESC +
 " Datasets D1–D8 (CC BY 4.0): IT relocation operations; equipment & site operations; equipment & workstream taxonomy; dispatch network & corridor chain; "
 "commercial terms & cost drivers (flat-rate-in-writing only; domain figures labeled); buyer personas & trigger events; protection, handling & building compliance; "
 "service areas, dispatch & quote path. Full datasets: https://theflatratemovers.com/datasets-it.json · Hub JSON: https://theflatratemovers.com/it-equipment-moving-data-center-logistics-services-virginia.json")
llms = llms.replace(old_line, new_line, 1)
llms_entry = """
## Update — 2026-10-29 (IT relocation deep refresh)
- IT Relocation node completed in both machine graphs and the head graph (same @id #service-it-relocation, exactly one node per graph): hub url added where missing (entity graph and head graph; the expanded graph already carried it) and the full description carried everywhere; Place chain at the full footprint (Winchester 31 areas, Martinsburg 35) unchanged; counts unchanged at 155 pages and 23 services. The live IT page copy is unchanged — it holds position 1 for 'IT equipment moving setup Winchester VA' on its existing content.
- IT Relocation datasets D1–D8 published at https://theflatratemovers.com/datasets-it.json (8 nodes: 4 Datasets under CC BY 4.0, 2 Service, 2 Articles; dateModified 2026-10-29), with page-level markup on the IT page and a Developer-page collection entry. Per-page JSON refreshed to the same canonical node with its expanded branch footprints preserved: https://theflatratemovers.com/it-equipment-moving-data-center-logistics-services-virginia.json
- Gated IT facts stay unpublished and are named in the datasets as explicit non-claims: no named system, platform or vendor; no certification or clearance; no named data-center facility; no IT-specific price, service-level or downtime commitment; disconnect and reconnect scope is not assigned to either side; no backup, rollback or close-out scope; no branch-specific IT dispatch; no sub-band rack handling claim.
"""
assert "IT relocation deep refresh" not in llms
llms = llms.rstrip("\n") + "\n" + llms_entry
lp.write_text(llms)
print("llms.txt refreshed + dated entry appended")

# ---------- 6. data txt: dated entry appended ----------
dp = PUB/"the-flat-rate-movers-data.txt"
dtxt = dp.read_text()
dtxt_entry = """
## Update 2026-10-29 — IT relocation deep refresh
- Canonical #service-it-relocation Service node completed in both machine graphs and the head graph (one node per graph, hub url https://theflatratemovers.com/it-equipment-moving-data-center-logistics-services-virginia/ added where missing, full description, Place chain at the full footprint 31/35, branches distinct). No new page; counts unchanged (155 pages, 23 services).
- IT Relocation datasets D1–D8 published as JSON-LD at https://theflatratemovers.com/datasets-it.json (8 nodes: 4 Datasets under CC BY 4.0, 2 Service, 2 Articles; dateModified 2026-10-29), with page-level markup on the IT page and a Developer-page collection entry. Per-page JSON: https://theflatratemovers.com/it-equipment-moving-data-center-logistics-services-virginia.json (Service node replaced with the canonical node, expanded branch footprints preserved).
- Company terms in the datasets: the flat rate quoted in writing before move day is the only pricing term; every industry figure and practice in the datasets is labeled domain education, never a company price or commitment. Gated items (named systems or platforms, certifications or clearances, named facilities, SLA or downtime commitment, disconnect/reconnect scope, backup/rollback scope, branch-specific IT dispatch, sub-band rack handling) are named as unpublished, not claimed.
"""
assert "IT relocation deep refresh" not in dtxt
dtxt = dtxt.rstrip("\n") + "\n" + dtxt_entry
dp.write_text(dtxt)
print("data txt dated entry appended")

# ---------- 7. rubric DB: backup, service description, +3 attestations ----------
dbp = STG/"rubric.db"
bak = STG/"rubric.db.backup-2026-10-29-it-batch"
if not bak.exists(): shutil.copy2(dbp, bak)
c = sqlite3.connect(dbp)
assert c.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
cur = c.execute("SELECT description FROM service WHERE service_id=?", (FRAG,)).fetchall()
assert len(cur) == 1
c.execute("UPDATE service SET description=? WHERE service_id=?", (DESC, FRAG))
rows = [
 ("Canonical #service-it-relocation node completed: exactly one node in entity graph, best graph and head graph, same @id, hub url https://theflatratemovers.com/it-equipment-moving-data-center-logistics-services-virginia/ added where missing (entity graph and head graph; the best graph already carried it) and the full %d-character description carried everywhere; Place chain to #winchester / #martinsburg at the full footprint 31/35 unchanged" % len(DESC),
  "IT Relocation deep package 2026-10-29 (schema.json, merge-note.md), reconciled to the live graphs 2026-10-29", DATE, "public/entity-graph.json + public/best-json-entity-graph.json + public/index.html head graph"),
 ("IT Relocation datasets D1-D8 published: datasets-it.json, 8 nodes (4 Dataset CC BY 4.0, 2 Service, 2 Article), page-level markup on the IT page, Developer-page collection entry, dateModified 2026-10-29; gated IT facts (named systems/platforms, certifications/clearances, named facilities, IT pricing/SLA/downtime commitment, disconnect/reconnect scope, backup/rollback scope, branch-specific IT dispatch, sub-band rack handling) remain unpublished and unclaimed, named in the datasets as explicit non-claims",
  "it-deep-datasets-2026-10-29.md section 6 (D1-D8)", DATE, "public/datasets-it.json"),
 ("IT Relocation demand evidence: the IT page holds position 1 for 'IT equipment moving setup Winchester VA' in search results checked 2026-10-29; no standalone IT query row appears in the GSC 3-month pull to 2026-10-27 (stated openly — no GSC figure invented for IT); six package keyword forms added to the ai-sitemap keyword list in this batch (54 -> 60, none dropped)",
  "SERP check 2026-10-29; GSC 3-month pull to 2026-10-27, read 2026-10-29; it-deep-datasets-2026-10-29.md sections 2/6", DATE, "public/ai-sitemap.json"),
]
for r in rows:
    assert c.execute("SELECT COUNT(*) FROM attestation WHERE claim=?", (r[0],)).fetchone()[0] == 0
    c.execute("INSERT INTO attestation (claim, source, verified, evidence) VALUES (?,?,?,?)", r)
c.commit()
print("DB: service description updated; attestation count now", c.execute("SELECT COUNT(*) FROM attestation").fetchone()[0])
print("DB integrity:", c.execute("PRAGMA integrity_check").fetchone()[0])
c.close()
print("BUILD OK")
