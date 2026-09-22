# tg-clean-deleted — 实现说明

## 通道

全部经 `agent-electron`:

- `agent-electron webcontents --json` — 找 Telegram Web K 目标(`url` 以 `https://web.telegram.org/k/` 开头)。
- `agent-electron cdp wc:<id> Runtime.evaluate {expression, awaitPromise:true, returnByValue:true}` — 在页面里跑下面的脚本。

不自己开 socket、不往机器写文件、不给页面打补丁。

## 页面侧 API(Telegram Web K 原生,无需补丁)

`window.rootScope.managers` 是 Telegram Web K 的 manager 代理,本来就是全局对象:

| 调用 | 用途 |
|---|---|
| `dialogsStorage.getDialogs({query:'', offsetIndex:0, limit:20000, filterId:0})` | 从内存缓存拿全部会话(几毫秒) |
| `appUsersManager.getUser(peerId)` → `pFlags.deleted` | 判断对方是不是已注销账号 |
| `appUsersManager.getSelf()` | 当前操作的是哪个号(输出里带手机号 / 用户名) |
| `appMessagesManager.flushHistory({peerId, justClear:false, revoke:false})` | 等同 UI 的「删除会话」:`messages.deleteHistory` + 本地删掉 dialog |
| `dialogsStorage.getDialogOnly(peerId)` | 删完核对会话确实没了 |

注意:现在的 tweb `flushHistory` 收**对象参数**;老的位置参数写法 `(peerId, justClear, revoke)` 会报 `Cannot read properties of undefined (reading 'isUser')`。

## 相关 skill

- `agent-electron` — 本 skill 依赖的通道。
- `tg-web-mirror-hook` — 只有要同步读 `window.__mirrors` 快照时才需要,这里不用。
