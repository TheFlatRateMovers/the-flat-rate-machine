#!/usr/bin/env python3
"""ping-websub.py — WebSub publish ping for the estate article feed
(batch-feed-push-2026-11-02).

Announces to Google's public WebSub hub that
https://theflatratemovers.com/feed.xml has changed, so subscribers
(Google included) fetch the upgraded feed immediately instead of
waiting for a poll cycle. This is the news-publisher instant-pickup
mechanism: the feed itself declares this hub via
<atom:link rel="hub" href="https://pubsubhubbub.appspot.com/"/>.

Usage:  python3 ping-websub.py <log-file>
        Appends one dated line per run to <log-file> and prints the
        hub's HTTP status (204 = publish accepted).

FIRE ORDER: run ONLY after the upgraded feed (with the rel="hub"
declaration and full <content:encoded> items) is verified live —
the ping announces the feed as it exists at ping time, so a ping
fired before the upgraded feed deploys announces the old feed.

Makes exactly one network call: the POST below. No retries, no
other endpoints.
"""
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

HUB_ENDPOINT = "https://pubsubhubbub.appspot.com/"
FEED_URL = "https://theflatratemovers.com/feed.xml"


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: ping-websub.py <log-file>", file=sys.stderr)
        return 2
    log_path = sys.argv[1]

    # curl subprocess is the reliable fetcher on this estate: the urllib
    # read against the hub timed out on 2026-11-02 even though the POST
    # itself was deliverable; the same POST via curl returned 204 in ~5s.
    import subprocess
    r = subprocess.run(
        ["curl", "-sS", "-o", "/dev/null", "-w", "%{http_code}",
         "--max-time", "60", "-X", "POST", HUB_ENDPOINT,
         "-d", "hub.mode=publish", "-d", f"hub.url={FEED_URL}"],
        capture_output=True, text=True, timeout=90)
    status = int(r.stdout.strip() or 0)

    stamp = datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")
    line = f"{stamp} websub-publish feed={FEED_URL} hub={HUB_ENDPOINT} http={status}"
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(line + "\n")
    print(status)
    return 0 if status == 204 else 1


if __name__ == "__main__":
    sys.exit(main())
