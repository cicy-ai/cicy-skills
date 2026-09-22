# tg-archive-groups — 实现说明

## 通道

全部经 `agent-electron`:

- `agent-electron webcontents --json` — 找 Telegram Web K 目标(`url` 以 `https://web.telegram.org/k/` 开头)。
- `agent-electron cdp wc:<id> Runtime.evaluate {expression, awaitPromise:true, returnByValue:true}` — 在页面里跑脚本。

不自己开 socket、不往机器写文件、不给页面打补丁。

## 页面侧 API(Telegram Web K 原生,无需补丁)

`window.rootScope.managers` 是 Telegram Web K 的 manager 代理,本来就是全局对象:

| 调用 | 用途 |
|---|---|
| `dialogsStorage.getDialogs({query:'', offsetIndex:0, limit:20000, filterId})`,`filterId` 0 和 1 各读一次 | 主列表 + 归档文件夹(`folder_id` 0 / 1);两边都读,「已归档」计数和 `unarchive` 才准 |
| `appChatsManager.getChat(-peerId)` | 分类:`_==='chat'` 或 `channel` 且 `pFlags.megagroup` = 群;其它 `channel` = 频道;`left / kicked / deactivated` 跳过 |
| `appUsersManager.getSelf()` | 当前操作的是哪个号 |
| `appMessagesManager.editPeerFolders(peerIds[], folderId)` | 即 `folders.editPeerFolders`,1 = 归档,0 = 主列表;分批调 |
| `dialogsStorage.getDialogOnly(peerId)` → `folder_id` | 核对每个会话确实到了目标文件夹 |

归档只是换文件夹:群成员身份、历史、静音状态都不变。

## 相关 skill

- `agent-electron` — 本 skill 依赖的通道。
- `tg-clean-deleted` — 同一套做法,用于删「已注销账号」会话。
