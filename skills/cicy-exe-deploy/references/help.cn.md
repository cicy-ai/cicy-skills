# cicy-exe-deploy — 命令参考

```
cicy-exe-deploy nodes [--json]
cicy-exe-deploy push <exe | https://url> [--nodes a,b] [--exclude a,b] [--dest projects] [--name file.exe] [--no-install] [--args "/S"] [--parallel 3] [--json]
cicy-exe-deploy install <name.exe> [--nodes a,b] [--dest projects] [--args "/S"] [--parallel 3] [--json]
cicy-exe-deploy status <name.exe> [--nodes a,b] [--dest projects] [--json]
cicy-exe-deploy versions [--nodes a,b] [--json]
cicy-exe-deploy --help
```

## 命令

### `nodes`
列出本节点所在 CiCy Hub 账号下的所有兄弟实例：平台、cicy-code 版本、frp ssh 端口是否可用、ssh 目标（`user@host:port`）。`●` 在线 / `○` 离线。

### `push <exe | url>`
把安装包放到所选节点的 Windows 主机上，然后（除非 `--no-install`）静默启动安装。

- **URL**（推荐）：每个节点自己 `curl` 下载到 `~/<dest>/<name>`。用节点能高速访问的 OSS/CDN 链接。
- **本地路径**：通过 hub 的 frp ssh 端口 `scp`。能用但很慢（每节点约 10 KB/s），只适合小文件或拿不到 URL 的情况。

默认 `--dest projects` 时文件落在 PC 的 `C:\projects\<name>`（容器的 `~/projects` 就是宿主机的 `C:\projects`）。

### `install <name.exe>`
只做安装这一步，文件已经在节点上时用。

### `status <name.exe>`
显示文件在各节点是否存在（MB）或缺失。

### `versions`
向各节点的 cicy-code 询问已连接的 cicy-desktop 客户端，打印各自上报的 desktop 版本（取自 user agent）。分发后用它核验。

## 选项

| 选项 | 默认 | 含义 |
|---|---|---|
| `--nodes a,b` | 所有在线的 linux/WSL 兄弟节点 | 只处理这些节点（名字以 `nodes` 输出为准） |
| `--exclude a,b` | – | 跳过这些 |
| `--dest <dir>` | `projects` | `~` 下的远程目录；`projects` 在 WSL-docker 主机上就是 `C:\projects` |
| `--name <file.exe>` | 路径/URL 的文件名 | 远程文件名 |
| `--no-install` | – | 只拷贝/下载 |
| `--args "<flags>"` | `/S` | 安装参数（`/S` = NSIS 静默） |
| `--parallel N` | 3 | 并发节点数 |
| `--json` | – | 机器可读输出 |

## 退出码
`0` 所选节点全部成功 · `1` 用法/发现错误 · `2` 至少一个节点失败（看逐节点行）。

## 典型流程

```sh
cicy-exe-deploy nodes
cicy-exe-deploy push https://cicy-1372193042-cn.oss-cn-shanghai.aliyuncs.com/releases/cicy-desktop-2.1.320.exe --nodes xs-1002
cicy-exe-deploy versions --nodes xs-1002          # 约 1 分钟后 → 2.1.320
cicy-exe-deploy push https://…/cicy-desktop-2.1.320.exe --exclude xs-1002 --parallel 2
cicy-exe-deploy versions
```
