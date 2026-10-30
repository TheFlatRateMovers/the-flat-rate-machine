# verify.js changes — Batch P2 (certificate extension) + Bristow GBP flip, 2026-10-30

Two changes, both in the standing pattern: gates are fixed or extended,
never waived; a check that encodes a superseded premise is rewritten
stricter, with the reason recorded here.

## 1. Winchester service-area count check rewritten (premise superseded)

Before: `Winchester service area has 16 entries` (locations.json
serviceArea.length === 16).

Why it changed: the 16 was the Google Business Profile service-area list as
supplied by the owner on 2026-10-27. On 2026-10-30 Google PUBLISHED the
owner's Bristow service-area edit on the Winchester profile (verified
read-only in GBP Manager 2026-10-30 ~05:07 EDT: 17 PUBLISHED areas,
"Bristow, VA, USA" listed first, no pending notice). locations.json now
records the true 17-entry GBP list, so the old check failed against correct
data (baseline run 2026-10-30: 80/81, sole failure this check).

After (stricter): length === 17 AND the list includes 'Bristow'. The
Martinsburg check (14) is unchanged and still passes. The total footprint
did not change (Winchester 32 areas = GBP 17 + extended 15; GeoJSON 53).

## 2. Provenance section extended: P-5 (coverage) and P-6 (repo digests)

Batch P2 (owner directive 2026-10-30: "each page, each signal that we send,
each set of codes or scripts, html, jsons, should carry the powerful
certificate tool") extends the signed ai-master-index from 35 to 202
distributions: the 35 data distributions, all 156 per-page JSONs, the site
shell (build artifact), and the deployed code sets (Pages functions, quote
Worker source, verify.js, and the Machine tools).

- P-5 asserts the SERVED index carries a distribution for every one of the
  156 per-page JSON files (filename set derived from the deployed public/
  listing minus the 30 known non-page JSONs — the Batch 8a derivation),
  plus the 11 shell/code contentUrls, and that the distribution total is
  exactly 202.
- P-6 re-computes the digest of EVERY repo-served distribution
  (raw.githubusercontent.com) against live bytes. P-3 already covered
  site-served entries; P1 had left repo entries to push-time read-back —
  P-6 strengthens the gate to live verification now that the code sets'
  canonical copies live in this repo.

Sequencing (per the P1 / Batch 9 precedent): the suite was run pre-deploy
with the new checks in place — 82/83, the sole failure being P-5, which
asserts the new served state by design (35 distributions live at that
moment). The FINAL post-deploy run is the gate and must be fully green.

## Note on the shell distribution

A direct /index.html fetch returns an empty body on this estate and the
Pages middleware rewrites heads per URL, so no served URL returns the shell
bytes. The shell is therefore sealed as a build-artifact distribution whose
contentUrl is its canonical copy in this repository
(code/site-shell/index.html) — the exact deploy-source bytes — and the
index entry says so. Per-URL served HTML is generated from that shell by
the sealed middleware + head-data chain, which are themselves
distributions in the index.
