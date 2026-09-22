# tg-set-name — 工作原理

## 通道

全部走 `agent-electron`:

- `agent-electron webcontents --json` — 找 Telegram Web K 目标(`url` 以 `https://web.telegram.org/k/` 开头)。
- `agent-electron cdp wc:<id> Runtime.evaluate {expression, awaitPromise:true, returnByValue:true}` — 在页面里执行下面的脚本。

不自己开连接,不在机器上写文件,不给页面打补丁。

## 页面内 API(Telegram Web K 原生)

| 调用 | 用途 |
|---|---|
| `appUsersManager.getSelf()` | 确认操作的是哪个账号(id / 手机号 / 用户名 / 名 / 姓) |
| `apiManager.invokeApi('account.updateProfile', {first_name, last_name})` | 设置显示名,返回更新后的 `User`。不传 `about`,简介保持不变 |
| `appUsersManager.saveApiUser(user, true)` | 同步页面自己的用户缓存,界面不用刷新就显示新名字 |

## 可爱名字怎么挑

`zh`(默认):120 个可爱中文女生名字,2、3、4、5 字各 30 个(`糖糖` `小桃` · `棉花糖` `林小鹿` · `小熊软糖` `草莓牛奶` · `樱桃小丸子` `今天也很甜`),名字长度随机,只放在名里,姓留空。

`en`:60 个女生名(`Luna`、`Mia`、`Coco`、`Lily`、`Momo` …)× 30 个可爱的姓(`Rose`、`Bunny`、`Peach`、`Mochi`、`Bloom` …),可选 emoji。
按 seed(默认账号 id)做 FNV-1a 哈希挑选,同一个号永远是同一个名字,第二次 `set --yes` 会显示「无需改动」。

## 说明

- Telegram Web K 还在启动时 `rootScope.myId = 0`,skill 按页面错误报出(退出码 2)。矩阵格子只有面板标签可见时才会启动。
- Telegram 对改资料有频率限制;`FLOOD_WAIT_n` 会带上需要等待的秒数。

## 相关 skill

- `agent-electron` — 本 skill 依赖的通道。
- `tg-set-username` — @用户名;`tg-archive-groups`、`tg-clean-deleted` — 同通道的其它账号维护。
