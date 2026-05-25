# cicy-todo — central todo list

> Source-only Node.js. Read [`bin/cicy-todo`](./bin/cicy-todo).

## What it does

A thin client for cicy-code's `/api/todo/*`. All todos live in **one** store
inside the master pane (`w-10001`) workspace at `<master-ws>/.cicy/todos.yaml`.
Each todo carries a `pane_id` recording the worker that owns it.

- Workers only see / modify their own todos (server enforces this).
- The master pane sees everything and can scope via `--pane <w-xxxxx>`.

The CLI identifies itself with `X-Agent-Show-Id: $X_AGENT_SHORT_ID`, the env
var the cicy-code tmux boot script sets in every pane.

## Install

```bash
cicy-code skill install cicy-todo
```

## Usage

```bash
# In any worker pane (e.g. w-10025) — own todos only.
cicy-todo                           # list active
cicy-todo add "Ship it"
cicy-todo start <id>                # → doing
cicy-todo done  <id>                # → done
cicy-todo drop  <id>                # → dropped
cicy-todo back  <id>                # → todo
cicy-todo edit  <id> "<new title>"
cicy-todo rm    <id>

# In the master pane (w-10001).
cicy-todo                           # all workers' active todos
cicy-todo --pane w-10025            # scope to one worker
cicy-todo --pane w-10025 add "ship it"
cicy-todo --pane w-10025 done t-1779
```

## Requires

- cicy-code server on `127.0.0.1:8008` (override with `CICY_API_PORT`)
- `~/cicy-ai/global.json` with `api_token` (or `CICY_API_TOKEN` env)
- `X_AGENT_SHORT_ID` set in the pane (cicy-code's boot script handles this)

## License

MIT
