# cicy-agent — tools

## Subcommand → endpoint

| subcmd          | method | path                       |
|-----------------|--------|----------------------------|
| `list` / `ls`   | GET    | `/api/tmux/panes`          |
| `tree`          | GET    | `/api/tmux/tree`           |
| `windows`       | GET    | `/api/tmux/windows`        |
| `capture`       | POST   | `/api/tmux/capture_pane`   |
| `reply`         | POST   | `/api/tmux/reply_text`     |
| `history`       | POST   | `/api/tmux/chat_history`   |
| `msg`           | POST   | `/api/tmux/send`           |
| `broadcast`     | GET ×2 + POST ×N | `/api/tmux/panes` + `/api/tmux/tree`, then `/api/tmux/send` per target (per-send timeout) |
| `get_online_agents` / `get_offline_agents` / `get_all_agents` | GET | `/api/tmux/panes` + `/api/tmux/tree` (online = session present in live tree) |
| `send-keys`     | POST   | `/api/tmux/send-keys`      |
| `restart`       | POST   | `/api/tmux/restart_all`    |
| `clear`         | POST   | `/api/tmux/clear`          |
| `whoami`        | GET    | `/api/health` + `/api/code/instances` |
| `cloud ls` / `cloud agents` | GET | `/api/code/instances` + `/api/code/agents` |
| `msg <team.agent>` | POST + GET | Local `/api/im/cicy-cloud/send` + `/status` over WS; Worker `/api/code/messages` fallback |
| `reply/history/msgs <team.agent>` | POST + GET | Cloud `rpc_request/rpc_reply` through the same WS-first transport |

All requests carry `Authorization: Bearer <api_token>`.

## Configuration

| path                              | mode | secret_fields  |
|-----------------------------------|------|----------------|
| `~/cicy-ai/global.json`           | 0600 | `api_token`    |
| `~/cicy-ai/db/cloud-device.json`  | 0600 | Cloud session `token` |

Cross-Instance messages use the authenticated Cloud device session. Target
Instance API Tokens are never stored or supplied to `cicy-agent`.
The local cicy-code daemon sends through its connected WebSocket first. If that
path is unavailable, cicy-agent falls back to the durable Worker HTTP/D1 path.

Local and Cloud `msg` both print an id immediately and wait for structured
completion by default. `--no-wait` is asynchronous. Cloud callbacks use
`agent_reply.reply_to`; `capture` is never used for delivery or completion.
Cloud sends also print `transport=ws|http`, reporting the path actually used.

## Common payloads

```jsonc
// msg
POST /api/tmux/send
{ "pane_id": "w-10002", "text": "hello", "callback_to": "w-1001" }
// NB: answers HTTP 200 in both outcomes — success is {"success":true,...},
// failure is {"detail":"failed to send text: ..."} (broadcast checks this).

// send-keys
POST /api/tmux/send-keys
{ "pane_id": "w-1001", "keys": "ls -la Enter" }

// capture
POST /api/tmux/capture_pane
{ "pane_id": "w-1001" }
```
