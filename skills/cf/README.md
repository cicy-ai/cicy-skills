# cf — Cloudflare API wrapper

> Source-only Node.js, 214 LOC. Read [`bin/cf`](./bin/cf).

## What it does

- `cf config`  — open `~/cicy-ai/db/cf.json` in `$EDITOR` (creates 0600 placeholder)
- `cf status`  — show config state with masked api_token
- `cf curl <METHOD> <PATH> [body]` — call the Cloudflare API; `Authorization: Bearer <token>` injected automatically
- `cf exec <command>` — spawn a child with `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` env injected (works with wrangler, terraform, etc.)

## Install

```bash
cicy-code skill install cf
```

## Configure

```bash
cf status              # check
cf config              # open editor
cf curl GET /zones     # verify
```

## Security

The api_token lives in `~/cicy-ai/db/cf.json` at mode 0600. The wrapper reads
it; the agent **never** sees the raw token. `status` masks the token; `curl`
injects the header itself.

## License

MIT
