# agent-code-server — help

## Commands

```
agent-code-server ping [page_client_id] [--json]
agent-code-server list / clients [--json]
agent-code-server open <path> [page_client_id] [--json]
agent-code-server active [page_client_id] [--json]
agent-code-server tabs [page_client_id] [--json]
agent-code-server --help / -h / help
agent-code-server tools
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
- `CICY_PANE_ID`   — default agent pane (e.g. `w-10001`)
- `CICY_GLOBAL_JSON` — global.json path override
