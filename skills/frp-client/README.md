# frp-client

> Source-only Node.js, ~265 LOC. Read [`bin/frp-client`](./bin/frp-client).

Manages a local `frpc` (FRP client) process: start / stop / status / reload /
logs / connections. Reload uses SIGHUP (frpc v0.50+).

## Install frpc binary

```bash
# One-liner install (downloads frpc, writes config, optionally sets up as service)
curl -fsSL https://install.cicy-ai.com/frp | bash -s -- \
  --server <HOST> \
  --token <TOKEN>

# Or with env vars:
FRP_SERVER=1.2.3.4 FRP_TOKEN=xxxx curl -fsSL https://install.cicy-ai.com/frp | bash

# Re-run with no args to reuse existing config and hot-reload:
curl -fsSL https://install.cicy-ai.com/frp | bash
```

| option | default | description |
|---|---|---|
| `--server <HOST>` | — | FRP server address (required on first install) |
| `--token <TOKEN>` | — | FRP auth token (required on first install) |
| `--server-port` | 9500 | FRP server port |
| `--remote-port` | 9502 | Remote TCP port on server |
| `--local-port` | 22 | Local port to expose |
| `--name` | auto | Proxy name |
| `--frp-version` | 0.68.1 | frpc version to download |
| `--service` | auto | Service mode: `auto`/`system`/`launchd`/`none` |

Then install the skill wrapper:

```bash
cicy-code skill install frp-client
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
