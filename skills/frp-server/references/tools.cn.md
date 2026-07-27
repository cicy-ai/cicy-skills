# frp-server — 工具

## 功能说明

本地 `frps` 守护进程的进程管理器 + Web-API 客户端。

## 涉及文件

| 操作   | 路径                                          | 模式 |
|--------|-----------------------------------------------|------|
| 读取   | `~/cicy-ai/db/frps.toml`                      | —    |
| 写入   | `~/.local/state/cicy-skills/frp/server/pid`   | 0644 |
| 写入   | `~/.local/state/cicy-skills/frp/server/state.json` | 0644 |
| 追加   | `~/logs/frps.log`                             | —    |

## 进程管理

- `start` — `spawn(BINARY, ['-c', CONFIG, ...extraArgs], { detached:true, stdio:['ignore', logFD, logFD] })` 然后写入 pid 和状态。
- `stop`  — SIGTERM，等待 5 秒，SIGKILL。
- `reload`— SIGHUP（frps v0.50+ 版本在收到 SIGHUP 时支持热重载）。
- `status`— `process.kill(pid, 0)` + 通过 Web 仪表盘的 GET `/api/serverinfo` 获取状态。

## Web 仪表盘

如果在 `frps.toml` 中设置了 `webServer.addr / port / user / password`，此工具会自动推导仪表盘 URL，并将其用于 `status` / `connections` / `clients` 操作。

| 子命令        | 端点              |
|---------------|-------------------|
| `status`      | `/api/serverinfo` |
| `connections` | `/api/proxy/all`  |
| `clients`     | `/api/client`     |

## 配置

| 路径                           | 模式 | 敏感字段       |
|--------------------------------|------|----------------|
| `~/cicy-ai/db/frps.toml`      | 0600 | （内部包含 frps 令牌/密码 — 应视为敏感信息） |

## 示例

```bash
# 启动时向 frps 传递额外参数：
frp-server start -- --log-level debug

# 原始透传：
frp-server raw -- verify -c ~/cicy-ai/db/frps.toml
```
