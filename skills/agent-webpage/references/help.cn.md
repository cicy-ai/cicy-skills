# agent-webpage — 帮助

## 命令

```
agent-webpage clients [--json]
agent-webpage ping [client_id] [--json]
agent-webpage ipc-ping [client_id] [--json]
agent-webpage exec-js '<js>' [client_id] [--json]
agent-webpage current-active-agent-id [client_id] [--json]
agent-webpage current-master-agent-id [client_id] [--json]
agent-webpage send <type> '<data_json>' [client_id] [expect_type] [--json]
agent-webpage helper-init [--json]
agent-webpage --help / -h / help
agent-webpage tools
```

## 注意事项

- 使用 `client_id` 进行定位，而非 `agent_id`
- 如果省略 `client_id`，当前代理必须恰好连接一个客户端
- 响应式调用会等待并打印真实的网页响应
- 原生 WebSocket 支持需要 Node 22+ 版本

## 环境变量

- `CICY_API_TOKEN`        — 令牌覆盖（用于 Bearer 认证）
- `CICY_API_PORT`         — 服务器端口（默认 8008）
- `CICY_PANE_ID`          — 默认代理面板标识（例如 `w-1001`）
- `CICY_GLOBAL_JSON`      — global.json 文件路径覆盖
- `CICY_AGENT_TIMEOUT_MS` — 默认 RPC 超时时间（默认 15000 毫秒）
