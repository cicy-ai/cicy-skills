# frp-server — help

## Commands

```
frp-server start [-- --extra args]      Start frps as a background daemon
frp-server stop                         SIGTERM (then SIGKILL after 5s)
frp-server restart [-- --extra args]    stop + start
frp-server status [--json]              pid / binary / config / web-api info
frp-server reload                       SIGHUP for hot reload (frps v0.50+)
frp-server logs [N|-f]                  tail log
frp-server connections [--json]         GET /api/proxy/all (proxy listeners)
frp-server clients [--json]             GET /api/client (online clients)
frp-server raw -- <real frps args>      passthrough to frps binary
frp-server --help / -h / help
frp-server tools
```

## Defaults

| key      | value                                      |
|----------|--------------------------------------------|
| binary   | `~/.frp-tunnel/bin/frps` (or `~/.local/bin/frps`, `~/bin/frps`, or `$FRP_SERVER_BIN`) |
| config   | `~/cicy-ai/db/frps.toml`                   |
| pid file | `~/.local/state/cicy-skills/frp/server/pid` |
| log      | `~/logs/frps.log` (override `FRP_SERVER_LOG`) |

## Environment

- `FRP_SERVER_BIN` — frps binary path override
- `FRP_SERVER_LOG` — log path override
- `FRP_CONFIG`     — config path override (default `~/cicy-ai/db/frps.toml`)
