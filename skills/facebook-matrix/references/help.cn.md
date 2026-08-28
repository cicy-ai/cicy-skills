# facebook-matrix — 帮助

## 命令

```
  facebook-matrix open
  facebook-matrix close
  facebook-matrix profiles --json
  facebook-matrix add-profile
  facebook-matrix remove-profile 3 --yes
  facebook-matrix set-proxy 2 http://127.0.0.1:20002
  facebook-matrix probe-ip 2
  facebook-matrix states --json
  facebook-matrix agents --json
  facebook-matrix select 2
  facebook-matrix reload 2
  facebook-matrix cell 2
  facebook-matrix eval 2 "document.title"
  facebook-matrix url 2 https://web.facebook.com/k/#@durov
  facebook-matrix snapshot 2
  facebook-matrix screenshot 2 --out shot.png
  facebook-matrix cdp 2 Page.reload "{}"
  facebook-matrix panel-eval "window.panelAPI.profiles()"

  facebook-matrix --client <client_id> ...   指定 cicy-desktop 客户端（连着多台时）
  facebook-matrix --json                      机器可读输出
  facebook-matrix --help
```

## 说明

- `accountIdx` = profile id = Electron session `persist:sandbox-<N>`，与 `agent-electron` 用的是同一个数字。
- 面板标签开在 profile 0 的标签窗口里（`cicyui://panel/...?preset=facebook-matrix`），`open` 会复用已有的。
- 会话（cell）打开后常驻后台，`select` 只是切换预览区显示。
- 绝不打印/导出 profile 的登录密钥或会话存储；截图需用户明确允许，优先用 `snapshot`。
- 退出码：0 成功 · 2 用法错误 · 3 需要 `--yes` 确认 · 4 传输/页面错误。
