# 工具与边界

- 本地 `host-install` 使用 `agent-desktop clients`、`rpc exec_shell` 和 `rpc file_write`。
- 本地页面 Cache hook 使用 `agent-electron`：目标发现 `agent-electron webcontents --json`，页面执行 `agent-electron cdp <target> Runtime.evaluate <params>`，刷新 `Page.reload` 仅在缓存变化时执行。
- fleet 模式（`--host`）读取 `~/cicy-ai/db/desktop-ctrl.json`（可用 `CICY_DESKTOP_CTRL` 覆盖），`GET /api/fleet` 列机器，`POST /api/rpc` 在目标机主进程执行；页面表达式通过 `webContents.executeJavaScript` 运行，刷新用 `webContents.reload()`。
- `webContentsId` 使用 `wc:<id>`，避免与 BrowserWindow 数字 ID 冲突。
- 不截屏；只写固定的 `~/cicy-ai/electron/extension/inject/telegram.org.js` 注入路径。

`lib/patch.js` 负责纯文本变换；`lib/expressions.js` 生成 Cache Storage 表达式（CDP 与 executeJavaScript 共用）；`bin/tg-web-mirror-hook` 负责发现、执行和验证。
