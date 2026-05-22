# cping

> Quick reachability + latency check, China-side aware.

Source-only Node.js (no npm dependencies, no compiled binary). Read
[`bin/cping`](./bin/cping) before installing.

## What it does

- Resolves a hostname to an IP via the system DNS resolver and reports the
  resolution time.
- Issues an HTTPS HEAD against the host and reports round-trip time + status
  code (or a TCP connect probe with `--tcp-only`).
- Returns a single line of human-readable output, or structured JSON with
  `--json`.

## Install

```bash
cicy-code skill install cping
```

## Usage

```bash
cping example.com
# example.com  → 93.184.216.34  dns=12.5ms  http=120.3ms status=200

cping example.com --json
# {"host":"example.com","port":443,"dns":{"ok":true,"address":"93.184.216.34","ms":12.5},
#  "http":{"ok":true,"status":200,"ms":120.3},"ok":true}

cping 8.8.8.8 --tcp-only --port 53
# 8.8.8.8  → 8.8.8.8  dns=0.1ms  tcp=18.4ms

cping example.com --dns-only
# example.com  → 93.184.216.34  dns=12.5ms
```

See [help.md](./help.md) for the full reference.

## Configuration

None. cping is stateless and reads no config files.

## Source

Authored at https://github.com/cicy-ai/cicy-skills/tree/main/skills/cping

## License

MIT
