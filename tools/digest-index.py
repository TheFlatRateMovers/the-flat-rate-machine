#!/usr/bin/env python3
"""Complete the AI master index: fill license + dateModified on every
distribution entry FROM REAL SOURCES ONLY, and attach a SHA-256 digest
computed over the actual bytes each contentUrl serves.

Fill rules (recorded per field in the audit; nothing is invented):
  license      <- the target file's own declared license if it has one,
                  else the index's own top-level license (the index is the
                  Dataset; its license covers its distributions).
  dateModified <- the target file's own declared dateModified (top level,
                  _machineNotes, or a Dataset node), else the index's own
                  top-level dateModified (the date this listing was stamped).
  digest       <- sha256 + byteSize over resolved bytes:
                  theflatratemovers.com/<p>      -> <public-dir>/<p>
                  raw.githubusercontent .../main/<p> -> <repo-dir>/<basename>
An entry that cannot be resolved or filled is reported as a GAP, never patched over.

S3 upgrade (Speed Batch S3, 2026-11-03): ONE read per file computes
THREE hashes — SHA-256 (the index digest, unchanged), the git blob
SHA-1, and the Cloudflare Pages BLAKE3 — and the audit entry gains
gitBlobSha1 + pagesBlake3. The output index format is unchanged:
entry["digest"] stays {algorithm SHA-256, value, byteSize} only.
Pages BLAKE3 := blake3(base64(data) + ext) hex truncated to 32 chars,
where ext is the resolved file's extension without the dot ('' if
none), appended as ASCII to the base64 bytes. An optional
--hash-cache <path> reuses the three hashes for a file whose size and
mtimeNs both match its cache entry (the file is then read only if a
license/dateModified fill still needs its contents); --fresh ignores
the cache and does not write it. Without the new flags, behaviour is
the original behaviour plus the two extra audit fields.
"""
import argparse
import base64
import hashlib
import itertools
import json
import os
import struct
import sys

try:
    import blake3 as _blake3_lib
except Exception:  # no blake3 library in this interpreter: vendored below
    _blake3_lib = None


# --- Vendored pure-Python BLAKE3 (hash mode only, 32-byte output) ---
# Written from the BLAKE3 specification (the same IV, message
# permutation, compression function and chunk/parent tree rules as
# the reference implementation). Used only when the blake3 library
# cannot be imported. Validated against the reference library
# (pip-installed blake3) on empty input, 'abc', 1 MB of random bytes,
# and the estate's large files before this batch shipped; see the
# lane report. A wrong BLAKE3 is worse than none, so the vendored
# path exists only because that validation passed.
_B3_IV = (0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
          0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19)
_B3_PERM = (2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8)
_B3_CHUNK_START = 1 << 0
_B3_CHUNK_END = 1 << 1
_B3_PARENT = 1 << 2
_B3_ROOT = 1 << 3
_B3_MASK = 0xFFFFFFFF


def _b3_rotr(x, n):
    return ((x >> n) | ((x << (32 - n)) & _B3_MASK)) & _B3_MASK


def _b3_g(state, a, b, c, d, mx, my):
    state[a] = (state[a] + state[b] + mx) & _B3_MASK
    state[d] = _b3_rotr(state[d] ^ state[a], 16)
    state[c] = (state[c] + state[d]) & _B3_MASK
    state[b] = _b3_rotr(state[b] ^ state[c], 12)
    state[a] = (state[a] + state[b] + my) & _B3_MASK
    state[d] = _b3_rotr(state[d] ^ state[a], 8)
    state[c] = (state[c] + state[d]) & _B3_MASK
    state[b] = _b3_rotr(state[b] ^ state[c], 7)
    return state


