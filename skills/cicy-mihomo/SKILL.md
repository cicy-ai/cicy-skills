---
name: cicy-mihomo
description: Manage the local Cicy Mihomo proxy with start/stop/reload/status/logs, node speed-testing, and per-Chrome-profile listeners (multi-port + IN-NAME rules).
---

# Cicy Mihomo Proxy

This skill (`cicy-mihomo`) manages a local Cicy Mihomo (a fork of
`mihomo` / clash-meta) proxy process. Mixed port `9001`, controller API on
`127.0.0.1:19001`.

## Scope

Use this skill when the task involves:

- starting / stopping / restarting / reloading mihomo
- viewing the current config or generating a fresh template
- tailing mihomo logs
- speed-testing the configured proxy nodes against fixed targets
- installing the mihomo binary itself (`cicy-mihomo install` pulls the per-platform `cicy-mihomo-<plat>` subpackage from npm — same channel as cicy-code — as a versioned binary `~/.local/bin/mihomo-<ver>`, with `~/.local/bin/mihomo` a symlink → the current version. So mihomo is **on PATH** and still version-managed + atomically rollback-able (repoint the symlink). Version-aware: present & current → skip, absent → install, behind → update; a GitHub release is the fallback. `--force` to reinstall)
- **adding a proxy node (1.2.0+)**: `cicy-mihomo addProxy name=<id> type=<adapter> server=<host> port=<n> [k=v ...]` writes the node into `proxies:` and adds it to `default_proxy_group` (`--group`/`--no-group` to override). Use `<YOUR_PASSWORD_HERE>`-style placeholders for secrets — never real values — and let the user substitute them in an editor; the command masks non-placeholder sensitive values in its output
- **adding/overwriting a proxy-group (1.3.0+)**: `cicy-mihomo addGroup <name> <member...>` upserts a `select` group (same name overwrites; members = nodes, groups, or DIRECT/REJECT/PASS)
- **per-user auth + routing (1.3.0+)**: `cicy-mihomo addUser <user> <target> [<password>]` upserts the `authentication:` entry and the `IN-USER,<user>,<target>` rule (inserted above IN-USER-PREFIX so it wins). No password → generated and printed once; never echo user-supplied passwords
- **per-Chrome-profile listeners**: open one auth-free local port per Chrome profile and route each port to its own proxy via IN-NAME rules

## Per-Chrome-profile listeners (1.1.0+)

Chrome does not accept proxies with username/password — Basic Auth in the
proxy URL is rejected. The clean workaround is one mihomo `listener` per
profile, no auth on each, routed by `IN-NAME,<listener>,<group>` rules.

```bash
cicy-mihomo listeners                                   # show what's configured
cicy-mihomo add-chrome-profile chrome-profile-1         # default port 20001 → DIRECT
cicy-mihomo add-chrome-profile chrome-profile-2 \
    --upstream proxy_local                              # routes via existing proxy "proxy_local"
cicy-mihomo add-chrome-profile work --port 20100 \
    --upstream us_proxy_group                           # custom port + group
cicy-mihomo reload                                       # SIGHUP / controller PUT
# Then point each Chrome profile at 127.0.0.1:<port>  (no auth)

cicy-mihomo remove-chrome-profile chrome-profile-2
```

`add-chrome-profile` mutates `~/cicy-ai/db/mihomo.yaml`:
1. Inserts a `mixed`-type listener under `listeners:`
2. Inserts a `select` `<name>-group` under `proxy-groups:`
3. Inserts `IN-NAME,<name>,<name>-group` at the **top** of `rules:`
   (must precede IN-USER / IN-USER-PREFIX rules)

Convention: `chrome-profile-<n>` on port `20000 + <n>`, `127.0.0.1`-bound.

## Rules

1. Prefer `cicy-mihomo` over hand-rolled `mihomo` invocations — the wrapper handles pid/log/state in a consistent location.
2. Config lives at `~/cicy-ai/db/mihomo.yaml`. Don't move it; the wrapper hard-codes that path.
3. Hot reload via `reload` rather than restart whenever possible — keeps connections alive.
4. After `add-chrome-profile` / `remove-chrome-profile`, run `cicy-mihomo reload` so the listener (or its release) takes effect.
5. `test` reports observational network data; don't over-attribute slowness to a single node from one run.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
