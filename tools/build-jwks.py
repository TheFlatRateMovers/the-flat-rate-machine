#!/usr/bin/env python3
"""Build the public JWKS document for https://theflatratemovers.com/.well-known/signing-keys.json

Derives the public key from the custody PEM (public half only is emitted),
and assembles the JWKS (RFC 7517) plus issuer metadata. Every metadata
value is a real estate fact; nothing is placeholder text.
"""
import base64
import hashlib
import json
import os

from cryptography.hazmat.primitives import serialization

PEM_PATH = os.path.expanduser("~/workspace/theflatratemovers/keys/ed25519-signing-key.pem")
OUT = os.path.join(os.path.dirname(__file__), "..", "site", ".well-known", "signing-keys.json")
KID = "theflatratemovers-2026-10-29-1"


def b64u(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")


def main() -> None:
    with open(PEM_PATH, "rb") as f:
        key = serialization.load_pem_private_key(f.read(), password=None)
    pub_raw = key.public_key().public_bytes(
        serialization.Encoding.Raw, serialization.PublicFormat.Raw
    )
    doc = {
        "issuer": "https://theflatratemovers.com/",
        "organization": "The Flat Rate Movers LLC",
        "purpose": (
            "This key signs the AI master index and dataset digests for The Flat Rate "
            "Movers machine-data estate. Any machine can verify that an index or pack "
            "carrying this key's signature is genuinely published by The Flat Rate "
            "Movers LLC and has not been altered."
        ),
        "created": "2026-10-29",
        "contact": "ratemovers@gmail.com",
        "keys": [
            {
                "kty": "OKP",
                "crv": "Ed25519",
                "x": b64u(pub_raw),
                "kid": KID,
                "alg": "EdDSA",
                "use": "sig",
            }
        ],
        "fingerprint_sha256": b64u(hashlib.sha256(pub_raw).digest()),
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(doc, f, indent=2)
        f.write("\n")
    print(f"wrote {os.path.normpath(OUT)}")
    print("kid:", KID, "| fingerprint:", doc["fingerprint_sha256"])


if __name__ == "__main__":
    main()
