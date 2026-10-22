---
name: tg-autojoin
description: 把 Telegram Web 自动 JOIN 注入脚本按版本下发到矩阵机(wsd),并核对各机装的是哪个版本。
---

# tg-autojoin

把 `assets/telegram.org.js`(Telegram Web 自动 JOIN 的油猴脚本)按版本下发到矩阵机,
并核对各机当前装的是哪个版本。下发走 `wsd`,不自己拼 hub 请求。

## 版本从哪来

脚本顶部的 `// @version` 就是唯一版本源,脚本里同时把它挂到
`window.__cicyTgAutojoin.version`,页面侧也能读到。改脚本就改这个号,再 `sync`。

```js
window.__cicyTgAutojoin = {
  version,              // 与 @version 一致
  floodLeft,            // FLOOD_WAIT 剩余秒(getter,读即当下真值)
  flooding,             // 是否在限流冷却中
  floodUntil,           // 冷却截止时间戳
  mobile,               // 本账号手机号(从 Telegram 自己读的,不看 fleet.json)
  liveGroups,           // 会话列表里有用户名的群/频道数
  stats,                // {assigned, joined, at} —— tgsou 对账回来的真实已加入数
}
```

## 换群由脚本自己做(2.0.0 起)

**不要让面板去导航格子。** 面板只能把一个 URL 交给主进程,主进程走
`loadPanelCellUrl` —— 它先 `about:blank` 再 `loadURL`,是**整页重载**。每 20 秒重载
一次,Telegram Web 根本初始化不完,格子就长期一片白(2026-09-14 全队 36 个格子有
24 个卡在没初始化/没会话)。

正确姿势是 tgsou 早就在用的(`admin.js` 的 `switchInGuest`),2.0.0 把它搬进了脚本:

```js
const r = await m.appUsersManager.resolveUsername(un);
await window.appImManager.setInnerPeer({ peerId });   // SPA 切换,文档不重载
```

私有群没有 username,用 `location.hash = '#?tgaddr=…'`(同文档导航,一样不重载)。

开关放在服务端 `tgsou /api/autojoin`(按手机号存):面板够不到格子的 window,塞不进
开关,于是反过来 —— 面板写,脚本每 10s 取。好处是状态不随页面刷新丢失,也不会出现
「这台面板停了、那台还在开」。`once` 是一次性的(面板「开一个」),取走即清。

验证没重载的办法:在页面里打个标记 `window.__mk=Date.now()`,隔几十秒再读,
标记还在 = 没重载(实测 xs-2001 连开三个群,标记不变)。

## 「已加入」是怎么算出来的(1.9.0 起)

joins 表在 tgsou 那边**只有 `POST /api/joined` 一个写入口**:客户端把该账号
**真实在里面**的群用户名集合报上去,服务端和分配表求交集才算「已加入」。没人上报 =
计数永远 0,而且 `/api/random-unjoined` 会把同一批群反复发出来。

矩阵面板够不到格子(BrowserView)的 window,所以这件事由脚本自己做 —— 它就在页面里:

- 每 30s 从 `dialogsStorage.getFolderDialogs(0/1)` 枚举会话取 username;
- 手机号取 `appUsersManager.getSelf().phone`(fleet.json 那份常年过期,不用);
- `POST https://tgsou.cicy-ai.com/api/joined?t=<fleet token>`(tgsou 已为
  `https://web.telegram.org` 开 CORS,并对带 token 的跨源 POST 放行 CSRF 校验);
- 结果写进 `document.title`,面板从那里读 —— 这是面板唯一能看到格子内部的通道:
  `⏳ 4分47秒 · v1.9.0 · 已加 12/465 · 在群 138 · +573108335085`
  (顺序固定:`⏳` 只在限流时出现在最前,其后第一个 `vX.Y.Z` 是版本。)

会话没加载完(枚举到 0 个)时**不上报**,否则会把已加入的群误标成 left。

## 用法

```sh
tg-autojoin show                 # 内置脚本的版本与大小
tg-autojoin status [target|all]  # 各机装的是哪个版本(不一致会退出码 1)
tg-autojoin sync   [target|all]  # 下发(覆盖同名文件)
tg-autojoin remove <target|all>  # 从机器上删掉
```

`target` 同 wsd:机器名(`xs-3002`)、主机名、cid 或 `all`。

## 落点与注意

机器上的路径是 `~/cicy-ai/electron/extension/inject/telegram.org.js`。
cicy-desktop 的注入器**按 `<域名>.js` 匹配**,所以文件名不能改。

⚠️ 同目录下的 **`.js` 是全域名通吃的注入**,`window.electronRPC` / `window._g` 这些
桥接在它里面,每台机器都有。本 skill 只动 `telegram.org.js`,不碰 `.js`。

⚠️ `sync` 是**覆盖**。下发前先 `status` 看一眼:矩阵机上原本的 `telegram.org.js`
多数是桥接脚本的副本(6412B),个别机器(实测 xs-3002 是 10492B)有人另加过东西,
覆盖会丢。先确认再全网推。
