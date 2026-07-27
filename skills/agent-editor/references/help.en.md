# agent-editor — help

## Commands

```
agent-editor ping [page_client_id] [--json]
agent-editor list / clients [--json]
agent-editor open <path> [page_client_id] [--json]
agent-editor active [page_client_id] [--json]
agent-editor tabs [page_client_id] [--json]
agent-editor --help / -h / help
agent-editor tools
```

## `open` path syntax

| form                                | effect                          |
|-------------------------------------|---------------------------------|
| `open /abs/path/foo.ts`             | open the file                   |
| `open /abs/path/foo.ts:42`          | open at line 42                 |
| `open /abs/path/foo.ts:42:7`        | open at line 42, column 7       |
| `open /abs/path/foo.ts:42:7-50:1`   | select range 42:7 → 50:1        |
| `open file:///abs/path/foo.ts`      | `file://` URI form              |

## Environment

- `CICY_API_TOKEN` — bearer token override
- `CICY_API_PORT`  — server port (default 8008)
- `CICY_PANE_ID`   — default agent pane (e.g. `w-1001`)
- `CICY_GLOBAL_JSON` — global.json path override
