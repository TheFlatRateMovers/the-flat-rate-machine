#!/usr/bin/env python3
"""Generate the Flat Rate Movers Ed25519 signing keypair.

Custody model: the private key is written ONLY to
~/workspace/theflatratemovers/keys/ed25519-signing-key.pem (dir 0700, file 0600),
outside every git repository. This script prints ONLY public material
(public key x, kid, SHA-256 fingerprint). It refuses to overwrite an
existing key: rotation means a NEW kid via a new run after the old key
file is retired by the operator, never a silent replace.
"""
import base64
import hashlib
import json
import os
import sys

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization

KEYS_DIR = os.path.expanduser("~/workspace/theflatratemovers/keys")
PEM_PATH = os.path.join(KEYS_DIR, "ed25519-signing-key.pem")
KID = "theflatratemovers-2026-10-29-1"


def b64u(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")


def main() -> int:
    if os.path.exists(PEM_PATH):
        print(f"REFUSING: {PEM_PATH} already exists (rotation is an explicit operator act).")
        return 1
    os.makedirs(KEYS_DIR, mode=0o700, exist_ok=True)
    os.chmod(KEYS_DIR, 0o700)
    key = Ed25519PrivateKey.generate()
    pem = key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
    fd = os.open(PEM_PATH, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as f:
        f.write(pem)
    os.chmod(PEM_PATH, 0o600)
    pub_raw = key.public_key().public_bytes(
        serialization.Encoding.Raw, serialization.PublicFormat.Raw
    )
    out = {
        "kid": KID,
        "kty": "OKP",
        "crv": "Ed25519",
        "alg": "EdDSA",
        "use": "sig",
        "x": b64u(pub_raw),
        "fingerprint_sha256_b64url": b64u(hashlib.sha256(pub_raw).digest()),
        "private_key_location": "custody path (see report); never printed",
    }
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
