# CiCy Skills - Tool List

## Chat / WebSocket

| 命令 | 说明 |
|------|------|
| `fast-api /api/chat/push '{"pane":"<pane>","type":"user_q","data":{"q":"..."}}' ` | 发用户消息气泡 |
| `fast-api /api/chat/push '{"pane":"<pane>","type":"ai_chunk","data":{"delta":"..."}}'` | 流式 AI 回复片段 |
| `fast-api /api/chat/push '{"pane":"<pane>","type":"ai_done","data":{}}'` | 结束 AI 流式回复 |
| `fast-api /api/chat/push '{"pane":"<pane>","type":"worker_idle","data":{"data":{"worker":"w-xxx"}}}'` | 显示系统通知气泡 |
| `fast-api /api/chat/push '{"pane":"<pane>","type":"exec_js","data":{"code":"..."}}'` | 在网页执行 JS |
| `fast-api /api/chat/push '{"pane":"<pane>","type":"status_change","data":{"status":"..."}}'` | 触发状态变化事件 |
| `fast-api /api/chat/clients` | 查看当前 WS 连接详情 |

## Page Exec

| 命令 | 说明 |
|------|------|
| `aeng-page-exec '<js>'` | 在前端页面执行 JS（通过 desktop_event eval） |
| `agent-page-ping [type]` | 测试 Agent → WS → AgentPage 连通性 |

## Notify / File

| 命令 | 说明 |
|------|------|
| `fast-api /api/notify '{"action":"open_file","file":"/path","message":"..."}'` | 在 code-server 打开文件 |

## IPC / Desktop

| 命令 | 说明 |
|------|------|
| `ipc-ping` | 测试 Electron IPC 连通性 |

## 通用 API

| 命令 | 说明 |
|------|------|
| `fast-api --tools` | 列出所有 API 端点 |
| `fast-api /api/tmux/panes` | 列出所有 pane |
| `fast-api /api/tmux/capture_pane?pane=<id>` | 获取 pane 输出 |
| `fast-api /api/tmux/send '{"pane":"<id>","text":"..."}'` | 向 pane 发命令 |
