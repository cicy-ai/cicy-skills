# tg-matrix — transport & integration (EN)

## Transport
Same channel as `wsd`: reads `{base, token}` from
`~/cicy-ai/db/desktop-ctrl.json` (override with `CICY_DESKTOP_CTRL`) and calls
the control plane:

- `GET  /api/fleet` — connected peers (for `ls`).
- `POST /api/rpc` with `{target, js}` — the JS is a homepage-bridge wrapper that
  resolves the window id per-process and evaluates the payload **in the Electron
  main process** via `control_electron_BrowserWindow`. This bridge is
  unauthenticated by design, so there is no consent gate.

Header `x-cicy-ctrl: <token>` authenticates; a browser-like `user-agent` avoids
Cloudflare's bot challenge (this is our own origin).

## Panel discovery (no hard-coded ids)
The main-process payload uses `globalThis.__cicyTabBrowserState.managers.get(0)`
(the profile-0 `TabManager`) and:

- `m.list()` → `[{webContentsId, title, url, active}]`
- finds the entry whose `url` matches `preset=telegram-matrix`
- `m.activate(webContentsId)` to foreground it
- `m.addTab(url, {title})` with `cicyui://panel/<Date.now().toString(36)>?preset=telegram-matrix` when absent

Because `webContentsId` is per-machine and mutable, it is always read from
`m.list()` at call time and never stored.

## Relationship to other skills
- `telegram-matrix` — drives the panel's contents (profiles, cells, batch,
  screenshots) via CDP; use it once the panel is open on a reachable host.
- `tg-login` — automates the phone → code → 2FA login inside a cell.
- This skill only opens / focuses / checks the panel, and does so fleet-wide.