def _b3_round(state, m):
    state = _b3_g(state, 0, 4, 8, 12, m[0], m[1])
    state = _b3_g(state, 1, 5, 9, 13, m[2], m[3])
    state = _b3_g(state, 2, 6, 10, 14, m[4], m[5])
    state = _b3_g(state, 3, 7, 11, 15, m[6], m[7])
    state = _b3_g(state, 0, 5, 10, 15, m[8], m[9])
    state = _b3_g(state, 1, 6, 11, 12, m[10], m[11])
    state = _b3_g(state, 2, 7, 8, 13, m[12], m[13])
    state = _b3_g(state, 3, 4, 9, 14, m[14], m[15])
    return state


def _b3_compress(cv, block_words, counter, block_len, flags):
    state = list(cv) + list(_B3_IV[:4]) + [
        counter & _B3_MASK, (counter >> 32) & _B3_MASK, block_len, flags]
    state = _b3_round(state, block_words)
    bw = block_words
    for _ in range(6):
        bw = [bw[_B3_PERM[i]] for i in range(16)]
        state = _b3_round(state, bw)
    for i in range(8):
        state[i] ^= state[i + 8]
        state[i + 8] ^= cv[i]
    return state


class _B3Output:
    def __init__(self, input_cv, block_words, counter, block_len, flags):
        self.input_cv = input_cv
        self.block_words = block_words
        self.counter = counter
        self.block_len = block_len
        self.flags = flags

    def chaining_value(self):
        return _b3_compress(self.input_cv, self.block_words,
                            self.counter, self.block_len,
                            self.flags)[:8]

    def root_output_bytes(self, length):
        out = b""
        for ctr in itertools.count():
            words = _b3_compress(self.input_cv, self.block_words, ctr,
                                 self.block_len, self.flags | _B3_ROOT)
            for w in words:
                out += struct.pack("<I", w)
            if len(out) >= length:
                return out[:length]


def _b3_words(block):
    padded = block + b"\x00" * (64 - len(block))
    return list(struct.unpack("<16I", padded))


