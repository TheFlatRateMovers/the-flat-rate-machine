#!/usr/bin/env python3
"""Sign the completed AI master index as a compact JWS (EdDSA / Ed25519).

The payload is the RFC 8785 (JCS) canonicalization of the index JSON, so
the signature binds the index's CONTENT, not any one serialization of it.
The private key is read ONLY from the custody path. Output: header.payload.
signature (base64url, no padding), payload segment embedded so the proof
is self-contained; verifiers must ALSO re-canonicalize the published index
and byte-compare (see verify-provenance.py), which binds the JWS to the
exact index the estate serves.
"""
import argparse
import base64
import json
import os
import sys

import jcs
from cryptography.hazmat.primitives import serialization

PEM_PATH = os.path.expanduser("~/workspace/theflatratemovers/keys/ed25519-signing-key.pem")
KID = "theflatratemovers-2026-10-29-1"


def b64u(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--index", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    with open(args.index, "rb") as f:
        index = json.loads(f.read().decode("utf-8"))
    canonical = jcs.canonicalize(index)

    with open(PEM_PATH, "rb") as f:
        key = serialization.load_pem_private_key(f.read(), password=None)

    header = {"alg": "EdDSA", "kid": KID, "typ": "JWS"}
    header_b64 = b64u(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = b64u(canonical)
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    signature = key.sign(signing_input)
    jws = f"{header_b64}.{payload_b64}.{b64u(signature)}"
    with open(args.out, "w") as f:
        f.write(jws + "\n")
    print(f"signed: kid={KID} canonical_bytes={len(canonical)} jws_chars={len(jws)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
