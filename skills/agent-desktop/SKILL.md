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


## Fleet — every desktop over the homepage channel

The commands above drive **this host's** local desktop via local cicy-code. The
`fleet` subcommand drives **every** cicy-desktop through the homepage control
channel at `desktop.cicy-ai.com` — no per-node cicy-code needed. Each desktop
holds a ws socket there and shows a short **id** in its top bar.

```sh
agent-desktop fleet ls                          # short id, team, version, login
agent-desktop fleet exec <target> '<shell>'     # shell (exec_shell)
agent-desktop fleet rpc  <target> <tool> '{…}'  # an Electron tool
agent-desktop fleet js   <target> '<async js>'  # JS in the page
agent-desktop fleet main <target> '<js>'        # JS in the Electron main process
agent-desktop fleet ipc  <target> <chan> '[…]'  # ipcRenderer.invoke
agent-desktop fleet team <target> <name>        # name a machine
```

`<target>` = short id (`TWPW9`), team (`desktop-xs-1001` / `xs-1001`),
hostname, or `all`. `--json` anywhere. Operator token:
`~/cicy-ai/db/desktop-ctrl.json`. Only owner-signed clients accept commands.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
