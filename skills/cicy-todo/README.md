# cicy-todo — per-workspace todo list

> Source-only Node.js, 247 LOC. Read [`bin/cicy-todo`](./bin/cicy-todo).

## What it does

A thin client for cicy-code's `/api/todo/*`. Each `w-xxxxx` pane has its own
`<workspace>/.cicy/todos.yaml`; the CLI sends `X-Agent-Show-Id: <pane>` so the
server can route to the right file.

## Install

```bash
cicy-code skill install cicy-todo
```

## Usage

```bash
cicy-todo                           # list own active todos
cicy-todo add "Ship it"
cicy-todo start <id>                # → doing
cicy-todo done  <id>                # → done
cicy-todo drop  <id>                # → dropped
cicy-todo back  <id>                # → todo
cicy-todo edit  <id> "<new title>"
cicy-todo rm    <id>

# act on another pane:
cicy-todo w-10001                   # list w-10001's
cicy-todo w-10001 add "ship it"
```

## Requires

- cicy-code server on `127.0.0.1:8008` (override with `CICY_API_PORT`)
- `~/cicy-ai/global.json` with `api_token` (or `CICY_API_TOKEN` env)

## License

MIT
