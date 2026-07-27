# telegram-web — 帮助

## 命令

```
telegram-web login [--from-profile N] [--to-account M] [--proxy URL|--no-proxy] [--url URL] [--from-client ID]
telegram-web status
telegram-web patch
telegram-web account
telegram-web chats
telegram-web dialogs [--limit N] [--folder active|archived]
telegram-web users
telegram-web messages <chatId> [--limit N]
telegram-web open <chatId>
telegram-web send <chatId> <text...>
telegram-web eval <jsExpression>
telegram-web close

telegram-web --client <client_id> ...
telegram-web --win <winId> ...
telegram-web --help / -h / help
```

## 流程

```
登录流程：
  1. 从系统 Chrome 配置文件 N 读取 localStorage（通过 chrome_cdp_call）
  2. 设置账户代理 set_account_proxy <目标账户> <代理地址>
  3. 打开窗口 url=https://web.telegram.org/a/ accountIdx=<目标账户>
  4. 等待 DOM 就绪（轮询 get_window_info，最长 45 秒）
  5. 注入约 20 个 localStorage 键值
  6. 页面重新加载
  7. 轮询等待 .chat-list 元素出现（最长 60 秒）
  8. 执行 webpack 补丁 → 获取 window.__tt / __getGlobal / __getActions
  9. 将会话持久化至 ~/cicy-ai/db/telegram-web.json

后续命令流程：
  - 从会话文件（或通过 --win 参数）解析窗口 ID
  - 确保已应用补丁（ensurePatched() → 如页面已重新加载则重新附加）
  - 读取操作：window.__getGlobal() → JSON 路径表达式
  - 写入操作：window.__getActions()[name](payload)
```

## 默认值

| 标志             | 默认值                       |
|------------------|------------------------------|
| `--from-profile` | `0`                          |
| `--to-account`   | `99`                         |
| `--proxy`        | `socks5://127.0.0.1:9001`    |
| `--url`          | `https://web.telegram.org/a/` |

`accountIdx=99` 是为了避免与 cicy-code 的主账户 0 冲突。如果 99 已被占用，请修改此值。

## `eval` 示例（扩展接口）

`eval` 暴露了三个快捷方式：`g`（全局状态）、`actions`（动作分发器）、`tt`（类型化访问器）：

```bash
telegram-web eval 'Object.keys(g).filter(k => k.startsWith("auth"))'
telegram-web eval 'g.chats.listIds.archived'
telegram-web eval 'g.messages.byChatId[g.currentUserId]?.byId'
telegram-web eval 'actions.openChat({id: "777000"})'
telegram-web eval 'actions.markMessageListRead({chatId: "777000"})'
```

## 环境变量

- `CICY_API_TOKEN`              — 用于覆盖 bearer token
- `CICY_API_PORT`               — 服务端口（默认 8008）
- `CICY_GLOBAL_JSON`            — 覆盖 global.json 路径
- `CICY_TELEGRAM_WEB_SESSION`   — 覆盖会话文件路径（默认 `~/cicy-ai/db/telegram-web.json`）
- `CICY_AGENT_TIMEOUT_MS`       — RPC 超时时间（默认 90000 — Web A 启动可能较慢）

## 相关技能

- `agent-chrome` — 读取源配置文件的 `localStorage`（通过 `chrome_cdp_call`）
- `agent-electron` — 管理此技能所操控的目标 Electron 会话/窗口
- `agent-desktop` — 与 cicy-desktop 通信的底层 RPC 总线
