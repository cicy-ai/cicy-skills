# email — tools

## External APIs

- `POST https://api.resend.com/emails` — send

## Configuration

| path                       | mode | secret_fields  |
|----------------------------|------|----------------|
| `~/cicy-ai/db/email.json`  | 0600 | `api_key`      |

Config keys:
- `api_key` — Resend api_key (`re_xxx...`)
- `from_address` — verified sender (or `onboarding@resend.dev` for sandbox)
- `default_to` — optional default recipient

## Environment variables

- `CICY_EMAIL_CONFIG` — override config path
- `EDITOR`/`VISUAL` — for `email config`

## JSON output

`status --json`:
```json
{
  "ok": true,
  "data": {
    "config_path": "...",
    "exists": true,
    "permissions": "0600",
    "api_key_set": true,
    "from_address_set": true,
    "default_to": null,
    "api_key_masked": "re_x***...."
  }
}
```

`send --json` (success):
```json
{ "ok": true, "data": { "id": "abc-123-..." } }
```

`send --json` (failure):
```json
{ "ok": false, "status": 422, "response": { "name": "validation_error", "message": "..." } }
```

## Exit codes

See [help.md](./help.md).
