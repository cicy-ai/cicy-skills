# 工具与边界

- 唯一外部执行工具：`agent-electron`。
- 目标发现：`agent-electron webcontents --json`。
- 页面执行：`agent-electron cdp <target> Runtime.evaluate <params>`。
- 页面刷新：`agent-electron cdp <target> Page.reload <params>`，仅在缓存变化时执行。
- `webContentsId` 使用 `wc:<id>`，避免与 BrowserWindow 数字 ID 冲突。
- 不使用 `agent-desktop`，不截屏，不直接修改远程 Mac 的扩展文件。

`lib/patch.js` 负责纯文本变换；`lib/expressions.js` 生成 Cache Storage CDP 表达式；`bin/tg-web-mirror-hook` 负责发现、执行和验证。
