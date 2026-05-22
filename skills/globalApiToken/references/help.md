# globalApiToken — help

## Synopsis

```
globalApiToken <show|refresh> [--json]
globalApiToken --help
```

## Commands

### `show`

Print the current `api_token` from `~/cicy-ai/global.json`.

- exit 0  → printed
- exit 1  → file corrupt
- exit 3  → file missing or `api_token` field missing

### `refresh`

Replace `api_token` with a new 32-byte random token (base64url, length 43).
The file is created if missing. Permissions are forced to 0600.

- exit 0  → printed (new token)

## Options

- `--json` — emit `{ ok, data }` envelope instead of plain text

## Environment

- `CICY_GLOBAL_JSON` — override the default path (~/cicy-ai/global.json)

## Examples

```bash
# print token
globalApiToken show

# get JSON
globalApiToken show --json
# → {"ok":true,"data":"abc123..."}

# rotate
globalApiToken refresh --json
# → {"ok":true,"data":{"api_token":"...","path":"...","refreshed_at":"..."}}
```
