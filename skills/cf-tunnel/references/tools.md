# cf-tunnel — tools

## External APIs

| call                                                                   | use                                        |
|------------------------------------------------------------------------|--------------------------------------------|
| `GET    /accounts/<account_id>/cfd_tunnel?is_deleted=false`             | list named tunnels (tunnels / sync / create) |
| `POST   /accounts/<account_id>/cfd_tunnel`                              | create a named tunnel (create)             |
| `DELETE /accounts/<account_id>/cfd_tunnel/<id>?cascade=true`            | delete a named tunnel (rm)                 |
| `GET    /accounts/<account_id>/cfd_tunnel/<id>/token`                   | fetch connector token (sync / create)      |
| `GET    /accounts/<account_id>/cfd_tunnel/<id>/configurations`          | read ingress                               |
| `PUT    /accounts/<account_id>/cfd_tunnel/<id>/configurations`          | replace ingress (create / add / del)       |
| `GET    /zones/<zone_id>/dns_records`                                   | list CNAME records                         |
| `POST   /zones/<zone_id>/dns_records`                                   | create CNAME (create / add)                |
| `PATCH  /zones/<zone_id>/dns_records/<id>`                              | fix CNAME if mismatched                    |
| `DELETE /zones/<zone_id>/dns_records/<id>`                              | remove CNAME (rm / del)                    |

DNS CNAMEs always point at `<tunnel_id>.cfargotunnel.com` and are proxied.

## Configuration / registry

| path                          | mode | secret_fields                                     |
|-------------------------------|------|---------------------------------------------------|
| `~/cicy-ai/db/cf-tunnel.json` | 0600 | `api_token`, `account_id`, `zone_id`, `tunnels.*.token` |
| `~/cicy-ai/db/cf.json`        | 0600 | credential fallback (read-only) when the registry is absent |

Registry layout (`sync` regenerates `tunnels`; `create` appends to it):

```json
{
  "prod": {
    "api_token": "...", "account_id": "...", "domain": "...", "zone_id": "...",
    "tunnels": {
      "<name>": {
        "id": "<tunnel uuid>",
        "token": "<connector token — pass to `cloudflared tunnel run --token`>",
        "hostnames": [ { "hostname": "<fqdn>", "service": "http://localhost:<port>" } ]
      }
    }
  },
  "dev": { }
}
```

Legacy `tunnel_id` (a single fixed tunnel for `add`/`del`/`list` g-<port>
routes) is still honored but no longer required for the named-tunnel commands.
The wrapper also accepts a flat top-level form (without `prod`) for
compatibility with the `cf` skill, treating it as the `prod` block.

## Environment variables

- `CICY_CF_CONFIG` — override config path
- `CF_ENV` — env block name (default `prod`)

## JSON output

`tunnels --json`:
```json
{ "ok": true, "data": { "env": "prod", "tunnels": [
  { "name": "cloudshell", "id": "…", "status": "healthy",
    "hostnames": [{ "hostname": "cloudshell.example.com", "service": "http://localhost:8008" }] }
] } }
```

`sync --json` (tokens masked in output; full tokens go only to the registry file):
```json
{ "ok": true, "data": { "env": "prod", "path": "~/cicy-ai/db/cf-tunnel.json", "tunnels": [
  { "name": "cloudshell", "id": "…", "status": "down", "hostnames": [ … ], "token_masked": "eyJh***dQ==" }
] } }
```

`create --json`:
```json
{ "ok": true, "data": { "env": "prod", "name": "api", "id": "…", "created": true,
  "hostname": "api.example.com", "service": "http://localhost:8009",
  "dns": "created", "token_masked": "eyJh***dQ==", "registry": "~/cicy-ai/db/cf-tunnel.json" } }
```

`rm --json`:
```json
{ "ok": true, "data": { "env": "prod", "name": "api", "id": "…", "dns_deleted": ["api.example.com"] } }
```

`status --json` adds `tunnels`: the names registered in the registry.
Legacy `list/add/del --json` shapes are unchanged.
