---
name: artifact
description: Open and remote-control the cicy-code 产物 (artifact) tab page frame: navigate, inject JS, call native Electron <webview>/webContents methods, and drive full CDP — input, screenshots, logs.
---

# Artifact

The cicy-code UI has a **产物 (Artifact)** content tab (left of Settings) that
hosts a controllable page frame. In **cicy-desktop (Electron)** that frame is a
native `<webview>`, so this skill gives the agent the same power a human with
DevTools open has: navigate, inject JS into the inner page, call any
`<webview>`/`webContents` method, drive the full **Chrome DevTools Protocol**
(CDP), synthesize mouse/keyboard input, capture screenshots and PDFs, and read
the console / CDP event stream. In a plain browser the frame is an `<iframe>`
and only navigation / reload / getUrl work.

This is the local `artifact` command on `PATH`. It talks to the live cicy-code
page over the chat WebSocket (`POST /api/chat/push`, `wait_ack`) — the same
transport as `agent-webpage` — by calling the page-global `window.cicyArtifact.*`
API.

## Scope

Use this skill when the task involves:

- opening a URL/result in the user-visible artifact tab (`open`)
- running JS inside the inner artifact page (`exec`)
- calling native webview/webContents methods (`call`, `invoke`)
- driving the artifact via CDP — DOM, Network, Runtime, Input, Page (`cdp`)
- synthesizing mouse/keyboard input (CDP `Input.*`, or `call sendInputEvent`)
- screenshotting / printing the artifact (`capture`, `pdf`)
- reading the artifact's console + CDP event log (`events`)

## Rules

1. **`open <url>` is the entry point** — it activates the artifact tab and
   loads the URL so the user sees it. Everything else operates on whatever is
   loaded.
2. **`exec` runs JS *inside* the artifact page**; `call`/`invoke`/`cdp` operate
   *on* the webview from the host. Pick the right layer.
3. **Full control needs Electron.** `cdp`, `capture`, `pdf`, `call`, and
   `invoke` require cicy-desktop's `<webview>`. In a browser they error — only
   `open`/`load`/`reload`/`geturl`/`clear`/`exec` (same-origin) work.
4. **CDP must be attached first**: `artifact cdp-attach` before `artifact cdp
   <Method>`. Attaching auto-closes any hand-opened DevTools.
5. **Logs are pull-based.** `exec_js` is request/response, so console/navigation
   /CDP events are buffered on the page; pull them with `artifact events`.
6. **Target selection**: with one cicy-code page connected it auto-targets;
   with several, pass `--client <id>` (see `artifact clients`).
7. Run `artifact help` / `artifact tools` before guessing subcommand shapes.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
