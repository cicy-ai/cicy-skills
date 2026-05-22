# frp-client — help

## Commands

```
frp-client start [-- --extra args]      Start frpc as a background daemon
frp-client stop                         SIGTERM (then SIGKILL after 5s)
frp-client restart [-- --extra args]    stop + start
frp-client status [--json]              pid / binary / config / admin-api info
frp-client reload                       SIGHUP for hot reload (frpc v0.50+)
frp-client logs [N|-f]                  tail log
frp-client connections [--json]         GET /api/status (proxy state)
frp-client raw -- <real frpc args>      passthrough to frpc binary
frp-client --help / -h / help
frp-client tools
```

## Defaults

| key      | value                                       |
|----------|---------------------------------------------|
| binary   | `~/.frp-tunnel/bin/frpc` (or `~/.local/bin/frpc`, `~/bin/frpc`, or `$FRP_CLIENT_BIN`) |
| config   | `~/cicy-ai/db/frpc.toml`                    |
| pid file | `~/.local/state/cicy-skills/frp/client/pid` |
| log      | `~/logs/frpc.log` (override `FRP_CLIENT_LOG`) |

## Environment

- `FRP_CLIENT_BIN` — frpc binary path override
- `FRP_CLIENT_LOG` — log path override
- `FRP_CONFIG`     — config path override (default `~/cicy-ai/db/frpc.toml`)

## Remote machines

When the target FRP client is on another machine, manage it through ssh:

```
ssh remote-box 'frp-client status'
ssh remote-box 'frp-client reload'
```

## Exit codes

| code | meaning                       |
|------|-------------------------------|
| 0    | success                       |
| 1    | generic                       |
| 2    | invalid arguments             |
| 3    | missing binary / config / log |
| 4    | already running / web-api / kill error |
