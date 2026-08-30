# cicy-exe-deploy — 接口 / 环境变量 / 退出码

## 与谁交互

| 目标 | 方式 | 用途 |
|---|---|---|
| 本地 cicy-code `GET /api/im/cicy-cloud/instances` | `http://127.0.0.1:$CICY_API_PORT`，Bearer `api_token` | 发现兄弟节点：`proxyHost`、`status`、`platform`、`version`、`frp.host`、`frp.ports.ssh`、`frp.user`、`frp.sshLive` |
| 各节点 sshd | `ssh -p <frp.ports.ssh> <frp.user>@<frp.host>`（BatchMode，密钥认证） | `mkdir`、`curl`、`stat`，读取节点 `~/cicy-ai/global.json` 的 `api_token` |
| 各节点 cicy-code `:8008` | `ssh -N -L <空闲端口>:127.0.0.1:8008` 隧道 | `agent-desktop clients --json`、`agent-desktop exec-file install.bat --client <id>` |
| 节点所在 Windows PC | 连着该节点的 cicy-desktop（`platform: win`） | 执行 `start "" "C:\projects\<name>" <args>` |

## 环境变量

| 变量 | 默认 | 含义 |
|---|---|---|
| `CICY_API_PORT` | `8008` | 本地 cicy-code 端口（远端隧道也用它） |
| `CICY_API_TOKEN` | 读 `~/cicy-ai/global.json` | 本地 cicy-code token |
| `CICY_GLOBAL_JSON` | `~/cicy-ai/global.json` | token 文件位置 |

## 依赖

- PATH 里有 `ssh`、`scp`；兄弟节点互信已建立（cicy-code hub 模式会把租户密钥写进每个节点的 `~/.ssh/authorized_keys`）
- 本机装了 `agent-desktop` skill（`cicy-code skill install agent-desktop`）
- 每个目标节点：一台 Windows PC，其 cicy-desktop 连着该节点的 `:8008`

## 退出码

`0` 成功 · `1` 用法错误、cicy-code 不可达、没有匹配节点 · `2` 一个或多个节点失败。

## 相关

- `agent-desktop` — 本 skill 驱动的每台 PC 的 RPC 桥
- `cicy-ssh` — 查看 `~/.ssh/config` 别名（这里不需要：目标来自 hub）
