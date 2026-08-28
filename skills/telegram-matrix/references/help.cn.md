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
