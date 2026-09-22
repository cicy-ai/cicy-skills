# tg-set-username — 命令参考

## 命令

| 命令 | 作用 |
|---|---|
| `tg-set-username targets [--client <id>] [--json]` | 列出可操作的 Telegram Web K webContents(`wc:<id>` + 窗口标题)。 |
| `tg-set-username show [--target wc:<id>] [--client <id>] [--json]` | 显示这个页面登录的是哪个账号(昵称、手机号、id)以及当前 @用户名。 |
| `tg-set-username check <username> [--target wc:<id>] [--client <id>] [--json]` | 先按规则本地校验,再问 Telegram(`account.checkUsername`)这个用户名是否还能用。 |
| `tg-set-username set <username> [--target wc:<id>] [--client <id>] [--yes] [--json]` | 设置用户名(`account.updateUsername`)。不带 `--yes` 只校验 + 查可用性,不改。 |
| `tg-set-username clear [--target wc:<id>] [--client <id>] [--yes] [--json]` | 删除当前用户名。不带 `--yes` 只打印将要删掉的用户名。 |

## 选项

| 选项 | 含义 |
|---|---|
| `--target wc:<id>` | Telegram Web K 的 webContents id(也接受纯数字)。只有恰好一个 Telegram Web K 目标时才会自动选。 |
| `--client <id>` | cicy-desktop 客户端 id,透传给 `agent-electron --client`。 |
| `--yes` | 真正修改(`set` / `clear`)。 |
| `--dry-run` | 显式保持只看不改(默认)。 |
| `--json` | 机器可读输出。 |

## 用户名规则(发请求前先本地校验)

5–32 个字符 · 只能 `a-z 0-9 _` · 必须字母开头 · 不能以 `_` 结尾 · 不能有 `__`。开头的 `@` 会自动去掉。

## 输出

`show --json`:`{ ok, target, self:{id,phone,username,name} }`
`check --json`:`{ ok, target, self, username, valid, available, own }`(服务器拒绝:`{ ok:false, err, hint }`)
`set --json`:`{ ok, target, self, username, previous }` · 只看不改:`{ ok, dryRun:true, username, available:true }` · 被拒:`{ ok:false, err, hint }`
`clear --json`:`{ ok, target, self, previous }` · 只看不改:`{ ok, dryRun:true, would_clear }`

## 退出码

| 码 | 含义 |
|---|---|
| 0 | 成功(dry run 和「无需改动」也是 0) |
| 1 | 用法错误,或用户名不符合本地规则 |
| 2 | agent-electron / 页面错误(找不到目标、页面没登录、CDP 失败) |
| 3 | Telegram 拒绝:被占用(`USERNAME_OCCUPIED`)、无效、Fragment 专属(`USERNAME_PURCHASE_AVAILABLE`)、`FLOOD_WAIT_n` 等 |

## 环境变量

- `AGENT_ELECTRON_BIN` — agent-electron 可执行文件路径(默认用 PATH 里的 `agent-electron`)。
