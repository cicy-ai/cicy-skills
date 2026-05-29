# agent-teams — tools

## Subcommand → wire protocol

Each subcommand spawns `agent-webpage exec-js '<expr>' --json` once.
The JS expression is an async IIFE that awaits the corresponding
`window.cicy.localTeams.*` call:

| subcmd   | JS expression                                                            |
|----------|---------------------------------------------------------------------------|
| list     | `(async () => await window.cicy.localTeams.list({ refresh: true }))()`    |
| add      | `(async () => await window.cicy.localTeams.add({...spec}))()`             |
| remove   | `(async () => await window.cicy.localTeams.remove("<id>"))()`             |
| update   | `(async () => await window.cicy.localTeams.update("<id>", {...patch}))()` |
| upgrade  | `(async () => await window.cicy.localTeams.upgrade("<id>"))()`            |
| open     | `(async () => await window.cicy.localTeams.open("<id>"))()`               |

`agent-webpage` carries the call over the chat WebSocket to the
connected cicy-desktop webview's preload, which routes through main's
`webview:relay` handler to the host renderer (App.jsx), which then calls
the real `window.cicy.localTeams.*` IPC against `local-teams.js` in the
main process. Every write to `~/cicy-ai/global.json` stays authoritative
on the desktop side.

## Auth + transport

Inherits everything from agent-webpage:

- Bearer token from `~/cicy-ai/global.json` `api_token`
- HTTP `POST 127.0.0.1:$CICY_API_PORT/api/chat/push`
- WS  `ws://127.0.0.1:$CICY_API_PORT/api/chat/ws?agent_id=…&token=…`
- Default 15 s timeout (override with `CICY_AGENT_TIMEOUT_MS`)

## Result envelope

`agent-webpage exec-js --json` returns:

```json
{ "ok": true, "data": { "requestId": "…", "result": "<json-string-or-scalar>" } }
```

`agent-teams` parses one level of JSON from `data.result` (the SPA's
`exec_js` handler `JSON.stringify`s objects before sending) and then
either pretty-prints or re-wraps as `{ ok, data }` when the user passed
`--json`.

## Examples

```bash
agent-teams list
agent-teams list --json

agent-teams add \
  --name "本地团队" \
  --base-url "http://127.0.0.1:8008" \
  --token cicy_xxx \
  --source helper-mac-linux \
  --os darwin --arch arm64 \
  --path "$HOME/.local/bin/cicy-code"

agent-teams update local-8008 --token cicy_newtok
agent-teams upgrade local-8008
agent-teams open local-8008
agent-teams remove local-8008
```
