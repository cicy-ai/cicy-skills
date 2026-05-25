# frp-client — help

## Install frpc binary + service

```bash
# First-time install (downloads frpc, writes config, installs service):
frp-client install --server <HOST> --token <TOKEN>

# Or via the one-liner installer:
FRP_SERVER=1.2.3.4 FRP_TOKEN=xxxx curl -fsSL https://install.cicy-ai.com/frp | bash

# Re-run with no args to reuse existing config:
frp-client install
```

### `frp-client install` options

| option | default | description |
|---|---|---|
| `--server <HOST>` | — | FRP server address (required on first install) |
| `--token <TOKEN>` | — | FRP auth token (required on first install) |
| `--server-port` | 9500 | FRP server port |
| `--remote-port` | 9502 | Remote TCP port on server |
| `--local-port` | 22 | Local port to expose |
| `--local-ip` | 127.0.0.1 | Local IP to expose |
| `--name` | auto (linux-ssh / mac-ssh) | Proxy name |
| `--admin-port` | 7400 | frpc webServer admin port |
| `--frp-version` | 0.68.1 | frpc version to download |
| `--service` | auto | Service mode: `auto`/`systemd`/`launchd`/`none` |
| `--github-proxy` | https://gh-proxy.com/ | GitHub download proxy |

## Commands

```
frp-client install [options]            Download frpc + write config + install service
frp-client service <install|enable|disable|status>
                                        Manage the platform service (systemd / launchd)
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
- `FRP_SERVER`     — server address for `install`
- `FRP_TOKEN`      — auth token for `install`
- `GITHUB_PROXY`   — GitHub download proxy for `install`

## Remote machines

When the target FRP client is on another machine, manage it through ssh:

```
ssh remote-box 'frp-client status'
ssh remote-box 'frp-client reload'
ssh remote-box 'frp-client install --server 1.2.3.4 --token xxxx'
```
