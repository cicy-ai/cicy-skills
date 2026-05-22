---
name: frp-server
description: Manage a local frps process on this host with background start, status, connections, hot reload, and stop/start controls.
---

# FRP Server

This skill manages the local `frps` process on this host.

## Scope

Use this skill when the task involves:

- starting `frps` as a background service
- checking whether the FRP server is running
- checking listeners or current connections
- reloading or restarting the FRP server after config changes
- stopping the FRP server cleanly

## Rules

1. Prefer the local `frp-server` wrapper first.
2. Use the real config file on disk; do not invent FRP state.
3. Use `status` before destructive actions.
4. Prefer `reload` (SIGHUP) for hot reload when frps version supports it (v0.50+).
5. Report the real config path, log path, pid, and connection / listener data back to the user.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
