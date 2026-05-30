---
name: cicy-r2
description: Upload, download, list, and manage objects in the project Cloudflare R2 bucket (public CDN at r2.deepfetch.de5.net). Global-friendly replacement for the arrears-prone Tencent COS bucket.
---

# cicy-r2

Thin CLI over Cloudflare R2, driven by `~/cicy-ai/db/r2.json`. This is the
project's **global asset CDN** — anything that used to live on the Tencent
COS bucket (`cicy-1372193042.cos.ap-shanghai`) and needs a public,
overseas-reachable URL belongs here instead. COS returns HTTP 451 to
non-CN IPs and freezes the whole bucket on arrears; R2 has a permanent free
tier, no ICP filter, and CF edge caching. See [[tencent-cos-bucket]].

## Scope

Use this skill when the task involves:

- uploading a release asset / SPA bundle / installer / binary to R2
- getting a public CDN URL for a file (`https://r2.deepfetch.de5.net/<key>`)
- downloading an object back from R2
- deleting an object
- creating buckets or listing buckets / custom domains
- migrating asset references off Tencent COS onto R2

## Quick start

```bash
cicy-r2 info                                    # show active config (token redacted)
cicy-r2 put binaries/manifest.json /tmp/m.json  # upload local file → bucket key
cicy-r2 get binaries/manifest.json              # download (out defaults to ./manifest.json)
cicy-r2 url app/v3/assets/index.js              # print public https URL
cicy-r2 delete tmp/foo                          # delete object
cicy-r2 bucket-list                             # list buckets in the account
cicy-r2 domain-list                             # custom domains on current bucket
```

## Config — `~/cicy-ai/db/r2.json`

```json
{
  "account_id": "...",
  "api_token": "...",            // CF Bearer token (R2 admin) — drives everything
  "bucket": "cicy-assets-poc",
  "public_url": "https://r2.deepfetch.de5.net"
}
```

Permissions are `600` (contains the token). The CLI reads this file
directly; no env vars, no S3 credentials needed — a single CF Bearer token
covers put / get / delete / list / url / bucket ops.

## How it works

- **`put` / `get` / `delete` / `bucket-*` / `domain-list`** → `npx wrangler
  r2 ...`, invoked from `/home/cicy/projects/cicy-desktop/workers/render`
  (a dir that has `node_modules/wrangler`).
- **`list`** → Cloudflare REST API
  (`GET /accounts/{acc}/r2/buckets/{bucket}/objects`) with the same Bearer
  token, paginated via cursor. wrangler has no bulk list command, but the
  REST API does — so no S3 credentials are required.

## Rules

1. **Read the real config** at `~/cicy-ai/db/r2.json`; never hard-code keys.
2. **Public URL shape** is `{public_url}/{key}` — keep COS path layout
   (`app/v3/...`, `binaries/...`, `mihomo/...`) so only the host changes
   when migrating references, making rollback trivial.
3. **Verify after writes**: `curl -sI "$(cicy-r2 url <key>)"` should be 200.
4. Custom domain SSL is auto-issued by CF (~4 min, no manual step). If
   `domain-list` shows `ssl_status: pending`, just wait.
5. The bucket is **public-read** (r2.dev + custom domain enabled). Don't put
   secrets in it.

## References

- [help.md](./references/help.md) — full subcommand reference
