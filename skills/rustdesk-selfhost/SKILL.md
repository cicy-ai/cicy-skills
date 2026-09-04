---
name: rustdesk-selfhost
description: Deploy a self-hosted RustDesk server (hbbs/hbbr) and generate the exact client config, TOML, and one-click Windows enrollment scripts your fleet needs to reach it.
---

# RustDesk Self-Host (rustdesk-selfhost)

> **Wrapper command:** `rustdesk-selfhost`. Subcommands: `server-up` / `server-down` /
> `key` / `check` / `firewall` / `client-config` / `client-toml` / `ps1` /
> `enroll-script` / `config` / `status`.

Stand up your own RustDesk ID + relay server and hand every machine the precise
settings it needs — without re-learning the four mistakes that make RustDesk
self-hosting fail silently.

## When to use

- You want remote desktop control of a fleet without depending on RustDesk's
  public servers (rate-limited, shared relay, slow for many machines).
- You have one host with a public IP (or a DNS name pointing at one) to run the
  server, and a set of Windows machines to control.

## The four things that silently break RustDesk self-hosting

This tool encodes each fix so you don't rediscover it at 2am:

1. **Key must match the server's CURRENT key.** Clients configure the server's
   `id_ed25519.pub`. Every `hbbs` restart that regenerates the keypair breaks
   every client — you see `Key 不匹配` / `invalid key`. `server-up` persists the
   key; `key` prints the authoritative one; **never rebuild the keypair without
   re-pushing the new key to all clients**.
2. **Open UDP 21116, not just TCP.** A device stays "online" via a UDP heartbeat
   on 21116. TCP-only makes it register once then look offline, and every connect
   stalls at "正在连接". `firewall` always includes the UDP rule.
3. **The relay address hbbs broadcasts must be public.** `server-up --relay` sets
   `hbbs -r <public-host>:21117`. A LAN IP there makes off-LAN clients hang.
4. **A cloud DNS endpoint must be DNS-only.** Cloudflare's proxy (orange cloud)
   only fronts HTTP; the RustDesk ports die behind it. Use a grey-cloud A record.

## Quick start

```sh
# On the SERVER host (needs docker + a public IP or DNS name):
rustdesk-selfhost server-up --relay rd.example.com     # starts hbbs+hbbr, prints the key
rustdesk-selfhost firewall gcloud                      # open tcp:21115-21117 + udp:21116
rustdesk-selfhost check                                # containers, ports, keypair sanity

# Persist the endpoint so client artifacts are one command each:
rustdesk-selfhost config host=rd.example.com password=<unattended-pw>

# CONTROL machine (the one you drive from) — type into the RustDesk GUI:
rustdesk-selfhost client-config

# MANAGED machines (被控) you can configure with an elevated agent:
rustdesk-selfhost ps1 | <run elevated on the host>

# MANAGED machines you CANNOT elevate remotely — ship a one-click script:
rustdesk-selfhost enroll-script > fix-rustdesk.bat     # user right-clicks → Run as administrator
```

## Control vs. managed clients (important)

- **Control client** (the machine you sit at): set ID/relay/key in the **GUI**
  (Settings → Network → ID/Relay server). A value written to the config file is
  overwritten by the running GUI, so `client-config` prints values to type, not a
  file to drop.
- **Managed/unattended host** (被控): the RustDesk *service* runs as LocalSystem
  and reads `C:\Windows\ServiceProfiles\LocalService\...\RustDesk2.toml`. Writing
  only `%APPDATA%` does nothing for unattended connections. Use `ps1` (elevated)
  or `enroll-script` (Run as administrator). There is **no remote non-elevated
  bypass** for the service config — verified against direct write, `schtasks /rl
  highest`, service stop, and WSL interop, all of which are refused.

## Security

- The server key and unattended password live only in
  `~/cicy-ai/db/rustdesk-selfhost.json` (mode 0600) — never committed.
- `client-config` prints the key/password for you to distribute; treat that
  output as a secret.
- Set a strong unattended password (`config password=...`); RustDesk stores it
  hashed on each host once applied.

See [references/help.md](./references/help.md) for the full command reference and
[references/tools.md](./references/tools.md) for the config file, ports, and
troubleshooting matrix.
