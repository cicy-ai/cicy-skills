# cf — help

## Commands

```
cf config                                   Open ~/cicy-ai/db/cf.json in $EDITOR
cf status [--json]                          Show config state (api_token masked)
cf curl <METHOD> <PATH> [json-body]         Call CF API with token injected
cf exec <command> [args...]                 Run with CLOUDFLARE_API_TOKEN+ACCOUNT_ID env
cf --help / -h / help                       Print this help
```

## Examples

```bash
# bootstrap
cf config
cf status

# list zones
cf curl GET /zones | jq '.result[] | {id, name}'

# DNS records for a zone
cf curl GET /zones/<zone_id>/dns_records | jq

# create a DNS record
cf curl POST /zones/<zone_id>/dns_records \
  '{"type":"A","name":"sub","content":"1.2.3.4","ttl":1}'

# delete a DNS record
cf curl DELETE /zones/<zone_id>/dns_records/<record_id>

# spawn wrangler with creds injected
cf exec npx wrangler deploy
cf exec npx wrangler kv namespace create FOO
```

## Environment

- `CICY_CF_CONFIG` — override config path (default `~/cicy-ai/db/cf.json`)
- `EDITOR` / `VISUAL` — editor for `cf config`

## Exit codes

| code | meaning                                      |
|------|----------------------------------------------|
| 0    | success                                      |
| 1    | generic error / unparseable response         |
| 2    | invalid arguments                            |
| 3    | config missing or placeholder                |
| 4    | Cloudflare API returned non-2xx              |
| 5    | filesystem permission error                  |
