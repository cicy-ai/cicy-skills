# frp-client

> Source-only Node.js. Manages a local `frpc` (FRP client) daemon — install / start / stop / status / reload. Auto-configures systemd (Linux) or launchd (macOS).

## Setup

```bash
frp-client install --server <HOST> --token <TOKEN>
```

## Commands

```bash
frp-client start                  # Start daemon
frp-client stop                   # Stop daemon
frp-client restart                # Restart daemon
frp-client status                 # Show pid + status
frp-client reload                 # Hot-reload config
frp-client logs [N|-f]            # Show logs
frp-client connections            # Show proxy state
frp-client service <cmd>          # Manage systemd/launchd
frp-client --help                 # Help
```

## Paths

- Binary: `~/.frp-tunnel/bin/frpc` (or `~/.local/bin/frpc`, `~/bin/frpc`)
- Config: `~/cicy-ai/db/frpc.toml`
- Logs: `~/logs/frpc.log`

## License

MIT
