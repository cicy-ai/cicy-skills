# cf — tools

## External APIs

- `https://api.cloudflare.com/client/v4{path}` — all `cf curl` calls

## Configuration

| path                       | mode | secret_fields           |
|----------------------------|------|-------------------------|
| `~/cicy-ai/db/cf.json`     | 0600 | `api_token`, `account_id` |

The wrapper auto-creates a placeholder file (with literal `<paste-...-here>`
strings) at mode 0600 on `cf config` if missing.

## Environment variables

- `CICY_CF_CONFIG` — override config path
- `EDITOR`, `VISUAL` — editor for `cf config`

When `cf exec` is invoked, the child process additionally sees:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID` (if set in config)

## Output

`cf curl` prints the raw Cloudflare JSON response. Use `jq` to extract fields.

`cf status` (text) prints 5 lines of config state. With `--json`:

```json
{
  "ok": true,
  "data": {
    "config_path": "...",
    "exists": true,
    "permissions": "0600",
    "api_token_set": true,
    "account_id_set": true,
    "api_token_masked": "abcd***wxyz"
  }
}
```
