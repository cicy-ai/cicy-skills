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
| `cloud ls` / `cloud agents` | GET | `/api/code/instances` + `/api/code/agents` |
| `msg <team.agent>` | POST + GET | `/api/code/messages`，然后 `/api/code/messages/status` |

所有请求携带 `Authorization: Bearer <api_token>`。

## 配置

| 路径 | 权限 | 敏感字段 |
|-----------------------------------|------|----------------|
| `~/cicy-ai/global.json` | 0600 | `api_token` |
| `~/cicy-ai/db/cloud-device.json` | 0600 | Cloud 会话 `token` |

跨 Instance 消息使用已认证的 Cloud 设备会话；无需保存或提供目标 Instance API Token。

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
