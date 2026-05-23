# agent-code-server — tools

## Subcommand → wire protocol

All RPC subcommands POST `/api/chat/push` with `wait_ack:true`. The server
injects requestId into `data`, sends to the target client, and blocks until
the matching response is received.

| subcmd        | type             | extension responds with     |
|---------------|------------------|-----------------------------|
| `ping`        | `host.ping`      | `code.pong`                 |
| `open`        | `host.open_file` | `code.opened` / `code.open_file_error` |
| `active`      | `host.active_file` | `code.active_file`        |
| `tabs`        | `host.list_tabs` | `code.tabs`                 |
| `list`        | (none — GET `/api/chat/clients`) | — |

For `open`, the wrapper additionally fires an async `code.show_files` event
to bring the Files panel forward (extension only activates when its workbench
is visible).

## Auth + endpoints

- `Authorization: Bearer <api_token>` from `~/cicy-ai/global.json`
- `POST http://127.0.0.1:$CICY_API_PORT/api/chat/push`
- `GET  http://127.0.0.1:$CICY_API_PORT/api/chat/clients`

## Configuration

| path                       | mode | secret_fields  |
|----------------------------|------|----------------|
| `~/cicy-ai/global.json`    | 0600 | `api_token`    |

## Targeting

- explicit: pass `page_client_id` as last positional arg
- implicit: current agent's `w-<id>` (from `CICY_PANE_ID` env or cwd) — must have **exactly one** non-`:code-ext` page client

## Retry behaviour

`open` retries up to 30 seconds when the response is `client not found`,
since the extension only awakens after the iframe is shown. Each attempt
is gated on a 1s sleep. Other errors fail immediately.

## JSON output

`open --json`: `{ ok, data: { opened: true, path, attempts, page_client_id } }`
`ping --json`: `{ ok, data: { connected: true, version, ... } }`
`active --json` / `tabs --json`: extension payload as-is.
`list --json`: `{ ok, data: [ { agent_id, page_client_id, code_server_client_id, code_server_connected } ] }`
