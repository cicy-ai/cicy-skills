# agent-editor — 工具

## 子命令 → 线路协议

所有 RPC 子命令通过 POST `/api/chat/push` 并设置 `wait_ack:true` 发送。服务器会在 `data` 中注入 `requestId`，将其发送到目标客户端，并阻塞直到收到匹配的响应。

| 子命令 | 类型 | 扩展程序响应 |
|---|---|---|
| `ping` | `host.ping` | `code.pong` |
| `open` | `host.open_file` | `code.opened` / `code.open_file_error` |
| `active` | `host.active_file` | `code.active_file` |
| `tabs` | `host.list_tabs` | `code.tabs` |
| `list` | （无 — GET `/api/chat/clients`） | — |

对于 `open` 命令，包装器会额外触发一个异步的 `code.show_files` 事件，以将文件面板带到前台（扩展程序仅在其工作台可见时才激活）。

## 认证 + 端点

- `Authorization: Bearer <api_token>`，其中 `api_token` 取自 `~/cicy-ai/global.json`
- `POST http://127.0.0.1:$CICY_API_PORT/api/chat/push`
- `GET http://127.0.0.1:$CICY_API_PORT/api/chat/clients`

## 配置

| 路径 | 权限模式 | 敏感字段 |
|---|---|---|
| `~/cicy-ai/global.json` | 0600 | `api_token` |

## 目标定位

- 显式：通过最后一个位置参数传递 `page_client_id`。
- 隐式：当前代理的 `w-<id>`（来自 `CICY_PANE_ID` 环境变量或工作目录）——必须恰好有一个非 `:code-ext` 页面客户端。

## 重试行为

当响应为 `client not found` 时，`open` 会重试最多 30 秒，因为扩展程序仅在 iframe 显示后才唤醒。每次尝试之间有 1 秒的间隔。其他错误会立即失败。

## JSON 输出

`open --json`：`{ ok, data: { opened: true, path, attempts, page_client_id } }`
`ping --json`：`{ ok, data: { connected: true, version, ... } }`
`active --json` / `tabs --json`：扩展程序载荷原样输出。
`list --json`：`{ ok, data: [ { agent_id, page_client_id, code_server_client_id, code_server_connected } ] }`
