---
name: cicy-todo
description: Per-workspace todo list (todo/test/done/dropped) backed by /api/todo on the local cicy-code server.
---

# Cicy Todo

A minimal todo list shared between every cicy-code agent / pane and the
Workspace "Todo" tab. There is **one** store, located in the master pane
(`w-10001`) workspace at `<master-ws>/.cicy/todos.yaml`.

Each todo carries a `pane_id` recording which worker owns it. The server
enforces:

- A worker pane only sees / modifies todos with `pane_id == self`.
- The master pane (`w-10001`) sees every todo and may filter via `--pane`.

## Quick start

```sh
# In any worker pane — own todos only.
cicy-todo                              # list active
cicy-todo add "Ship the cicy-todo skill"
cicy-todo test  <id>                   # → test    (done coding, awaiting review)
cicy-todo done  <id>                   # → done    (operator-verified; usually NOT you)
cicy-todo drop  <id>                   # → dropped
cicy-todo back  <id>                   # → todo
cicy-todo edit  <id> "<new title>"
cicy-todo rm    <id>

# In the master pane (w-10001) — sees every worker's todos.
cicy-todo                              # all workers' active todos (PANE col)
cicy-todo --pane w-10025               # filter to one worker
cicy-todo --pane w-10025 add "ship it" # create on behalf of w-10025
cicy-todo --pane w-10025 done t-1779
```

`<id-prefix>` accepts the leading 4–8 chars when unique. The CLI sends
`X-Agent-Show-Id: $X_AGENT_SHORT_ID` so the server knows who is asking.

## Status lifecycle — keep it current as you work

The board is only useful if its status reflects reality. Whenever you finish
work on a todo, move its status forward.

1. **When you finish the work, move it to `test`:** `cicy-todo test <id>`.
   This signals "done coding, awaiting the operator's review." **Do not mark
   it `done` yourself** — `done` means the operator has verified it. Leave the
   final `done` to them unless they explicitly tell you to close it.
2. If you abandon a task, `cicy-todo drop <id>`; if it was misfiled back to
   the queue, `cicy-todo back <id>`.

When a task is dispatched to you via the Workspace "send" / "assign" action,
the prompt carries the todo's id — use it: `test` it when you're done.

## Scope

Use this skill when:

- the user wants to record / view / change the status of todos for the
  current worker (or, from master, any worker)
- the user asks "what am I working on", "what's left", "mark X done"
- you need to leave a durable note for the next session about pending work

Do **not** use this skill for ephemeral in-conversation task tracking — that's
what TaskCreate is for. `cicy-todo` is for items that should survive across
conversations and be visible in the Workspace UI tab.

## Rules

1. Storage is centralised: every operation goes through the master pane's
   `todos.yaml`. Never write to that file directly — always go through the
   CLI / `/api/todo/*`.
2. Workers cannot see or change other workers' todos. The server returns
   403 if they try.
3. From the master pane, `--pane <w-xxxxx>` restricts a command to one
   worker. Without it, master sees / acts on all workers.
4. Status set is fixed: `todo | test | done | dropped`. Do not invent
   new states. The lifecycle is `todo → test → done`, with `dropped`
   as a terminal "abandoned" state.
5. The CLI requires `X_AGENT_SHORT_ID` (or `CICY_PANE_ID`) and exits with
   code 2 when neither is set — there is no default. cicy-code's tmux boot
   script sets the variable in every pane.
6. The CLI requires the local cicy-code server on `$CICY_API_PORT`
   (default 8008) and reads `api_token` from `~/cicy-ai/global.json`.

## Security model

The per-worker isolation is **honor-system, not a security boundary**. All
panes share the same `api_token`, so a malicious caller with the token can
trivially set `X-Agent-Show-Id: w-10001` and impersonate the master. Treat
the worker scope as a UI/UX guard rail, not a privilege boundary.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
