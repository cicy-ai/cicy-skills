# tg-set-name — 命令参考

## 命令

| 命令 | 作用 |
|---|---|
| `tg-set-name targets [--client <id>] [--json]` | 列出可操作的 Telegram Web K webContents(`wc:<id>` + 窗口标题)。 |
| `tg-set-name show [--target wc:<id>] [--client <id>] [--json]` | 显示这个页面登录的是哪个账号(名字、手机号、id、@用户名)。 |
| `tg-set-name suggest [--count <n>] [--seed <s>] [--lang zh\|en] [--emoji] [--no-last] [--json]` | 列出可爱的女生名字(默认中文)。离线,不需要页面;同一个 seed 结果相同。 |
| `tg-set-name set [<名> [<姓>]] [--target wc:<id>] [--client <id>] [--seed <s>] [--lang zh\|en] [--emoji] [--no-last] [--yes] [--json]` | 设置显示名(`account.updateProfile`)。不给名字时按账号 id 挑一个可爱女生名字。不带 `--yes` 只打印将要设置的名字,不改。 |

## 选项

| 选项 | 含义 |
|---|---|
| `--target wc:<id>` | Telegram Web K 的 webContents id(也接受纯数字)。只有恰好一个目标时才会自动选。 |
| `--client <id>` | cicy-desktop 客户端 id,透传给 `agent-electron --client`。 |
| `--seed <s>` | 挑名字用的种子。`set` 默认用账号 id(每个号固定一个名字,重跑不变);`suggest` 默认用当前时间。 |
| `--lang zh\|en` | `zh`(默认):可爱的中文女生名字(`糖糖`、`小桃`、`棉花糖` … 共 110 个)放在名里,姓留空。`en`:英文名 + 可爱的姓(`Luna Peach`)。 |
| `--emoji` | 在姓里放一个可爱 emoji(`🌸 🎀 🍓 🍑 🐰 …`)。 |
| `--no-last` | (en)只设名,姓留空(配合 `--emoji` 时姓只放 emoji)。 |
| `--count <n>` | `suggest` 输出几个(1–200,默认 10)。 |
| `--yes` | 真正修改(`set`)。 |
| `--dry-run` | 显式保持只看不改(默认)。 |
| `--json` | 机器可读输出。 |

名字里有空格要加引号:`tg-set-name set "Mary Jane" Rose`。

## 名字规则(请求前本地校验)

名 1–64 个字符(不能为空白)· 姓 0–64 个字符。

## 输出

`show --json`:`{ ok, target, self:{id,phone,username,first,last} }`
`suggest --json`:`{ ok, names:[{first,last}] }`
`set --json`:`{ ok, target, self, first, last, previous:{first,last}, picked }` · 只看不改:`{ ok, dryRun:true, first, last, picked }` · 已经是这个名字:`{ ok, unchanged:true }` · 被拒:`{ ok:false, err, hint }`

## 退出码

| 码 | 含义 |
|---|---|
| 0 | 成功(只看不改、无需改动也是 0) |
| 1 | 用法错误或名字不符合本地规则 |
| 2 | agent-electron / 页面错误(没有目标、页面没登录、CDP 失败) |
| 3 | Telegram 拒绝(`FIRSTNAME_INVALID`、`LASTNAME_INVALID`、`FLOOD_WAIT_n` 等) |

## 环境变量

- `AGENT_ELECTRON_BIN` — agent-electron 可执行文件路径(默认用 PATH 里的 `agent-electron`)。
