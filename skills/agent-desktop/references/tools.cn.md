# agent-desktop — 工具集

> **静态快照。** 有关连接客户端的实时权威工具集，请运行 `agent-desktop tools`（查询 `list_tools` 元工具；支持 `--schema` / `--names` / `--tag <Tag>` / `--json` 参数）。本文档为离线备用参考，可能滞后于实际约 100 多个工具。

## 通信协议

```
1. 打开 WebSocket: ws://127.0.0.1:$CICY_API_PORT/api/chat/ws?agent_id=...&token=...
2. 发送 POST 请求至 /api/chat/push:
     { agent_id, client_id, type:'desktop_event',
       data:{ type:'rpc_call', tool, args, requestId } }
3. 等待 WebSocket 消息:
     msg.type === 'rpc_result' && msg.data.requestId === requestId
4. 结果在 msg.data.result 中；错误在 msg.data.error 中。
```

## 子命令 → electronRPC 工具映射

| 子命令          | 对应工具                                |
|-----------------|-------------------------------------|
| `ping`          | `get_system_info`（任何响应式调用） |
| `exec`          | `exec_shell`                        |
| `exec-file`     | `exec_shell_file` / `exec_python_file` / `exec_node_file`（按扩展名区分，支持内容上传） |
| `sysinfo`       | `get_system_info` + `exec_shell` 补充（获取 `os_version`，在 darwin 系统中获取磁盘信息） |
| `rpc <tool>`    | `<tool>`（透传调用）              |
| `clients`       | （无 RPC 调用 — GET 请求 `/api/chat/clients`）  |

## 配置

| 文件路径                       | 权限模式 | 敏感字段  |
|----------------------------|------|----------------|
| `~/cicy-ai/global.json`    | 0600 | `api_token`    |

## 目标客户端选择

- 显式指定：`--client <client_id>`
- 隐式选择：User-Agent 中包含 `ElectronMCP` 的单个已连接客户端

## 示例

```bash
agent-desktop rpc clipboard_read_text '{}' --json
agent-desktop rpc exec_shell '{"command":"ls -la"}'
```
