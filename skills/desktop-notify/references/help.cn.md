# desktop-notify — 帮助

```text
desktop-notify send <title> [--body <text>] [--subtitle <text>] [--url <url>]
                    [--silent] [--no-focus] [--client <ID>] [--json]
desktop-notify status [--client <ID>] [--json]
desktop-notify help
```

- `send`：发送通知，标题必填。
- `--body`：添加摘要。
- `--subtitle`：添加副标题，仅 macOS 显示。
- `--silent`：静音通知。
- `--no-focus`：点击通知时不聚焦 CiCy Desktop。
- `--url`：点击通知时用系统浏览器打开 URL。
- `--client <ID>`：指定桌面客户端；用 `agent-desktop clients` 查看 ID。
- `--json`：输出机器可读结果。
- `status`：检查桌面连接状态和原生 `notify` RPC 是否可用。

成功退出码为 `0`；桌面不可达或发送失败时为 `1`。

## 故障排查

macOS 上命令成功但没有弹窗时，请在“系统设置 → 通知”中允许
**Electron**（开发版）或 **CiCy Desktop**（打包版）的通知，并检查专注模式和通知样式。

旧版桌面没有 `notify` RPC 时会自动回退网页通知；回退通知不支持点击聚焦窗口。
