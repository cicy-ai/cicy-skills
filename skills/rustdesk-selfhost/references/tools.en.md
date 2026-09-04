# rustdesk-selfhost — config, ports, and troubleshooting

## Config file

`~/cicy-ai/db/rustdesk-selfhost.json` (mode 0600, never committed):

```json
{
  "host": "rd.example.com",
  "key": "<server id_ed25519.pub>",
  "password": "<unattended password>",
  "idPort": 21116,
  "relayPort": 21117,
  "dataDir": "/home/you/rustdesk-data"
}
```

- `host` — the DNS name or IP clients point at. A DNS name is best: the server IP
  can change without touching any client.
- `key` — the server public key. Filled automatically by `server-up`.
- `password` — the unattended (permanent) password applied to managed hosts.

## Ports

| Port | Proto | Role | Notes |
|---|---|---|---|
| 21115 | tcp | NAT type test | speeds up hole-punching; without it clients fall back to relay |
| 21116 | tcp + **udp** | ID / rendezvous | **UDP is the heartbeat — must be open or devices look offline** |
| 21117 | tcp | relay | data path when hole-punching fails |
| 21118 | tcp | ID web-client | optional |
| 21119 | tcp | relay web-client | optional |
| 21114 | tcp | Pro API | open-source hbbs does not listen here; harmless if firewalled |

## Server files (in `dataDir`)

- `id_ed25519` / `id_ed25519.pub` — the server keypair. The public key is what
  clients configure. **Back these up.** Deleting them = a new key = every client
  breaks until re-pushed.
- `db_v2.sqlite3` — the peer registry (who has registered).

## Troubleshooting matrix

| Symptom | Cause | Fix |
|---|---|---|
| `Key 不匹配` / `invalid key` (server log) | Client key ≠ server's current key | Re-push `rustdesk-selfhost key` to all clients; don't rebuild the keypair casually |
| Stuck at "正在连接", no relay/punch in server log | Device offline to server = UDP heartbeat blocked | Open **udp:21116** (`firewall`) |
| Connects then `Failed to secure tcp` | Control client using an old key | Set the current key in the control GUI, restart RustDesk |
| Off-LAN clients hang, LAN clients fine | hbbs relay broadcast is a LAN IP | `server-up --relay <public-host>` |
| Endpoint unreachable behind a domain | Cloud DNS record is HTTP-proxied | Make the A record DNS-only (grey cloud) |
| Managed host won't take config remotely | Service config needs Administrator+UAC | Use `enroll-script`, Run as administrator on the host |
| `keypair_consistent: false` in `check` | Corrupt/short private key | `server-down`, remove `dataDir`, `server-up` fresh, re-push key |

## Control vs. managed

- Control client config only sticks when set in the **GUI**.
- Managed host config must be written to the **LocalService** profile
  (`C:\Windows\ServiceProfiles\LocalService\...\RustDesk2.toml`), which requires
  Administrator. `ps1` writes both profiles; `enroll-script` does it under a UAC
  prompt.

## Related

- `cf` — create the DNS-only A record for your endpoint.
- RustDesk server docs: https://rustdesk.com/docs/en/self-host/
