# agent-electron — help

## Commands

```
agent-electron list [--json]                         # profiles from config (name/proxy/logins)
agent-electron profile <id> [--json]                 # one profile (id = electron-N or N)
agent-electron add [name]                             # create a new profile (next account-N.json)
agent-electron login set <id> --name <名称> [--url --username --email --mobile --2fa --second-email --note]   # rich login record
agent-electron login rm <id> <name>
agent-electron logins <id>
agent-electron detect-logins <id>                     # infer signed-in sites from cookies
agent-electron probe-ip <id>                          # egress IP+area via the profile's proxy (stored)
agent-electron tabs <accountIdx>                      # tab-browser tabs (BrowserView, by webContentsId)
agent-electron tab-open <accountIdx> [url]            # tab-nav/tab-eval/tab-screenshot/tab-activate/tab-close <wcId>
agent-electron sessions [--json]                      # live windows grouped by session
agent-electron session <accountIdx> [--json]
agent-electron proxy <id> <url|"">                    # set + PERSIST proxy (auto-applied to new windows)
agent-electron open <url> [--idx 1] [--no-reuse] [--json]
agent-electron close <winId>
agent-electron windows [--json]
agent-electron window <winId> [--json]
agent-electron url <winId> <url>
agent-electron cdp <winId> <method> [json_params]
agent-electron screenshot <winId> [--out path]
agent-electron snapshot <winId>
agent-electron sysinfo

agent-electron --client <client_id> ...
agent-electron --help / -h / help
agent-electron tools
```

## Notes

- The cicy-desktop host must be running and connected to cicy-code.
- **Before `open`, check `windows` first.** If the target URL is already
  open in that session, don't open another window by default — activate it
  natively (desktop RPC `control_electron_BrowserWindow`, code
  `(win.isMinimized()&&win.restore(), win.show(), win.focus())`) and report
  its winId; refresh only if needed (`url <winId> <url>`). Open a new
  window only when the user explicitly wants one (`--no-reuse`).
- **`list` vs `sessions`:** `list` reads persisted profiles from config
  (`~/data/electron/account-N.json`) — name, proxy, logins — and is the
  unified verb shared with `agent-chrome`. `sessions` is the live-window
  view (inferred from open windows; partitions with no open window aren't
  listed — Electron has no enumerate-partitions API).
- **account 0 is the reserved system slot.** Account 0 = the platform's own
  system windows (the desktop homepage / platform pages). They run on
  Electron's **default session** (no `persist:sandbox-N` partition) and are
  reported as accountIdx 0 — **not** a user browsing profile. **User profiles
  start at account-1** (`electron-1`, `electron-2`, …), each on its own
  `persist:sandbox-N` partition. So `list` shows user profiles only
  (account-1+), while `windows` / `sessions` also surface the account-0 system
  windows — account-0 in `windows` but not in `list` is expected, not a bug.
- **Agents must open windows with an explicit accountIdx > 0** so they never
  land in the system slot. `agent-electron open` defaults to `--idx 1`, and the
  desktop `open_window` tool now defaults accountIdx to 1 as well. Pass 0 only
  for a genuine platform/system window.
- **`proxy` is persisted now.** `proxy <id> <url>` writes `{url,enabled}`
  into `account-N.json` AND applies it to the live session; newly opened
  windows for that profile auto-apply it (no manual re-apply). `proxy <id> ""`
  clears it.
- **`logins`** are rich manual records of which sites a profile signed
  into — `login set <id> --name <名称> [--url --username --email --mobile
  --2fa --second-email --note]` (keyed by name; re-setting merges non-empty
  fields). `login rm <id> <name>` deletes. Stored in `account-N.json`.
  Use `detect-logins <id>` to infer signed-in sites from cookies.
- Cookies/storage persist in `<userData>/Partitions/sandbox-N/` — unchanged.
- `screenshot --out path` writes a PNG to `path`; with no `--out` it puts
  the image on the host's clipboard (avoids large WebSocket payloads).
- **Default to `snapshot`, not `screenshot`.** Screenshots capture the
  user's screen — only when the user explicitly allows it. Use `snapshot`
  (DOM structure) to inspect page state.
- `cdp` accepts any CDP method — `Runtime.evaluate`, `Page.navigate`,
  `Page.reload`, `Network.setCookie`, `Input.dispatchMouseEvent`, etc.

## Environment

- `CICY_API_TOKEN`        — bearer token override
- `CICY_API_PORT`         — server port (default 8008)
- `CICY_GLOBAL_JSON`      — global.json path override
- `CICY_AGENT_TIMEOUT_MS` — RPC timeout (default 60000)
