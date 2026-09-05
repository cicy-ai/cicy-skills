# tg-matrix — 传输与集成(中文)

## 传输
与 `wsd` 同一通道:读 `~/cicy-ai/db/desktop-ctrl.json` 的 `{base, token}`
(可用 `CICY_DESKTOP_CTRL` 覆盖路径),调用控制面:

- `GET  /api/fleet` —— 当前连接的机器(供 `ls`)。
- `POST /api/rpc`,body `{target, js}` —— 这段 JS 是 homepage bridge 包装器,
  按进程解析窗口 id,再通过 `control_electron_BrowserWindow` 把 payload 跑在
  **Electron 主进程**里。该 bridge 设计上不需鉴权,所以没有确认弹窗。

请求头 `x-cicy-ctrl: <token>` 做鉴权;用类浏览器 `user-agent` 规避 Cloudflare
的机器人校验(这是我们自己的源站)。

## 面板发现(不写死 id)
主进程 payload 使用 `globalThis.__cicyTabBrowserState.managers.get(0)`
(profile 0 的 `TabManager`):

- `m.list()` → `[{webContentsId, title, url, active}]`
- 找到 `url` 含 `preset=telegram-matrix` 的那条
- `m.activate(webContentsId)` 切前台
- 不存在时 `m.addTab(url, {title})`,url 为
  `cicyui://panel/<Date.now().toString(36)>?preset=telegram-matrix`

由于 `webContentsId` 每台不同且会变,始终在调用时从 `m.list()` 现查,绝不存储。

## 与其他 skill 的关系
- `telegram-matrix` —— 通过 CDP 驱动面板内部(profile、cell、批量、截图);面板
  在可达主机上打开后使用它。
- `tg-login` —— 自动化 cell 内的 手机号 → 验证码 → 2FA 登录。
- 本 skill 只负责打开 / 聚焦 / 查询面板,且面向整个 fleet。
