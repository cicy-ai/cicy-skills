# frp-server — 帮助

## 命令

```
frp-server start [-- --extra args]      以后台守护进程方式启动 frps
frp-server stop                         发送 SIGTERM 信号（5秒后强制 SIGKILL）
frp-server restart [-- --extra args]    执行停止 + 启动操作
frp-server status [--json]              显示进程ID / 二进制文件 / 配置 / web接口信息
frp-server reload                       发送 SIGHUP 信号实现热重载（需 frps v0.50+）
frp-server logs [N|-f]                  查看日志（支持行数限制/实时跟踪）
frp-server connections [--json]         调用 GET /api/proxy/all（代理监听器列表）
frp-server clients [--json]             调用 GET /api/client（在线客户端列表）
frp-server raw -- <实际frps参数>        直接传递参数给 frps 二进制文件
frp-server --help / -h / help
frp-server tools
```

## 默认配置

| 配置项      | 默认值                                      |
|-------------|--------------------------------------------|
| 二进制文件   | `~/.frp-tunnel/bin/frps`（或 `~/.local/bin/frps`、`~/bin/frps`、`$FRP_SERVER_BIN`） |
| 配置文件     | `~/cicy-ai/db/frps.toml`                   |
| 进程ID文件   | `~/.local/state/cicy-skills/frp/server/pid` |
| 日志文件     | `~/logs/frps.log`（可通过 `FRP_SERVER_LOG` 覆盖） |

## 环境变量

- `FRP_SERVER_BIN` — 覆盖 frps 二进制文件路径
- `FRP_SERVER_LOG` — 覆盖日志文件路径
- `FRP_CONFIG`     — 覆盖配置文件路径（默认 `~/cicy-ai/db/frps.toml`）
