# agent-electron — help

## Commands

```
agent-electron sessions [--json]
agent-electron session <accountIdx> [--json]
agent-electron profiles [--json]
agent-electron tabs [accountIdx] [--json]
agent-electron webcontents [--json]
agent-electron proxy <accountIdx> <url|"">
agent-electron open <url> [--idx 1] [--no-reuse] [--json]
agent-electron close <winId|webContentsId>
agent-electron windows [--json]
agent-electron window <winId|webContentsId> [--json]
agent-electron url <winId|webContentsId> <url>
agent-electron cdp <winId|webContentsId> <method> [json_params]
agent-electron screenshot <winId|webContentsId> [--out path]
agent-electron snapshot <winId|webContentsId>
agent-electron sysinfo
agent-electron inject install <name> --source <file>
agent-electron inject status <name>
agent-electron inject uninstall <name>

agent-electron --client <client_id> ...
agent-electron --help / -h / help
agent-electron tools
```

## Notes

- The cicy-desktop host must be running and connected to cicy-code.
- `inject install` writes only to `~/data/electron/extension/inject/<name>` on the Desktop host. It sends source content to the restricted `electron_inject` RPC but never prints it.
- Codex discovers the installed skill through
  `~/.agents/skills/agent-electron`; `~/.codex/skills/agent-electron` is kept
  for legacy compatibility. Start a new Codex session or run `/clear` after
  installation, then invoke the skill with `@agent-electron`.
- `accountIdx` = profile id = session id. They are the same numeric identifier;
  for example, all three forms of id `1` map to `persist:sandbox-1`.
- `BrowserWindow.id` and `webContents.id` may be the same number. A bare
  number (for example `4`) remains a `winId`; use `tab:4` (or `wc:4`) for a
  `webContentsId`. `tabs <accountIdx>` lists the live tab ids.
- `close`, `window`, `url`, `cdp`, `screenshot`, and `snapshot` accept both
  target kinds. Use `profiles`, `tabs`, and `webcontents` to discover and
  inspect the hierarchy.
- **Before `open`, check `windows` first.** If the target URL is already
  open in that session, don't open another window by default — activate it
  natively (desktop RPC `control_electron_BrowserWindow`, code
  `(win.isMinimized()&&win.restore(), win.show(), win.focus())`) and report
  its winId; refresh only if needed (`url <winId> <url>`). Open a new
  window only when the user explicitly wants one (`--no-reuse`).
- `sessions` is inferred from live windows — sessions on disk that have no
  open window are not listed (Electron has no enumerate-partitions API).
- `proxy <idx> "" ` clears the proxy on a session.
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
