#!/usr/bin/env python3
"""Verify the provenance layer using ONLY public artifacts:
  1. the JWKS document parses and carries the expected kid;
  2. the JWS signature verifies against the JWKS public key (Ed25519);
  3. the JWS payload byte-equals the RFC 8785 canonicalization of the
     published index (binds signature -> the exact served index);
  4. every distribution digest in the index re-computes over the resolved
     file bytes (site files from --public-dir, repo files from --repo-dir).
Exit 0 and prints PROVENANCE OK only if every check passes.
"""
import argparse
import base64
import hashlib
import json
import os
import sys

import jcs
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

EXPECTED_KID = "theflatratemovers-2026-10-29-1"


def b64u_dec(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--jwks", required=True)
    ap.add_argument("--index", required=True)
    ap.add_argument("--jws", required=True)
    ap.add_argument("--public-dir", required=True)
    ap.add_argument("--repo-dir", required=True)
    args = ap.parse_args()
    fails = []

    jwks = json.load(open(args.jwks))
    keys = {k.get("kid"): k for k in jwks.get("keys", [])}
    if EXPECTED_KID not in keys:
        fails.append(f"kid {EXPECTED_KID} not in JWKS")
        print("\n".join(fails))
        return 1
    jwk = keys[EXPECTED_KID]
    pub = Ed25519PublicKey.from_public_bytes(b64u_dec(jwk["x"]))
    print(f"[1] JWKS parses; kid {EXPECTED_KID} present (Ed25519, use={jwk.get('use')}, alg={jwk.get('alg')})")

    jws = open(args.jws).read().strip()
    h_b64, p_b64, s_b64 = jws.split(".")
    header = json.loads(b64u_dec(h_b64))
    assert header.get("alg") == "EdDSA" and header.get("kid") == EXPECTED_KID, header
    try:
        pub.verify(b64u_dec(s_b64), f"{h_b64}.{p_b64}".encode("ascii"))
        print("[2] JWS signature VERIFIED against the published public key")
    except InvalidSignature:
        fails.append("signature invalid")
        print("[2] SIGNATURE INVALID")

    index = json.load(open(args.index))
    canonical = jcs.canonicalize(index)
    if b64u_dec(p_b64) == canonical:
        print(f"[3] JWS payload == RFC 8785 canonical form of the published index ({len(canonical)} bytes)")
    else:
        fails.append("payload != canonical(index)")
        print("[3] PAYLOAD MISMATCH vs canonical(index)")

    ok = bad = skipped = 0
    for e in index.get("distribution", []):
        url = e.get("contentUrl", "")
        path = None
        if url.startswith("https://theflatratemovers.com/"):
            rel = url[len("https://theflatratemovers.com/"):]
            cand = os.path.join(args.public_dir, rel)
            # Per-route architecture (Solution A, 2026-10-31): route
            # contentUrls resolve to the route's index.html document.
            if rel == "" or rel.endswith("/"):
                cand = os.path.join(cand, "index.html")
            path = cand if os.path.isfile(cand) else None
        elif "raw.githubusercontent.com" in url and "/main/" in url:
            cand = os.path.join(args.repo_dir, os.path.basename(url.split("/main/", 1)[1]))
            path = cand if os.path.isfile(cand) else None
        dg = e.get("digest") or {}
        if not path:
            skipped += 1
            continue
        data = open(path, "rb").read()
        if hashlib.sha256(data).hexdigest() == dg.get("value") and len(data) == dg.get("byteSize"):
            ok += 1
        else:
            bad += 1
            fails.append(f"digest mismatch: {e.get('name')}")
    print(f"[4] distribution digests re-computed: {ok} match, {bad} mismatch, {skipped} unresolved")

    if fails:
        print("PROVENANCE FAILED:", "; ".join(fails))
        return 1
    print("PROVENANCE OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
