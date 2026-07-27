# frp-server — tools

## What it does

Process manager + web-API client for a local `frps` daemon.

## Files touched

| op     | path                                          | mode |
|--------|-----------------------------------------------|------|
| read   | `~/cicy-ai/db/frps.toml`                      | —    |
| write  | `~/.local/state/cicy-skills/frp/server/pid`   | 0644 |
| write  | `~/.local/state/cicy-skills/frp/server/state.json` | 0644 |
| append | `~/logs/frps.log`                             | —    |

## Process management

- `start` — `spawn(BINARY, ['-c', CONFIG, ...extraArgs], { detached:true, stdio:['ignore', logFD, logFD] })` then write pid + state.
- `stop`  — SIGTERM, wait 5s, SIGKILL.
- `reload`— SIGHUP (frps v0.50+ hot-reloads on SIGHUP).
- `status`— `process.kill(pid, 0)` + GET `/api/serverinfo` from web dashboard.

## Web dashboard

If `webServer.addr / port / user / password` are set in `frps.toml`, the
wrapper auto-derives the dashboard URL and uses it for `status` /
`connections` / `clients`.

| subcmd        | endpoint           |
|---------------|--------------------|
| `status`      | `/api/serverinfo`  |
| `connections` | `/api/proxy/all`   |
| `clients`     | `/api/client`      |

## Configuration

| path                       | mode | secret_fields |
|----------------------------|------|---------------|
| `~/cicy-ai/db/frps.toml`   | 0600 | (frps tokens / passwords inside — treat as sensitive) |

## Examples

```bash
# pass extra args to frps on startup:
frp-server start -- --log-level debug

# raw passthrough:
frp-server raw -- verify -c ~/cicy-ai/db/frps.toml
```
