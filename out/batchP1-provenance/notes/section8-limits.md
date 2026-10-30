# §8 — LIMITS, CUSTODY, ROTATION (Batch P1, stated plainly)

## What the signature proves — and what it does not
- PROVES: the index (and, through its digests, every listed pack) originated
  from the holder of the company's Ed25519 private key and has not been
  altered since signing. Origin + integrity, full stop.
- DOES NOT: make any AI system, search engine, or partner REQUIRED to check
  it. Verification is voluntary on the consumer's side — the same honest
  limit the certificate research established for the whole field. The layer
  makes proof AVAILABLE to any machine that asks; it cannot compel asking.
- DOES NOT: certify that the CONTENT of a pack is true. It certifies the
  pack is the company's own unaltered publication. Truth of content remains
  governed by the estate's evidence discipline (rubric attestations).

## Custody (as built)
- Private key: ONE file, ~/workspace/theflatratemovers/keys/
  ed25519-signing-key.pem — directory 0700, file 0600, unencrypted PKCS#8
  (signing at deploy time is an agent operation; a passphrase would have to
  live somewhere equally sensitive, so filesystem custody is the control).
- Verified at build: `git rev-parse` FAILS from the keys directory and from
  ~/workspace/theflatratemovers — the key sits outside every git repository.
- The key is never copied into any repo, staged root, report, or log. Deploy
  gates include a pre-push grep for "PRIVATE KEY" across all push paths = 0.

## Rotation (planned, standard)
1. Generate a new keypair (new kid, e.g. ...-2) with tools/keygen.py after
   retiring the old PEM by operator action (the script refuses overwrite).
2. Publish BOTH public keys in the JWKS during the overlap: old signatures
   in circulation stay verifiable.
3. Re-run digest + sign with the new kid; deploy; dated note in llms.txt /
   data txt announcing the new kid + fingerprint.
4. Remove the old kid from the JWKS only after the overlap window, with a
   dated note — removing a kid IS the revocation act in this pattern
   (the CRL-equivalent for a self-published JWKS).

## Compromise
- Suspected exposure of the private key: treat as rotation, immediately,
  plus a dated public note that signatures under the old kid after the
  compromise date must not be relied on. Anything signed by an attacker
  during exposure is indistinguishable from genuine until the note lands —
  that residual risk is inherent to every signing system and is stated here
  rather than hidden.

## Loss
- If the private key is LOST (not compromised): old signatures become
  permanently unverifiable as "current" — they still verify mathematically
  against the published public key while it stays up, but no NEW signature
  can ever be produced under that kid. Recovery = new keypair, new kid,
  re-sign everything, dated note disclosing the loss and the kid change.
  The public key document must keep the lost key's public half published
  (marked superseded in the dated notes) so historical verification of
  pre-loss signatures remains possible.

## §8 gaps from the completeness audit
- NONE. All 35 distribution entries were completed from real sources
  (license 35/35 — 24 from the files' own Dataset nodes, 11 from the
  index's own top-level license; dateModified 35/35 — 28 from the files
  themselves, 7 from the index's stamp; digests 35/35 over real bytes).
- Observation only (not a gap, not fixed in this batch): the index entry
  named "Entity Graph — Full (33 nodes)" carries a stale node count in its
  NAME (the graph is 92 nodes post-Batch 7). Renaming is a content edit
  outside this batch's mandate; flagged for a future index hygiene pass.
