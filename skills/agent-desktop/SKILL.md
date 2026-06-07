---
name: agent-desktop
description: Control a connected cicy-desktop (Electron) client on this host. Exec shell, system info, live tool discovery, raw electronRPC via desktop_event over WebSocket.
---

# Agent Desktop

This skill covers the local `agent-desktop` wrapper. It pushes
`desktop_event { rpc_call, tool, args, requestId }` to a connected
cicy-desktop client and awaits the matching `rpc_result` over the chat
WebSocket.

Sister to `agent-webpage`: `agent-webpage` runs JS inside the renderer;
`agent-desktop` invokes Electron-main tools (shell exec, system info).

## Scope

Use this skill when the task involves:

- listing connected cicy-desktop clients
- running a shell command on the desktop machine
- uploading a local script and executing it on the desktop (`exec-file`, runner picked by extension: sh/py/js)
- inspecting OS / hardware info
- making an arbitrary Electron-main tool call via raw electronRPC
- discovering the live tool set — `agent-desktop tools` queries the connected client via the `list_tools` meta-tool (`--schema`/`--names`/`--tag`), falling back to the static reference when no client is connected

## Rules

1. Prefer `agent-desktop` over hand-rolling `agent-webpage exec-js` for desktop-side operations — `exec-js` is synchronous and cannot await Promises, so it can't invoke `electronRPC` correctly.
2. Target a specific client by `--client <client_id>`. When omitted, `agent-desktop` auto-selects the single client whose UA contains `ElectronMCP`; it refuses to guess if multiple are connected.
3. For response-oriented calls, **report the actual returned payload** — don't stop at "event sent".

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
