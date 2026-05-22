# cf-tunnel — tools

## External APIs

| call                                                                | use                                  |
|---------------------------------------------------------------------|--------------------------------------|
| `GET    /accounts/<account_id>/cfd_tunnel/<tunnel_id>/configurations` | read ingress                         |
| `PUT    /accounts/<account_id>/cfd_tunnel/<tunnel_id>/configurations` | replace ingress (used by add/del)    |
| `GET    /zones/<zone_id>/dns_records`                                | list CNAME records                   |
| `POST   /zones/<zone_id>/dns_records`                                | create CNAME on add                  |
| `PATCH  /zones/<zone_id>/dns_records/<id>`                           | fix CNAME on add (if mismatched)     |
| `DELETE /zones/<zone_id>/dns_records/<id>`                           | remove CNAME on del                  |

DNS CNAMEs always point at `<tunnel_id>.cfargotunnel.com` and are proxied.

## Configuration

| path                       | mode | secret_fields                                       |
|----------------------------|------|-----------------------------------------------------|
| `~/cicy-ai/db/cf.json`     | 0600 | `api_token`, `account_id`, `tunnel_id`, `zone_id`   |

Layout:
```json
{
  "prod": { "api_token": "...", "account_id": "...", "tunnel_id": "...", "domain": "...", "zone_id": "..." },
  "dev":  { ... }   // optional
}
```

The wrapper also accepts a flat top-level form (without `prod`) for
compatibility with the `cf` skill, treating it as the `prod` block.

## Environment variables

- `CICY_CF_CONFIG` — override config path
- `CF_ENV` — env block name (default `prod`)

## JSON output

`status --json`:
```json
{
  "ok": true,
  "data": {
    "env": "prod",
    "config_path": "...",
    "exists": true,
    "permissions": "0600",
    "fields": { "api_token": true, "account_id": true, "tunnel_id": true, "domain": true, "zone_id": true },
    "api_token_masked": "abcd***wxyz"
  }
}
```

`list --json`:
```json
{
  "ok": true,
  "data": {
    "env": "prod",
    "domain": "example.com",
    "routes": [{ "port": 8080, "hostname": "g-8080.example.com", "service": "http://localhost:8080" }],
    "dns_count": 1
  }
}
```

`add --json` / `del --json`:
```json
{
  "ok": true,
  "data": {
    "env": "prod",
    "added":   [{ "port": 8080, "hostname": "g-8080.example.com", "service": "...", "dns": "created" }],
    "removed": [{ "port": 8080, "hostname": "g-8080.example.com", "dns": "deleted" }]
  }
}
```

## Exit codes

See [help.md](./help.md).
