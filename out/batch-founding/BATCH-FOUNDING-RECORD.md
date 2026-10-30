# Batch FOUNDING — foundingDate 2010-06 estate-wide (2026-10-30)

Owner order 2026-10-30: "we have been in business since june 2010 and i
dont see that data anywhere that you made, google has that data baked
into everything." Fix: "foundingDate": "2010-06" (month precision, no
day ever) on every full Organization / MovingCompany / LocalBusiness
node representing The Flat Rate Movers LLC or a branch that lacked it.
No other fields changed anywhere. Full pre-edit inventory:
out/batch-founding/GAP-LIST.md (sweep of the site tree, index.html
embeds, all 103 ai-repo JSON blobs at HEAD, machine canonical files).

## Nodes fixed: 428
- Site datasets: 12 files x 8 creator Organization stubs = 96
  (crating, final-mile, government, industrial-commercial,
  industrial-offices, ispm15, military, ocean-container, piano-antique,
  residential, route81, transloading).
- index.html: 21 dataset embeds (168 stubs; 19 byte-spliced + blocks
  27/29 parse-spliced — those two embeds are not byte-copies of their
  files) + head-graph branch nodes #winchester/#martinsburg = 170.
  Proof of confinement: everything outside ld+json blocks is
  byte-identical to the pre-batch shell (quote form untouched);
  exactly 22 of 38 ld+json blocks changed; node --check clean.
- Site per-page JSONs: 32 branch LocalBusiness nodes in 30 files.
- Site ai-master-index.json: creator + @graph[0] Organization = 2.
- AI repo: data/datasets mirrors 96 (byte-synced to the edited site
  files), schemas/ 26 branch nodes in 24 files, answer-engine.json,
  authority-index.jsonld, identity/root-entity.jsonld,
  protocols/protocol-relationships.jsonld = 4, index pair = 2.

## Edit mechanics
Parse-edit-dump only where a byte-exact round-trip format was proven
per file (differ asserted the sole change = added foundingDate keys).
Three files defeated round-trip and got scoped text insertions with
the same differ assertion: packing-services-winchester-va.json (mixed
\u00b7 escaping), answer-engine.json, authority-index.jsonld.

## Mirror divergence found + corrected by the lockstep sync
The ai-repo dataset mirrors were stale: 11 of 12 still carried
pre-Bristow-flip GBP counts ("16 GBP + 16 extended", "31 published
areas") in @graph[7] descriptions (route81: +1 Bristow source field).
Syncing the mirrors to the live site bytes corrected those fields to
the already-live truth (17 + 15, 32 areas). No new facts introduced;
full enumeration in out/batch-founding/mirror-divergence.json.

## Dispositioned, not edited (see GAP-LIST.md sections G-H)
- 13 datasets reference the org via untyped stubs (106 {@id, sameAs}
  creators + 128 {@id} refs) — referenced-only, no node fabricated;
  they resolve to the canonical #organization node, which carries
  the date.
- endpoint-definition.jsonld provider = {@type, @id} ref only.
- ai-catalog.json (both) and .well-known/ard.json: no Organization
  node exists — nothing fabricated.
- ai-repo data/entity-graph.json (gist-lineage): its Organization
  node lacks the date but the file is NEVER overwritten (standing
  rule); blob SHA re-confirmed unchanged after all pushes:
  cda897e61319a0f52172ef1365402e4d7179cddf.
- GBP untouched (both profiles already show a June 2010 opening
  date — verified separately by the parent).

## Seal (widened P2 rule)
Repo files pushed FIRST (machine shell copy, then ai datasets/schemas/
org files), repo-dir assembled from the 16 sealed repo files fetched
at the new HEADs, digest-index.py re-run: 202 distributions, 0 gaps.
Set-diff assertion: EXACTLY 45 digests changed (12 datasets + 30 page
JSONs + site shell + answer-engine + authority-index); zero non-digest
entry changes; the only non-distribution diffs are the index's own 2
foundingDate additions. Re-signed from the custody key only
(kid theflatratemovers-2026-10-29-1; canonical 87,283 B); pre-push
key-material grep over all push paths = 0.

## Deploy + verification
- Pages deploy https://6ba3c909.the-flat-rate-movers.pages.dev —
  wrangler reported "Uploaded 45 files", matching the set-diff.
- verify.js full run: 83/83 PASS — VERIFY OK (router 156 included).
- Public-only provenance over live-fetched bytes: JWS signature
  VERIFIED; payload == canonical(index), 87,283 B; 202 match /
  0 mismatch / 0 unresolved — PROVENANCE OK.
- Live proof samples: datasets-route81/ocean-container/military/
  residential serve foundingDate x8 each; commercial-movers-
  winchester-va.json x2 (org + branch); interstate-70-corridor.json
  x3; served home HTML carries 174 occurrences; ai raw at HEAD:
  answer-engine x1, authority-index x1, root-entity x1,
  data/datasets-ispm15 x8, schemas/military-movers-winchester-va x2.
- Post-edit sweep: ZERO remaining gap nodes on the site; ai-repo
  remainder = the dispositioned gist node + endpoint ref only.

## Repo HEADs
- machine: 22137cf0789a -> c7abb1717150 (shell re-sync); records push
  follows this file.
- ai: 1fb37c288748 -> 2305d136f5fb (datasets + schemas) ->
  cf69080a034a (org files) -> dd730cc6e37a (resealed index pair).
  Index-pair read-backs at HEAD match the staged bytes.
