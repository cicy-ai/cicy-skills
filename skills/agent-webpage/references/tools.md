# agent-webpage — tools

## Subcommand → wire protocol

Every RPC subcommand:

1. Connects WebSocket to `ws://127.0.0.1:$CICY_API_PORT/api/chat/ws?agent_id=<pane>&token=<api_token>`.
2. Once open, POST `/api/chat/push` with `{ agent_id, client_id, type, data }`.
3. Awaits a WS message with matching `type` and `data.requestId`.

| subcmd                       | sent type      | awaited type       |
|------------------------------|----------------|--------------------|
| `ping`                       | `webpage_ping` | `webpage_pong`     |
| `ipc-ping`                   | `ipc_ping`     | `ipc_pong`         |
| `exec-js`                    | `exec_js`      | `exec_js_result`   |
| `current-active-agent-id`    | `exec_js`      | `exec_js_result`   |
| `current-master-agent-id`    | `exec_js`      | `exec_js_result`   |
| `send <type> <data> [exp]`   | `<type>`       | `<exp>` or any with matching `requestId` |
| `clients`                    | (none — GET `/api/chat/clients`) | — |
| `helper-init`                | `exec_js` (auto-resolved web-* client; runs a single payload that returns `{lang, area, isElectron}` — silent, JSON to stdout) | `exec_js_result` |

## Auth + endpoints

- `Authorization: Bearer <api_token>` from `~/cicy-ai/global.json`
- HTTP: `POST http://127.0.0.1:$CICY_API_PORT/api/chat/push`, `GET /api/chat/clients`
- WS:   `ws://127.0.0.1:$CICY_API_PORT/api/chat/ws?agent_id=…&token=…`

## Configuration

| path                       | mode | secret_fields  |
|----------------------------|------|----------------|
| `~/cicy-ai/global.json`    | 0600 | `api_token`    |

## Targeting

- explicit: pass `client_id` as last positional arg
- implicit: current agent's `w-<id>` (from `CICY_PANE_ID` env or cwd) — must have **exactly one** non-`:code-ext` client

## Timeouts

Default 15s. Override per process with `CICY_AGENT_TIMEOUT_MS`.

## Examples

```bash
# title of the live page
agent-webpage exec-js 'document.title' web-abc123

# arbitrary JSON in / out
agent-webpage send my_action '{"x":1}' web-abc123 my_action_reply --json
```
