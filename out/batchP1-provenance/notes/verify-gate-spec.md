# VERIFY.JS — PROVENANCE GATE (check-update spec for the P1 deploy batch)

Status: SPEC ONLY. Not applied in the staged build. At deploy, these checks are
ADDED to verify.js in the same motion as the feature ships, with this reasoning
recorded beside them (standing precedent: checks change only with the state
they assert, never silently, never weakened).

New section: "Provenance — signing layer" (4 checks)

P-1  Well-known key document live.
     GET https://theflatratemovers.com/.well-known/signing-keys.json must
     return 200 + application/json, parse as JSON, contain keys[] with an
     entry whose kid == "theflatratemovers-2026-10-29-1", kty "OKP",
     crv "Ed25519", alg "EdDSA", use "sig", and a 32-byte x.
     WHY: the whole layer is anchored on this file; if it 404s or drifts,
     every downstream proof is void and the batch must know immediately.

P-2  Index signature verifies against the published key.
     Fetch https://theflatratemovers.com/ai-master-index.jws and
     https://theflatratemovers.com/ai-master-index.json; canonicalize the
     index per RFC 8785; assert the JWS payload byte-equals the canonical
     form; verify the Ed25519 signature over header.payload using the key
     from P-1's document (matched by kid). Implementation: a small Node
     helper using node:crypto Ed25519 (built-in) + a JCS canonicalizer
     (the estate already vendors JSON tooling in verify.js's style; if no
     JCS lib is vendored at deploy time, shell to the staged
     tools/verify-provenance.py, whose round trip is proven in this batch).
     WHY: proves the served index is the signed index — origin + integrity.

P-3  Digest integrity sample (all site-served distributions).
     For every distribution entry whose contentUrl is on
     theflatratemovers.com: fetch the bytes, recompute SHA-256 + byteSize,
     assert equality with the entry's digest object. (At spec time: 30
     entries — 25 datasets + ai-sitemap + both graphs + GeoJSON + llms.txt.)
     Repo-served entries (5) are covered at push time by the GitHub
     read-back md5 discipline instead — asserting them over raw URLs in
     verify.js would burn the rate-limited unauthenticated API path.
     WHY: a digest that no longer matches means the file changed without a
     re-sign — exactly the silent-drift failure this layer exists to catch.

P-4  Index completeness invariant.
     Every distribution entry in the served index must carry: name,
     contentUrl, encodingFormat, license, dateModified, and digest
     {algorithm:"SHA-256", value:<64 hex>, byteSize:<int>}. Any missing
     field fails the suite.
     WHY: Henry's standing law — every element full with the proper data —
     enforced mechanically so no future batch can add a half-filled entry.

Gate placement: P-1..P-4 run in the live-checks section (they assert served
state). Expected suite count after deploy: 71 -> 75 checks, all passing.
Failure of any P-check post-deploy = the signing layer is down; treat like
a failed batch gate (fix forward, never waive).
