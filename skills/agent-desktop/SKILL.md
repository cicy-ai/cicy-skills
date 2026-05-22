---
name: agent-desktop
description: Control a connected cicy-desktop (Electron) client on this host. Screenshot, clipboard, exec shell, list windows, raw electronRPC via desktop_event over WebSocket.
---

# Agent Desktop

This skill covers the local `agent-desktop` wrapper. It pushes
`desktop_event { rpc_call, tool, args, requestId }` to a connected
cicy-desktop client and awaits the matching `rpc_result` over the chat
WebSocket.

Sister to `agent-webpage`: `agent-webpage` runs JS inside the renderer;
`agent-desktop` invokes Electron-main tools (clipboard, screenshot, shell
exec, system info).

## Scope

Use this skill when the task involves:

- listing connected cicy-desktop clients
- reading or writing the desktop machine's clipboard
- capturing a screenshot of the active window to clipboard
- running a shell command on the desktop machine
- inspecting OS / hardware info or window list
- making an arbitrary Electron-main tool call via raw electronRPC

## Rules

1. Prefer `agent-desktop` over hand-rolling `agent-webpage exec-js` for desktop-side operations — `exec-js` is synchronous and cannot await Promises, so it can't invoke `electronRPC` correctly.
2. Target a specific client by `--client <client_id>`. When omitted, `agent-desktop` auto-selects the single client whose UA contains `ElectronMCP`; it refuses to guess if multiple are connected.
3. For response-oriented calls, **report the actual returned payload** — don't stop at "event sent".
4. `agent-desktop windows` may return `Unsupported platform` on Windows because the underlying `get_system_windows` tool isn't implemented for win32. Use `agent-desktop exec` with PowerShell as a fallback.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
