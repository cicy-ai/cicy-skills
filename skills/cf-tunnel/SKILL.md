---
name: cf-tunnel
description: Manage Cloudflare NAMED tunnels (token/name → hostname list), routes and DNS. Subcommands: config / status / tunnels / sync / create / rm / list / add / del.
---

# Cloudflare Tunnel

> **Wrapper command:** `cf-tunnel`. Subcommands: `config` / `status` / `tunnels` /
> `sync` / `create` / `rm` + legacy `list` / `add` / `del`.
> Credentials + tunnel registry live in `~/cicy-ai/db/cf-tunnel.json` (chmod 600).
> The wrapper reads them — the agent never sees them.

## Credentials: hard rules

- **NEVER cat / Read / grep / print** `~/cicy-ai/db/cf-tunnel.json` or `~/cicy-ai/db/cf.json`.
  The api_token and every `tunnels.*.token` are user secrets.
- If config is missing or placeholder, run `cf-tunnel config`. **Never ask the user to paste tokens into chat.**
- `status` / `sync` / `create` mask tokens in their output — trust that output.

## Registry shape (~/cicy-ai/db/cf-tunnel.json)

One named tunnel = one connector token; under it, the list of hostnames it serves:

```json
{
  "prod": {
    "api_token":  "<cloudflare api token>",
    "account_id": "<cloudflare account id>",
    "domain":     "<zone apex, e.g. example.com>",
    "zone_id":    "<cloudflare zone id>",
    "tunnels": {
      "cloudshell": {
        "id": "<tunnel uuid>",
        "token": "<connector token>",
        "hostnames": [
          { "hostname": "cloudshell.example.com", "service": "http://localhost:8008" }
        ]
      }
    }
  }
}
```

A `dev` block is optional; use `CF_ENV=dev cf-tunnel ...` to target it.
If only a flat `~/cicy-ai/db/cf.json` exists (from the `cf` skill), its
credentials are used as fallback; writes always go to `cf-tunnel.json`.

## Named tunnels (primary workflow)

```sh
cf-tunnel tunnels                      # tree: each tunnel → its hostnames (live)
cf-tunnel sync                         # regenerate <env>.tunnels in the registry from the CF API
cf-tunnel create cloudshell            # provision: tunnel + ingress + DNS + token → registry
cf-tunnel create api --port 8009       # api.<domain> → http://localhost:8009
cf-tunnel rm api                       # delete tunnel + DNS + registry entry
```

`create` is end-to-end: create/reuse tunnel by name → upsert ingress rule →
upsert proxied DNS CNAME → fetch connector token → save
`{id, token, hostnames}` under `<env>.tunnels.<name>`. Run the connector on the
target host with `cloudflared tunnel run --token <token from registry>` (or
cicy-code's `--cft-token`).

## Legacy fixed-tunnel routes

`list` / `add <port>` / `del <port>` manage `g-<port>.<domain>` routes on the
single tunnel configured as `tunnel_id` — kept for backward compatibility and
only these three require `tunnel_id`.

## Bootstrap

1. `cf-tunnel status` — confirm config + token; shows registered tunnel names.
2. `cf-tunnel config` — opens the file in `$EDITOR`. Walk the user through the
   four credential fields. **Never ask them to paste tokens into chat.**
3. `cf-tunnel sync` — pull existing tunnels (+tokens) into the registry.
4. `cf-tunnel create <name>` — provision a new stable hostname.

## Rules

1. The wrapper is the only thing that reads the registry. You do not.
2. If `status` says missing/placeholder, run `cf-tunnel config`.
3. `cf-tunnel` manages tunnels, routes and DNS — not the `cloudflared` daemon
   itself. To install/start the daemon, refer to the README on the host.
4. `create` hostnames must be inside the configured zone (`<domain>`).

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
