# cping — tools

For agents: this file documents what cping calls, where it reads/writes, and
how to interpret its output programmatically.

## External calls

| target                      | when                                  | method |
|-----------------------------|---------------------------------------|--------|
| system DNS resolver         | always (DNS step)                     | `dns.lookup` |
| `https://<host>:<port>/`    | default + `--port` modes              | HEAD   |
| `tcp://<host>:<port>`       | `--tcp-only`                          | connect |

cping makes **at most one** request per probe per invocation.

## Configuration files

None. cping is stateless.

## Environment variables

None.

## Stdin / stdout / stderr

- stdin: ignored
- stdout: result (JSON if `--json`, otherwise plain text)
- stderr: usage errors and dns/network failures (in non-JSON mode)

## JSON output schema

```json
{
  "host": "example.com",
  "port": 443,
  "dns": {
    "ok": true,
    "address": "93.184.216.34",
    "family": 4,
    "ms": 12.5
  },
  "http": {
    "ok": true,
    "status": 200,
    "ms": 120.3
  },
  "tcp": {
    "ok": true,
    "ms": 18.4
  },
  "ok": true
}
```

`http` is present iff neither `--dns-only` nor `--tcp-only` was used.
`tcp` is present iff `--tcp-only` was used.

On error:

```json
{
  "ok": false,
  "host": "example.com",
  "error": {
    "code": "NETWORK",
    "message": "..."
  },
  "dns": { ... }
}
```

## Error codes

| code            | meaning                            |
|-----------------|------------------------------------|
| `INVALID_ARGS`  | usage error, exit 2                |
| `NETWORK`       | DNS or connect failure, exit 4     |
| `TIMEOUT`       | step exceeded budget, exit 3 or 4  |
| `INTERNAL`      | unexpected error, exit 1           |
