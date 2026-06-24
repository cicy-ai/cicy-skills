# global-api-token — help

## Synopsis

```
global-api-token <show|refresh> [--json]
global-api-token --help
```

## Commands

### `show`

Print the current `api_token` from `~/cicy-ai/global.json`.

- exit 0  → printed
- exit 1  → file corrupt
- exit 3  → file missing or `api_token` field missing

### `refresh`

Replace `api_token` with a new 32-byte random token (base64url, length 43) and
**email the new token** via the `email` skill (SMTP). The file is created if
missing; permissions are forced to 0600. The new token is emailed BEFORE it is
written, and only written if the send succeeds — so a failed delivery never
rotates (your current token keeps working).

- exit 0  → rotated + emailed (prints new token)
- exit 2  → no recipient (no `--to` and no email `default_to`)
- exit 3  → email skill not installed / SMTP not configured (NOT rotated)
- exit 4  → email send failed (NOT rotated)

## Options

- `--json` — emit `{ ok, data }` envelope instead of plain text
- `--to <addr>` — (refresh) recipient for the new token; defaults to the email
  skill's `default_to`
- `--no-email` / `--local` — (refresh) rotate WITHOUT emailing. Skips the email
  requirement; use only if you accept being locked out when you don't have the
  new token.

## Environment

- `CICY_GLOBAL_JSON` — override the default path (~/cicy-ai/global.json)

## Examples

```bash
# print token
global-api-token show

# get JSON
global-api-token show --json
# → {"ok":true,"data":"abc123..."}

# rotate
global-api-token refresh --json
# → {"ok":true,"data":{"api_token":"...","path":"...","refreshed_at":"..."}}
```
