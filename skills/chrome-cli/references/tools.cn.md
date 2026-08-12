# chrome-cli — 本机架构

CLI 直接读写 `~/cicy-ai/db/chrome.json`、启动本机 Chrome/Chromium，并通过
HTTP/WebSocket 连接回环地址的 CDP。它不依赖 cicy-code、cicy-desktop、
Electron RPC 或 `--client`。

`accountIdx` 与 profile ID 都是 `profile_N` 中的 `N`。浏览器级 CDP 域使用
browser endpoint；页面级调用默认使用第一个页面，也可指定 `--target <targetId>`。
