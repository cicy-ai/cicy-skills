---
name: cicy-exe-deploy
description: Distribute a Windows installer (.exe) from a WSL/Docker cicy-code node to every sibling team's Windows PC via CiCy Hub ssh and install it through that team's cicy-desktop.
---

# CiCy Exe Deploy

Push a Windows installer to every team of the same CiCy Hub account and run it
on each team's PC — from one cicy-code node, without touching the PCs by hand.

## Topology this relies on

Each team = one Windows PC running **cicy-code as a Docker container inside
WSL**, with **cicy-desktop** on that PC connected to the container's `:8008`.

- the container's `~/projects` is the PC's `C:\projects` (drvfs mount) → a file dropped
  in `~/projects/X.exe` is `C:\projects\X.exe` on that PC
- every node of one Hub account is reachable over ssh through the hub's frp
  port (`frp.ssh` in `/api/im/cicy-cloud/instances`); sibling ssh trust is
  installed automatically by cicy-code hub mode
- `agent-desktop` against a node's `:8008` (through an ssh tunnel) runs a
  `.bat` on that PC's cicy-desktop → the installer starts there

## Scope

Use this skill when the task is:

- "把 exe 分发/安装到所有 team / 所有 xs-* 机器"
- roll a new cicy-desktop (or any NSIS installer) out to every Windows node
- check which nodes already have the file / which desktop version they run

Do **not** use it for macOS/Linux nodes (no `C:\projects`, no exe) — they are skipped
unless named explicitly — or for copying ordinary files (use scp directly).

## Rules

1. **Prefer a URL over a local file.** Relayed transfers through the hub are
   slow (≈10 KB/s scp, ≈40 KB/s download from the hub host); nodes pull from
   OSS/CDN at >10 MB/s. Upload the exe to OSS (CI already does for releases:
   `https://cicy-1372193042-cn.oss-cn-shanghai.aliyuncs.com/releases/cicy-desktop-<ver>.exe`)
   and pass that URL.
2. Run `nodes` first; act only on nodes shown `ssh live`.
3. Try one node (`--nodes xs-1002`) and confirm with `versions` before the fleet.
4. The install ack usually times out — the installer restarts the desktop,
   which drops the client. "sent (ack timed out — expected)" is success;
   verify with `versions` a minute later.
5. Never install on the node you are running from unless asked (it is not a
   sibling and is excluded automatically).
6. **Run it from a node with a stable link to the hub.** Every step is an ssh
   session through the hub's frp port; a flaky uplink shows up as
   `tunnel failed` / `no api_token on node` / `kex_exchange_identification`.
   Copy the skill to a well-connected sibling (`tar | ssh … tar x`) and run it
   there under `nohup`, writing to a log you fetch later.
7. Containers whose drvfs mount is broken (`~/projects: Input/output error`)
   or absent are handled automatically: the PC's cicy-desktop downloads the
   URL with Windows `curl` and installs (`installed (via desktop)`). Force that
   path with `--via-desktop`. A node with **no cicy-desktop connected** cannot
   be installed remotely — the exe is left at `C:\projects\<name>`.
8. `--parallel 1..2` is the safe range over the hub; higher values trip
   connection drops.

## Quick start

```sh
cicy-exe-deploy nodes
cicy-exe-deploy push https://…/cicy-desktop-2.1.320.exe --nodes xs-1002
cicy-exe-deploy versions --nodes xs-1002
cicy-exe-deploy push https://…/cicy-desktop-2.1.320.exe --exclude xs-1002 --parallel 2
cicy-exe-deploy versions
```

## References

- [help.md](./references/help.md) — commands and options
- [tools.md](./references/tools.md) — endpoints, env, exit codes
