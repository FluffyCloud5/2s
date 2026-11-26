# 2s

The short address inside Tada2you QR codes. A code holds `https://2s.au/<ending>`; this Worker forwards it to `https://tada2you.com/<ending>`, where the site shows the card.

It is one small Cloudflare Worker with no database, no cookies and nothing stored.

| Request | Answer |
|---|---|
| `GET` or `HEAD` `/<ending>` (letters, digits, hyphen, up to 32) | 302 to `TARGET_ORIGIN/<ending in lower case>` |
| `/` | 302 to `TARGET_ORIGIN/` |
| `/health` | 200 with the target; 500 if `TARGET_ORIGIN` is missing or malformed |
| `/robots.txt` | allow all bots, so chat apps show a shared link's preview |
| anything else | 404; other methods 405 |

- The answer is always 302, never 301, so the destination can change later.
- Query strings are dropped.
- Every answer carries `cache-control: no-store`, `referrer-policy: no-referrer` and `x-robots-tag: noindex`.
- The site alone decides which endings exist and limits wrong guesses. This Worker does not need a new deployment when those rules change.

## Layout

- `src/worker.js` is the whole Worker.
- `test/worker.test.js` is one table of requests and expected answers.
- `wrangler.toml` holds the two environments: production (`2s.au` to `https://tada2you.com`) and `[env.staging]` (`staging.2s.au` to `https://staging.tada2you.com`).

## Local

Use Node 24 or later.

```sh
npm ci
npm test
npm run check   # tests, then a dry run of both environments; nothing is deployed
npm run dev     # http://localhost:8788, forwarding to a local site on http://localhost:8787
```

Deployment is described in [DEPLOY.md](DEPLOY.md).
