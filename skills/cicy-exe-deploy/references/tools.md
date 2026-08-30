# cicy-exe-deploy — endpoints / env / exit codes

## What it talks to

| target | how | purpose |
|---|---|---|
| local cicy-code `GET /api/im/cicy-cloud/instances` | `http://127.0.0.1:$CICY_API_PORT`, Bearer `api_token` | discover siblings: `proxyHost`, `status`, `platform`, `version`, `frp.host`, `frp.ports.ssh`, `frp.user`, `frp.sshLive` |
| each node's sshd | `ssh -p <frp.ports.ssh> <frp.user>@<frp.host>` (BatchMode, key auth) | `mkdir`, `curl`, `stat`, read the node's `~/cicy-ai/global.json` `api_token` |
| each node's cicy-code `:8008` | `ssh -N -L <free>:127.0.0.1:8008` tunnel | `agent-desktop clients --json`, `agent-desktop exec-file install.bat --client <id>` |
| the node's Windows PC | cicy-desktop connected to that node (`platform: win`) | runs `start "" "C:\projects\<name>" <args>` |

## Env

| var | default | meaning |
|---|---|---|
| `CICY_API_PORT` | `8008` | local cicy-code port (also the remote port tunnelled) |
| `CICY_API_TOKEN` | from `~/cicy-ai/global.json` | local cicy-code token |
| `CICY_GLOBAL_JSON` | `~/cicy-ai/global.json` | where to read the token |

## Requirements

- `ssh`, `scp` on PATH; sibling ssh trust in place (cicy-code hub mode installs
  the tenant's keys into every node's `~/.ssh/authorized_keys`)
- the `agent-desktop` skill installed here (`cicy-code skill install agent-desktop`)
- each target node: a Windows PC whose cicy-desktop is connected to that node's `:8008`

## Exit codes

`0` ok · `1` usage, cicy-code unreachable, no matching nodes · `2` one or more nodes failed.

## Related

- `agent-desktop` — the per-PC RPC bridge this skill drives
- `cicy-ssh` — inspect `~/.ssh/config` aliases (not needed here: targets come from the hub)
