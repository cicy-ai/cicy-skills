# tg-web-pull — 工具与内部实现

## 原理

`tg-web-pull` 调用 **agent-electron** 技能，抓取 Telegram Web K 的 DOM。不需要 mirror
hook / `window.__mirrors`。

| tg-web-pull 命令     | agent-electron 调用                                              |
|-------------|------------------------------------------------------------------|
| `webviews`  | `agent-electron webcontents --json` → 过滤 `web.telegram.org`     |
| `groups`    | `agent-electron cdp <t> Runtime.evaluate`（抓 `.chatlist`）       |
| `pull`      | `agent-electron cdp <t> Runtime.evaluate`（抓 `.bubbles`）        |

所有注入表达式都 `return JSON.stringify(...)`；`tg-web-pull` 从 CDP 结果
`result.result.value` 取出字符串再 `JSON.parse`。

## DOM 约定（Telegram Web K v2.1.x）

- 会话容器：`.chats-container > .chat`，打开的那个带 `.active`。切换前后可能同时
  存在多个容器，所以消息始终按单个容器抓取并按 `peerId` 分组。
- 消息气泡：`.chat .bubbles .bubble[data-mid]`，含 `data-mid`、`data-peer-id`、
  `data-timestamp`（unix 秒）。正文在 `.message`（已去掉 `.time`、`.reactions`
  和私有区图标字符）。发送者在 `.name`。发出的消息带 `.is-out`。媒体由
  `.media-photo`/`.album-item`（图片）、`video`、`.document`、`.audio` 判断。
- 会话列表：`.chatlist a.chatlist-chat` → `data-peer-id`、`href="#<peerId>"`、
  `.peer-title`、未读角标 `.dialog-subtitle-badge-unread`/`.unread`。

## 切群限制

矩阵格子的当前会话由 Telegram 矩阵面板掌控并会被其重新覆盖，因此 `location.hash=`、
原生 `.click()`、合成 `MouseEvent`、以及受信任的 CDP `Input.dispatchMouseEvent`
都无法可靠切群。`--open` 只是**尝试**切换；`pull` 从不假设切换成功，而是按
`peerId` 匹配目标容器。

## 环境 / 兼容性

- 需要 `PATH` 上有 `agent-electron` 技能（Linux cicy-code 或 Windows dsh）。
- `--client <id>` 透传给 `agent-electron --client`。
- 纯 Node ≥18，零 npm 依赖；无 Linux 专有命令 → 可在 Windows dsh 中运行。
