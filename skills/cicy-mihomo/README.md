# cicy-mihomo

> Source-only Node.js. Read [`bin/cicy-mihomo`](./bin/cicy-mihomo).

Manages a local mihomo / clash-meta proxy: start / stop / reload / status /
logs / speed-test, plus per-Chrome-profile listener management.
Mixed port `9001`, controller `127.0.0.1:19001`.

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
cicy-mihomo template                 # print yaml template
cicy-mihomo show-config              # print current config
cicy-mihomo test                     # latency to anthropic / google / github / cf
```

## Per-Chrome-profile listeners (1.1.0+)

Chrome rejects proxies with username/password. The fix: one mihomo
listener per Chrome profile, no auth on each, routed via `IN-NAME` rules.

```bash
cicy-mihomo listeners                                    # show what's configured
cicy-mihomo add-chrome-profile chrome-profile-1          # default port 20001 → DIRECT
cicy-mihomo add-chrome-profile chrome-profile-2 \
    --upstream proxy_local                               # via existing proxy "proxy_local"
cicy-mihomo add-chrome-profile work --port 20100 \
    --upstream us_proxy_group
cicy-mihomo reload                                       # apply
# → Chrome profile 1 proxy: 127.0.0.1:20001 (no auth)
# → Chrome profile 2 proxy: 127.0.0.1:20002 (no auth)

cicy-mihomo remove-chrome-profile chrome-profile-2
cicy-mihomo reload
```

`add-chrome-profile` mutates `~/cicy-ai/db/mihomo.yaml`:
1. Inserts a `mixed`-type listener under `listeners:`
2. Inserts a `select` `<name>-group` under `proxy-groups:`
3. Inserts `IN-NAME,<name>,<name>-group` at the **top** of `rules:`

Convention: port `20000 + <n>` for `chrome-profile-<n>`. IN-NAME rules
must precede IN-USER / IN-USER-PREFIX (listeners-named connections never
reach auth-user rules).

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
