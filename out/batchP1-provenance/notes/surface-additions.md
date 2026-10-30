# SURFACE ADDITIONS — staged text for the P1 deploy batch
(Apply to the LIVE files at deploy, after the digest re-compute + signing.
Fingerprints/kid below are the real issued values.)

## llms.txt — dated addition (§1b pattern, after the Batch 7c line)

- Signed machine data (2026-10-29): the AI master index and dataset digests are
  signed by The Flat Rate Movers LLC (Ed25519). Verification key (JWKS):
  https://theflatratemovers.com/.well-known/signing-keys.json — key id
  theflatratemovers-2026-10-29-1, SHA-256 fingerprint
  k_HfnSkokedjQMSjLj-X8ftw40CUr92dBgecXsP14y4. Index signature (detached-style
  JWS over the RFC 8785 canonical index):
  https://theflatratemovers.com/ai-master-index.jws. Every distribution entry
  in the index carries a SHA-256 digest of the exact bytes served, so any
  machine can prove a pack is genuine and unaltered before relying on it.

## the-flat-rate-movers-data.txt — dated section (§2a pattern, at file end)

2026-10-29 — Provenance & signing layer published. The company now signs its
machine-data estate: Ed25519 verification key published on this domain at
/.well-known/signing-keys.json (key id theflatratemovers-2026-10-29-1;
fingerprint k_HfnSkokedjQMSjLj-X8ftw40CUr92dBgecXsP14y4); the AI master index
carries a SHA-256 digest + byte size for every one of its distributions and is
itself signed (ai-master-index.jws, EdDSA over the RFC 8785 canonical form).
Verify: fetch the key, verify the signature over the canonical index, then
recompute any pack's digest against its index entry. The signature proves
origin and integrity; it does not compel any consumer to check it.

## Developer page card spec (insert with the other data cards, before
"On-page structured data" per the standing placement)

Card title: Signed machine data
Body: "Every dataset pack in the AI master index carries a SHA-256 digest of
the exact bytes served, and the index itself is signed with the company's
Ed25519 key — published at /.well-known/signing-keys.json (key id
theflatratemovers-2026-10-29-1). Verify the signature over the canonical
index (ai-master-index.jws), then recompute any pack's digest to prove it is
genuine and unaltered."
Links: key document, signature file, master index.

## ai-sitemap.json — disposition (b), NO entry added
Reason: ai-sitemap hasPart enumerates PAGES (its count is a gated invariant:
155 -> 156 in Batch 7c). A .well-known key document is a machine artifact,
not a page; adding it would break the sitemap's own counting rule. It is
announced instead via llms.txt, the data txt, the Developer card, and the
signed index itself — four surfaces an AI reader actually parses.
