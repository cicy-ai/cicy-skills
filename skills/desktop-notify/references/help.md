# desktop-notify — help

```
desktop-notify send <title> [--body <text>] [--subtitle <text>] [--url <url>]
                    [--silent] [--no-focus] [--client <ID>] [--json]
desktop-notify status [--client <ID>] [--json]
desktop-notify help
```

- `send`:发通知。title 必填;`--body` 放摘要;`--subtitle` 仅 mac;`--silent` 静音;
  `--no-focus` 点击不聚焦主窗口;`--url` 点击时用系统浏览器打开。
- `status`:桌面是否可达 + notify RPC 是否注册(未注册则 send 自动回退 exec_js)。
- `--client <ID>`:多台桌面时指定目标(`agent-desktop clients` 查 ID);默认发默认客户端。
- `--json`:机器可读输出。

退出码:0 成功;1 失败(桌面不可达 / 发送失败)。

## 故障排查

- **发送返回 ✅ 但没弹(macOS)**:系统设置 → 通知 → **Electron**(开发模式)/
  **CiCy Desktop**(打包版)→ 打开「允许通知」。这是最常见原因——权限关着时
  Electron 的 `Notification.show()` 静默失败,RPC 仍报 ok。
- 其次检查:专注模式(勿扰)是否开启;通知样式是否为「无」。
- 对照测试:`osascript -e 'display notification "x" with title "t"'` 能弹而 skill 不弹,
  基本就是上面的权限问题。
