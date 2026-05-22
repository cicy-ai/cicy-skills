---
name: cicy-mihomo
description: Manage the local Cicy Mihomo (mihomo / clash-meta fork) proxy on this host with start/stop/reload/status/logs and node speed-testing.
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
- installing the mihomo binary itself (`cicy-mihomo install` downloads from cicy-ai/cicy-mihomo)

## Rules

1. Prefer `cicy-mihomo` over hand-rolled `mihomo` invocations — the wrapper handles pid/log/state in a consistent location.
2. Config lives at `~/cicy-ai/db/mihomo.yaml`. Don't move it; the wrapper hard-codes that path.
3. Hot reload via `reload` rather than restart whenever possible — keeps connections alive.
4. `test` reports observational network data; don't over-attribute slowness to a single node from one run.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
