---
name: cicy-agent
description: Operate tmux panes/windows on this host (list, capture, send-keys, msg, create, restart). `msg --notify` wakes the SENDER when the dispatched agent finishes — the multi-agent coordination primitive.
---

# Cicy Agent

This skill is the local `cicy-agent` wrapper for tmux pane / window
operations on this host — and on other TEAMS' hosts via `--team NAME`
(register with `cicy-agent team add`; probe with `cicy-agent team ping`).

## ⭐ `--notify` — get woken when the agent you dispatched finishes

`cicy-agent msg <pane> --notify "<task>"` does more than send text — it arms a
**callback on the receiver**. When `<pane>`'s turn handling your message reaches
a terminal state, YOU (the sender) receive a push:

```
🔔 [<them>] msg <id> → done       (or  ⚠️ [<them>] msg <id> → failed)
```

**That push wakes you up.** This is the point: after dispatching, you can go
idle — no polling, no screen-scraping a pane to guess if they're done. The
receiver finishing is what re-activates you, to collect the result or verify.

This is the core multi-agent **orchestration primitive**:

```
orchestrator:  cicy-agent msg w-200 --notify "do X"     # dispatch
               cicy-agent msg w-201 --notify "do Y"     # dispatch
               …go idle…
               🔔 [w-201] msg ab12 → done   ← woken → collect Y
               🔔 [w-200] msg cd34 → done   ← woken → collect X
```

Details:

- **Default (no `--notify`) is silent.** The message is still recorded in the
  store (`cicy-agent msgs` shows status `sent → done/failed`), but NO chat push
  fires — so routine dispatches don't spam you. Add `--notify` only when you
  want to be woken.
- **De-duped.** If the receiver already replied to you in-band during that turn,
  the `--notify` push is suppressed — you won't be double-notified.
- **You get an id immediately.** `msg` returns `msg_id=<id>`; use it with
  `cicy-agent msgs` to trace this message's status / link later.
- `--no-callback` = pure fire-and-forget (not even tracked).

> Don't "dispatch then sit waiting to be poked", and don't write a script that
> scrapes `capture` to detect completion — `--notify` exists for exactly this.

## Scope

- list panes / windows / tree
- capture pane output; `reply` returns the recipient's parsed last-turn text
- `msg` a message to another pane (recorded in the store, status → done/failed;
  `--notify` above; `--no-callback` = fire-and-forget)
- `msgs` — the cross-agent message link: who→who, status, and a q⟶answer
  summary of what the receiver actually did
- restart all panes / clear one
- `team add/ls/rm/ping` — register another team's cicy-code (api + token) and
  probe liveness + version; then any command works cross-team with `--team NAME`

## Rules

1. Prefer `cicy-agent` for local convenience operations on this host; use
   `--team NAME` for other teams (registry `~/cicy-ai/db/cicy-agent.json`,
   managed by `cicy-agent team add/ls/rm`; legacy alias `--node`). Cross-team
   `--notify` can't push back — check with `cicy-agent msgs --team NAME`.
2. `msg --notify` needs `X_AGENT_SHORT_ID` env (set inside cicy panes) — it's
   the sender id the callback wakes.
3. To judge "did they finish" or read their conclusion, use `reply` (parsed
   last turn) — do NOT scrape `capture` (raw scrollback drifts as it scrolls).

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
