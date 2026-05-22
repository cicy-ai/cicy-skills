# frp-client

> Source-only Node.js, ~265 LOC. Read [`bin/frp-client`](./bin/frp-client).

Manages a local `frpc` (FRP client) process: start / stop / status / reload /
logs / connections. Reload uses SIGHUP (frpc v0.50+).

## Install

```bash
cicy-code skill install frp-client
# install frpc separately (binary discovery order):
#   ~/.frp-tunnel/bin/frpc
#   ~/.local/bin/frpc
#   ~/bin/frpc
# or set FRP_CLIENT_BIN env to a custom path
```

## Quick usage

```bash
frp-client start
frp-client status               # pid + binary + config + web-api status
frp-client connections          # GET /api/status from frpc admin
frp-client logs 200
frp-client logs -f
frp-client reload               # SIGHUP for hot reload
frp-client restart
frp-client stop
frp-client raw -- --help        # passthrough to frpc binary
```

## Remote management

```bash
ssh prod-vps 'frp-client status'
ssh prod-vps 'frp-client reload'
```

## Defaults

| key      | value                                       |
|----------|---------------------------------------------|
| binary   | `~/.frp-tunnel/bin/frpc` → `~/.local/bin/frpc` → `~/bin/frpc` (override `FRP_CLIENT_BIN`) |
| config   | `~/cicy-ai/db/frpc.toml`                    |
| pid file | `~/.local/state/cicy-skills/frp/client/pid` |
| log      | `~/logs/frpc.log` (override `FRP_CLIENT_LOG`) |

## License

MIT
