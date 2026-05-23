# cping — help

## Synopsis

```
cping <host>[:port] [options]
```

`<host>` may be a domain name or an IP. If `:port` is included it overrides
the default port. Without a port, cping uses 443 for HTTPS probes.

## Options

| flag                | default | meaning                                       |
|---------------------|---------|-----------------------------------------------|
| `--json`            | off     | emit JSON instead of human-readable text      |
| `--dns-only`        | off     | resolve DNS only, skip HTTP/TCP probe         |
| `--tcp-only`        | off     | TCP connect probe only (use with `--port`)    |
| `--port N`          | 443     | port for TCP probe; HTTPS uses 443, HTTP 80   |
| `--timeout S`       | 10      | total timeout in seconds (split across steps) |
| `--help`, `-h`      |         | print this help text                          |

## Examples

```bash
# Default: DNS + HTTPS HEAD
cping example.com

# Machine output
cping example.com --json

# DNS resolution only
cping example.com --dns-only

# TCP probe to port 22 (SSH)
cping github.com --tcp-only --port 22

# Lower the timeout to 3 seconds total
cping flaky.example.com --timeout 3

# Combine host:port with --tcp-only
cping mysql.internal:3306 --tcp-only
```

## Output (text)

```
<host>  → <resolved-ip>  dns=<ms>ms  [http=<ms>ms status=<code> | tcp=<ms>ms]
```

## Output (JSON)

```json
{
  "host": "example.com",
  "port": 443,
  "dns": { "ok": true, "address": "93.184.216.34", "family": 4, "ms": 12.5 },
  "http": { "ok": true, "status": 200, "ms": 120.3 },
  "ok": true
}
```

On failure:

```json
{
  "ok": false,
  "host": "example.com",
  "error": { "code": "NETWORK", "message": "..." },
  "dns": { ... }
}
```

## Environment variables

(none — cping is stateless)
