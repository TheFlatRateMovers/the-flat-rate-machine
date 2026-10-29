#!/usr/bin/env python3
"""Gun-safe cleanup batch 2026-10-29: remove 3 working-note leaks from
datasets-gun-safe.json (+ mirrored hub markup block in index.html) and add
the missing url to the head graph #service-residential node.
Scope is exactly the four fixes in the batch brief; nothing else changes."""
import json, re, pathlib, sys

PUB = pathlib.Path.home() / "workspace/the-flat-rate-movers-pages/public"
DS = PUB / "datasets-gun-safe.json"
IDX = PUB / "index.html"

raw = DS.read_text(encoding="utf-8")
old_parsed = json.loads(raw)

def sub_once(text, old, new, count=1):
    n = text.count(old)
    assert n == count, f"expected {count} occurrence(s), found {n}: {old[:80]!r}"
    return text.replace(old, new)

# --- Fix 1: dispatch node, remove internal refresh sentence ---
raw = sub_once(
    raw,
    " This node refresh fixes the prior Martinsburg skew: both branches carry equal weight in the refreshed node.",
    "",
)

# --- Fix 2: Winchester node name (+ Article headline mirror) and description ---
raw = sub_once(
    raw,
    "Gun Safe Service Detail: Winchester Page Parity Approved",
    "Gun Safe Service Detail: Winchester Branch Coverage",
    count=2,  # "name" and Article "headline"
)
raw = sub_once(
    raw,
    "Winchester branch page depth matches Martinsburg depth in this batch as a branch-page update, distinct from the hub update. Winchester page today is 442 words; Martinsburg page is 1,083 words. The update mirrors Martinsburg depth elements with Winchester-only facts:",
    "Winchester branch gun safe coverage matches Martinsburg depth, with Winchester-only facts:",
)
raw = sub_once(raw, " No Martinsburg fact is copied onto the Winchester page.", "")

# --- Fix 3: classes node name only (description verified clean, unchanged) ---
raw = sub_once(
    raw,
    "Gun Safe Service Detail: Standard Safe Classes, Ambiguity Flagged",
    "Gun Safe Service Detail: Standard Safe Classes",
)

new_parsed = json.loads(raw)
assert new_parsed["@graph"] and len(new_parsed["@graph"]) == 18

# Prove only intended fields changed across all 18 nodes
TARGETS = {
    "https://theflatratemovers.com/#dataset-gun-safe-dispatch": {"description"},
    "https://theflatratemovers.com/#dataset-gun-safe-service-winchester": {"name", "headline", "description"},
    "https://theflatratemovers.com/#dataset-gun-safe-service-classes": {"name"},
}
old_by_id = {n["@id"]: n for n in old_parsed["@graph"]}
for n in new_parsed["@graph"]:
    o = old_by_id[n["@id"]]
    assert set(o.keys()) == set(n.keys()), f"key set changed on {n['@id']}"
    for k in n:
        if o[k] != n[k]:
            assert n["@id"] in TARGETS and k in TARGETS[n["@id"]], \
                f"UNINTENDED change {n['@id']} field {k}"
print("datasets-gun-safe.json: intended-field diff check OK")
DS.write_text(raw, encoding="utf-8")

# --- index.html: dataset block mirror + head residential url ---
html = IDX.read_text(encoding="utf-8")
blocks = list(re.finditer(r'<script type="application/ld\+json">(.*?)</script>', html, re.S))
ds_block = next(b for b in blocks if "#dataset-gun-safe-dispatch" in b.group(1))
old_file_text = pathlib.Path(
    pathlib.Path.home() / "workspace/the-flat-rate-machine/out/gun-safe-cleanup-backup-2026-10-29/datasets-gun-safe.json"
).read_text(encoding="utf-8")
assert ds_block.group(1) == old_file_text.rstrip("\n"), "pre-edit block != backup file"
new_block = raw.rstrip("\n")
html = html[: ds_block.start(1)] + new_block + html[ds_block.end(1):]
assert json.loads(new_block) == json.loads(raw), "block not parse-equal to file"

# Fix 4: head #service-residential url (placed after provider, matching siblings)
OLD = '''      "@id": "https://theflatratemovers.com/#service-residential",
      "name": "Residential Moving",
      "serviceType": "Residential Moving",
      "provider": {
        "@id": "https://theflatratemovers.com/#organization"
      },
      "areaServed": ['''
NEW = '''      "@id": "https://theflatratemovers.com/#service-residential",
      "name": "Residential Moving",
      "serviceType": "Residential Moving",
      "provider": {
        "@id": "https://theflatratemovers.com/#organization"
      },
      "url": "https://theflatratemovers.com/residential-moving/",
      "areaServed": ['''
html = sub_once(html, OLD, NEW)
IDX.write_text(html, encoding="utf-8")

# Post-edit checks
head = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S).group(1))
res = next(n for n in head["@graph"] if n.get("@id", "").endswith("#service-residential"))
assert res["url"] == "https://theflatratemovers.com/residential-moving/", res.get("url")
assert len(head["@graph"]) == 24
for s in ["Martinsburg skew", "442 words", "1,083 words", "Parity Approved", "Ambiguity Flagged"]:
    assert s not in raw and s not in html, f"forbidden string remains: {s}"
print("index.html: head url set, block mirrored, forbidden strings zero")
print("ALL EDITS APPLIED")
