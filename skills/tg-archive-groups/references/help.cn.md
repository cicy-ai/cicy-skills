# tg-archive-groups — 命令参考

## 命令

| 命令 | 作用 |
|---|---|
| `tg-archive-groups targets [--client <id>] [--json]` | 列出 Telegram Web K webContents(`wc:<id>` + 窗口标题)。 |
| `tg-archive-groups scan [--target wc:<id>] [--groups-only] [--bots] [--json]` | 统计群 / 频道 / 私聊数量,显示哪些群和频道(加 `--groups-only` 只看群)已在归档、哪些会被移动。 |
| `tg-archive-groups archive [...] [--yes]` | 把还没归档的群和频道(加 `--groups-only` 只动群)移进「已归档」文件夹。不加 `--yes` 只看不动。 |
| `tg-archive-groups unarchive [...] [--yes]` | 移回主列表。不加 `--yes` 只看不动。 |

## 选项

| 选项 | 含义 |
|---|---|
| `--target wc:<id>` | Telegram Web K 的 webContents id(也可只写数字)。只有恰好一个 Telegram Web K 窗口时才自动选。 |
| `--client <id>` | cicy-desktop 客户端 id,透传给 `agent-electron --client`。 |
| `--bots` | 连 bot 会话和官方「Telegram」服务通知号(id 777000)一起处理(真人私聊永远不动)。 |
| `--groups-only` | 只动群,频道不动(默认群 + 频道都归档)。 |
| `--channels` | 兼容旧写法;默认已包含频道。 |
| `--yes` | 真移动。 |
| `--no-keep` | 不改账号的「保持归档」设置(默认 `archive` 会打开 `keep_archived_unmuted` + `keep_archived_folders`,否则未静音的会话一来新消息就自动跳回主列表,白干)。 |
| `--dry-run` | 显式声明只看不动(默认就是)。 |
| `--limit N` | 本次最多移 N 个。 |
| `--batch N` | 每次 `folders.editPeerFolders` 带几个会话(默认 20)。 |
| `--delay ms` | 每批之间停多久(默认 500)。 |
| `--json` | 机器可读输出。 |

## 输出

`scan --json`:`{ ok, target, self:{id,phone,username}, total, users, groups, channels, included, archived, not_archived, items:[{peerId,title,kind,folder,unread}] }`
`archive|unarchive --json`:`{ ok, target, self, moved, failed, remaining, keep:{ok,changed}|null, errors:[{peers,err}] }`(dry run 时 `{ ok, dryRun:true, would_move:[...], already }`)

## 退出码

| 码 | 含义 |
|---|---|
| 0 | 成功(dry run、没有可动的也是 0) |
| 1 | 用法错误 |
| 2 | agent-electron / 页面报错,或至少一批失败 |

## 环境变量

- `AGENT_ELECTRON_BIN` — agent-electron 可执行文件路径(默认用 PATH 里的 `agent-electron`)。
