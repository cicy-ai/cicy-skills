# cf-tunnel — Cloudflare named tunnels + routes

> Source-only Node.js. Read [`bin/cf-tunnel`](./bin/cf-tunnel).

## What it does

Named tunnels (primary):

- `cf-tunnel tunnels` — tree of tunnels → their hostnames (live from CF API)
- `cf-tunnel sync`    — regenerate `<env>.tunnels` in `~/cicy-ai/db/cf-tunnel.json`
  (`{id, token, hostnames:[{hostname, service}]}` per tunnel)
- `cf-tunnel create <name> [--host <h>] [--service <url>|--port <n>]` — provision
  end-to-end: tunnel + ingress + proxied DNS CNAME + connector token → registry
- `cf-tunnel rm <name>` — delete tunnel + its DNS + registry entry

Legacy fixed-tunnel port routes (need `tunnel_id` in config):

- `cf-tunnel list`    — list all routes of the fixed tunnel
- `cf-tunnel add 8080 [<port> ...]` — add `8080.<domain>` → `http://localhost:8080`
- `cf-tunnel del 8080 [<port> ...]` — remove route + DNS (also matches old `g-<port>` names)

Plus `cf-tunnel config` / `cf-tunnel status` for credential setup (0600, masked output).

## Install

```bash
cicy-code skill install cf-tunnel
```

## Configure

```bash
cf-tunnel status
cf-tunnel config
cf-tunnel sync
cf-tunnel create myapp --port 3000
```

## Environments

Set `CF_ENV=dev` to use a `dev` block in the config:

```bash
CF_ENV=dev cf-tunnel sync
```

## Required token scopes

The api_token must have:
- **Account** → *Cloudflare Tunnel:Edit* (create/delete tunnels, ingress, tokens)
- **Zone** → *DNS:Edit* (for the target zone)

## License

MIT
