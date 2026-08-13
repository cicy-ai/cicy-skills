# cf-tunnel — help

## Commands

```
cf-tunnel config                          Open the config in $EDITOR
cf-tunnel status  [--json]                Show config state + registered tunnels
cf-tunnel tunnels [--json]                Tree: each tunnel → its hostnames (live, from CF API)
cf-tunnel sync    [--json]                Regenerate accounts.<key>.tunnels in ~/cicy-ai/db/cf-tunnel.json
                                          from the CF API (id + connector token + hostname list)
cf-tunnel create <name> [--host <h>] [--service <url>|--port <n>] [--json]
                                          Provision a NAMED tunnel end-to-end: create/reuse the
                                          tunnel, add ingress <h>→service, upsert proxied DNS
                                          CNAME, fetch the connector token, save the entry to
                                          the registry. Defaults: host=<name>.<domain>,
                                          service=http://localhost:8008
cf-tunnel rm <name> [--json]              Delete a named tunnel + its DNS + registry entry
cf-tunnel list   [--json]                 (legacy) List all routes of the fixed tunnel_id
cf-tunnel add    <port> [<port> ...]      (legacy) Add <port>.<domain> route
cf-tunnel del    <port> [<port> ...]      (legacy) Remove <port>.<domain> route (also matches old g-<port>)
cf-tunnel --help / -h / help              Print this help
```

## Registry (~/cicy-ai/db/cf-tunnel.json)

One tunnel = one connector token; the hostnames list is the domains served
through it:

```json
{
  "default": "main",
  "accounts": { "main": {
    "api_token": "...", "account_id": "...", "domain": "...", "zone_id": "...",
    "tunnels": {
      "cloudshell": {
        "id": "744e1a6d-…",
        "token": "eyJ…",
        "hostnames": [
          { "hostname": "cloudshell.example.com", "service": "http://localhost:8008" }
        ]
      }
    }
  } }
}
```

## Examples

```bash
# bootstrap
cf-tunnel status
cf-tunnel config

# named tunnels
cf-tunnel tunnels                          # live tree: tunnel → hostnames
cf-tunnel sync                             # write all tunnels (+tokens) into the registry
cf-tunnel create cloudshell                # cloudshell.<domain> → http://localhost:8008
cf-tunnel create api --port 8009           # api.<domain> → http://localhost:8009
cf-tunnel create web --host www.example.com --service http://localhost:3000
cf-tunnel rm api

# run a connector with a saved token (never print the token itself)
# The wrapper keeps connector tokens private. Start cloudflared through the
# product integration that consumes accounts.<key>.tunnels.<name>.token.

# legacy fixed-tunnel port routes (add 8080 → 8080.<domain> → localhost:8080)
cf-tunnel list
cf-tunnel add 8080
cf-tunnel del 8080

# legacy environment-block config only
CF_ENV=dev cf-tunnel sync
```

## Environment

- `CICY_CF_CONFIG` — override config path (default `~/cicy-ai/db/cf-tunnel.json`,
  falling back to `~/cicy-ai/db/cf.json` for credentials if the registry is absent;
  writes always go to `~/cicy-ai/db/cf-tunnel.json`)
- `CF_ACCOUNT`     — select an `accounts` key (default: top-level `default`)
- `CF_ENV`         — legacy env-block selector (default `prod`)
- `EDITOR`/`VISUAL` — editor for `cf-tunnel config`
