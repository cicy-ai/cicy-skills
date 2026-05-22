---
name: cf-tunnel
description: Manage Cloudflare Tunnel routes and DNS records on this host. Subcommands: config / status / list / add / del.
---

# Cloudflare Tunnel

> **Wrapper command:** `cf-tunnel`. Subcommands: `config` / `status` / `list` / `add` / `del`.
> Credentials live in `~/cicy-ai/db/cf.json` (chmod 600). The wrapper reads them — the agent never sees them.

## Credentials: hard rules

- **NEVER cat / Read / grep / print** `~/cicy-ai/db/cf.json`. The api_token is a user secret.
- If config is missing or placeholder, run `cf-tunnel config`. **Never ask the user to paste the api_token into chat.**
- `status` masks the api_token — trust its output.

## Config shape

```json
{
  "prod": {
    "api_token":  "<paste-your-cloudflare-api-token-here>",
    "account_id": "<paste-your-cloudflare-account-id-here>",
    "tunnel_id":  "<paste-your-cloudflare-tunnel-id-here>",
    "domain":     "<paste-your-domain-here>",
    "zone_id":    "<paste-your-cloudflare-zone-id-here>"
  }
}
```

A `dev` block is optional; use `CF_ENV=dev cf-tunnel ...` to target it.

If the existing `~/cicy-ai/db/cf.json` is flat (just `{api_token, account_id}`
from the `cf` skill), `cf-tunnel config` will preserve those values and add
the missing tunnel-specific fields.

## Bootstrap

1. `cf-tunnel status` — confirm config + token + tunnel reachability.
2. `cf-tunnel config` — opens placeholder in `$EDITOR`. Walk the user through
   filling in the five fields. **Never ask them to paste api_token into chat.**
3. `cf-tunnel list` — verify by listing current tunnel routes.
4. `cf-tunnel add 8080` — add route; hostname becomes `g-8080.<domain>`.

## Usage

```sh
cf-tunnel list                            # list current ingress + DNS
cf-tunnel add 8080                        # add g-8080.<domain> → http://localhost:8080
cf-tunnel add 5174 8010 13000             # add multiple at once
cf-tunnel del 8080                        # remove g-8080.<domain>
CF_ENV=dev cf-tunnel list                 # use the dev block
```

## Rules

1. The wrapper is the only thing that reads `~/cicy-ai/db/cf.json`. You do not.
2. If `status` says missing/placeholder, run `cf-tunnel config`.
3. `cf-tunnel` manages routes and DNS only — not the `cloudflared` daemon
   itself. To install/start the daemon, refer to the README on the host.
4. Hostname pattern is fixed: `g-<port>.<domain>`.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
