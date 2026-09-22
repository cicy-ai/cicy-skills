# tg-export-history — 命令参考

## 命令

| 命令 | 作用 |
|---|---|
| `tg-export-history targets [--client <id>] [--json]` | 列出可操作的 Telegram Web K webContents(`wc:<id>` + 窗口标题)。 |
| `tg-export-history info <chat> [--target wc:<id>] [--client <id>] [--json]` | 解析 `<chat>`,打印标题、类型(频道 / 超级群 / 普通群 / 用户 / bot)、id、成员数、本账号是否在里面、消息总数和最新一条。 |
| `tg-export-history export <chat> [--target wc:<id>] [--client <id>] [--out <文件\|目录>] [--format json\|jsonl\|csv\|all] [--limit N] [--since 日期] [--min-id N] [--batch N] [--json]` | 翻页拉取历史并写文件。进度打到 stderr,汇总(或 `--json`)打到 stdout。 |

`<chat>` 可以是 `@用户名`、`https://t.me/<用户名>[/<消息id>]`、`t.me/+<hash>` / `t.me/joinchat/<hash>`(仅当本账号已在群里)、或 peer id(`-100<channel_id>`、`-<channel_id>`、普通群 `-<chat_id>`、用户为正数 —— 数字 id 要求页面已经认识这个会话,否则请用 @用户名 / 链接)。

## 选项

| 选项 | 含义 |
|---|---|
| `--target wc:<id>` | Telegram Web K 的 webContents id(也接受纯数字)。只有恰好一个目标时才自动选。 |
| `--client <id>` | cicy-desktop 客户端 id,透传给 `agent-electron --client`。 |
| `--out <路径>` | 输出文件(扩展名决定格式)或目录(末尾带 `/` 或已存在的目录)。默认 `./<用户名或id>-messages.<ext>`。同名文件会被覆盖。 |
| `--format` | `json`(默认,`{meta, messages[]}`)、`jsonl`(一行一条)、`csv`(UTF-8 带 BOM,Excel 直接打开)、`all`(三种都写)。 |
| `--topic <消息id>` | 论坛型群/频道:只导根消息 id 为 `<消息id>` 的那个话题(`messages.getReplies`)。`t.me/<会话>/<id>` 链接指向话题根时会自动按话题导。输出文件名带 `-topic<id>`。 |
| `--limit N` | 只要最新的 N 条。 |
| `--since 日期` | 只要该日期(`YYYY-MM-DD`,UTC)或 unix 时间戳之后的消息,翻到更早的就停。 |
| `--min-id N` | 只要 id > N 的消息(增量导出:传上次已有的最大 id)。 |
| `--batch N` | 每次页面求值里调多少次 `messages.getHistory`(每次 100 条),默认 8,最大 20。 |
| `--json` | 机器可读汇总。 |

## 记录字段

`id`、`date`(ISO 8601 UTC)、`from`(发送者昵称 + @用户名,频道消息则为频道)、`from_id`(`u<id>` / `c<id>`)、`text`、`media`(`photo`、`document`、`webpage`、`poll`… 或空)、`media_id`(Telegram 的 photo / document id)、`mime`、`size`(字节)、`file`(文件名)、`reply_to`(被回复的消息 id)、`fwd`(转发来源)、`views`、`service`(系统消息动作,如 `ChatAddUser`)、`edit_date`、`grouped_id`(相册 id)。按时间从旧到新写出。

## 输出

`info --json`:`{ ok, target, chat, info:{id,title,username,type,members,member}, topic, topicInfo:{id,title}?, count, latest:{id,date} }`
`export --json`:`{ ok, target, chat, count, total_in_chat, files:{json?,jsonl?,csv?}, seconds, err? }`

## 退出码

| 码 | 含义 |
|---|---|
| 0 | 成功 |
| 1 | 用法错误(选项不对、缺 `<chat>`、`--since` 解析不了) |
| 2 | agent-electron / 页面错误(没目标、页面没登录或还在启动、CDP 失败、导出中途 RPC 报错 —— 已拉到的部分会保留) |
| 3 | 会话找不到 / 读不了(`USERNAME_NOT_OCCUPIED`、`CHANNEL_PRIVATE`、邀请链接但不是成员、未知 peer id) |

## 环境变量

- `AGENT_ELECTRON_BIN` — agent-electron 可执行文件路径(默认用 PATH 里的 `agent-electron`)。
