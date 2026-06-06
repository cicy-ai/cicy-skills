---
name: agent-electron
description: Drive cicy-desktop Electron BrowserWindows and per-account sandbox sessions via desktop_event RPC. Each accountIdx = its own session.fromPartition() with proxy. Electron analog of agent-chrome.
---

# Agent Electron

This skill drives a connected cicy-desktop host's **Electron**
BrowserWindows — as opposed to `agent-chrome`, which drives the host's
**system Chrome** profiles.

The two skills share the same wire protocol (`desktop_event` → `rpc_call`
over `/api/chat/push` with `wait_ack`), but operate on different surfaces:

| concept           | agent-chrome                          | agent-electron                                       |
|-------------------|---------------------------------------|------------------------------------------------------|
| identity unit     | profile (`chrome.json` entry)         | session (`persist:sandbox-<N>` partition)            |
| concrete instance | a Chrome process with `--user-data-dir`| an Electron `BrowserWindow` in that session         |
| proxy             | `--proxy-server=` arg at launch       | `session.setProxy(...)` — applies to all windows    |
| introspection     | Chrome's `/json` debugger targets     | Electron `BrowserWindow.getAllWindows()` + `webContents.debugger` |
| addressed by      | `accountIdx` (chrome.json key)        | `winId` (BrowserWindow.id) — accountIdx is the session it lives in |

## Scope

Use this skill when the task involves:

- listing the live BrowserWindows on the cicy-desktop host
- opening a new BrowserWindow inside a specific sandbox session
- setting the proxy on a session before opening windows in it
- closing a BrowserWindow by id
- making raw CDP calls (`Runtime.evaluate`, `Page.navigate`, etc.) against a BrowserWindow's webContents
- taking screenshots / snapshots / loading new URLs in an existing window

## Rules

1. **`accountIdx` selects the session.** The first BrowserWindow opened
   under a fresh `accountIdx` triggers `session.fromPartition('persist:sandbox-<N>')`.
   All windows opened under the same `accountIdx` share cookies, localStorage,
   IndexedDB, service workers, and proxy.
2. **`winId` addresses one BrowserWindow.** Returned by `open` and listed
   by `windows`; use it for `close`, `window`, `url`, `cdp`, `screenshot`,
   `snapshot`.
3. **Proxy is per-session, not per-window.** `proxy <accountIdx> <url>`
   calls `session.setProxy({proxyRules: url})`. New windows opened in that
   session pick it up immediately; **already-open windows keep their old
   proxy** until reload (matches Electron's behavior). Set proxy *before*
   `open` for a deterministic result.
4. **Check before `open` — never double-open a URL.** First run `windows`
   (or `session <idx>`). If the target URL is already open in that session,
   do NOT open another window by default: bring the existing one to front
   (`cdp <winId> Page.bringToFront`) and report its winId to the user;
   refresh it only when needed (`url <winId> <url>` or
   `cdp <winId> Page.reload`). Only open a fresh window when the user
   explicitly asks for a new one (`--no-reuse`).
5. **`--client <client_id>` targets a specific cicy-desktop host.** With no
   flag, auto-selects the single host whose UA contains `CiCyDesktop` /
   `ElectronMCP`.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
