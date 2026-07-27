# frp-client — 工具集

## 功能说明

针对本地 `frpc` 守护进程的进程管理器 + 管理接口客户端。

## 涉及文件

| 操作   | 路径                                          | 权限   |
|--------|-----------------------------------------------|--------|
| 读取   | `~/cicy-ai/db/frpc.toml`                      | —      |
| 写入   | `~/.local/state/cicy-skills/frp/client/pid`   | 0644   |
| 写入   | `~/.local/state/cicy-skills/frp/client/state.json` | 0644   |
| 追加   | `~/logs/frpc.log`                             | —      |

## 进程管理

- `start` — 执行 `spawn(BINARY, ['-c', CONFIG, ...extraArgs], { detached:true, stdio:['ignore', logFD, logFD] })`，随后写入进程ID与状态文件。
- `stop`  — 发送 SIGTERM 信号，等待5秒，若未终止则发送 SIGKILL。
- `reload`— 发送 SIGHUP 信号（frpc v0.50+ 版本支持通过 SIGHUP 热重载）。
- `status`— 执行 `process.kill(pid, 0)` 检查进程状态，并调用管理接口 `GET /api/status` 获取详细信息。

## 管理接口

如果 `frpc.toml` 中配置了 `webServer.addr / port / user / password`，本工具将自动生成管理接口URL。

| 子命令          | 接口端点             |
|----------------|--------------------|
| `status`       | `/api/status`      |
| `connections`  | `/api/status`      |

## 配置说明

| 路径                         | 权限   | 敏感字段说明                     |
|------------------------------|--------|----------------------------------|
| `~/cicy-ai/db/frpc.toml`     | 0600   | (包含 frps 令牌/认证信息——请视为敏感数据) |

## 远程管理

需要管理其他机器上的 frpc？可使用 SSH：

```
ssh remote 'frp-client status --json'
```

本工具输出规范的退出码且支持 JSON 格式，通过 SSH 管道传输时能保持天然兼容性。
