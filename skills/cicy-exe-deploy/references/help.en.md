# cicy-exe-deploy — command reference

```
cicy-exe-deploy nodes [--json]
cicy-exe-deploy push <exe | https://url> [--nodes a,b] [--exclude a,b] [--dest projects] [--name file.exe] [--no-install] [--args "/S"] [--parallel 3] [--json]
cicy-exe-deploy install <name.exe> [--nodes a,b] [--dest projects] [--args "/S"] [--parallel 3] [--json]
cicy-exe-deploy status <name.exe> [--nodes a,b] [--dest projects] [--json]
cicy-exe-deploy versions [--nodes a,b] [--json]
cicy-exe-deploy --help
```

## Commands

### `nodes`
Lists every sibling instance of this node's CiCy Hub account with platform,
cicy-code version, whether its frp ssh port is live, and the ssh target
(`user@host:port`). `●` online / `○` offline.

### `push <exe | url>`
Gets the installer onto each selected node's Windows host, then (unless
`--no-install`) starts it there silently.

- **URL** (recommended): each node runs `curl` itself into `~/<dest>/<name>`.
  Use an OSS/CDN link the nodes can reach fast.
- **local path**: `scp` over the hub frp ssh port. Works, but is slow
  (~10 KB/s per node) — only for small files or when no URL is possible.

With the default `--dest projects`, the file lands at `C:\projects\<name>` on the PC
(the container's `~/projects` is the host's `C:\projects`).

### `install <name.exe>`
Only the install step, for a file already present on the nodes.

### `status <name.exe>`
Shows whether the file exists on each node (size in MB) or is missing.

### `versions`
Asks each node's cicy-code for its connected cicy-desktop clients and prints
the desktop version each reports (from its user agent). Use it after a rollout.

## Options

| option | default | meaning |
|---|---|---|
| `--nodes a,b` | all online linux/WSL siblings | only these node names (as printed by `nodes`) |
| `--exclude a,b` | – | skip these |
| `--dest <dir>` | `projects` | remote dir under `~`; `projects` = `C:\projects` on WSL-docker hosts |
| `--name <file.exe>` | basename of path/URL | remote file name |
| `--no-install` | – | copy/download only |
| `--args "<flags>"` | `/S` | installer flags (`/S` = NSIS silent) |
| `--parallel N` | 3 | nodes processed concurrently |
| `--json` | – | machine-readable output |

## Exit codes
`0` all selected nodes ok · `1` usage / discovery error · `2` at least one node failed (see per-node lines).

## Typical rollout

```sh
cicy-exe-deploy nodes
cicy-exe-deploy push https://cicy-1372193042-cn.oss-cn-shanghai.aliyuncs.com/releases/cicy-desktop-2.1.320.exe --nodes xs-1002
cicy-exe-deploy versions --nodes xs-1002          # → 2.1.320 after ~1 min
cicy-exe-deploy push https://…/cicy-desktop-2.1.320.exe --exclude xs-1002 --parallel 2
cicy-exe-deploy versions
```
