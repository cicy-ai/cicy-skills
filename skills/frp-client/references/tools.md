# frp-client — tools

## What it does

Process manager + admin-API client for a local `frpc` daemon.

## Files touched

| op     | path                                          | mode |
|--------|-----------------------------------------------|------|
| read   | `~/cicy-ai/db/frpc.toml`                      | —    |
| write  | `~/.local/state/cicy-skills/frp/client/pid`   | 0644 |
| write  | `~/.local/state/cicy-skills/frp/client/state.json` | 0644 |
| append | `~/logs/frpc.log`                             | —    |

## Process management

- `start` — `spawn(BINARY, ['-c', CONFIG, ...extraArgs], { detached:true, stdio:['ignore', logFD, logFD] })` then write pid + state.
- `stop`  — SIGTERM, wait 5s, SIGKILL.
- `reload`— SIGHUP (frpc v0.50+ hot-reloads on SIGHUP).
- `status`— `process.kill(pid, 0)` + GET `/api/status` from admin api.

## Admin api

If `webServer.addr / port / user / password` are set in `frpc.toml`, the
wrapper auto-derives the admin URL.

| subcmd        | endpoint           |
|---------------|--------------------|
| `status`      | `/api/status`      |
| `connections` | `/api/status`      |

## Configuration

| path                       | mode | secret_fields |
|----------------------------|------|---------------|
| `~/cicy-ai/db/frpc.toml`   | 0600 | (frps tokens / auth — treat as sensitive) |

## Remote management

frpc on another machine? Use ssh:

```
ssh remote 'frp-client status --json'
```

The wrapper is exit-code clean and JSON-friendly, so piping through ssh
behaves naturally.

## Exit codes

See [help.md](./help.md).
