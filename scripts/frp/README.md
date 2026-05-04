# FRP Client Installer

GitHub-hosted installers for connecting a client machine to the CiCy FRP server.

## China-friendly bootstrap URLs

### macOS / Linux

```bash
curl -fsSL https://gh-proxy.com/https://raw.githubusercontent.com/cicy-ai/cicy-skills/main/scripts/frp/install-frpc-client.sh | bash
```

The installer prompts for the FRP token if you do not pass `--token`.

Default behavior:

- installs `frpc`
- writes `~/.config/frp/frpc.toml`
- installs a service
  - macOS: LaunchAgent
  - Linux: systemd service
- exposes local `127.0.0.1:22` to remote port `9502`

### Windows

Run in PowerShell:

```powershell
$u='https://gh-proxy.com/https://raw.githubusercontent.com/cicy-ai/cicy-skills/main/scripts/frp/install-frpc-client.ps1';
$p=Join-Path $env:TEMP 'install-frpc-client.ps1';
irm $u -OutFile $p; powershell -ExecutionPolicy Bypass -File $p
```

The script prompts for the FRP token and self-elevates to install the Windows service.

## Defaults

- FRP server: `47.114.96.114:9500`
- remote port start: `9502`
- local port: `22`

After install, access the client machine through the server with:

```bash
ssh -p 9502 <your-user>@47.114.96.114
```
