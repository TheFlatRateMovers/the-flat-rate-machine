# BATCH P1 — PROVENANCE & SIGNING LAYER (STAGED, NOT DEPLOYED)

Ordered by Henry 2026-10-29 ("do it build it, but make sure that every
element is full with the proper data"). Design settled from sourced research
(Web Bot Auth / A2A pattern): the company publishes its Ed25519 verification
key on its own domain, every AI master index distribution carries a SHA-256
digest of the real served bytes, and the index itself is signed (JWS, EdDSA,
RFC 8785 canonical payload). Staged root:
~/workspace/the-flat-rate-machine/out/batchP1-provenance/
NO deploy, NO live edits, NO GitHub pushes in this pass. The ONLY write
outside the staged root is the private key at its custody path.

## Key facts (issued values)
- kid: theflatratemovers-2026-10-29-1
- Public key x (base64url): nIWKjzVpVYHFWj0Y-afgANg_EOvGGKexcjDeWWiVx9Q
- SHA-256 fingerprint of public key (base64url): k_HfnSkokedjQMSjLj-X8ftw40CUr92dBgecXsP14y4
- Private key: stored at the keys path, 0600, dir 0700, outside all repos
  (git rev-parse fails there — proven at build). Never in any push path.

## Staged inventory
| File | Deploy target | Action |
|---|---|---|
| site/.well-known/signing-keys.json | Site public/.well-known/signing-keys.json; mirror ai repo root signing-keys.json | NEW. JWKS + issuer metadata (all fields real). |
| data/ai-master-index.completed.json | Site public/ai-master-index.json; ai repo data/ai-master-index.json; machine copies per layout | REPLACES index at deploy — REGENERATED at deploy time (step 1), this file is the worked template/proof. |
| data/ai-master-index.jws | Site public/ai-master-index.jws; ai repo data/ai-master-index.jws | NEW — REGENERATED at deploy (step 2). |
| data/ai-master-index.head.json | (internal) | The HEAD index the audit ran against (ai 89f1688f). |
| data/completeness-audit.json | (internal) | Per-entry sources for every filled field + digests. |
| data/repo-files/* (5 files) | (internal) | The ai-repo files fetched at HEAD as digest sources for the 5 raw.githubusercontent entries. |
| tools/keygen.py | machine repo tools (with this batch's records) | Refuses overwrite; custody rules in header. |
| tools/build-jwks.py | machine repo tools | Derives JWKS from the custody key (public half only). |
| tools/digest-index.py | machine repo tools | Deterministic completeness + digest regeneration. |
| tools/sign-index.py | machine repo tools | Reads key ONLY from custody path. |
| tools/verify-provenance.py | machine repo tools | Public-artifacts-only verification. |
| notes/verify-gate-spec.md | verify.js at deploy (checks P-1..P-4 added) | Spec only this pass. |
| notes/surface-additions.md | llms.txt, data txt, Developer card at deploy | Staged text, real values. |
| notes/section8-limits.md | (record) | Limits, custody, rotation, loss. |

Tooling deps (proven at build): python3.12 venv with cryptography 50.0.2
and jcs (RFC 8785) — recreate with `python3 -m venv venv && pip install
cryptography jcs` wherever the tools run at deploy; the staged venv under
tools/venv is path-bound to this machine and is NOT a push artifact.

## ⚠ DEPLOY-TIME RECOMPUTE — mandatory, read first
The staged completed index + JWS were computed over the bytes live at build
time. Batch 7c (workforce page) changes datasets-industrial-commercial.json
(2 sameAs appends) and llms.txt (its additions) before P1 deploys, so the
digests for those entries — and therefore the signature — MUST be recomputed
on the final post-7c files immediately before signing. The tools are
deterministic; the deploy runs them fresh. The staged artifacts prove the
pipeline end-to-end; they are not the deploy bytes.

## Deploy order (after Batch 7c is live + verified)
1. Re-fetch the 5 ai-repo files at the then-HEAD; re-run digest-index.py
   against the then-live public/ -> completed index (audit must show
   35/35 complete, 0 gaps; a gap stops the batch).
2. Run sign-index.py -> ai-master-index.jws.
3. Run verify-provenance.py (local, public artifacts) — must print
   PROVENANCE OK before anything deploys.
4. Back up live index copies, llms.txt, data txt, index.html (Developer card).
5. Site: place public/.well-known/signing-keys.json, public/ai-master-index.json,
   public/ai-master-index.jws; apply the txt additions; insert the Developer
   card before "On-page structured data". DEPLOY-CHECK: confirm the Pages
   build actually uploads + serves the .well-known path (200 +
   application/json). If the asset pipeline skips dot-directories, fallback =
   serve the identical bytes via a Pages Function route at the same URL —
   the URL and bytes are the contract, not the mechanism.
6. Deploy Pages (only from ~/workspace/the-flat-rate-movers-pages, connector
   token, never printed).
7. GitHub in the same motion (binding layout): ai repo — data/ai-master-index.json
   (completed), data/ai-master-index.jws (new), root signing-keys.json mirror,
   root llms.txt + data txt if changed; machine repo — completed index copies
   per its layout + the tools/* + this batch record. PRE-PUSH GATE: grep every
   push path for "PRIVATE KEY" and for the PEM filename — both must be 0; the
   custody path is never a push source. NEVER touch the gist-based
   data/entity-graph.json (SHA cda897e61319a0f52172ef1365402e4d7179cddf).
   Chunk pushes if a card stalls; verify HEADs + gist SHA after.
8. Apply the verify.js additions (notes/verify-gate-spec.md, P-1..P-4) in the
   same motion; record the reasoning beside the checks; push verify.js to the
   machine repo; suite must read 75/75 against live.
9. Live verification (independent): fresh fetches of ONLY public URLs —
   key document, index, JWS, and 3 sampled packs — run verify-provenance.py
   against the fetched copies; all four checks pass. Plus: sitemap count
   unchanged (156 post-7c), router/pages unchanged (this batch adds no page),
   quote-form segment byte-identical (Developer card insert re-checked),
   node --check on edited inline scripts.

## Gate list (deploy)
- Audit regeneration: 35/35 entries complete, gaps = 0, sources recorded.
- Local round trip PROVENANCE OK pre-deploy AND post-deploy (public fetches).
- No "PRIVATE KEY" / PEM filename in any push path (grep = 0).
- Gist blob SHA unchanged; HEADs verified by read-back.
- verify.js 75/75 with P-1..P-4 active.
- Forbidden sweep on shipped text: no "attested" wording in publishable
  surfaces, no USDOT, no invented values — the only new numbers anywhere are
  digests, byte sizes, and the fingerprint, all computed from real bytes.

## Indexing / announcement
No GSC requests (machine files, not pages). Announcement surfaces ARE the
llms.txt + data txt dated entries and the Developer card (step 5/7). The
next GSC pass needs no addition for P1.
