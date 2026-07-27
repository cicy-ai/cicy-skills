# frp-client — 帮助信息

## 安装 frpc 二进制文件及服务

```bash
# 首次安装（下载 frpc、写入配置、安装服务）：
frp-client install --server <主机地址> --token <令牌>

# 或使用一键安装脚本：
FRP_SERVER=1.2.3.4 FRP_TOKEN=xxxx curl -fsSL https://install.cicy-ai.com/frp | bash

# 无参数重新运行以复用现有配置：
frp-client install
```

### `frp-client install` 选项

| 选项 | 默认值 | 描述 |
|---|---|---|
| `--server <HOST>` | — | FRP 服务器地址（首次安装必填） |
| `--token <TOKEN>` | — | FRP 认证令牌（首次安装必填） |
| `--server-port` | 9500 | FRP 服务器端口 |
| `--remote-port` | 9502 | 服务器上的远程 TCP 端口 |
| `--local-port` | 22 | 要暴露的本地端口 |
| `--local-ip` | 127.0.0.1 | 要暴露的本地 IP 地址 |
| `--name` | 自动（linux-ssh / mac-ssh） | 代理名称 |
| `--admin-port` | 7400 | frpc web 服务器管理端口 |
| `--frp-version` | 0.68.1 | 要下载的 frpc 版本 |
| `--service` | 自动 | 服务模式：`auto`/`systemd`/`launchd`/`none` |
| `--github-proxy` | https://gh-proxy.com/ | GitHub 下载代理 |

## 命令

```
frp-client install [选项]             下载 frpc + 写入配置 + 安装服务
frp-client service <install|enable|disable|status>
                                       管理平台服务（systemd / launchd）
frp-client start [-- --额外参数]       将 frpc 作为后台守护进程启动
frp-client stop                        发送 SIGTERM（5 秒后发送 SIGKILL）
frp-client restart [-- --额外参数]     停止 + 启动
frp-client status [--json]             进程ID / 二进制文件 / 配置 / 管理API 信息
frp-client reload                      发送 SIGHUP 进行热重载（frpc v0.50+）
frp-client logs [N|-f]                 查看日志尾部
frp-client connections [--json]        获取 /api/status（代理状态）
frp-client raw -- <实际的 frpc 参数>   透传给 frpc 二进制文件
frp-client --help / -h / help
frp-client tools
```

## 默认值

| 键       | 值                                          |
|----------|---------------------------------------------|
| 二进制文件   | `~/.frp-tunnel/bin/frpc`（或 `~/.local/bin/frpc`、`~/bin/frpc`、`$FRP_CLIENT_BIN`） |
| 配置文件     | `~/cicy-ai/db/frpc.toml`                    |
| PID 文件  | `~/.local/state/cicy-skills/frp/client/pid` |
| 日志文件   | `~/logs/frpc.log`（可通过 `FRP_CLIENT_LOG` 覆盖） |

## 环境变量

- `FRP_CLIENT_BIN` — 覆盖 frpc 二进制文件路径
- `FRP_CLIENT_LOG` — 覆盖日志文件路径
- `FRP_CONFIG`     — 覆盖配置文件路径（默认 `~/cicy-ai/db/frpc.toml`）
- `FRP_SERVER`     — `install` 命令使用的服务器地址
- `FRP_TOKEN`      — `install` 命令使用的认证令牌
- `GITHUB_PROXY`   — `install` 命令使用的 GitHub 下载代理

## 远程机器

当目标 FRP 客户端位于其他机器上时，可通过 SSH 进行管理：

```
ssh remote-box 'frp-client status'
ssh remote-box 'frp-client reload'
ssh remote-box 'frp-client install --server 1.2.3.4 --token xxxx'
```
