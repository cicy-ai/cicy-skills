# tg-clean-deleted — 命令参考

## 命令

| 命令 | 作用 |
|---|---|
| `tg-clean-deleted targets [--client <id>] [--json]` | 列出可操作的 Telegram Web K webContents(`wc:<id>` + 窗口标题)。 |
| `tg-clean-deleted scan [--target wc:<id>] [--client <id>] [--json]` | 列出对方是「已注销账号」(`user.pFlags.deleted`)的会话,按最后消息时间倒序,带未读数。 |
| `tg-clean-deleted clean [--target wc:<id>] [--client <id>] [--yes] [--dry-run] [--limit N] [--delay ms] [--json]` | 删除这些会话。不加 `--yes` 只打印将要删的,不动。 |

## 选项

| 选项 | 含义 |
|---|---|
| `--target wc:<id>` | Telegram Web K 的 webContents id(也可只写数字)。只有恰好一个 Telegram Web K 窗口时才会自动选。 |
| `--client <id>` | cicy-desktop 客户端 id,透传给 `agent-electron --client`。 |
| `--yes` | 真删。 |
| `--dry-run` | 显式声明只看不删(默认就是)。 |
| `--limit N` | 本次最多删 N 个(最新的先删)。 |
| `--delay ms` | 每删一个停多久,默认 400。 |
| `--json` | 机器可读输出。 |

## 输出

`scan --json`:`{ ok, target, self:{id,phone,username}, total, count, deleted:[{peerId,date,unread}] }`
`clean --json`:`{ ok, target, self, deleted, failed, remaining, errors:[{peerId,err}] }`(dry run 时是 `{ ok, dryRun:true, would_delete:[...] }`)

## 退出码

| 码 | 含义 |
|---|---|
| 0 | 成功(dry run、没有可删的也是 0) |
| 1 | 用法错误 |
| 2 | agent-electron / 页面报错,或至少一条删除失败 |

## 环境变量

- `AGENT_ELECTRON_BIN` — agent-electron 可执行文件路径(默认用 PATH 里的 `agent-electron`)。
