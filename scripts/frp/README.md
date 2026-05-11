# FRP Client Installer

Short installer entrypoints for connecting a client machine to the CiCy FRP server.

## Install commands

### macOS / Linux

Interactive terminal:

```bash
curl -fsSL https://install.cicy-ai.com/frp | bash
```

Non-interactive terminal:

```bash
FRP_TOKEN='your-token' curl -fsSL https://install.cicy-ai.com/frp | bash
```

Or pass the token explicitly:

```bash
curl -fsSL https://install.cicy-ai.com/frp | bash -s -- --token 'your-token' --remote-port 9503
```

Default behavior:

- installs `frpc`
- writes `~/.config/frp/frpc.toml` on first run
- if `~/.config/frp/frpc.toml` already exists, prints the config path and reuses it without overwriting
- starts `frpc` immediately
  - macOS: LaunchAgent
  - Linux: systemd service when `systemctl` + `sudo` are available
  - fallback: `--service none` background process
- rerun the installer after editing the config to hot reload; if reload is unavailable, it falls back to restart
- exposes local `127.0.0.1:22` to remote port `9502`

Useful options:

- `--service auto|launchd|system|none`
- `--remote-port <PORT>`
- `--local-port <PORT>`
- `--name <NAME>`
- `--token <TOKEN>`

### Windows

Run in PowerShell:

```powershell
$u='https://install.cicy-ai.com/frp';
$p=Join-Path $env:TEMP 'install-frpc-client.ps1';
irm $u -OutFile $p; powershell -ExecutionPolicy Bypass -File $p
```

The script prompts for the FRP token and self-elevates to install the Windows service.

## Defaults

- FRP server: `47.114.96.114:9500`
- remote port start: `9502`
- local port: `22`
- binary path: `~/.local/bin/frpc`
- config path: `~/.config/frp/frpc.toml`
- log path: `~/.local/frp/frpc.log`

## Manage an existing install

The installer prints the exact commands for the current machine after each run, including:

- `status`
- `reload`
- `restart`
- `start` (for `--service none`)

Typical workflow after editing the config:

1. Open the printed config path.
2. Update token / ports / proxy name.
3. Rerun the installer, or use the printed reload command.
4. If reload fails, use the printed restart command.

After install, access the client machine through the server with:

```bash
ssh -p 9502 <your-user>@47.114.96.114
```
