# cicy-mihomo — help

## Commands

```
cicy-mihomo install [--force]            Download mihomo binary into ~/.local/bin
cicy-mihomo template                     Print yaml template (no write)
cicy-mihomo gen-config [--force]         Write template to ~/cicy-ai/db/mihomo.yaml
cicy-mihomo show-config                  Print current config
cicy-mihomo status [--json]              pid / binary / config / controller status
cicy-mihomo start                        Start mihomo as background daemon
cicy-mihomo stop                         SIGTERM (then SIGKILL after 5s)
cicy-mihomo restart                      stop + start
cicy-mihomo reload                       Hot reload via controller PUT /configs?force=true
cicy-mihomo logs [N|-f]                  tail log
cicy-mihomo test [--json]                Measure latency of each node to anthropic / google / github / cf
cicy-mihomo --help / -h / help
cicy-mihomo tools
```

## Defaults

| key      | value                                  |
|----------|----------------------------------------|
| binary   | `~/.local/bin/mihomo`                  |
| config   | `~/cicy-ai/db/mihomo.yaml`             |
| pid      | `~/.local/state/cicy-skills/mihomo/pid` |
| log      | `~/logs/mihomo.log`                    |
| port     | `9001` (mixed)                         |
| ctrl     | `http://127.0.0.1:19001`               |

## Environment

- `MIHOMO_BIN`              — binary path override
- `MIHOMO_CONFIG`           — config path override
- `MIHOMO_LOG`              — log path override
- `MIHOMO_CTRL`             — controller URL override
- `CICY_MIHOMO_VERSION`     — pin install release tag (default `v1.10.2`)
- `CICY_MIHOMO_RELEASE_URL` — direct download URL override
- `GITHUB_PROXY`            — github.com proxy prefix (default `https://gh-proxy.com/`)

## Exit codes

| code | meaning                   |
|------|---------------------------|
| 0    | success                   |
| 1    | generic                   |
| 2    | invalid arguments         |
| 3    | missing binary / config / log |
| 4    | controller / process error |
