# lanshare — 帮助

## 命令

```
lanshare serve [dir] [选项]     通过 HTTP 共享 [dir]（默认当前目录），自动生成目录索引
lanshare note [file] [选项]     局域网共享记事本：一个全页 textarea，自动保存到 [file]
lanshare ip [--json]            打印局域网（内网 IPv4）地址
lanshare status [--json]        查看 --daemon 启动的后台服务
lanshare stop [serve|note]      停止后台服务（默认全部）
lanshare --help
```

## serve / note 选项

| 选项 | 默认 | 说明 |
|------|------|------|
| `-p, --port <n>` | serve `8080`，note `8081` | 监听端口；`0` 表示随机空闲端口 |
| `-H, --host <addr>` | `0.0.0.0` | 绑定地址（所有网卡） |
| `-a, --auth <user:pass>` | 无 | 启用 HTTP Basic 认证 |
| `-d, --daemon` | 关 | 后台运行；pid 与 URL 写入 `~/cicy-ai/db/lanshare.json` |
| `--no-hidden` | 关 | 仅 serve：索引中隐藏点文件，且拒绝访问 |
| `--json` | 关 | 以 `{"ok":true,"data":{...}}` 输出启动信息 |

## serve 行为

- 访问目录返回 HTML 索引（文件夹在前，含大小和 UTC 修改时间）；目录 URL 缺少末尾 `/` 时 301 跳转。
- 文件按扩展名推断 MIME 流式返回，支持 `Range`（206），可用于视频拖动和断点续传。
- 仅允许 `GET` / `HEAD`（其他返回 405）；路径越出共享根目录返回 403。

## note 行为

- `GET /` 返回一个全页 `<textarea>`；默认文件 `~/cicy-ai/db/lanshare-note.txt`（不存在则创建空文件）。
- `GET /api/note` 返回文本（带 `ETag`）；`PUT /api/note` 整体替换（临时文件 + rename 原子写入，上限 16 MB，返回 `204`）。
- 停止输入 400 ms 后自动保存（或 Ctrl+S / Cmd+S）；空闲时每 2 s 轮询，其他设备的修改会同步显示。后写覆盖先写。

## 通用

- 认证失败或缺失 → `401` 并带 `WWW-Authenticate: Basic`。
- `--daemon` 打印与前台相同的信息后退出，服务继续运行。每台主机各记录一个 `serve` 和一个 `note` 后台实例；同类实例存活时拒绝再次启动。

## 退出码

`0` 成功 · `1` 运行错误（端口占用、后台启动失败） · `2` 用法错误
