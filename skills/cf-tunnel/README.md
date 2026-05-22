# cf-tunnel — Cloudflare Tunnel routes

> Source-only Node.js, 407 LOC. Read [`bin/cf-tunnel`](./bin/cf-tunnel).

## What it does

- `cf-tunnel config`  — open `~/cicy-ai/db/cf.json` in `$EDITOR` (creates 0600 placeholder)
- `cf-tunnel status`  — show 5-field config state with masked api_token
- `cf-tunnel list`    — list current `g-*.<domain>` routes (ingress + DNS)
- `cf-tunnel add 8080 [<port> ...]` — add ingress rule + DNS CNAME (proxied)
- `cf-tunnel del 8080 [<port> ...]` — remove both

Hostname pattern: `g-<port>.<domain>` → `http://localhost:<port>`.

## Install

```bash
cicy-code skill install cf-tunnel
```

## Configure

```bash
cf-tunnel status
cf-tunnel config
cf-tunnel list
cf-tunnel add 8080
```

## Environments

Set `CF_ENV=dev` to use a `dev` block in the config:

```bash
CF_ENV=dev cf-tunnel list
```

## Required token scopes

The api_token must have:
- **Account** → *Cloudflare Tunnel:Edit* (for ingress configurations)
- **Zone** → *DNS:Edit* (for the target zone)

## License

MIT
