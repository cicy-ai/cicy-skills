---
name: cicy-agent
description: Operate local and Cloud Agents, discover this Instance's team ID and fixed domain, and coordinate work with tracked messages and completion notifications.
---

# Cicy Agent

This skill wraps local tmux pane/window operations and CiCy Cloud routing to
Agents on other Instances. Cloud targets use `<team>.<agent>` addresses and do
not require the target Instance's API Token.

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

- **Local and Cloud have the same CLI lifecycle.** `msg` prints `msg_id`
  immediately, then waits for a structured `done/failed` result by default.
  `--no-wait` returns after durable acceptance. Neither path scrapes `capture`.
- **Default has no unsolicited chat push.** Waiting output belongs to the
  calling CLI. Add `--notify` only when the sender Agent itself must be woken.
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
- `reply` and `history` read structured replies/turns locally or from a
  `team.agent` Cloud target; Cloud reads never use terminal capture
- `msgs` — the local or Cloud cross-agent message link: who→who, status, and a q⟶answer
  summary of what the receiver actually did
- restart all panes / clear one
- `projects [--current|<id|name>]` — list all projects with their nested Agents, or filter to the current/specified project
- `cloud ls [--all]` / `cloud agents [--all]` — discover Cloud Instances and Agents
- `whoami` — return this Agent, team, Instance, and fixed-domain identity
- `msg <team.agent>` — route through CiCy Cloud and print the correlated reply

## Rules

1. Use a plain Agent ID such as `w-102` locally. Use a Cloud address such as
   `gh_linux.w-1001` for another Instance; Cloud discovery and authentication
   are automatic from `~/cicy-ai/db/cloud-device.json`.
2. `msg --notify` needs `X_AGENT_SHORT_ID` env (set inside cicy panes) — it's
   the sender id the callback wakes.
3. Message completion and replies MUST use structured message/turn state. Never
   scrape `capture`; it is manual diagnostics only and is forbidden in Cloud
   delivery callbacks.
4. To obtain the current `team_id` or fixed Instance URL, use
   `cicy-agent --json whoami`; never infer the hostname from the team name.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
