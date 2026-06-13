# globalApiToken — tools

For agents: where this skill reads/writes and what it returns.

## File operations

| op    | path                       | mode | when             |
|-------|----------------------------|------|------------------|
| read  | `~/cicy-ai/global.json`    | —    | `show`, `refresh` |
| write | `~/cicy-ai/global.json`    | 0600 | `refresh`        |

## Dependency

`refresh` shells out to the **`email`** skill (`email status` / `email send`) to
deliver the new token by SMTP. It refuses to rotate (exit 3) unless email is
configured, unless `--no-email` is passed.

## Environment variables

- `CICY_GLOBAL_JSON` — override the default path

## JSON output schema

`show --json`:

```json
{ "ok": true, "data": "abc123..." }
```

`refresh --json`:

```json
{
  "ok": true,
  "data": {
    "api_token": "abc123...",
    "path": "/home/<user>/cicy-ai/global.json",
    "refreshed_at": "2026-05-22T07:30:00.000Z",
    "emailed_to": "me@example.com"
  }
}
```

`emailed_to` is the recipient the new token was sent to, or `null` when
`--no-email` was used.

On error:

```json
{ "ok": false, "error": { "code": "NOT_FOUND", "message": "..." } }
```

## Error codes

| code                  | exit | meaning                                            |
|-----------------------|------|----------------------------------------------------|
| `NOT_FOUND`           | 3    | `~/cicy-ai/global.json` does not exist             |
| `MISSING_FIELD`       | 3    | the `api_token` key is absent                      |
| `CORRUPT`             | 1    | file exists but is not valid JSON                  |
| `INVALID_COMMAND`     | 2    | unknown subcommand                                 |
| `EMAIL_NOT_INSTALLED` | 3    | (refresh) `email` skill not found — NOT rotated    |
| `EMAIL_NOT_CONFIGURED`| 3    | (refresh) email has no SMTP config — NOT rotated   |
| `NO_RECIPIENT`        | 2    | (refresh) no `--to` and no email `default_to`      |
| `EMAIL_SEND_FAILED`   | 4    | (refresh) email send failed — NOT rotated          |
