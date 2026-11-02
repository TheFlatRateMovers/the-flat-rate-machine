#!/usr/bin/env python3
"""Signal observation #2 — robots.txt after the sitemap-architecture change.

Follows out/batch-crawl-presence-2026-10-31/work/observe_robots.py exactly
(same fetch, same header canonicalization, same directive parser, same
entry_digest construction): fetches the SERVED robots.txt, stores the raw
artifact, computes the digests, builds signal-log entry
sig-2026-11-02-robots-002 chained to the genesis entry, signs the digest
bytes with the estate key (read from paths.json keys_dir; the key is
never printed), and writes the entry JSON for the generator update.
Run with the paths.json venv python (provides jcs + cryptography).
"""
import hashlib, json, os, sys, urllib.request
from datetime import datetime, timezone

MACHINE = os.path.expanduser('~/workspace/the-flat-rate-machine')
BATCH = os.path.join(MACHINE, 'out/batch-sitemap-architecture-2026-11-02')
PATHS = json.load(open(os.path.join(MACHINE, 'paths.json')))
sys.path.insert(0, os.path.join(MACHINE, 'repo-dir'))
import jcs  # noqa: E402  (RFC 8785 canonicalization, from the estate venv)
from cryptography.hazmat.primitives import serialization  # noqa: E402
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey  # noqa: E402
import base64  # noqa: E402

URL = 'https://theflatratemovers.com/robots.txt'
GENESIS_ENTRY_DIGEST = 'e6927f3889fe39008bad8fac1ccad36029ea1cf726861cb3c237f60510bbdde7'

req = urllib.request.Request(URL, headers={'User-Agent': 'FlatRateMachine/1.0 (estate signal observation)'})
with urllib.request.urlopen(req, timeout=30) as r:
    status = r.status
    headers = dict(r.headers.items())
    body = r.read()
observed_at = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

artifact_dir = os.path.join(BATCH, 'work/signal-artifacts')
os.makedirs(artifact_dir, exist_ok=True)
artifact_path = os.path.join(artifact_dir, 'robots-2026-11-02.txt')
with open(artifact_path, 'wb') as f:
    f.write(body)

canon_headers = '\n'.join(f'{k.lower()}: {v}' for k, v in sorted(headers.items()))
headers_digest = hashlib.sha256(canon_headers.encode()).hexdigest()
body_digest = hashlib.sha256(body).hexdigest()

def parse_robots(text):
    groups, pending, cur = [], [], None
    sitemaps = []
    for raw in text.split('\n'):
        line = raw.strip()
        if not line or line.startswith('#') or ':' not in line:
            continue
        field, val = line.split(':', 1)
        field, val = field.strip().lower(), val.strip()
        if field == 'user-agent':
            if cur is not None and cur['rules']:
                groups.append(cur); cur = None
            if cur is None:
                cur = {'agents': [], 'rules': []}
            cur['agents'].append(val)
        elif field in ('allow', 'disallow'):
            if cur is None:
                cur = {'agents': [], 'rules': []}
            cur['rules'].append({'type': field, 'pattern': val})
        elif field == 'sitemap':
            sitemaps.append(val)
    if cur is not None and (cur['agents'] or cur['rules']):
        groups.append(cur)
    directives = [{'user_agent': a, 'rules': g['rules']} for g in groups for a in g['agents']]
    if sitemaps:
        directives.append({'sitemap_directives': sitemaps})
    return directives

entry = {
    'entry_id': 'sig-2026-11-02-robots-002',
    'schema_version': 'signal-observation/1.0 (per Dossier 05 §3.3)',
    'observed_at': observed_at,
    'capturing_agent': 'Flat Rate Machine signal observation (Mira) — urllib fetch + build-crawl-presence parser, 2026-11-02',
    'mechanism': 'robots',
    'signal_url': URL,
    'scope': 'site',
    'scope_value': '/',
    'http_status': status,
    'response_headers_digest': headers_digest,
    'body_digest': body_digest,
    'body_byte_size': len(body),
    'raw_artifact_uri': 'estate-archive:out/batch-sitemap-architecture-2026-11-02/work/signal-artifacts/robots-2026-11-02.txt',
    'parsed_directives': parse_robots(body.decode('utf-8')),
    'spec_version': 'RFC 9309 (robots.txt) + draft-ietf-aipref-attach-01 (Content Signals, read as unset)',
    'archive_snapshot_uri': None,
    'archive_snapshot_note': ('No Internet Archive capture of this robots.txt revision exists '
                              '(checked 2026-11-02): the CDX index holds only predecessor-era captures of the '
                              'www host\u2019s WordPress robots.txt (latest 2026-03-04, WARC digest '
                              '5YOGMNIWAMGAZJZXWZFQZ7ACXZFVEQOI); this revision was first served 2026-11-02 by the '
                              'sitemap-architecture batch. Recorded absent, never invented.'),
    'change_ref': ('batch-sitemap-architecture-2026-11-02: robots.txt gains the news-sitemap Sitemap line '
                   '(Google News Spec A); deliberate change, drift gate re-armed by this entry'),
    'effective_from': observed_at,
    'effective_to': None,
    'prev_entry_digest': GENESIS_ENTRY_DIGEST,
    'timestamp_token': None,
    'signing_key_id': 'theflatratemovers-2026-10-29-1',
}
canon = jcs.canonicalize({k: v for k, v in entry.items()
                          if k not in ('entry_digest', 'signature', 'timestamp_token')})
entry_digest = hashlib.sha256(canon).hexdigest()
key = serialization.load_pem_private_key(
    open(os.path.join(PATHS['keys_dir'], 'ed25519-signing-key.pem'), 'rb').read(), password=None)
assert isinstance(key, Ed25519PrivateKey)
sig = key.sign(bytes.fromhex(entry_digest))
entry['entry_digest'] = entry_digest
entry['signature'] = base64.urlsafe_b64encode(sig).rstrip(b'=').decode()

out_path = os.path.join(BATCH, 'work/signal-entry-002.json')
with open(out_path, 'w') as f:
    json.dump(entry, f, indent=1, ensure_ascii=False)
print('status:', status, '| body:', len(body), 'bytes | sha256:', body_digest)
print('headers_digest:', headers_digest)
print('directive groups:', len(entry['parsed_directives']))
print('entry_digest:', entry_digest, '(prev:', GENESIS_ENTRY_DIGEST[:12] + '…)')
print('entry written to', out_path)
