# agent-electron — 帮助文档

## 命令

```
agent-electron sessions [--json]
agent-electron session <accountIdx> [--json]
agent-electron proxy <accountIdx> <url|"">
agent-electron open <url> [--idx 1] [--no-reuse] [--json]
agent-electron close <winId>
agent-electron windows [--json]
agent-electron window <winId> [--json]
agent-electron url <winId> <url>
agent-electron cdp <winId> <method> [json_params]
agent-electron screenshot <winId> [--out path]
agent-electron snapshot <winId>
agent-electron sysinfo

agent-electron --client <client_id> ...
agent-electron --help / -h / help
agent-electron tools
```

## 注意事项

- cicy-desktop 主机必须运行并连接至 cicy-code。
- **执行 `open` 命令前，请先检查 `windows` 列表。** 若目标 URL 已在当前会话中打开，默认不应创建新窗口——而应通过桌面 RPC `control_electron_BrowserWindow` 原生激活该窗口（代码为 `(win.isMinimized()&&win.restore(), win.show(), win.focus())`），并返回其 `winId`；仅在必要时刷新页面（使用 `url <winId> <url>`）。仅当用户明确要求时才创建新窗口（使用 `--no-reuse` 参数）。
- `sessions` 列表根据实时窗口推断——磁盘上存在但无打开窗口的会话不会列出（Electron 无窗口分区枚举 API）。
- `proxy <idx> "" ` 会清除该会话的代理设置。
- `screenshot --out path` 将 PNG 图片写入指定路径；若不指定 `--out`，则将图片放入主机剪贴板（避免产生大型 WebSocket 负载）。
- **默认使用 `snapshot` 而非 `screenshot`。** 截图功能会捕获用户屏幕——仅在用户明确允许时使用。请使用 `snapshot`（DOM 结构）检查页面状态。
- `cdp` 支持所有 CDP 方法——包括 `Runtime.evaluate`、`Page.navigate`、`Page.reload`、`Network.setCookie`、`Input.dispatchMouseEvent` 等。

## 环境变量

- `CICY_API_TOKEN`        — 持有者令牌覆盖
- `CICY_API_PORT`         — 服务端口（默认 8008）
- `CICY_GLOBAL_JSON`      — global.json 路径覆盖
- `CICY_AGENT_TIMEOUT_MS` — RPC 超时时间（默认 60000）
