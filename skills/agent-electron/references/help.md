# agent-electron — help

## Commands

```
agent-electron sessions [--json]
agent-electron session <accountIdx> [--json]
agent-electron proxy <accountIdx> <url|"">
agent-electron open <accountIdx> --url <url> [--no-reuse] [--json]
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
  open in that session, don't open another window by default — bring the
  existing one to front (`cdp <winId> Page.bringToFront`) and report its
  winId; refresh only if needed (`url <winId> <url>` or
  `cdp <winId> Page.reload`). Open a new window only when the user
  explicitly wants one (`--no-reuse`).
- `sessions` is inferred from live windows — sessions on disk that have no
  open window are not listed (Electron has no enumerate-partitions API).
- `proxy <idx> "" ` clears the proxy on a session.
- `screenshot --out path` writes a PNG to `path`; with no `--out` it puts
  the image on the host's clipboard (avoids large WebSocket payloads).
- `cdp` accepts any CDP method — `Runtime.evaluate`, `Page.navigate`,
  `Page.reload`, `Network.setCookie`, `Input.dispatchMouseEvent`, etc.

## Environment

- `CICY_API_TOKEN`        — bearer token override
- `CICY_API_PORT`         — server port (default 8008)
- `CICY_GLOBAL_JSON`      — global.json path override
- `CICY_AGENT_TIMEOUT_MS` — RPC timeout (default 60000)
