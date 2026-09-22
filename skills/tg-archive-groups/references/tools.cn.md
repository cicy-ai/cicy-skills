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
| `dialogsStorage.getDialogOnly(peerId)` → `folder_id` | 本地快速核对 |
| `apiManager.invokeApi('messages.getPeerDialogs', {peers})` | 本地缓存仍显示旧文件夹的,直接问服务器(缓存有时收不到 `updateFolderPeers`);服务器也说没动的逐个重试 —— 一批里混进一个服务端不认的 peer,整批会被静默丢掉 |
| `apiManager.invokeApi('account.getGlobalPrivacySettings')` / `setGlobalPrivacySettings` | 归档前先打开 `keep_archived_unmuted` + `keep_archived_folders`,否则未静音会话一来新消息 Telegram 就自动取消归档(实测:431 个刚归档,一分钟内跳回 3 个) |

已知拒绝:对官方「Telegram」通知号(user 777000)调 `folders.editPeerFolders` 服务端返回空 `updates`,会话留在 folder 0 —— Telegram 不允许客户端归档它,skill 直接跳过。

归档只是换文件夹:群成员身份、历史、静音状态都不变。

## 服务端扫尾

本地缓存那轮跑完后,`archive`/`unarchive` 会再翻一遍服务器自己的会话列表(`messages.getDialogs`,源文件夹),把还留在里面、在本次范围内的会话用服务器给的 access_hash 逐个移动 —— 页面刚启动时本地 `dialogsStorage` 可能还没把会话全拉下来,只按缓存扫会漏。拒绝的按标题列出。

## 相关 skill

- `agent-electron` — 本 skill 依赖的通道。
- `tg-clean-deleted` — 同一套做法,用于删「已注销账号」会话。
