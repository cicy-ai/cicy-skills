# agent-electron — 工具

## 子命令 → electronRPC 工具

| 子命令                          | 工具                              | 参数                                       |
|---------------------------------|-----------------------------------|--------------------------------------------|
| `sessions`                      | `get_windows`（分组）              | `{}` — 从窗口列表推导                     |
| `session <idx>`                 | `get_windows`（筛选后）           | `{}` — 按 accountIdx 筛选                  |
| `proxy <idx> <url>`             | `set_account_proxy`               | `{ accountIdx, proxy }`                    |
| `open <url> [--idx 1]`          | `open_window`                     | `{ url, accountIdx, reuseWindow }`         |
| `close <winId>`                 | `close_window`                    | `{ win_id }`                               |
| `windows`                       | `get_windows`                     | `{}`                                       |
| `window <winId>`                | `get_window_info`                 | `{ win_id }`                               |
| `url <winId> <url>`             | `load_url`                        | `{ win_id, url }`                          |
| `cdp <winId> <method> [params]` | `cdp_sendcmd`                     | `{ win_id, method, params? }`              |
| `screenshot <winId>`            | `webpage_screenshot_to_clipboard` | `{ win_id }`                               |
| `screenshot <winId> --out P`    | `cdp_sendcmd Page.captureScreenshot` | `{ win_id, method, params:{format:"png"} }` |
| `snapshot <winId>`              | `webpage_snapshot`                | `{ win_id }`                               |
| `sysinfo`                       | `get_system_info`                 | `{}`                                       |

## 传输协议

```
POST /api/chat/push
{
  "client_id":  "<desktop-client-id>",
  "type":       "desktop_event",
  "wait_ack":   true,
  "timeout_ms": 60000,
  "data": {
    "type":      "rpc_call",
    "tool":      "<electronRPC 工具名称>",
    "args":      { ... },
    "requestId": "<随机字符串>"
  }
}
```

服务器注入自身的 requestId，注册等待者，通过 WS 分派到客户端，
并在客户端写回任何带有该 requestId 的消息时通过 HTTP 响应进行回复。

## 会话布局

每个 `accountIdx`（N）映射到：

- 分区：`persist:sandbox-<N>`
- 磁盘路径：`<userData>/Partitions/sandbox-<N>/`
- 代理：上次通过 `set_account_proxy <N>` 应用的值（或无）
- 窗口：所有使用 `accountIdx: N` 打开的 `BrowserWindow`

同一会话中的窗口共享 cookie、localStorage、IndexedDB、
服务工作线程、缓存和代理。

## 打开规则（代理协议）

在执行 `open <url> [--idx N]` 之前，需先运行 `windows`（或 `session <idx>`）：

1. **该会话中已打开此 URL →** 请勿新建窗口。
   使用原生 BrowserWindow 方法激活现有窗口，并告知用户其 winId（桌面 RPC `control_electron_BrowserWindow`）：
   ```bash
   agent-desktop rpc control_electron_BrowserWindow \
     '{"win_id":<winId>,"code":"(win.isMinimized()&&win.restore(), win.show(), win.focus(), {id:win.id, visible:win.isVisible(), focused:win.isFocused()})"}'
   ```
2. **需要新内容 →** 原地刷新而非重新打开：
   `agent-electron url <winId> <u>`
3. **用户明确需要新窗口 →** 此时才执行
   `agent-electron open <url> --no-reuse`

注意：带默认复用选项的 `open` 不会按 URL 在桌面端匹配
（仅在单窗口模式下复用）——因此上述检查是代理的工作。

## CDP 示例

```bash
# 在窗口 4 中执行 JavaScript
agent-electron cdp 4 Runtime.evaluate '{"expression":"document.title","returnByValue":true}'

# 导航窗口 4
agent-electron cdp 4 Page.navigate '{"url":"https://example.com"}'

# 重新加载窗口 4
agent-electron cdp 4 Page.reload '{}'

# 通过 CDP 在会话上设置 cookie（该会话中的任意窗口均可）
agent-electron cdp 4 Network.setCookie '{"name":"k","value":"v","domain":"example.com"}'
```

## 与 agent-chrome 对比

- `agent-chrome cdp <method> --idx <N>` 操作的是系统 Chrome 中配置文件 N 下的活动标签页。
- `agent-electron cdp <winId> <method>` 操作的是特定的 Electron BrowserWindow，无论其所属会话。要针对会话级操作，选择该会话中的任意 winId。
