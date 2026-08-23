# agent-electron

> Source-only Node.js. Read [`bin/agent-electron`](./bin/agent-electron).
> Requires Node **22+** for native `fetch`.

Per-session control of a connected cicy-desktop host's Electron
**BrowserWindows and BrowserView tabs** — the Electron analog of
`agent-chrome`.

A "session" here is `session.fromPartition('persist:sandbox-<accountIdx>')`.
Setting a proxy on the session applies it to every BrowserWindow opened
under that `accountIdx`.

`accountIdx`, profile id, and session id are the same numeric identifier:
`accountIdx=1` = profile 1 = session 1 = `persist:sandbox-1`.

## Install

```bash
cicy-code skill install agent-electron
```

For Codex, cicy-code exposes the installed skill at
`~/.agents/skills/agent-electron` and keeps the legacy
`~/.codex/skills/agent-electron` path for compatibility. Start a new session
or run `/clear` after installation, then invoke it explicitly with
`@agent-electron`.

## Quick usage

```bash
# Sessions known to the host (derived from live windows)
agent-electron sessions

# Configured Electron profiles
agent-electron profiles

# Tabs in profile 0; each row contains a webContentsId
agent-electron tabs 0

# All live WebContents. Each row includes webContentsId, url, and profileId.
agent-electron webcontents

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

# The same supported operations can target a tab explicitly. Bare numbers are
# winIds; tab:/wc: prefixes avoid collisions between Electron's id namespaces.
agent-electron window tab:4
agent-electron url tab:4 https://example.com/
agent-electron screenshot tab:4 --out /tmp/tab4.png
agent-electron cdp tab:4 Runtime.evaluate '{"expression":"document.title"}'
agent-electron snapshot tab:4

# Multi-host: pick a specific cicy-desktop client
agent-electron --client web-w-1001-... windows

# Install a persistent host-side Electron injection script
agent-electron inject install telegram.org.js --source ./telegram.org.js
agent-electron inject status telegram.org.js
agent-electron inject uninstall telegram.org.js
```

## License

MIT
