# frp-server

> Source-only Node.js, 267 LOC. Read [`bin/frp-server`](./bin/frp-server).

Manages a local `frps` (FRP server) process: start / stop / status / reload /
logs / connections. Reload uses SIGHUP (frps v0.50+).

## Install

```bash
cicy-code skill install frp-server
# install frps separately:
#   ~/.frp-tunnel/bin/frps  ←  preferred location
#   ~/.local/bin/frps       ←  fallback
#   ~/bin/frps              ←  fallback
# or set FRP_SERVER_BIN env to a custom path
```

## Quick usage

```bash
frp-server start                # daemon (logs to ~/logs/frps.log)
frp-server status               # pid + binary + config + web-api version
frp-server connections          # GET /api/proxy/all from frps web dashboard
frp-server clients              # GET /api/client (online clients)
frp-server logs 200             # tail last 200 lines
frp-server logs -f              # follow
frp-server reload               # SIGHUP for hot reload
frp-server restart
frp-server stop
frp-server raw -- --help        # passthrough to frps binary
```

## Defaults

| key      | value                                      |
|----------|--------------------------------------------|
| binary   | `~/.frp-tunnel/bin/frps` → `~/.local/bin/frps` → `~/bin/frps` (override `FRP_SERVER_BIN`) |
| config   | `~/cicy-ai/db/frps.toml`                   |
| pid file | `~/.local/state/cicy-skills/frp/server/pid` |
| log      | `~/logs/frps.log` (override `FRP_SERVER_LOG`) |

## License

MIT
