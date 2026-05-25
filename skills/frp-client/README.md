# frp-client

> Source-only Node.js. Read [`bin/frp-client`](./bin/frp-client).

Manages a local `frpc` (FRP client) process: install / start / stop / status / reload /
logs / connections. Auto-installs systemd (Linux) or launchd (macOS) service.

## Install frpc + service

```bash
# Install frpc binary, write config, and set up as system service:
frp-client install --server <HOST> --token <TOKEN>

# Or via curl one-liner:
FRP_SERVER=1.2.3.4 FRP_TOKEN=xxxx curl -fsSL https://install.cicy-ai.com/frp | bash

# Re-run install to reuse existing config and hot-reload:
frp-client install
```

Then install the skill wrapper:
```bash
cicy-code skill install frp-client
```

## Quick usage

```bash
frp-client install --server 1.2.3.4 --token xxxx   # first-time setup
frp-client service status                            # check service state
frp-client start
frp-client status               # pid + binary + config + web-api status
frp-client connections          # GET /api/status from frpc admin
frp-client logs 200
frp-client logs -f
frp-client reload               # SIGHUP for hot reload
frp-client restart
frp-client stop
```

## Remote management

```bash
ssh prod-vps 'frp-client status'
ssh prod-vps 'frp-client reload'
ssh prod-vps 'frp-client install --server 1.2.3.4 --token xxxx'
```

## Defaults

| key      | value                                       |
|----------|---------------------------------------------|\
| binary   | `~/.frp-tunnel/bin/frpc` → `~/.local/bin/frpc` → `~/bin/frpc` (override `FRP_CLIENT_BIN`) |
| config   | `~/cicy-ai/db/frpc.toml`                    |
| pid file | `~/.local/state/cicy-skills/frp/client/pid` |
| log      | `~/logs/frpc.log` (override `FRP_CLIENT_LOG`) |

## License

MIT
