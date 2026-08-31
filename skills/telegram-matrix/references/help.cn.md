# telegram-matrix — 帮助

## 命令

```
  telegram-matrix open
  telegram-matrix close
  telegram-matrix profiles --json
  telegram-matrix add-profile
  telegram-matrix remove-profile 3 --yes
  telegram-matrix set-proxy 2 http://127.0.0.1:20002
  telegram-matrix probe-ip 2
  telegram-matrix states --json
  telegram-matrix agents --json
  telegram-matrix select 2
  telegram-matrix reload 2
  telegram-matrix cell 2
  telegram-matrix eval 2 "document.title"
  telegram-matrix url 2 https://web.telegram.org/k/#@durov
  telegram-matrix snapshot 2
  telegram-matrix screenshot 2 --out shot.png
  telegram-matrix cdp 2 Page.reload "{}"
  telegram-matrix panel-eval "window.panelAPI.profiles()"

  telegram-matrix --client <client_id> ...   指定 cicy-desktop 客户端（连着多台时）
  telegram-matrix --json                      机器可读输出
  telegram-matrix --help
```

## 说明

- `accountIdx` = profile id = Electron session `persist:sandbox-<N>`，与 `agent-electron` 用的是同一个数字。
- 面板标签开在 profile 0 的标签窗口里（`cicyui://panel/...?preset=telegram-matrix`），`open` 会复用已有的。
- 会话（cell）打开后常驻后台，`select` 只是切换预览区显示。
- 绝不打印/导出 profile 的登录密钥或会话存储；截图需用户明确允许，优先用 `snapshot`。
- 退出码：0 成功 · 2 用法错误 · 3 需要 `--yes` 确认 · 4 传输/页面错误。

## 新增（0.2.0）

### set-login <idx> <手机号> [接码URL]
写入该 profile 的手机号与接码 URL，面板列表和「接码」按钮都读这两个字段。

### open-code <idx> [url]
在该 profile **自己的窗口**里打开接码页。面板原生的「接码」按钮会复用已有 tab 却
**不导航**，所以换卡（改了 codeUrl）之后点它仍然显示旧卡的页面和旧报错；本命令会
比对 tab 当前 URL，不一致就强制导航过去。

### reset <idx> --yes
清空该 cell 的 localStorage / sessionStorage / IndexedDB 后重载，让页面回到
手机号（或二维码）登录界面。`reload` 做不到这一点：Telegram Web K 把未完成的登录
状态存在 localStorage 里，卡在「输入验证码」那步的 cell 重载后还是那一步，没法换号。
**会销毁该 profile 已有的 Telegram 登录**，所以需要 `--yes`。

### batch [on|off]
读取（不带参数）或设置面板的「批量登录」网格。不带参数只读，不会把用户正在看的
网格翻掉。

### add-profile 的修正
改为点击面板自己的「+ 添加 Profile」按钮。只有那个 handler 会重新渲染 profile
列表；直接调 `panelAPI.addProfile` 虽然能建出 profile，但列表不刷新，新 profile
没有对应的行，`select` 就找不到它。
