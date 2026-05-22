---
name: cping
description: Check network latency and reachability to a domain or IP from this host, with emphasis on China-side reachability.
---

# cping

Check reachability and latency from this host to a domain or IP, including
DNS resolution time and HTTP HEAD round-trip. Designed to give a quick
"is this reachable from where I am right now?" answer that's useful when
debugging China-side connectivity.

## Scope

Use this skill when:

- the user asks "can I reach X?" or "what's the latency to X?"
- you need a quick reachability check before spinning up a longer connection
- the user wants to compare China-side vs international reachability

Do **not** use this skill for:

- continuous monitoring (use a real probe instead)
- traceroute / network topology debugging
- TCP-level latency to non-HTTP services (DNS-only mode is the workaround)

## Quick start

```sh
cping example.com                      # human-readable
cping example.com --json               # machine-readable
cping example.com --dns-only           # skip HTTP probe
cping 8.8.8.8 --timeout 5              # custom timeout (seconds)
cping example.com --port 443           # custom port for TCP probe
```

## Rules

1. By default cping does DNS resolution + HTTPS HEAD. Pass `--dns-only` if the
   target doesn't speak HTTP.
2. Default timeout is 10 seconds total per probe. Use `--timeout` to change.
3. Output is single-line plain text by default; pass `--json` for structured
   output.
4. Exit code 0 means reachable; non-zero means failure of some kind (see
   [help.md](./help.md) for the code map).
5. cping does NOT modify any system state. It is read-only and stateless.

## References

- [help.md](./help.md) — full command reference and examples
- [tools.md](./tools.md) — endpoints, env vars, exit codes
