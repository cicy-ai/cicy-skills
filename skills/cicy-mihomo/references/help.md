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
cicy-mihomo test [--json]                Measure latency to anthropic / google / github / cf

cicy-mihomo listeners [--json]           List configured listeners + IN-NAME rule mapping

cicy-mihomo add-chrome-profile <name> [--port N] [--upstream G] [--listen ADDR]
                                         Append listener + proxy-group + IN-NAME rule
cicy-mihomo remove-chrome-profile <name> Remove listener + group + rule

cicy-mihomo addProxy name=<id> type=<adapter> server=<host> port=<n> [k=v ...]
                     [--group <group>|--no-group]
                                         Append a node under proxies: and add it to a
                                         proxy-group (default: default_proxy_group)

cicy-mihomo --help / -h / help
cicy-mihomo tools
```

## Per-Chrome-profile flow (1.1.0+)

Chrome rejects proxies with username/password. The fix: one local mihomo
listener per Chrome profile, no auth, routed by IN-NAME.

```
1. cicy-mihomo add-chrome-profile chrome-profile-1 --upstream proxy_local
2. cicy-mihomo reload
3. set Chrome profile 1's proxy = 127.0.0.1:20001 (no creds)
```

`add-chrome-profile <name> [...]` writes three things:

- `listeners:` entry — `name`, `type: mixed`, `port`, `listen`
- `proxy-groups:` entry — `<name>-group` selecting `<upstream>` (default `DIRECT`)
- `rules:` entry **at the top** — `IN-NAME,<name>,<name>-group`

Default port: smallest free `20001+`. Default listen: `127.0.0.1`.
Default upstream: `DIRECT` (change later by editing the yaml or re-adding).

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
