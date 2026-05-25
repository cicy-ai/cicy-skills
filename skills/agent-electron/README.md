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

# Open a window in session 1
agent-electron open 1 --url https://example.com --no-reuse
# → { winId: 5, ... }

# Inspect / control by winId
agent-electron window 5
agent-electron url 5 https://web.telegram.org/a/
agent-electron cdp 5 Runtime.evaluate '{"expression":"document.title","returnByValue":true}'
agent-electron screenshot 5 --out /tmp/win5.png
agent-electron close 5

# Multi-host: pick a specific cicy-desktop client
agent-electron --client web-w-10001-... windows
```

## License

MIT
