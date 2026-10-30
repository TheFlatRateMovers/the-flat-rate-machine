# BATCH P1 — PROVENANCE & SIGNING LAYER — DEPLOY REPORT (2026-10-29)

Deployed under standing authorization (test/check -> deploy -> GitHub in
one motion) from the staged build at out/batchP1-provenance/ (MANIFEST.md
governed). Pages deployment 21264a3a (7 files uploaded).

## Sequence as executed
1. Re-digest + re-sign on FINAL post-7c bytes: the 5 ai-repo digest
   sources were re-fetched at HEAD a0833784 (all 5 byte-identical to the
   staged snapshots — Batch 7c had not touched them); digest-index.py
   re-ran against the current index + edited public/ -> 35/35 entries
   complete, 0 gaps; sign-index.py re-signed (kid
   theflatratemovers-2026-10-29-1, canonical 16,600 bytes). Private key
   read only from its custody path by the tools; never copied or printed.
2. Index name fix (c-correction, BEFORE signing): distribution entry
   "Entity Graph — Full (33 nodes)" -> "Entity Graph — Full (92 nodes)".
   Count verified from the live best graph file itself:
   https://theflatratemovers.com/best-json-entity-graph.json carries a
   92-node @graph. (Noted for the record: the entry's contentUrl target,
   /entity-graph.json, is the separate 33-node gist-lineage graph; the
   name now carries the estate's full-graph count per the batch order.)
3. Surface additions (notes/surface-additions.md, verbatim): dated
   "Signed machine data (2026-10-29)" bullet appended to llms.txt after
   the Batch 7c entry; dated provenance section appended to
   the-flat-rate-movers-data.txt; Developer-page "Signed machine data"
   card inserted with the other data cards, immediately before
   "On-page structured data". node --check passes on both executable
   inline scripts; quote-form segment md5 unchanged
   (4d8d49f05b22b129eac623a41370d9cb).
4. Audit fold-ins (Henry's 48-state all-AI-surfaces audit, verbatim):
   (a) llms.txt Industrial & Commercial Services line — sentence appended
   in BOTH the public copy (line 36) and the phase-a staged copy (its
   line 36); (b) data txt workforce line added immediately after the
   "Service footprint (52 areas)..." paragraph; (c) ai-sitemap.json —
   IC service description appended + keyword "specialized workforce
   labor 48 contiguous states deployment coverage" added + top
   description "155 clean canonical URLs" -> 156 (sitemap.xml verified
   at 156 locs first), applied to BOTH the public and phase-a copies.
   Copy note: the phase-a copies are condensed variants by design (not
   byte-identical documents — pre-existing estate state); every edit was
   applied to every copy where the target passage exists, in the same
   motion, per the binding layout rules.
5. Placements: site public/.well-known/signing-keys.json (NEW),
   public/ai-master-index.json (completed), public/ai-master-index.jws
   (NEW); ai repo data/ai-master-index.json + data/ai-master-index.jws +
   root signing-keys.json mirror + root llms.txt / ai-sitemap.json /
   the-flat-rate-movers-data.txt; machine repo tools/ (5 tools, NO venv),
   verify.js, out/phase-a copies, this record set. The machine repo held
   NO ai-master-index copy at HEAD (verified via the connector) — no
   machine index placement existed to update (disposition b).
6. verify.js gate: P-1..P-4 added (new section 11) + ONE rewritten
   assertion (section 10 keywords coverage: length equality -> floor,
   coverage assertion unchanged) — reasoning in
   out/verify-fix-2026-10-29-p1-provenance.md. Final suite: 75/75 PASS
   against live (P-3: 30/30 site-served digests match live bytes).
7. .well-known serving: https://theflatratemovers.com/.well-known/
   signing-keys.json = 200 + application/json with the expected kid on
   the FIRST check — the Pages Function fallback was NOT needed.
8. Pre-push key gate: PEM block headers (-----BEGIN) = 0 across all push
   paths; private-key base64 body (overlapping-fragment scan) = 0 hits;
   the custody PEM file is in no push path. The custody filename appears
   only as the PEM_PATH pointer inside the three tool scripts and in the
   section-8 custody record — path references, not key material.
9. Independent public-only verification: verify-provenance.py run
   against ONLY live-fetched artifacts (key doc, index, JWS, all 30
   site-served packs fetched fresh from theflatratemovers.com, 5 repo
   files from raw.githubusercontent at the new HEAD) -> PROVENANCE OK,
   35/35 digests match the LIVE served bytes.
10. Regression sweep: pages 156, sitemap 156, services 23, datasets 25,
    best graph 92, rubric 190 (untouched), per-page JSONs 82/156
    (unchanged — P1 adds no page), router set equality intact (verify.js
    sitemap/registry checks green), quote-form md5 identical, forbidden
    sweep clean (the only Spearman/Around Town string in the machine
    push is verify.js's own pre-existing banned-wording detector regex),
    gist data/entity-graph.json blob SHA re-confirmed
    cda897e61319a0f52172ef1365402e4d7179cddf.

## HEADs
- ai: a0833784dcdf520b5d5dc8f77971db379cc637fc -> dab9447fdfb453ff27d798271ebafb6ec8dcd4e8
- machine: 540b4184f3c594403ff7b5edd3c5ef73e18d279d -> (this push; read back at deploy)
