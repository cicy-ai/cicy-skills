# agent-electron — 帮助文档

## 命令

```
agent-electron sessions [--json]
agent-electron session <accountIdx> [--json]
agent-electron profiles [--json]
agent-electron tabs [accountIdx] [--json]
agent-electron webcontents [--json]
agent-electron proxy <accountIdx> <url|"">
agent-electron open <url> [--idx 1] [--no-reuse] [--json]
agent-electron close <winId|webContentsId>
agent-electron windows [--json]
agent-electron window <winId|webContentsId> [--json]
agent-electron url <winId|webContentsId> <url>
agent-electron cdp <winId|webContentsId> <method> [json_params]
agent-electron screenshot <winId|webContentsId> [--out path]
agent-electron snapshot <winId|webContentsId>
agent-electron sysinfo
agent-electron inject install <name> --source <file>
agent-electron inject status <name>
agent-electron inject uninstall <name>

agent-electron --client <client_id> ...
agent-electron --help / -h / help
agent-electron tools
```

## 注意事项

- cicy-desktop 主机必须运行并连接至 cicy-code。
- `inject install` 仅写入 Desktop 主机的 `~/data/electron/extension/inject/<name>`。源码只发送给受限的 `electron_inject` RPC，不会输出到终端。
- Codex 通过 `~/.agents/skills/agent-electron` 发现已安装的 skill；
  `~/.codex/skills/agent-electron` 仅用于兼容旧版 Codex。安装后请新建
  Codex 会话或执行 `/clear`，再用 `@agent-electron` 显式调用。
- `accountIdx` = profile id = session id，三者是同一个数字标识。例如三者的
  id 都为 `1` 时，均对应 `persist:sandbox-1`。
- `BrowserWindow.id` 与 `webContents.id` 可能出现相同数字。裸数字（例如
  `4`）继续按 `winId` 处理；标签页必须写成 `tab:4`（也可写 `wc:4`）。
  使用 `tabs <accountIdx>` 查看实时标签页 ID。
- `close`、`window`、`url`、`cdp`、`screenshot`、`snapshot` 均支持两类
  目标。使用 `profiles`、`tabs`、`webcontents` 查看并定位层级关系。
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
