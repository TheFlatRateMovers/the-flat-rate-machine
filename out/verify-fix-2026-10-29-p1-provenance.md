# verify.js changes — Batch P1 provenance layer, 2026-10-29

Batch P1 (provenance & signing layer, ordered by Henry 2026-10-29) changed
verify.js in the same motion as the feature shipped. Two kinds of change,
both recorded here per the standing precedent (checks change only with the
state they assert, never silently, never weakened).

## 1. NEW section — "11. Provenance — signing layer" (checks P-1..P-4)

Spec: out/batchP1-provenance/notes/verify-gate-spec.md. Suite 71 -> 75.

- P-1  Well-known key document live: GET
  https://theflatratemovers.com/.well-known/signing-keys.json returns
  200 + application/json, parses, and carries a keys[] entry with kid
  "theflatratemovers-2026-10-29-1", kty OKP, crv Ed25519, alg EdDSA,
  use sig, and a 32-byte x. WHY: the whole layer anchors on this file;
  if it 404s or drifts, every downstream proof is void.
- P-2  Index signature verifies against the published key: the served
  ai-master-index.jws payload must byte-equal the RFC 8785 (JCS)
  canonicalization of the served ai-master-index.json, and the Ed25519
  signature must verify with the P-1 key (matched by kid). Implemented
  natively in Node (node:crypto Ed25519 + JWK import + a compact JCS
  canonicalizer); the byte-compare against the signed payload makes any
  canonicalization drift fail loudly rather than pass silently — at
  deploy time the Node canonical form reproduced the Python jcs output
  exactly (16,600 bytes), cross-proving the two implementations on the
  real artifact. WHY: proves the served index is the signed index —
  origin + integrity.
- P-3  Digest integrity, all site-served distributions: every index
  entry whose contentUrl is on theflatratemovers.com (30 at ship time:
  25 datasets + ai-sitemap + both graphs + GeoJSON + llms.txt) is
  fetched and its SHA-256 + byteSize recomputed and asserted against
  the entry's digest. Repo-served entries (5, raw.githubusercontent)
  are covered at push time by the GitHub read-back md5 discipline —
  asserting them here would burn the rate-limited unauthenticated API
  path. WHY: a digest that no longer matches means a file changed
  without a re-sign — the silent-drift failure this layer exists to
  catch.
- P-4  Index completeness invariant: every distribution entry in the
  served index must carry name, contentUrl, encodingFormat, license,
  dateModified, and digest {algorithm "SHA-256", value <64 hex>,
  byteSize <int>}. WHY: Henry's standing law — every element full with
  the proper data — enforced mechanically so no future batch can add a
  half-filled entry.

## 2. REWRITTEN assertion — section 10 ai-sitemap keywords check

Old assertion: staged ai-sitemap keywords.length === services count
(23) AND every service name present.

New assertion: keywords.length >= services count AND every service name
present (detail string updated; count contribution unchanged: 1 check).

Why — the documented exception, same shape as the Batch 3 ocean-era
rewrite recorded in out/verify-fix-2026-10-29.md: the check was not
weakened to force a pass; an approved batch changed the intended state.
Henry's 48-state all-AI-surfaces audit fold-in, shipped inside Batch P1,
adds exactly one approved non-service-name keyword — "specialized
workforce labor 48 contiguous states deployment coverage" — to every
ai-sitemap.json copy, the phase-a staged copy included. Exact-length
equality with the service count therefore no longer expresses the
check's intent. The check's named assertion (keywords COVER all service
names) is unchanged and still enforced; the length term is now a floor.
If a future batch removes a service name from the keywords, this check
still fails.
