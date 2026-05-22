---
name: cicy-todo
description: Per-workspace todo list (todo/doing/done/dropped) backed by /api/todo on the local cicy-code server.
---

# Cicy Todo

A minimal todo list that lives **inside each agent's workspace** and is shared
between the `cicy-todo` CLI and the cicy-code Workspace "Todo" tab — both go
through `/api/todo/*` so there is one source of truth per worker.

Storage: `<workspace>/.cicy/todos.yaml`

## Quick start

```sh
cicy-todo                              # list OWN active todos
cicy-todo add "Ship the cicy-todo skill"
cicy-todo start <id-prefix>            # → doing
cicy-todo done  <id-prefix>            # → done
cicy-todo drop  <id-prefix>            # → dropped
cicy-todo back  <id-prefix>            # → todo
cicy-todo edit  <id-prefix> "<new title>"
cicy-todo rm    <id-prefix>            # delete

# View / modify ANOTHER agent's todos: prepend the pane id (w-xxxxx).
cicy-todo w-10001                      # list w-10001's active todos
cicy-todo w-10001 add "ship it"
cicy-todo w-10001 done t-1779
```

`<id-prefix>` accepts the leading 4–8 chars of an id when unique. The leading
pane id (`w-xxxxx`) is optional — without it the command targets
`$CICY_PANE_ID` (else `w-10001`). Internally every request carries
`X-Agent-Show-Id: <pane>` so the backend knows whose todos to act on.

## Scope

Use this skill when:

- the user wants to record / view / change the status of todos for the current
  worker OR another worker
- the user asks "what am I working on", "what's left", "mark X done"
- you need to leave a durable note for the next session about pending work

Do **not** use this skill for ephemeral in-conversation task tracking — that's
what TaskCreate is for. `cicy-todo` is for items that should survive across
conversations and be visible in the Workspace UI tab.

## Rules

1. Data is **per pane**: each `w-xxxxx` worker has its own `todos.yaml`. The
   CLI sends `X-Agent-Show-Id` based on the leading positional pane arg (or
   `$CICY_PANE_ID` / `w-10001` when no arg given).
2. CLI is a thin wrapper over the cicy-code REST API; it requires the local
   cicy-code server on `$PORT` (default 8008) and reads `api_token` from
   `~/cicy-ai/global.json`.
3. Status set is fixed: `todo | doing | done | dropped`. Do not invent new
   states.
4. The CLI mutates `todos.yaml` only via the API — never write to that file
   directly.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
