---
name: mihomo2clash
description: Convert the cicy mihomo.yaml into a standard Clash config (drops listeners, IN-* rules and auth, rewrites default-deny) and save it to ~/projects for local or remote import.
---

# mihomo2clash

The cicy `mihomo.yaml` (`~/cicy-ai/db/mihomo.yaml`) is a mihomo/clash-meta
config with cicy-specific parts: per-Chrome-profile `listeners`, `IN-NAME` /
`IN-USER-PREFIX` routing, proxy authentication, a `type: direct` placeholder
node and a default-deny `MATCH,REJECT`. None of that loads (or makes sense) in
a normal Clash client. This skill strips/rewrites those parts and writes a
standard config you can import on a phone or another PC.

## When to use

- Reuse the nodes configured in cicy-mihomo in Clash Verge / ClashX Meta /
  Stash / Clash for Android
- Hand a colleague the same egress nodes as a plain Clash profile
- Preview what would change before exporting → `mihomo2clash check`

## Usage

```sh
mihomo2clash convert                       # → ~/projects/clash-config.yaml
mihomo2clash convert --cn-direct           # add GEOIP,CN,DIRECT before MATCH
mihomo2clash convert --strict              # drop vless/hysteria/tuic (classic Clash only)
mihomo2clash convert -o - > my.yaml        # to stdout
mihomo2clash check --json                  # dry run
```

## Importing

- **Local profile**: pick `~/projects/clash-config.yaml` in the client.
- **Remote profile**: serve the folder with the `lanshare` skill and use the
  URL as the subscription:
  `lanshare serve ~/projects -a user:pass --daemon` →
  `http://user:pass@<LAN-IP>:8080/clash-config.yaml`

## What is changed

| Source | Output |
|--------|--------|
| `mixed-port`, `allow-lan: true`, `bind-address` | `port: 7890`, `socks-port: 7891`, `allow-lan: false` |
| `external-controller`, `external-ui` | `127.0.0.1:9090`, dropped |
| `authentication`, `skip-auth-prefixes`, `listeners` | dropped |
| `dns.listen: 127.0.0.1:53` | `0.0.0.0:1053` (unprivileged) |
| proxy `type: direct` / `reject` | dropped; group references → `DIRECT` |
| `IN-NAME`, `IN-USER`, `IN-USER-PREFIX`, `IN-TYPE`, `IN-PORT`, `SUB-RULE`, logic rules | dropped |
| groups only referenced by dropped `IN-*` rules | dropped |
| `MATCH,REJECT` | `MATCH,<--group>` (default `default_proxy_group`) |

The output contains proxy credentials and is written with mode `0600`.
`vless`, `hysteria2`, `tuic`, … remain unless `--strict`; they need a
Meta-core client.

## References

- [help.en.md](./references/help.en.md) / [help.cn.md](./references/help.cn.md)
- [tools.en.md](./references/tools.en.md) / [tools.cn.md](./references/tools.cn.md)
