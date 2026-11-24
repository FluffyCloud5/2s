# Deploying 2s

For the person who deploys, on their own computer and Cloudflare account. Nothing here runs automatically.

## Once

1. `npm ci`, then `npx wrangler login`.
2. The zone `2s.au` must be in the same Cloudflare account. `wrangler.toml` attaches `staging.2s.au` and `2s.au` as custom domains, so Cloudflare creates the DNS records and certificates at the first deployment.
   On 24 November 2026 `2s.au` still showed the registrar's parking page: its A records pointed to `207.207.210.107` and `207.207.210.229`, and `https://2s.au` failed its TLS handshake. `staging.2s.au` was already this Worker. At the first production deployment wrangler finds those records on `2s.au` and asks whether to point them at the Worker instead: answer yes, or delete them in the zone's DNS beforehand. Afterwards `dig +short 2s.au` must show Cloudflare addresses. `www.2s.au` (a CNAME to the same parking page) is not part of this Worker; delete that record too, so that a typed `www.` address does not land on the parking page.
3. In the zone's SSL/TLS settings, keep **Always Use HTTPS** off and do not enable HSTS. A printed code may hold the address without `https://`; the Worker must answer plain `http://` itself, so that such a code costs one hop and not two.

There are no secrets, no database and no bindings.

## Staging

```sh
npm run check            # tests and a dry run of both environments
npm run deploy:staging   # deploys the Worker 2s-staging to staging.2s.au
```

Check it:

```sh
curl -sI https://staging.2s.au/abcde     # 302, location: https://staging.tada2you.com/abcde
curl -sI http://staging.2s.au/abcde      # 302 straight to the site, with no hop to https://staging.2s.au first
curl -s  https://staging.2s.au/health    # {"ok":true,"target":"https://staging.tada2you.com"}
curl -sI https://staging.2s.au/a/b       # 404
```

## Production

```sh
npm run deploy           # deploys the Worker 2s to 2s.au
```

Repeat the four checks with `2s.au` and `https://tada2you.com`.

## Changing the destination

Edit `TARGET_ORIGIN` in `wrangler.toml` (both environments are listed in full; `[env.staging]` inherits nothing) and deploy again. The value must be an origin only, such as `https://tada2you.com`, without a path or a trailing slash; `/health` answers 500 otherwise.