def _b3_chunk_output(chunk, counter):
    cv = list(_B3_IV)
    num_blocks = max(1, (len(chunk) + 63) // 64)
    for i in range(num_blocks):
        block = chunk[i * 64:(i + 1) * 64]
        flags = ((_B3_CHUNK_START if i == 0 else 0)
                 | (_B3_CHUNK_END if i == num_blocks - 1 else 0))
        if i == num_blocks - 1:
            return _B3Output(cv, _b3_words(block), counter,
                             len(block), flags)
        cv = _b3_compress(cv, _b3_words(block), counter, 64, flags)[:8]
    raise AssertionError("unreachable")


def _b3_parent_output(left_cv, right_cv):
    return _B3Output(list(_B3_IV), list(left_cv) + list(right_cv),
                     0, 64, _B3_PARENT)


def _pure_blake3_hexdigest(data):
    if len(data) <= 1024:
        return _b3_chunk_output(data, 0).root_output_bytes(32).hex()
    chunks = [data[i:i + 1024] for i in range(0, len(data), 1024)]
    stack = []
    for idx, ch in enumerate(chunks[:-1]):
        new_cv = _b3_chunk_output(ch, idx).chaining_value()
        total = idx + 1
        while total & 1 == 0:
            new_cv = _b3_parent_output(
                stack.pop(), new_cv).chaining_value()
            total >>= 1
        stack.append(new_cv)
    output = _b3_chunk_output(chunks[-1], len(chunks) - 1)
    while stack:
        output = _b3_parent_output(stack.pop(),
                                   output.chaining_value())
    return output.root_output_bytes(32).hex()


def blake3_hexdigest(data):
    """Full BLAKE3 hexdigest: the library when importable, else the
    validated vendored pure-Python implementation above."""
    if _blake3_lib is not None:
        return _blake3_lib.blake3(data).hexdigest()
    return _pure_blake3_hexdigest(data)


def git_blob_sha1(data):
    return hashlib.sha1(
        b"blob " + str(len(data)).encode("ascii") + b"\x00"
        + data).hexdigest()


def pages_blake3(data, path):
    ext = os.path.splitext(path)[1]
    if ext.startswith("."):
        ext = ext[1:]
    payload = base64.b64encode(data) + ext.encode("ascii")
    return blake3_hexdigest(payload)[:32]


def find_declared(doc, key):
    """Search a parsed JSON doc for a declared value: top level, then
    _machineNotes, then any @graph node (Dataset nodes preferred)."""
    if isinstance(doc, dict):
        if key in doc and isinstance(doc[key], str):
            return doc[key], "file-top-level"
        mn = doc.get("_machineNotes")
        if isinstance(mn, dict) and isinstance(mn.get(key), str):
            return mn[key], "file-_machineNotes"
        graph = doc.get("@graph")
        if isinstance(graph, list):
            for node in graph:
                if isinstance(node, dict) and isinstance(node.get(key), str):
                    t = str(node.get("@type", ""))
                    if "Dataset" in t or key == "dateModified":
                        return node[key], "file-dataset-node"
            for node in graph:
                if isinstance(node, dict) and isinstance(node.get(key), str):
                    return node[key], "file-graph-node"
    return None, None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--index", required=True)
    ap.add_argument("--public-dir", required=True)
    ap.add_argument("--repo-dir", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--audit", required=True)
    ap.add_argument("--hash-cache", default=None,
                    help="JSON cache: resolved absolute path -> "
                         "{size, mtimeNs, sha256, gitBlobSha1, "
                         "pagesBlake3}; on a size+mtimeNs match the "
                         "hashes are reused without reading the file")
    ap.add_argument("--fresh", action="store_true",
                    help="ignore the hash cache and do not write it "
                         "(a full recompute, e.g. the proof round)")
    args = ap.parse_args()

    cache = {}
    cache_hits = 0
    cache_misses = 0
    use_cache = bool(args.hash_cache) and not args.fresh
    if use_cache and os.path.isfile(args.hash_cache):
        try:
            with open(args.hash_cache) as f:
                loaded = json.load(f)
            if isinstance(loaded, dict):
                cache = loaded
        except Exception:
            cache = {}

    with open(args.index) as f:
        index = json.load(f)
    top_license = index.get("license")
    top_dm = index.get("dateModified")

    audit = {"entries": [], "gaps": [], "totals": {}}
    filled = {"license": 0, "dateModified": 0, "digest": 0}

    for entry in index.get("distribution", []):
        name = entry.get("name")
        url = entry.get("contentUrl", "")
        rec = {"name": name, "contentUrl": url, "sources": {}}
        path = None
        if url.startswith("https://theflatratemovers.com/"):
            rel = url[len("https://theflatratemovers.com/"):]
            cand = os.path.join(args.public_dir, rel)
            # Per-route architecture (Solution A, 2026-10-31): a site
            # contentUrl that names a route (empty rel, or ending in
            # "/") is served by that route's index.html document.
            if rel == "" or rel.endswith("/"):
                cand = os.path.join(cand, "index.html")
            elif not os.path.isfile(cand) and "." not in os.path.basename(rel):
                # Serving-alias resolution (Outside-Copies micro-batch,
                # 2026-11-11): the Pages asset server serves an
                # extensionless path from the .html file of that name
                # (a .html request 308-redirects to the alias), so a
                # contentUrl registered at its serving URL resolves to
                # the .html file — the same rule build-routes.js
                # encodes as STATIC_FILES serving aliases (verify.js
                # S-2B gates those). First occurrence: /ai-ingestion-card,
                # the estate's first root-level non-index .html asset.
                alt = cand + ".html"
                if os.path.isfile(alt):
                    cand = alt
            if os.path.isfile(cand):
                path, rec["resolved"] = cand, f"public/{rel}"
        elif "raw.githubusercontent.com" in url and "/main/" in url:
            rel = url.split("/main/", 1)[1]
            cand = os.path.join(args.repo_dir, os.path.basename(rel))
            if os.path.isfile(cand):
                path, rec["resolved"] = cand, f"ai-repo/{rel}@HEAD"
        if not path:
            rec["error"] = "unresolvable contentUrl"
            audit["gaps"].append(rec)
            audit["entries"].append(rec)
            continue
        st = os.stat(path)
        abspath = os.path.abspath(path)
        centry = cache.get(abspath) if use_cache else None
        data = None
        if (centry is not None
                and centry.get("size") == st.st_size
                and centry.get("mtimeNs") == st.st_mtime_ns
                and centry.get("sha256")
                and centry.get("gitBlobSha1")
                and centry.get("pagesBlake3")):
            # Cache hit: reuse all three hashes WITHOUT reading the
            # file. The file is read below only if a license /
            # dateModified fill still needs its contents.
            cache_hits += 1
            sha256_value = centry["sha256"]
            git_sha1 = centry["gitBlobSha1"]
            pages_b3 = centry["pagesBlake3"]
            byte_size = st.st_size
        else:
            if args.hash_cache:
                cache_misses += 1
            with open(path, "rb") as f:
                data = f.read()
            sha256_value = hashlib.sha256(data).hexdigest()
            git_sha1 = git_blob_sha1(data)
            pages_b3 = pages_blake3(data, path)
            byte_size = len(data)
            if use_cache:
                cache[abspath] = {
                    "size": st.st_size,
                    "mtimeNs": st.st_mtime_ns,
                    "sha256": sha256_value,
                    "gitBlobSha1": git_sha1,
                    "pagesBlake3": pages_b3,
                }
        digest = {
            "algorithm": "SHA-256",
            "value": sha256_value,
            "byteSize": byte_size,
        }
        entry["digest"] = digest
        filled["digest"] += 1
        rec["digest"] = digest
        rec["gitBlobSha1"] = git_sha1
        rec["pagesBlake3"] = pages_b3

        doc = None
        if data is None and (not entry.get("license")
                             or not entry.get("dateModified")):
            # Cache hit, but a fill still needs the file's declared
            # values: read the file for the fill only (the hashes
            # above already came from the cache).
            with open(path, "rb") as f:
                data = f.read()
        if data is not None:
            try:
                doc = json.loads(data.decode("utf-8"))
            except Exception:
                doc = None
        for field, topval in (("license", top_license), ("dateModified", top_dm)):
            if entry.get(field):
                rec["sources"][field] = "already-present"
                filled[field] += 1
                continue
            val, src = find_declared(doc, field) if doc is not None else (None, None)
            if val is None and topval:
                val, src = topval, "index-top-level"
            if val is None:
                rec.setdefault("missing", []).append(field)
                audit["gaps"].append({"name": name, "missing": field})
            else:
                entry[field] = val
                rec["sources"][field] = src
                filled[field] += 1
        audit["entries"].append(rec)

    audit["totals"] = {
        "distributions": len(index.get("distribution", [])),
        **filled,
        "gaps": len(audit["gaps"]),
    }
    if args.hash_cache:
        audit["totals"]["hashCacheHits"] = cache_hits
        audit["totals"]["hashCacheMisses"] = cache_misses
    with open(args.out, "w") as f:
        json.dump(index, f, indent=1)
        f.write("\n")
    with open(args.audit, "w") as f:
        json.dump(audit, f, indent=2)
        f.write("\n")
    if use_cache:
        cache_dir = os.path.dirname(os.path.abspath(args.hash_cache))
        os.makedirs(cache_dir, exist_ok=True)
        with open(args.hash_cache, "w") as f:
            json.dump(cache, f, indent=1, sort_keys=True)
            f.write("\n")
    print(json.dumps(audit["totals"], indent=2))
    return 0 if not audit["gaps"] else 2


if __name__ == "__main__":
    sys.exit(main())
