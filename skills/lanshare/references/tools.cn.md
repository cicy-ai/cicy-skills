# lanshare — 工具

| 工具 | 示例 | 说明 |
|------|------|------|
| `lanshare serve` | `lanshare serve -a user:pass` | 共享目录（默认当前目录）并生成可浏览索引；可选 Basic 认证；`--daemon` 后台运行 |
| `lanshare note` | `lanshare note ~/notes/lan.md -p 8081 -a team:pass` | 局域网共享记事本：全页 textarea 自动保存到文件；可选 Basic 认证；`--daemon` |
| `lanshare ip` | `lanshare ip --json` | 打印局域网 IPv4 地址（内网段优先） |
| `lanshare status` | `lanshare status --json` | 查看后台实例（目录/文件、端口、URL、pid） |
| `lanshare stop` | `lanshare stop note` | 停止后台实例：全部，或仅 `serve` / `note` |

## 文件

- `~/cicy-ai/db/lanshare.json` — 按模式（`serve`、`note`）记录后台状态。`CICY_HOME` 可覆盖 `~/cicy-ai`。
- `~/cicy-ai/db/lanshare-note.txt` — 默认记事本文件。

## 相关

- `pubip` — 公网 IP；`lanshare ip` 是对应的局域网版本。
