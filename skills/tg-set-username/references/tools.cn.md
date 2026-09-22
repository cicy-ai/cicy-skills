# tg-set-username — 工作原理

## 传输层

一切都走 `agent-electron`:

- `agent-electron webcontents --json` — 发现 Telegram Web K 目标(`url` 以 `https://web.telegram.org/k/` 开头)。
- `agent-electron cdp wc:<id> Runtime.evaluate {expression, awaitPromise:true, returnByValue:true}` — 在页面里执行下面的脚本。

不开自己的 socket,不往机器上写文件,不给页面打补丁。

## 页面侧 API(未打补丁的 Telegram Web K)

`window.rootScope.managers` 是 Telegram Web K 自己的 manager 代理,是普通全局变量;页面没启动完时 `window.rootScope.myId` 为空。

| 调用 | 用途 |
|---|---|
| `apiManager.invokeApi('users.getFullUser', {id: inputUserSelf})`(兜底 `appUsersManager.getSelf()`) | 当前操作的是哪个账号(id / 手机号 / 昵称 / 现有用户名)—— 以服务器为准,页面缓存在刚改完时会滞后 |
| `apiManager.invokeApi('account.checkUsername', {username})` | 可用时返回 `true`;RPC 错误(`USERNAME_INVALID`、`USERNAME_OCCUPIED`、`USERNAME_PURCHASE_AVAILABLE`、`FLOOD_WAIT_n`)原样放进 `err` |
| `apiManager.invokeApi('account.updateUsername', {username})` | 设置(传 `''` 即删除)用户名,返回更新后的 `User` |
| `appUsersManager.saveApiUser(user, true)` | 同步页面自己的用户缓存,界面不用刷新就显示新用户名 |

## 注意

- Telegram Web K 还在启动的页面 `rootScope.myId = 0`,技能会按页面错误(退出码 2)报出来,不会瞎猜。矩阵格子只有在所在面板标签页可见时才会启动。
- Telegram 对改用户名有频率限制,`FLOOD_WAIT_n` 会连同要等的秒数一起报出来。
- Fragment 上售卖的收藏用户名不能这样设置 —— 会报 `USERNAME_PURCHASE_AVAILABLE`,什么都不改。

## 相关技能

- `agent-electron` — 本技能依赖的传输层。
- `tg-archive-groups`、`tg-clean-deleted` — 同一传输层的其它账号维护技能。
