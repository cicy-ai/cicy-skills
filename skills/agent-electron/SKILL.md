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
| concrete instance | a Chrome process with `--user-data-dir`| an Electron `BrowserWindow` or BrowserView tab       |
| proxy             | `--proxy-server=` arg at launch       | `session.setProxy(...)` — applies to all windows    |
| introspection     | Chrome's `/json` debugger targets     | Electron `BrowserWindow.getAllWindows()` + `webContents.debugger` |
| addressed by      | `accountIdx` (chrome.json key)        | `winId` or `webContentsId` — accountIdx selects the session |

## Scope

Use this skill when the task involves:

- listing the live BrowserWindows on the cicy-desktop host
- listing and controlling BrowserView tabs by `webContentsId`
- opening a new BrowserWindow inside a specific sandbox session
- setting the proxy on a session before opening windows in it
- closing a BrowserWindow by id
- making raw CDP calls (`Runtime.evaluate`, `Page.navigate`, etc.) against a BrowserWindow's webContents
- taking screenshots / snapshots / loading new URLs in an existing window

## Rules

1. **`accountIdx` = profile id = session id.** They are three names for the
   same numeric identifier. For example, `accountIdx=1`, `profile id=1`, and
   `session id=1` all select the same `persist:sandbox-1` partition. The first BrowserWindow opened
   under a fresh `accountIdx` triggers `session.fromPartition('persist:sandbox-<N>')`.
   All windows opened under the same `accountIdx` share cookies, localStorage,
   IndexedDB, service workers, and proxy.
2. **Targets are typed because their numeric ids can collide.** `winId`
   addresses a BrowserWindow and is returned by `open` / listed by `windows`.
   `webContentsId` addresses a BrowserView tab and is listed by `tabs <idx>`;
   `webcontents` returns every live WebContents across all profiles/surfaces.
   Bare numbers remain window ids for compatibility; write `tab:4` or `wc:4`
   for a tab. `close`, `window`, `url`, `cdp`, `screenshot`, and `snapshot`
   accept both target kinds. `profiles` lists configured Electron profiles,
   while `tabs` and `webcontents` discover the target pages.
3. **Proxy is per-session, not per-window.** `proxy <accountIdx> <url>`
   calls `session.setProxy({proxyRules: url})`. New windows opened in that
   session pick it up immediately; **already-open windows keep their old
   proxy** until reload (matches Electron's behavior). Set proxy *before*
   `open` for a deterministic result.
4. **Check before `open` — never double-open a URL.** First run `windows`
   (or `session <idx>`). If the target URL is already open in that session,
   do NOT open another window by default: activate the existing one with the
   native BrowserWindow methods via the desktop RPC
   `control_electron_BrowserWindow` — code
   `(win.isMinimized()&&win.restore(), win.show(), win.focus())` — and
   report its winId to the user; refresh it only when needed
   (`url <winId> <url>`). Only open a fresh window when the user explicitly
   asks for a new one (`--no-reuse`).
5. **`--client <client_id>` targets a specific cicy-desktop host.** With no
   flag, auto-selects the single host whose UA contains `CiCyDesktop` /
   `ElectronMCP`.
6. **Prefer `snapshot` over `screenshot`.** Screenshots capture the user's
   screen — only take one when the user has explicitly allowed it. For
   checking page state / verifying renders, use `snapshot` (DOM structure,
   machine-readable) by default.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
