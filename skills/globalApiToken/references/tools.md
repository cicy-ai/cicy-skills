# globalApiToken — tools

For agents: where this skill reads/writes and what it returns.

## File operations

| op    | path                       | mode | when             |
|-------|----------------------------|------|------------------|
| read  | `~/cicy-ai/global.json`    | —    | `show`, `refresh` |
| write | `~/cicy-ai/global.json`    | 0600 | `refresh`        |

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
    "refreshed_at": "2026-05-22T07:30:00.000Z"
  }
}
```

On error:

```json
{ "ok": false, "error": { "code": "NOT_FOUND", "message": "..." } }
```

## Error codes

| code               | exit | meaning                                  |
|--------------------|------|------------------------------------------|
| `NOT_FOUND`        | 3    | `~/cicy-ai/global.json` does not exist   |
| `MISSING_FIELD`    | 3    | the `api_token` key is absent            |
| `CORRUPT`          | 1    | file exists but is not valid JSON        |
| `INVALID_COMMAND`  | 2    | unknown subcommand                       |
