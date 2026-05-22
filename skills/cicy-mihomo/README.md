# cicy-mihomo

> Source-only Node.js, 362 LOC. Read [`bin/cicy-mihomo`](./bin/cicy-mihomo).

Manages a local mihomo / clash-meta proxy: start / stop / reload / status /
logs / speed-test. Mixed port `9001`, controller `127.0.0.1:19001`.

## Install

```bash
cicy-code skill install cicy-mihomo
cicy-mihomo install                  # download mihomo binary
cicy-mihomo gen-config               # write ~/cicy-ai/db/mihomo.yaml template
$EDITOR ~/cicy-ai/db/mihomo.yaml     # add proxies / groups
cicy-mihomo start
cicy-mihomo status
```

## Quick usage

```bash
cicy-mihomo start / stop / restart / reload
cicy-mihomo status
cicy-mihomo logs 200                 # tail last 200 lines
cicy-mihomo logs -f                  # follow
cicy-mihomo template                 # print yaml template (no write)
cicy-mihomo show-config              # print current config
cicy-mihomo test                     # measure each node's latency to anthropic / google / github / cf
```

## Defaults

| key      | value                       |
|----------|-----------------------------|
| binary   | `~/.local/bin/mihomo` (override `MIHOMO_BIN`) |
| config   | `~/cicy-ai/db/mihomo.yaml` (override `MIHOMO_CONFIG`) |
| pid file | `~/.local/state/cicy-skills/mihomo/pid` |
| log      | `~/logs/mihomo.log` (override `MIHOMO_LOG`) |
| port     | `9001` (mixed)              |
| ctrl     | `127.0.0.1:19001` (override `MIHOMO_CTRL`) |

## License

MIT
