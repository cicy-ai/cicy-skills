# cicy-todo — tools

## Endpoints

All on `http://127.0.0.1:$CICY_API_PORT/api/todo` (default port 8008).

| call                | use                                              |
|---------------------|--------------------------------------------------|
| `GET    /list`      | list todos for the requesting pane               |
| `POST   /add`       | create todo (`{title}`)                          |
| `PATCH  /<id>`      | update (`{status?, title?}`)                     |
| `DELETE /<id>`      | delete                                           |

Every request carries:
- `Authorization: Bearer <api_token>`
- `X-Agent-Show-Id: <pane>`

## Configuration

| path                       | mode | secret_fields  |
|----------------------------|------|----------------|
| `~/cicy-ai/global.json`    | 0600 | `api_token`    |

The token is also accepted from `CICY_API_TOKEN` env (overrides file).

## Environment variables

- `CICY_PANE_ID`     — default pane (w-xxxxx)
- `CICY_API_PORT`    — server port (default 8008)
- `CICY_API_TOKEN`   — bearer token override
- `CICY_GLOBAL_JSON` — global.json path override

## JSON output

`list --json`:
```json
{
  "ok": true,
  "data": {
    "pane": "w-10001",
    "todos": [
      { "id": "abc-123", "title": "...", "status": "todo", "created_at": "...", "updated_at": "..." }
    ]
  }
}
```

`add`/`start`/`done`/`drop`/`back`/`edit` `--json` returns whatever the server
returned (typically `{ todo: {...} }`) wrapped in `{ ok, data }`.

`rm --json` returns `{ ok: true, data: { ... } }`.
