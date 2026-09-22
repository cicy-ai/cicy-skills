# tg-export-history — 工作原理

## 传输层

一切都走 `agent-electron`:

- `agent-electron webcontents --json` — 发现 Telegram Web K 目标(`url` 以 `https://web.telegram.org/k/` 开头)。
- `agent-electron cdp wc:<id> Runtime.evaluate {expression, awaitPromise:true, returnByValue:true}` — 在页面里执行下面的脚本,每次往返带回最多 `--batch` × 100 条消息的 JSON。

不开自己的 socket,不给页面打补丁。页面上只留一个 `window.__tgExportPeer`(解析出来、供翻页用的 InputPeer)。

## 页面侧 API(未打补丁的 Telegram Web K)

`window.rootScope.managers` 是 Telegram Web K 自己的 manager 代理;页面没启动完时 `window.rootScope.myId` 为空。

| 调用 | 用途 |
|---|---|
| `apiManager.invokeApi('contacts.resolveUsername', {username})` | @用户名 / t.me 链接 → 会话或用户(含 access_hash) |
| `apiManager.invokeApi('messages.checkChatInvite', {hash})` | 邀请链接 → 会话,仅当返回 `chatInviteAlready`(已是成员) |
| `appChatsManager.getChat(id)` / `appUsersManager.getUser(id)` | 数字 peer id → 页面缓存里的会话 / 用户(页面必须已经认识它) |
| `apiManager.invokeApi('messages.getHistory', {peer, offset_id, limit:100, min_id})` | 翻页本身,从新到旧;第一次返回的 `count` 是总数 |
| 每次 `messages.getHistory` 返回里的 `users` / `chats` | 发送者 / 转发来源的名字 |

## 注意

- 公开频道和公开群不用加入就能读;私有的需要本账号是成员(否则 `CHANNEL_PRIVATE`)。
- 速度大约 100–150 条/秒,1.5 万条的频道 2–3 分钟。`--batch` 调大 = 往返更少但单次求值更长。
- 可手动续传:带 `--min-id <上次最大 id>` 再跑一次只拉新的。
- 不下载媒体 —— `media` / `file` 只记录这条消息带的是什么附件。
- 矩阵格子只有在所在面板标签页可见时才会启动;还在启动的页面直接按错误报出,不等。

## 相关技能

- `agent-electron` — 本技能依赖的传输层。
- `tg-archive-groups`、`tg-clean-deleted`、`tg-set-username` — 同一传输层的其它账号维护技能。
