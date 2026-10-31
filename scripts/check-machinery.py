#!/usr/bin/env python3
"""Machinery assertions for verify.js §17 (checks M-1..M-5).

Reliability design D4 (2026-10-31): verify.js proves the published
estate; this helper proves the MACHINERY that produces it — the paths
registry resolves, the canonical folder's set is complete against the
sealed index, the seal reproduces from its sources, no stale per-batch
path literals survive in live tooling, and the ingest's idempotency
is armed. Stdlib only. Emits one JSON object on stdout:
{"M-1": {"ok": bool, "detail": str}, ...}. Never raises: a failure
inside a check is reported as that check's ok:false with the error
as detail; a failure to even load the registry fails all five.
"""
import glob
import hashlib
import json
import os
import re
import sqlite3
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://theflatratemovers.com/"
# The M-4 literals are assembled from parts so this file's own source
# does not contain them (M-4 scans every scripts/*.py, this included).
STALE_LITERALS = ["batch-" + "intent-rubric-v2-live",
                  "batch-" + "per-route-shell-live",
                  "batch-" + "naming/.venv"]


def load_registry():
    with open(os.path.join(ROOT, "paths.json"), encoding="utf-8") as f:
        return json.load(f)


def sha256_of(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def m1(reg):
    problems = []
    for key, value in sorted(reg.items()):
        if not isinstance(value, str) or not os.path.exists(value):
            problems.append(f"{key} missing: {value}")
    venv_py = reg.get("venv_py", "")
    if not os.access(venv_py, os.X_OK):
        problems.append("venv_py not executable")
    else:
        r = subprocess.run([venv_py, "-c", "import cryptography"],
                           capture_output=True, text=True)
        if r.returncode != 0:
            problems.append("venv_py cannot import cryptography")
    src_path = os.path.join(ROOT, "scripts", "ingest-outcome-evidence.py")
    with open(src_path, encoding="utf-8") as f:
        src = f.read()
    if "out/batch-" in src:
        problems.append("ingest tool source names a per-batch out/ path")
    if re.search(r"(?m)^(DEFAULT_DB|DEFAULT_PUB|DEFAULT_REPO_DIR|TOOLS|VENV_PY)\s*=", src):
        problems.append("ingest tool source carries a module-level path default")
    if "expanduser" in src:
        problems.append("ingest tool source builds paths from the home directory")
    if "~/workspace" in src:
        problems.append("ingest tool source carries a literal home path")
    detail = (f"{len(reg)} registry paths resolve; venv imports cryptography; "
              "ingest tool has no path defaults outside its loader")
    return (not problems), ("; ".join(problems) if problems else detail)


def github_entries(index):
    return [e for e in index.get("distribution", [])
            if "raw.githubusercontent.com" in (e.get("contentUrl") or "")
            and "/main/" in e["contentUrl"]]


def m2(reg):
    with open(os.path.join(reg["public_dir"], "ai-master-index.json"),
              encoding="utf-8") as f:
        index = json.load(f)
    entries = github_entries(index)
    bad = []
    for e in entries:
        base = os.path.basename(e["contentUrl"].split("/main/", 1)[1])
        p = os.path.join(reg["repo_dir"], base)
        if not os.path.isfile(p):
            bad.append(base + " missing")
            continue
        d = e.get("digest") or {}
        if sha256_of(p) != d.get("value") or os.path.getsize(p) != d.get("byteSize"):
            bad.append(base + " digest/size mismatch")
    return (not bad), (f"{len(entries)} GitHub-main distributions checked against "
                       f"repo_dir" + (", bad: " + "; ".join(bad[:4]) if bad else ", all match"))


def m3(reg):
    sealed_path = os.path.join(reg["public_dir"], "ai-master-index.json")
    with open(sealed_path, encoding="utf-8") as f:
        sealed = json.load(f)
    sealed_map = {e["contentUrl"]: e.get("digest") or {}
                  for e in sealed.get("distribution", [])}
    with tempfile.TemporaryDirectory() as td:
        idx_copy = os.path.join(td, "index.json")
        out_path = os.path.join(td, "digested.json")
        audit_path = os.path.join(td, "audit.json")
        with open(sealed_path, "rb") as f:
            data = f.read()
        with open(idx_copy, "wb") as f:
            f.write(data)
        r = subprocess.run([reg["venv_py"],
                            os.path.join(reg["tools_dir"], "digest-index.py"),
                            "--index", idx_copy,
                            "--public-dir", reg["public_dir"],
                            "--repo-dir", reg["repo_dir"],
                            "--out", out_path, "--audit", audit_path],
                           capture_output=True, text=True)
        if r.returncode != 0:
            return False, "digest-index exited " + str(r.returncode) + ": " + (r.stderr or r.stdout)[-200:]
        with open(audit_path, encoding="utf-8") as f:
            audit = json.load(f)
        gaps = audit.get("gaps", [])
        if gaps:
            return False, f"digest-index reported {len(gaps)} gaps"
        with open(out_path, encoding="utf-8") as f:
            repro = json.load(f)
        repro_map = {e["contentUrl"]: e.get("digest") or {}
                     for e in repro.get("distribution", [])}
        bad = []
        for url, d in sealed_map.items():
            rd = repro_map.get(url)
            if not rd or rd.get("value") != d.get("value") or rd.get("byteSize") != d.get("byteSize"):
                bad.append(url)
        if set(repro_map) != set(sealed_map):
            bad.append("distribution set differs")
        return (not bad), (f"{len(sealed_map)} distributions reproduced from sources, "
                           "gaps 0" + (", bad: " + "; ".join(bad[:3]) if bad else ""))


_REGEX_PREV_KEYWORDS = {"return", "typeof", "case", "in", "of", "new",
                        "delete", "void", "instanceof", "do", "else",
                        "yield", "await"}


def _regex_allowed(last_sig):
    """Whether a '/' here opens a regex literal rather than division:
    true at expression start and after operators/punctuators or a
    regex-preceding keyword; false after an operand (identifier,
    number, string, template, regex, ')', ']')."""
    if last_sig is None:
        return True
    if last_sig.startswith("word:"):
        return last_sig[5:] in _REGEX_PREV_KEYWORDS
    if last_sig in ("str", "tpl", "regex", "num", ")", "]"):
        return False
    return True


def strip_js_comments(text):
    """Blank JS comments (// line, /* */ block) char-for-char, preserving
    length and newlines. String literals ('...', "..."), template
    literals, and regex literals are copied verbatim — their contents
    are executable text and stay scanned; ${ } expressions inside
    templates are code and are processed as code (nested templates
    handled via the frame stack). '//' or '/*' met in code position
    always starts a comment (an empty regex is inexpressible); a
    single '/' opens a regex only where _regex_allowed says a term
    can start, and the regex body (escapes and [...] classes tracked)
    is then consumed verbatim so its slashes are never mistaken for
    comment starts."""
    out = []
    i, n = 0, len(text)
    stack = [("code", None)]  # frames: code(brace depth|None), tpl, sq, dq, regex, comments
    last_sig = None  # last significant token in code position (see _regex_allowed)
    cur_word = ""

    def finalize_word():
        nonlocal last_sig, cur_word
        if cur_word:
            last_sig = "word:" + cur_word
            cur_word = ""

    while i < n:
        c = text[i]
        top = stack[-1][0]
        if top == "line_comment":
            if c == "\n":
                out.append(c)
                stack.pop()
            else:
                out.append(" ")
            i += 1
        elif top == "block_comment":
            if c == "*" and i + 1 < n and text[i + 1] == "/":
                out.append("  ")
                i += 2
                stack.pop()
            else:
                out.append("\n" if c == "\n" else " ")
                i += 1
        elif top == "regex":
            if c == "\\" and i + 1 < n:
                out.append(text[i:i + 2])
                i += 2
            elif c == "[":
                out.append(c)
                stack[-1] = ("regex", True)
                i += 1
            elif c == "]":
                out.append(c)
                stack[-1] = ("regex", False)
                i += 1
            elif c == "/" and not stack[-1][1]:
                out.append(c)
                i += 1
                while i < n and text[i].isalpha():  # flags are part of the token
                    out.append(text[i])
                    i += 1
                stack.pop()
                last_sig = "regex"
            else:
                out.append(c)
                i += 1
        elif top == "code":
            two = text[i:i + 2]
            if two == "//":
                finalize_word()
                out.append("  ")
                stack.append(("line_comment",))
                i += 2
            elif two == "/*":
                finalize_word()
                out.append("  ")
                stack.append(("block_comment",))
                i += 2
            elif c == "/" and _regex_allowed(
                    "word:" + cur_word if cur_word else last_sig):
                finalize_word()
                out.append(c)
                stack.append(("regex", False))
                i += 1
            elif c == "'":
                finalize_word()
                out.append(c)
                stack.append(("sq",))
                i += 1
            elif c == '"':
                finalize_word()
                out.append(c)
                stack.append(("dq",))
                i += 1
            elif c == "`":
                finalize_word()
                out.append(c)
                stack.append(("tpl",))
                i += 1
            elif c == "{":
                finalize_word()
                out.append(c)
                last_sig = "{"
                if stack[-1][1] is not None:
                    stack[-1] = ("code", stack[-1][1] + 1)
                i += 1
            elif c == "}":
                finalize_word()
                out.append(c)
                last_sig = "}"
                if stack[-1][1] is not None:
                    if stack[-1][1] == 0:
                        stack.pop()  # closes the ${ } — back to the template frame
                    else:
                        stack[-1] = ("code", stack[-1][1] - 1)
                i += 1
            elif c.isalnum() or c in "_$":
                cur_word += c
                out.append(c)
                i += 1
            elif c.isspace():
                finalize_word()
                out.append(c)
                i += 1
            else:
                finalize_word()
                out.append(c)
                last_sig = "num" if c.isdigit() else c
                i += 1
        elif top in ("sq", "dq"):
            q = "'" if top == "sq" else '"'
            if c == "\\" and i + 1 < n:
                out.append(text[i:i + 2])
                i += 2
            elif c == q or c == "\n":
                out.append(c)
                stack.pop()
                last_sig = "str"
                i += 1
            else:
                out.append(c)
                i += 1
        elif top == "tpl":
            if c == "\\" and i + 1 < n:
                out.append(text[i:i + 2])
                i += 2
            elif c == "`":
                out.append(c)
                stack.pop()
                last_sig = "tpl"
                i += 1
            elif c == "$" and i + 1 < n and text[i + 1] == "{":
                out.append("${")
                stack.append(("code", 0))
                last_sig = None
                cur_word = ""
                i += 2
            else:
                out.append(c)
                i += 1
    return "".join(out)


def strip_py_comments(text):
    """Blank Python # comments char-for-char, preserving length and
    newlines. String literals (single/double, incl. triple-quoted
    docstrings) are copied verbatim — their contents stay scanned;
    only #-to-end-of-line text outside strings is blanked."""
    out = []
    i, n = 0, len(text)
    state = None  # None = code; else (quote, triple)
    while i < n:
        c = text[i]
        if state is None:
            if c == "#":
                while i < n and text[i] != "\n":
                    out.append(" ")
                    i += 1
            elif c in ("'", '"'):
                if text[i:i + 3] == c * 3:
                    out.append(c * 3)
                    state = (c, True)
                    i += 3
                else:
                    out.append(c)
                    state = (c, False)
                    i += 1
            else:
                out.append(c)
                i += 1
        else:
            q, triple = state
            if c == "\\" and i + 1 < n:
                out.append(text[i:i + 2])
                i += 2
            elif triple and text[i:i + 3] == q * 3:
                out.append(q * 3)
                state = None
                i += 3
            elif not triple and (c == q or c == "\n"):
                out.append(c)
                state = None
                i += 1
            else:
                out.append(c)
                i += 1
    return "".join(out)


def executable_text(path, text):
    """The text M-4 scans: the file with comments blanked, so every
    executable line (and every string literal) is scanned and comment
    text — provenance notes, design-record pointers — is not."""
    if path.endswith(".py"):
        return strip_py_comments(text)
    return strip_js_comments(text)


def m4(reg):
    files = sorted(glob.glob(os.path.join(ROOT, "scripts", "*.py")) +
                   glob.glob(os.path.join(ROOT, "scripts", "*.js")) +
                   [os.path.join(ROOT, "verify.js")])
    hits = []
    for p in files:
        with open(p, encoding="utf-8", errors="replace") as f:
            text = f.read()
        code = executable_text(p, text)
        for lit in STALE_LITERALS:
            if lit in code:
                hits.append(os.path.basename(p) + " names " + lit)
    return (not hits), (f"{len(files)} live tooling files scanned (executable "
                        "lines, comments stripped), zero stale per-batch path "
                        "literals" + (", hits: " + "; ".join(hits) if hits else ""))


def m5(reg):
    con = sqlite3.connect(reg["rubric_db"])
    try:
        idx = con.execute("SELECT name FROM sqlite_master WHERE type='index'"
                          " AND name='idx_evidence_dedupe'").fetchone()
        nulls = con.execute("SELECT COUNT(*) FROM intent_outcome_evidence"
                            " WHERE dedupe_key IS NULL").fetchone()[0]
        total = con.execute("SELECT COUNT(*) FROM intent_outcome_evidence").fetchone()[0]
        runs = con.execute("SELECT name FROM sqlite_master WHERE type='table'"
                           " AND name='intent_ingest_runs'").fetchone()
    finally:
        con.close()
    problems = []
    if not idx:
        problems.append("idx_evidence_dedupe missing")
    if nulls:
        problems.append(f"{nulls} evidence rows have NULL dedupe_key")
    if not runs:
        problems.append("intent_ingest_runs missing")
    return (not problems), ("; ".join(problems) if problems else
                            f"dedupe unique index present, 0 NULL keys over {total} "
                            "evidence rows, run ledger exists")


def main():
    results = {}
    try:
        reg = load_registry()
    except Exception as e:  # registry unreadable: every check fails on it
        for mid in ("M-1", "M-2", "M-3", "M-4", "M-5"):
            results[mid] = {"ok": False, "detail": f"paths registry unreadable: {e}"}
        print(json.dumps(results))
        return 0
    for mid, fn in (("M-1", m1), ("M-2", m2), ("M-3", m3), ("M-4", m4), ("M-5", m5)):
        try:
            ok, detail = fn(reg)
            results[mid] = {"ok": bool(ok), "detail": detail}
        except Exception as e:
            results[mid] = {"ok": False, "detail": f"check error: {e}"}
    print(json.dumps(results))
    return 0


if __name__ == "__main__":
    sys.exit(main())
