# cicy-mihomo — tools

## What it does

Process manager + thin controller-API client for a local mihomo proxy.

## Files touched

| op     | path                                       | mode | when         |
|--------|--------------------------------------------|------|--------------|
| write  | `~/.local/bin/mihomo`                      | 0755 | `install`    |
| write  | `~/cicy-ai/db/mihomo.yaml`                 | 0600 | `gen-config` |
| read   | `~/cicy-ai/db/mihomo.yaml`                 | —    | `show-config` |
| write  | `~/.local/state/cicy-skills/mihomo/pid`    | 0644 | `start`      |
| append | `~/logs/mihomo.log`                        | —    | `start`      |

## Process management

- `start` — `spawn(BINARY, ['-f', CONFIG], { detached:true, stdio:['ignore', logFD, logFD] })` then write pid file.
- `stop`  — `process.kill(pid, 'SIGTERM')`, wait up to 5s, then SIGKILL.
- `status` — `process.kill(pid, 0)` to verify pid is alive; if alive, GET `/version` from controller for version string.

## Controller API

- `reload`: `PUT http://127.0.0.1:19001/configs?force=true` with `{ "path": "<config>" }`
- `test`:   `GET /proxies` to enumerate nodes, then `GET /proxies/<node>/delay?url=<probe>&timeout=3000` per node × probe URL

Probe URLs:

| key       | url                                            |
|-----------|------------------------------------------------|
| anthropic | `https://api.anthropic.com/`                   |
| google    | `https://www.google.com/generate_204`          |
| github    | `https://github.com/`                          |
| cf        | `https://www.cloudflare.com/cdn-cgi/trace`     |

## Configuration

| path                       | mode | secret_fields  |
|----------------------------|------|----------------|
| `~/cicy-ai/db/mihomo.yaml` | 0600 | (none — yaml may contain proxy passwords; treat as sensitive) |

## Conventions (default template)

- `mixed-port: 9001`
- `external-controller: 127.0.0.1:19001`
- `skip-auth-prefixes: [127.0.0.1/32, ::1/128]` — local Chrome / curl skip auth
- `IN-USER-PREFIX,w-,default_proxy_group` — every `w-*` user routes via default group; pin a worker by adding `IN-USER,<user>,<target>` ABOVE this line
- `default_proxy_group` is a `select` group; switch active node via `PUT /proxies/default_proxy_group`

## Exit codes

See [help.md](./help.md).
