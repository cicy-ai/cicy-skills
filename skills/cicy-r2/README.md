# cicy-r2

> Source-only Python. Read [`bin/cicy-r2`](./bin/cicy-r2).

Thin CLI over Cloudflare R2, driven by `~/cicy-ai/db/r2.json`. The project's
global asset CDN — anything that used to live on the Tencent COS bucket and
needs a public, overseas-reachable URL goes here instead. COS returns HTTP
451 to non-CN IPs and freezes the whole bucket on arrears; R2 has a
permanent free tier, no ICP filter, and CF edge caching.

## Config

`~/cicy-ai/db/r2.json` (perms `600`):

```json
{
  "account_id": "...",
  "api_token": "...",
  "bucket": "cicy-assets-poc",
  "public_url": "https://r2.deepfetch.de5.net"
}
```

A single CF Bearer `api_token` drives everything — no S3 credentials.

## Usage

```bash
cicy-r2 info                                    # show config (token redacted)
cicy-r2 put binaries/manifest.json /tmp/m.json  # upload local file → bucket key
cicy-r2 get binaries/manifest.json              # download (out defaults to ./manifest.json)
cicy-r2 list app/v3/                            # list objects under a prefix
cicy-r2 url app/v3/assets/index.js              # print public https URL
cicy-r2 delete tmp/foo                          # delete object
cicy-r2 bucket-list                             # list buckets in the account
cicy-r2 domain-list                             # custom domains on current bucket
```

## How it works

- `put` / `get` / `delete` / `bucket-*` / `domain-list` → `npx wrangler r2 ...`
- `list` → Cloudflare REST API (`GET /accounts/{acc}/r2/buckets/{bucket}/objects`),
  paginated via cursor — wrangler has no bulk list, the REST API does.

Both paths authenticate with the same Bearer `api_token`. No S3 access key /
secret needed.

## Migration note

This bucket replaces Tencent COS for global asset delivery. Keep the COS
path layout (`app/v3/...`, `binaries/...`, `mihomo/...`) so only the host
changes when migrating references — `r2.deepfetch.de5.net/<same-path>`.

See [`references/help.md`](./references/help.md) for the full subcommand reference.
