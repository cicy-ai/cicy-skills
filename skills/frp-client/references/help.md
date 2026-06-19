# frp-client

```bash
frp-client install [--server <HOST>] [--token <TOKEN>]  # Download frpc + install service
frp-client start                                        # Start frpc daemon
frp-client stop                                         # Stop frpc
frp-client restart                                      # Restart frpc
frp-client status                                       # Show pid / config / admin API
frp-client reload                                       # Hot-reload config (v0.50+)
frp-client logs [N|-f]                                  # Tail log (N lines or follow)
frp-client connections                                  # Show proxy connections
frp-client service <install|enable|disable|status>     # Manage systemd/launchd
frp-client raw -- <frpc args>                           # Pass through to frpc binary
frp-client help                                         # This help
```

## Install options

| option | default | description |
|---|---|---|
| `--server <HOST>` | — | FRP server address (required first time) |
| `--token <TOKEN>` | — | FRP auth token (required first time) |
| `--server-port` | 9500 | Server port |
| `--remote-port` | 9502 | Remote TCP port |
| `--local-port` | 22 | Local port to expose |
| `--local-ip` | 127.0.0.1 | Local IP |
| `--name` | auto | Proxy name |
| `--admin-port` | 7400 | Web admin port |
| `--frp-version` | 0.68.1 | Release version |
| `--service` | auto | `systemd`/`launchd`/`none` |

## Setup (first time)

```bash
frp-client install --server 1.2.3.4 --token xxxxx
# Then start with: frp-client start
```
