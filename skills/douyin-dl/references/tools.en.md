# douyin-dl — 依赖 / 代理 / 目录

## 系统依赖

| 工具 | 用途 | 缺失处理 |
|------|------|----------|
| `yt-dlp` | 下载抖音媒体 | 自动下载独立二进制到 `~/.local/bin/yt-dlp` |
| `ffmpeg` / `ffprobe` | 抽音轨 / 读时长 | 报错(`apt install ffmpeg`) |
| `curl` | 解析短链 302 | 报错 |
| `python3` + `faster-whisper` | 仅 `-t` 转写需要 | 报错并给安装命令 |

## 代理(反爬关键)

- 解析顺序:`--proxy` > `$HTTPS_PROXY`/`$https_proxy` > 探测 `127.0.0.1:1087`。
- cicy 环境里 `127.0.0.1:1087` 是本 agent 的出站代理(env `HTTPS_PROXY=http://<agent>:x@127.0.0.1:1087`)。
- 抖音直连会 TLS 重置;走代理 + 规范 URL 命中抖音提取器即可下载。

## 工作原理(三步)

1. **解析 ID**:短链跟随 302 → 从 `…/video/<id>` 抠出 video id。
2. **下载**:`yt-dlp --proxy … https://www.douyin.com/video/<id>` →(可)`ffmpeg` 抽 mp3。
3. **转写(可选)**:`faster-whisper`(CPU/int8)→ `.txt`。

## 配置 / 密钥

- 当前无需密钥。若改用云端转写(如 Cloudflare Workers AI whisper),密钥放
  `~/cicy-ai/db/douyin-dl.json` 或 `~/cicy-ai/global.json`,**不要提交进 skill**。

## 输出目录

默认当前目录;建议 `-o /tmp/dy` 之类集中存放。文件名带 video id,便于幂等复用。
