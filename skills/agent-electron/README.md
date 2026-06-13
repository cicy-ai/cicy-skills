# agent-electron

> Source-only Node.js. Read [`bin/agent-electron`](./bin/agent-electron).
> Requires Node **22+** for native `fetch`.

Per-session, per-window control of a connected cicy-desktop host's
**Electron BrowserWindows** — the Electron analog of `agent-chrome`.

A "session" here is `session.fromPartition('persist:sandbox-<accountIdx>')`.
Setting a proxy on the session applies it to every BrowserWindow opened
under that `accountIdx`.

## Install

```bash
cicy-code skill install agent-electron
```

## Quick usage

```bash
# Sessions known to the host (derived from live windows)
agent-electron sessions

# Set proxy on session 1 — affects all windows opened under accountIdx 1
agent-electron proxy 1 socks5://127.0.0.1:9001

# Open a window in session 1 (url positional, --idx defaults to 1)
agent-electron open https://example.com --idx 1 --no-reuse
# → { winId: 5, ... }

# Inspect / control by winId
agent-electron window 5
agent-electron url 5 https://web.telegram.org/a/
agent-electron cdp 5 Runtime.evaluate '{"expression":"document.title","returnByValue":true}'
agent-electron snapshot 5                          # DOM snapshot (prefer over screenshot)
agent-electron close 5

# Profiles: create, probe egress IP, infer logins, record a rich login
agent-electron add                                 # new profile (next account-N.json)
agent-electron probe-ip 1                           # egress IP+area via the proxy (stored)
agent-electron detect-logins 1                      # infer signed-in sites from cookies
agent-electron login set electron-1 --name 抖音 --username u --email e@x.com
agent-electron logins electron-1

# Tab browser (BrowserView tabs, addressed by webContentsId)
agent-electron tabs 1
agent-electron tab-open 1 https://example.com
agent-electron tab-eval <wcId> "document.title"

# Multi-host: pick a specific cicy-desktop client
agent-electron --client web-w-1001-... windows
```

## License

MIT
