# skill-template — tools

For agents: this file documents the API surface, env vars, and exit codes.

## Endpoints / external APIs

- (none) | or list `https://api.example.com/...`

## Configuration files

| path                              | mode | purpose         |
|-----------------------------------|------|-----------------|
| `~/cicy-ai/db/skill-template.json`| 0600 | (replace)       |

## Environment variables

| name                  | default        | meaning            |
|-----------------------|----------------|--------------------|
| `CICY_DB_OVERRIDE`    | `~/cicy-ai/db` | override db dir    |
| `CICY_API_TOKEN`      | (config file)  | override api_token |

## Exit codes

See [help.md](./help.md).

## JSON output schema

`skill-template do-something --json`:

```json
{
  "ok": true,
  "data": { ... }
}
```

On error:

```json
{
  "ok": false,
  "error": { "code": "STRING_CODE", "message": "human description" }
}
```
