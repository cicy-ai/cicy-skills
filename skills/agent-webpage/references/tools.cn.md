# agent-webpage — 工具

## 子命令 → 线路协议

每个 RPC 子命令：

1.  通过 WebSocket 连接到 `ws://127.0.0.1:$CICY_API_PORT/api/chat/ws?agent_id=<pane>&token=<api_token>`。
2.  连接成功后，向 `POST /api/chat/push` 发送数据 `{ agent_id, client_id, type, data }`。
3.  等待一条类型匹配 `type` 且数据中 `data.requestId` 匹配的 WS 消息。

| 子命令                         | 发送的类型     | 等待的类型         |
|--------------------------------|----------------|--------------------|
| `ping`                       | `webpage_ping` | `webpage_pong`     |
| `ipc-ping`                   | `ipc_ping`     | `ipc_pong`         |
| `exec-js`                    | `exec_js`      | `exec_js_result`   |
| `current-active-agent-id`    | `exec_js`      | `exec_js_result`   |
| `current-master-agent-id`    | `exec_js`      | `exec_js_result`   |
| `send <type> <data> [exp]`   | `<type>`       | `<exp>` 或任何类型匹配的 `requestId` |
| `clients`                    | （无 — 使用 GET `/api/chat/clients`） | — |
| `helper-init`                | `exec_js`（自动解析 web-* 客户端；运行一个返回 `{lang, area, isElectron, os, arch, github, dockerhub}` 的负载 — 静默执行，JSON 输出到标准输出） | `exec_js_result` |

## 认证与端点

- 认证头：`Authorization: Bearer <api_token>`，来自 `~/cicy-ai/global.json`
- HTTP 端点：`POST http://127.0.0.1:$CICY_API_PORT/api/chat/push`，`GET /api/chat/clients`
- WebSocket 端点：`ws://127.0.0.1:$CICY_API_PORT/api/chat/ws?agent_id=…&token=…`

## 配置

| 路径                         | 权限   | 敏感字段      |
|-------------------------------|--------|---------------|
| `~/cicy-ai/global.json`      | 0600   | `api_token`   |

## 目标定位

- 显式：将 `client_id` 作为最后一个位置参数传入。
- 隐式：使用当前代理的 `w-<id>`（来自 `CICY_PANE_ID` 环境变量或当前工作目录）—— 必须恰好存在一个**非** `:code-ext` 的客户端。

## 超时

默认 15 秒。可通过每个进程的 `CICY_AGENT_TIMEOUT_MS` 环境变量覆盖。

## 示例

```bash
# 实时页面的标题
agent-webpage exec-js 'document.title' web-abc123

# 任意 JSON 输入/输出
agent-webpage send my_action '{"x":1}' web-abc123 my_action_reply --json
```
