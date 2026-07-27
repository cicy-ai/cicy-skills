# cicy-agent — 工具

## 子命令 → 端点

| 子命令 | 方法 | 路径 |
|-----------------|--------|----------------------------|
| `list` / `ls` | GET | `/api/tmux/panes` |
| `tree` | GET | `/api/tmux/tree` |
| `windows` | GET | `/api/tmux/windows` |
| `capture` | POST | `/api/tmux/capture_pane` |
| `reply` | POST | `/api/tmux/reply_text` |
| `msg` | POST | `/api/tmux/send` |
| `broadcast` | GET ×2 + POST ×N | `/api/tmux/panes` + `/api/tmux/tree`，然后为每个目标执行 `/api/tmux/send`（每次发送有超时） |
| `get_online_agents` / `get_offline_agents` / `get_all_agents` | GET | `/api/tmux/panes` + `/api/tmux/tree`（在线 = 会话存在于实时树中） |
| `send-keys` | POST | `/api/tmux/send-keys` |
| `restart` | POST | `/api/tmux/restart_all` |
| `clear` | POST | `/api/tmux/clear` |
| `team ping` | GET | `<team.api>/api/health`（按团队；状态+版本+代理数量） |
| `team add/ls/rm` | — | 仅本地注册表文件（add 时还会探测 `/api/health`） |

所有请求携带 `Authorization: Bearer <api_token>`。

## 配置

| 路径 | 权限 | 敏感字段 |
|-----------------------------------|------|----------------|
| `~/cicy-ai/global.json` | 0600 | `api_token` |
| `~/cicy-ai/db/cicy-agent.json` | 0600 | 各团队的 `api_token` |

`cicy-agent.json` 是团队注册表：`{ "teams": [{name, api, api_token}, ...] }`
（仍支持旧版纯数组/`{nodes}` 格式）。通过 `--team NAME` 选择（旧别名 `--node`）。省略时使用本地 cicy-code 服务器。

## 常用载荷

```jsonc
// msg
POST /api/tmux/send
{ "pane_id": "w-10002", "text": "hello", "callback_to": "w-1001" }
// 注意：两种情况均返回 HTTP 200 — 成功为 {"success":true,...}，
// 失败为 {"detail":"failed to send text: ..."}（广播会检查此项）。

// send-keys
POST /api/tmux/send-keys
{ "pane_id": "w-1001", "keys": "ls -la Enter" }

// capture
POST /api/tmux/capture_pane
{ "pane_id": "w-1001" }
```
