# mihomo2clash — help

```
mihomo2clash convert [options]   Convert mihomo.yaml → standard Clash config
mihomo2clash check [--json]      Dry run: report kept / dropped / rewritten
mihomo2clash --help
```

## Options

| Option | Default | Meaning |
|--------|---------|---------|
| `-i, --in <file>` | `~/cicy-ai/db/mihomo.yaml` (`$MIHOMO_CONFIG`) | Source config |
| `-o, --out <file>` | `~/projects/clash-config.yaml` (`$CICY_PROJECTS/clash-config.yaml`) | Destination; `-` = stdout |
| `--group <name>` | `default_proxy_group` | Group that replaces `MATCH,REJECT`; created as a select over all proxies if missing |
| `--cn-direct` | off | Insert `GEOIP,CN,DIRECT` before the final `MATCH` |
| `--strict` | off | Drop proxy types classic Clash cannot load (`vless`, `hysteria*`, `tuic`, `wireguard`, …) |
| `--port <n>` / `--socks-port <n>` | `7890` / `7891` | Ports in the output |
| `--allow-lan` | off | Emit `allow-lan: true` |
| `--json` | off | Machine-readable summary (`{ok, data:{in,out,report}}`) |

## Conversion rules

- Dropped top-level keys: `listeners`, `authentication`, `skip-auth-prefixes`, `external-ui`, `bind-address`, `mixed-port`, `tun`, `sniffer`, other mihomo-only tuning keys. Unknown keys are passed through.
- `dns` is kept; a privileged `listen` (`:53`) becomes `0.0.0.0:1053`.
- Proxies of type `direct` / `reject` / `dns` are dropped; groups that referenced them get `DIRECT` instead (deduplicated).
- Rules of kind `IN-NAME`, `IN-USER`, `IN-USER-PREFIX`, `IN-TYPE`, `IN-PORT`, `SUB-RULE`, `AND`/`OR`/`NOT`, `RULE-SET`, `DSCP` are dropped. Groups referenced only by dropped rules are dropped; groups reachable from surviving rules (transitively) are kept.
- `MATCH,REJECT` becomes `MATCH,<group>`; a `MATCH` rule is appended if none exists.
- Output is written with file mode `0600`; it contains credentials.

## Exit codes

`0` ok · `1` cannot read/parse source · `2` usage error
