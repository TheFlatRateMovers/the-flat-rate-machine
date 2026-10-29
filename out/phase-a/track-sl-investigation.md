# track.sl Investigation — Phase A (read-only, 2026-10-29)

## Question
Google Search Console → Settings → robots.txt shows one failing row:
`https://track.sl.theflatratemovers.com/robots.txt` — checked Aug 23, 10:52 AM —
"Not Fetched — Blocked due to other 4xx issue."

## Finding 1 — What the DNS record is
Cloudflare zone record (read via API, read-only):
- **Type:** CNAME — `track.sl.theflatratemovers.com` → `track.m2.sendlayer.net`
- **Proxied:** No (DNS-only). **TTL:** Auto. Record id `db6b811d0f7e8de228e350b5626fa125`.
- Public resolution confirms the chain: the CNAME resolves to SendLayer's
  tracking host at `198.18.234.73`.
- **So "track.sl" is SendLayer's email tracking subdomain** ("sl" = SendLayer,
  "track" = click/open tracking). It is not a website, not a Pages project,
  and not part of the Cloudflare Pages site.

## Finding 2 — What still serves it
- HTTPS `https://track.sl.theflatratemovers.com/` → **302** to
  `https://track.sl.theflatratemovers.com/app/user/` (SendLayer's app login).
- HTTPS `.../robots.txt` → **403, 0 bytes**, served by **Caddy**
  (SendLayer's tracking server refuses robots.txt — this is exactly the
  4xx GSC reported on Aug 23).
- HTTP `.../` → **301** to the HTTPS URL.
- The host is alive and answering; it is SendLayer's server, not anything
  Henry controls directly.

## Finding 3 — What still references it
- **Nothing in the live site source** (whole `public/` tree searched):
  no `track.sl` string in index.html, sitemap.xml, robots.txt, JSONs, or assets.
- **Nothing in the machine, the workers, or the survey projects.**
- The only references anywhere are this plan and this investigation.
- The quote form does NOT use SendLayer (it uses the Cloudflare Worker
  email route). SendLayer may still be wired to the WordPress fallback on
  SiteGround, or may be fully dormant — that cannot be determined from
  public data; it is a question for Henry, not something to guess.

## Finding 4 — Sibling records (SendLayer setup is still intact in DNS)
- `sl.theflatratemovers.com` → CNAME `sl.m2-use1.sendlayer.net` (DNS-only)
- `_dmarc.sl.theflatratemovers.com` → CNAME `_dmarc.m2.sendlayer.net`
- `yn3p7sz4kj.sl.theflatratemovers.com` → TXT verification token
- These four records stand or fall together with any SendLayer decision.

## Conclusion — the failing row is expected behavior, not a site error
A tracking host is not meant to be indexed, and SendLayer's server
deliberately refuses robots.txt. The GSC row is cosmetic for a host that
should never appear in search. There is nothing broken on
theflatratemovers.com itself because of it.

## Recommended fix (needs Henry's tap — NOT done in Phase A)
- **Option A (recommended if SendLayer is retired):** delete the
  `track.sl` CNAME (and, if the whole SendLayer setup is retired, the
  other three `sl.*` records too). The GSC row then disappears because
  the hostname stops resolving. This is a DNS change — Henry's tap.
- **Option B (if SendLayer is still used for any sending):** leave it
  exactly as-is. The GSC "Not Fetched" row is harmless and will persist;
  do not chase it.
- **NOT a fix:** "serve a valid robots.txt there" cannot be done
  directly — the hostname is a DNS-only CNAME to SendLayer's server, so
  no Cloudflare rule or Pages file can answer for it. Serving robots
  would require proxying the record plus a Worker/redirect, or asking
  SendLayer — both more machinery than a tracking host deserves.

## Explicitly NOT broken (verify-only, no action)
- The 4 live robots.txt variants (root/www × http/https, 75 bytes,
  fetched Oct 28) are correct — verified live 2026-10-29: `Allow: /` plus
  the sitemap pointer. No change.
- The 1,589-byte row (http://www, Sep 29) is a historical fetch from the
  WordPress era, predating the Oct 28 cutover. It is not a current file
  and needs no fix; it ages out of the 90-day window on its own. Do NOT
  "fix" it by re-serving the old file.
