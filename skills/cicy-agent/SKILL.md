---
name: cicy-agent
description: Operate tmux panes and windows on this host. Wraps cicy-code's /api/tmux/* endpoints (list, capture, send-keys, msg, create, restart, clear).
---

# Cicy Agent

This skill is the local `cicy-agent` wrapper for tmux pane / window
operations on this host (and optional remote nodes via `--node NAME`).

## Scope

Use this skill for:

- listing panes / windows / tree
- capturing pane output
- sending text or keys to a pane
- sending a chat message (`msg`) to another pane
- waiting for a recipient pane's reply (`msg_wait`)
- restarting all panes / clearing one

## Rules

1. Prefer `cicy-agent` for local convenience operations on this host.
2. Use `--node NAME` for remote nodes; the named entry in `~/cicy-ai/db/cicy-agent.json` supplies the API base + token.
3. `msg --callback` requires `X_AGENT_SHORT_ID` env (set inside cicy panes).
4. `capture` returns raw pane text. `reply` returns parsed last-turn text from the recipient.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
