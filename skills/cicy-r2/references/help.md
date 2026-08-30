# cicy-r2 — subcommand reference

All commands read `~/cicy-ai/db/r2.json` for account/bucket/credentials.

## info

```bash
cicy-r2 info
```

Prints the active config with `account_id` / `api_token` redacted. Use to
confirm which bucket + public URL is wired before any write.

## put

```bash
cicy-r2 put <key> <local-file>
```

Uploads `<local-file>` to the bucket under `<key>`. Key may contain `/`
(creates nested "folders"). Backend: `wrangler r2 object put`.

Example:
```bash
cicy-r2 put app/v3/assets/index-ABC.js dist/assets/index-ABC.js
```

## get

```bash
cicy-r2 get <key> [out]
```

Downloads object `<key>`. `out` defaults to `./<basename(key)>`.

## delete

```bash
cicy-r2 delete <key>
```

Deletes object `<key>`. Verify with `curl -sI "$(cicy-r2 url <key>)"` → 404.

## url

```bash
cicy-r2 url <key>
```

Prints `{public_url}/{key}`. Pure string op, no network. Pipe into curl:
```bash
curl -sI "$(cicy-r2 url binaries/manifest.json)"
```

## list

```bash
cicy-r2 list [prefix]
```

Lists objects, optionally filtered by key prefix. Uses the Cloudflare REST
API (`GET /accounts/{acc}/r2/buckets/{bucket}/objects`) with the Bearer
`api_token` — no S3 credentials needed. Paginates via cursor, prints each
key + size, then a total count / MB summary.

```bash
cicy-r2 list                # all objects
cicy-r2 list app/v3/        # only keys under app/v3/
```

## bucket-create / bucket-list

```bash
cicy-r2 bucket-create <name>
cicy-r2 bucket-list
```

Create / list buckets in the account.

## domain-list

```bash
cicy-r2 domain-list
```

Lists custom domains attached to the current bucket, with `ssl_status`.
After `wrangler r2 bucket domain add`, SSL auto-issues in ~4 minutes; watch
for `ssl_status: active`.

## Backend notes

- wrangler runs from `/home/cicy/projects/cicy-desktop/workers/render`
  (needs `node_modules/wrangler`). If that dir moves, edit `wrangler()` in
  the script.
- wrangler 3.x prints an out-of-date warning on every call — harmless.
- The `api_token` is a CF Bearer token with R2 admin scope. It drives every
  subcommand — both wrangler ops and the REST list. No S3 access key /
  secret needed (that's only for third-party S3 tools like rclone, which
  this CLI doesn't use).

## Migration context

This bucket replaces Tencent COS for global asset delivery. COS hard-codes
to migrate (host → `r2.deepfetch.de5.net`, path unchanged):

| Old COS URL prefix | New R2 prefix |
|---|---|
| `cicy-1372193042.cos.ap-shanghai.myqcloud.com/app/v3/` | `r2.deepfetch.de5.net/app/v3/` |
| `.../binaries/` | `r2.deepfetch.de5.net/binaries/` |
| `.../mihomo/` `.../rootfs/` `.../ttyd/` `.../installers/` | same path under R2 host |

COS GetObject is frozen during arrears (even signed), so bulk-mirroring
COS→R2 requires recharging COS first, OR just publishing fresh release
assets straight to R2 and letting old clients drain off COS.

## wrangler `--remote`

`put` / `get` / `delete` always pass `--remote`. Since wrangler 4, the
`r2 object` commands default to the **local simulated store**
(`.wrangler/state/v3/r2/` under the wrangler cwd): a put prints
"Upload complete" while writing nothing to the real bucket, and the object
never appears in `list` (which goes through the REST API) or at the public
URL. If you invoke wrangler by hand, add `--remote` yourself.
