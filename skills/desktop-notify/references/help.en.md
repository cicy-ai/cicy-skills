# desktop-notify — Help

```text
desktop-notify send <title> [--body <text>] [--subtitle <text>] [--url <url>]
                    [--silent] [--no-focus] [--client <ID>] [--json]
desktop-notify status [--client <ID>] [--json]
desktop-notify help
```

- `send`: Send a notification. The title is required.
- `--body`: Add summary text.
- `--subtitle`: Add a subtitle on macOS.
- `--silent`: Disable the notification sound.
- `--no-focus`: Do not focus CiCy Desktop when the notification is clicked.
- `--url`: Open a URL in the system browser when clicked.
- `--client <ID>`: Target a desktop client. Use `agent-desktop clients` to list IDs.
- `--json`: Return machine-readable output.
- `status`: Check desktop connectivity and whether the native `notify` RPC is available.

Exit status is `0` on success and `1` when the desktop is unavailable or delivery fails.

## Troubleshooting

If the command succeeds but no notification appears on macOS, enable notifications for
**Electron** (development builds) or **CiCy Desktop** (packaged builds) under
System Settings → Notifications. Also check Focus / Do Not Disturb and the notification style.

Older desktop clients without the `notify` RPC automatically fall back to a web notification.
Fallback notifications cannot focus the desktop window when clicked.
