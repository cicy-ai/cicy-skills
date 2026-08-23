# 工具与边界

- `host-install` 使用 `agent-desktop clients`、`rpc exec_shell` 和 `rpc file_write`。
- 页面 Cache hook 使用 `agent-electron`。
- 目标发现：`agent-electron webcontents --json`。
- 页面执行：`agent-electron cdp <target> Runtime.evaluate <params>`。
- 页面刷新：`agent-electron cdp <target> Page.reload <params>`，仅在缓存变化时执行。
- `webContentsId` 使用 `wc:<id>`，避免与 BrowserWindow 数字 ID 冲突。
- 不截屏；仅 `host-install` 可写固定的 `telegram.org.js` 注入路径。

`lib/patch.js` 负责纯文本变换；`lib/expressions.js` 生成 Cache Storage CDP 表达式；`bin/tg-web-mirror-hook` 负责发现、执行和验证。
