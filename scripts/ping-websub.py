#!/usr/bin/env python3
"""ping-websub.py — WebSub publish pings for the estate feeds
(batch-feed-push-2026-11-02; generalized to both feeds by
batch-pulse-2026-11-02).

Announces to Google's public WebSub hub that an estate feed has
changed, so subscribers (Google included) fetch it immediately
instead of waiting for a poll cycle. The feeds themselves declare
this hub via <atom:link rel="hub"
href="https://pubsubhubbub.appspot.com/"/>.

Usage:  python3 ping-websub.py <log-file> [feed-url ...]
        With no feed URLs, BOTH estate feeds are pinged:
          https://theflatratemovers.com/feed.xml     (articles)
          https://theflatratemovers.com/updates.xml  (estate updates)
        Pass explicit feed URLs to ping a subset — the hub accepts
        exactly one hub.url per POST, so each feed gets its own call.
        Appends one dated line per feed to <log-file> and prints one
        HTTP status per feed (204 = publish accepted). Exit 0 only
        if every pinged feed returned 204.

FIRE ORDER (standing rule): run ONLY after the changed feed(s) are
verified live — the ping announces the feed as it exists at ping
time, so a ping fired before the feed deploys announces the old
feed. Ping the feeds that changed in the close; both when both
changed.

One network call per feed: the POST below. No retries, no other
endpoints.
"""
import subprocess
import sys
from datetime import datetime, timezone

HUB_ENDPOINT = "https://pubsubhubbub.appspot.com/"
DEFAULT_FEEDS = [
    "https://theflatratemovers.com/feed.xml",
    "https://theflatratemovers.com/updates.xml",
]


def ping(feed_url: str) -> int:
    # curl subprocess is the reliable fetcher on this estate: the urllib
    # read against the hub timed out on 2026-11-02 even though the POST
    # itself was deliverable; the same POST via curl returned 204 in ~5s.
    r = subprocess.run(
        ["curl", "-sS", "-o", "/dev/null", "-w", "%{http_code}",
         "--max-time", "60", "-X", "POST", HUB_ENDPOINT,
         "-d", "hub.mode=publish", "-d", f"hub.url={feed_url}"],
        capture_output=True, text=True, timeout=90)
    return int(r.stdout.strip() or 0)


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: ping-websub.py <log-file> [feed-url ...]",
              file=sys.stderr)
        return 2
    log_path = sys.argv[1]
    feeds = sys.argv[2:] or DEFAULT_FEEDS

    ok = True
    with open(log_path, "a", encoding="utf-8") as f:
        for feed_url in feeds:
            status = ping(feed_url)
            stamp = datetime.now(timezone.utc).astimezone().isoformat(
                timespec="seconds")
            f.write(f"{stamp} websub-publish feed={feed_url} "
                    f"hub={HUB_ENDPOINT} http={status}\n")
            print(f"{feed_url} -> {status}")
            ok = ok and status == 204
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
