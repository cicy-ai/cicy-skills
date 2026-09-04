# rustdesk-selfhost — command reference

`rustdesk-selfhost <command> [args]`

## Server (run on the public server host; needs docker)

| Command | What it does |
|---|---|
| `server-up --relay <host>` | Start `hbbs`+`hbbr` (docker, host net). Broadcasts `<host>:21117` as relay. Waits for the keypair and saves the public key to config. Optional: `--data <dir>` (default `~/rustdesk-data`). |
| `server-down` | Stop and remove the `hbbs`/`hbbr` containers. |
| `key` | Print the current server public key from disk (authoritative). |
| `check` | JSON report: running containers, tcp/udp port listen state, and keypair consistency (private[32:] must equal the public key). |
| `firewall [gcloud\|iptables]` | Print the firewall rules. Always includes **udp:21116**. `gcloud` prints the `firewall-rules create` command; `iptables` prints `-A INPUT` rules; no arg prints a plain port list. |

## Client artifacts

| Command | For | Output |
|---|---|---|
| `client-config` | Control machine | Human ID/relay/key to type into the RustDesk GUI. |
| `client-toml` | Managed host | The `[options]` TOML lines (`key` / `custom-rendezvous-server` / `relay-server`). |
| `ps1` | Managed host (elevated agent) | PowerShell that writes both the service and user profiles and restarts the service. |
| `enroll-script` | Managed host you can't elevate remotely | A one-click Windows `.bat` (CRLF). User right-clicks → Run as administrator. |

## Config

| Command | What it does |
|---|---|
| `config` | Print the current endpoint/config (key shown, password masked). |
| `config k=v ...` | Set fields: `host` (DNS or IP), `key`, `password`, `idPort` (21116), `relayPort` (21117), `dataDir`. |
| `status` | Server + endpoint status as JSON. |

## Typical flow

```sh
rustdesk-selfhost server-up --relay rd.example.com
rustdesk-selfhost firewall gcloud          # apply the printed rule
rustdesk-selfhost config host=rd.example.com password=<pw>
rustdesk-selfhost check                    # all ports true, keypair_consistent true
rustdesk-selfhost client-config            # type into control GUI
rustdesk-selfhost enroll-script > fix.bat  # for hosts you must enroll on-site
```
