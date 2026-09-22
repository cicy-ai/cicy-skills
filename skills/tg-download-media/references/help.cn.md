# tg-download-media — 命令参考

## 命令

| 命令 | 作用 |
|---|---|
| `tg-download-media targets [--client <id>] [--json]` | 列出可操作的 Telegram Web K webContents(`wc:<id>` + 窗口标题)。 |
| `tg-download-media download <chat> (--ids … \| --from-jsonl …) [选项]` | 取回选中的消息,下载它们的附件,写到 `--out` 目录。 |

`<chat>` 可以是 `@用户名`、`https://t.me/<用户名>[/<消息id>]`(带 `/<消息id>` 且没给 `--ids` 时就只下这一条)、`t.me/+<hash>` / `t.me/joinchat/<hash>`(仅当本账号已在群里)、或页面已经认识的 peer id。

## 选消息

| 选项 | 含义 |
|---|---|
| `--ids a,b,c-d` | 消息 id,逗号/空格分隔,支持区间(`100-250`)。 |
| `--from-jsonl <文件>` | 从 `tg-export-history` 导出的 JSONL 里读 `id`。 |
| `--codes x,y` | 配合 `--from-jsonl`:只要 `code`(导出后处理提取的编号)在列表里的。 |
| `--match <正则>` | 配合 `--from-jsonl`:只要 `text` 匹配的(不区分大小写)。 |

## 选项

| 选项 | 含义 |
|---|---|
| `--out <目录>` | 输出目录,不存在会创建。默认 `./tg-media`。 |
| `--album` | 同一 `grouped_id`(相册)的消息放进 `album_<grouped_id>/` 子目录。 |
| `--thumb` | 图片下最小尺寸的预览而不是原图;文件不受影响。 |
| `--limit N` | 下满 N 个文件就停(跳过的不算)。 |
| `--overwrite` | 已存在也重新下。默认已存在且非空的文件直接跳过(可断点续跑)。 |
| `--target wc:<id>` | Telegram Web K 的 webContents id(也接受纯数字)。只有恰好一个目标时才自动选。 |
| `--client <id>` | cicy-desktop 客户端 id,透传给 `agent-electron --client`。 |
| `--json` | 机器可读汇总打到 stdout;进度打到 stderr。 |

## 文件命名

- 图片和没有文件名的文件:`<消息id>_<media_id>.<ext>`(扩展名按 MIME:jpg、mp4、mp3、pdf…)
- 有文件名的文件:`<消息id>_<文件名>`(不安全字符替换成 `_`)
- 同一个 `media_id` 一次运行只写一份;后面再遇到同一文件的消息记为跳过

## 输出

`download --json`:`{ ok, target, chat:{id,title,username,type}, out, downloaded, bytes, skipped, failed, seconds, files:[{id,file,size,media_id,kind,mime,grouped_id}], skipped_items:[{id,reason,file?}], failed_items:[{id,err}] }`

## 退出码

| 码 | 含义 |
|---|---|
| 0 | 选中的文件全部下完或已存在跳过 |
| 1 | 用法错误(没选到消息、id 不对、未知选项) |
| 2 | agent-electron / 页面错误(没目标、页面没登录或还在启动、CDP 失败) |
| 3 | 会话找不到 / 读不了 |
| 4 | 跑完了但至少一个文件失败(见 `failed_items`) |

## 环境变量

- `AGENT_ELECTRON_BIN` — agent-electron 可执行文件路径(默认用 PATH 里的 `agent-electron`)。
