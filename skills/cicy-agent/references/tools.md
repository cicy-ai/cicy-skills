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
| `msg_wait`      | POST   | `/api/tmux/send_wait`      |
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
{ "pane_id": "w-10002", "text": "hello", "callback_to": "w-10001" }

// msg_wait
POST /api/tmux/send_wait
{ "target": "w-10002", "text": "one-shot", "timeout": 60 }

// send-keys
POST /api/tmux/send-keys
{ "pane_id": "w-10001", "keys": "ls -la Enter" }

// capture
POST /api/tmux/capture_pane
{ "pane_id": "w-10001" }
```
