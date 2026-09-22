# tg-set-avatar — 命令参考

## 命令

| 命令 | 作用 |
|---|---|
| `tg-set-avatar targets [--client <id>] [--json]` | 列出可操作的 Telegram Web K webContents(`wc:<id>` + 窗口标题)。 |
| `tg-set-avatar show [--target wc:<id>] [--client <id>] [--json]` | 显示这个页面登录的是哪个账号(昵称、手机号、id、@用户名)以及当前头像 id。 |
| `tg-set-avatar styles [--json]` | 列出内置头像风格。 |
| `tg-set-avatar preview [--style <s> \| --image <路径\|URL>] [--seed <s>] --out <文件.jpg> [--target wc:<id>] [--client <id>] [--json]` | 在页面里渲染出 `set` 将要上传的图(640×640 JPEG)并保存到本地。不做任何修改。 |
| `tg-set-avatar set [--style <s> \| --image <路径\|URL>] [--seed <s>] [--if-none] [--target wc:<id>] [--client <id>] [--yes] [--json]` | 上传为新头像。不加 `--yes` 只显示将要做什么。 |

## 风格

| 风格 | 样子 | 网络 |
|---|---|---|
| `girl`(默认) | 微笑卡通女生,长发,粉彩背景(DiceBear `avataaars`) | 需访问 api.dicebear.com |
| `girl-cartoon` | 涂鸦风女生头像,长发,腮红(DiceBear `adventurer`) | 需访问 api.dicebear.com |
| `emoji` | 粉彩渐变 + 可爱 emoji(`🐰 🌸 🎀 🍓 🧸 …`)+ 闪光 | 离线 |

按账号 id 取种子:每个账号一张自己的头像,重复运行得到同一张图。

## 选项

| 选项 | 含义 |
|---|---|
| `--target wc:<id>` | Telegram Web K 的 webContents id(也接受纯数字)。只有一个 Telegram Web K 目标时才自动选择。 |
| `--client <id>` | cicy-desktop 客户端 id,透传给 `agent-electron --client`。 |
| `--style <s>` | `girl`(默认)、`girl-cartoon` 或 `emoji`。 |
| `--image <路径\|URL>` | 用自己的图:png / jpg / webp / gif / svg 文件或 http(s) 链接(最大 10 MB)。居中裁成正方形,缩放到 640×640。 |
| `--seed <s>` | 风格的种子。默认:账号 id。 |
| `--if-none` | `set`:账号已有头像就跳过。 |
| `--out <文件>` | `preview`:JPEG 写到哪里。 |
| `--yes` | 真正修改头像(`set`)。 |
| `--dry-run` | 显式保持只看不改(默认)。 |
| `--json` | 机器可读输出。 |

## 输出

`show --json`:`{ ok, target, self:{id,phone,username,first,last,photoId} }`(没有头像时 `photoId` 为 `""`)
`preview --json`:`{ ok, target, self, out, bytes, style|image, seed }`
`set --json`:`{ ok, target, self, photoId, previousPhotoId, bytes, style|image, seed }` · 只看不改:`{ ok, dryRun:true, … }` · `--if-none` 跳过:`{ ok, skipped:"has-photo" }` · 被拒:`{ ok:false, err, hint }`

## 退出码

| 码 | 含义 |
|---|---|
| 0 | 成功(只看不改、跳过也是 0) |
| 1 | 用法错误或图片不可用(读不到、不是图片、太大、页面解码失败) |
| 2 | agent-electron / 页面 / 网络错误(没有目标、页面没登录、CDP 失败、下载失败) |
| 3 | Telegram 拒绝(`FLOOD_WAIT_n`、`PHOTO_CROP_SIZE_SMALL`、`IMAGE_PROCESS_FAILED` 等)或头像没有变化 |

## 环境变量

- `AGENT_ELECTRON_BIN` — agent-electron 可执行文件路径(默认用 PATH 里的 `agent-electron`)。
