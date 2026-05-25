---
name: frp-client
description: Manage a local frpc process on this host with background start, status, proxy connections, hot reload, and stop/start controls. Remote machines via ssh.
---

# FRP Client

This skill manages the local `frpc` process on this host (and remote
machines via `ssh <host> 'frp-client ...'`).

## Scope

Use this skill when the task involves:

- installing `frpc` and setting it up as a background service
- starting `frpc` as a background service
- checking whether the FRP client is running
- checking current proxy status / connections
- reloading or restarting the FRP client after config changes
- stopping the FRP client cleanly
- managing a remote FRP client machine over `ssh`

## Quick start

```bash
# First-time install (downloads frpc, writes config, installs service):
frp-client install --server <HOST> --token <TOKEN>

# Service management:
frp-client service status
frp-client service install   # re-install service unit only

# Day-to-day:
frp-client status
frp-client reload
frp-client logs -f
```

## Rules

1. Prefer the local `frp-client` wrapper first.
2. Use the real config file on disk; do not invent FRP state.
3. Prefer `connections` or `status` before changing a working client.
4. Prefer `reload` (SIGHUP) for hot reload; restart if frpc lacks SIGHUP support.
5. Report the real config path, log path, pid, and proxy status back to the user.
6. When the target FRP client is on another machine, manage it through `ssh <host> 'frp-client …'` using the remote machine's own `frpc`, config, and service manager.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
