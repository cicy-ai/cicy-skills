---
name: artifact
description: Open and remote-control the cicy-code 产物 (artifact) tab frame: open drawer+tab, run JS in the webview guest page, call native <webview> methods (list-tools), screenshot/PDF, drive full CDP.
---

# Artifact

The cicy-code UI has a **产物 (Artifact)** content tab (right drawer, left of
Settings) that hosts a controllable page frame. In **cicy-desktop (Electron)**
that frame is a native `<webview>`, so this skill gives the agent the same
power a human with DevTools open has: navigate, run JS **inside the guest
page**, call any of the `<webview>` element's native methods (67 of them —
enumerate live with `list-tools`), synthesize mouse/keyboard input, capture
screenshots and PDFs, and read the console / CDP event stream. In a plain
browser the frame is an `<iframe>` and only navigation / reload / getUrl (and
same-origin `exec`) work.

This is the local `artifact` command on `PATH`. It talks to the live cicy-code
page over the chat WebSocket (`POST /api/chat/push`, `wait_ack`) — the same
transport as `agent-webpage`. `exec` addresses the webview element directly
(`webview.executeJavaScript`), everything else goes through the page-global
`window.cicyArtifact.*` API.

## Scope

Use this skill when the task involves:

- opening a URL/result for the user to see (`open` — opens the right drawer,
  activates the 产物 tab, loads the URL)
- discovering what the current frame can do (`list-tools` — live enumeration
  of all element methods with descriptions + webContentsId + bridge status)
- running JS inside the webview guest page (`exec`)
- calling native webview element methods (`call` — insertCSS, sendInputEvent,
  setZoomFactor, openDevTools, findInPage, …)
- screenshotting / printing the artifact (`capture`, `pdf`)
- driving the artifact via CDP — DOM, Network, Runtime, Input, Page (`cdp`,
  needs the desktop bridge)
- reading the artifact's console + CDP event log (`events`)

## Rules

1. **`open <url>` is the entry point** — it opens the right drawer, activates
   the 产物 tab and loads the URL so the user sees it immediately. Everything
   else operates on whatever is loaded.
2. **`exec` runs JS inside the webview guest page** (direct
   `webview.executeJavaScript`); `call` operates *on* the webview element from
   the host. Pick the right layer. Native `alert/confirm` dialogs are
   suppressed in webview guests — inject DOM for visible effects.
3. **Element-level control works on every cicy-desktop**: `call`, `capture`,
   `pdf`, `exec`, `list-tools` only need the `<webview>` element. Only
   `invoke` (webContents path) and `cdp` additionally require the desktop
   preload bridge (`window.cicy.artifact`); `artifact info` shows
   `hasBridge`/`hasCdp`.
4. **CDP must be attached first**: `artifact cdp-attach` before `artifact cdp
   <Method>`. Attaching auto-closes any hand-opened DevTools.
5. **Logs are pull-based.** `exec_js` is request/response, so console/navigation
   /CDP events are buffered on the page; pull them with `artifact events`.
6. **webContentsId changes on every frame reload** — locate the frame by
   selector/skill commands, don't cache the id.
7. **Target selection**: with one cicy-code page connected it auto-targets;
   with several, pass `--client <id>` (see `artifact clients`).
8. Run `artifact help` / `artifact tools` / `artifact list-tools` before
   guessing shapes.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
