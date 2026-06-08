# cicy-agent — tools

## Subcommand → endpoint

| subcmd          | method | path                       |
|-----------------|--------|----------------------------|
| `list` / `ls`   | GET    | `/api/tmux/panes`          |
| `tree`          | GET    | `/api/tmux/tree`           |
| `windows`       | GET    | `/api/tmux/windows`        |
| `capture`       | POST   | `/api/tmux/capture_pane`   |
| `reply`         | POST   | `/api/tmux/reply_text`     |
| `msg`           | POST   | `/api/tmux/send`           |
| `broadcast`     | GET ×2 + POST ×N | `/api/tmux/panes` + `/api/tmux/tree`, then `/api/tmux/send` per target (per-send timeout) |
| `get_online_agents` / `get_offline_agents` / `get_all_agents` | GET | `/api/tmux/panes` + `/api/tmux/tree` (online = session present in live tree) |
| `send-keys`     | POST   | `/api/tmux/send-keys`      |
| `restart`       | POST   | `/api/tmux/restart_all`    |
| `clear`         | POST   | `/api/tmux/clear`          |

All requests carry `Authorization: Bearer <api_token>`.

## Configuration

| path                              | mode | secret_fields  |
|-----------------------------------|------|----------------|
| `~/cicy-ai/global.json`           | 0600 | `api_token`    |
| `~/cicy-ai/db/cicy-agent.json`    | 0600 | per-node `api_token` |

`cicy-agent.json` is a JSON array: `[{name, api, api_token}, ...]`. Selected
with `--node NAME`. When omitted, the local cicy-code server is used.

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
