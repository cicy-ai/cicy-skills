# douyin-dl — 依赖 / 代理 / 目录

## 系统依赖

| 工具 | 用途 | 缺失处理 |
|------|------|----------|
| `yt-dlp` | 下载抖音媒体 | 自动下载独立二进制到 `~/.local/bin/yt-dlp` |
| `ffmpeg` / `ffprobe` | 抖音轨道处理 / 读取时长 | 报错并提示 `apt install ffmpeg` |
| `curl` | 解析短链 302 跳转 | 报错 |
| `python3` + `faster-whisper` | 仅 `-t` 转写功能需要 | 报错并给出安装命令 |

## 代理（反爬关键）

- 解析顺序：`--proxy` 参数优先级 > `$HTTPS_PROXY`/`$https_proxy` 环境变量 > 自动探测 `127.0.0.1:1087`。
- 在 cicy 环境中，`127.0.0.1:1087` 是本 agent 的出站代理（环境变量 `HTTPS_PROXY=http://<agent>:x@127.0.0.1:1087`）。
- 抖音直连会触发 TLS 重置；通过代理并使用规范 URL 命中抖音提取器即可正常下载。

## 工作原理（三步）

1. **解析 ID**：短链跟随 302 跳转 → 从 `…/video/<id>` 路径中提取视频 ID。
2. **下载**：`yt-dlp --proxy … https://www.douyin.com/video/<id>` → （可选）使用 `ffmpeg` 抽取 MP3 音频。
3. **转写（可选）**：使用 `faster-whisper`（CPU/int8 模式）→ 生成 `.txt` 文本文件。

## 配置 / 密钥

- 当前无需密钥。若改用云端转写服务（例如 Cloudflare Workers AI whisper），请将密钥放置在 `~/cicy-ai/db/douyin-dl.json` 或 `~/cicy-ai/global.json` 中，**切勿提交至 skill 仓库**。

## 输出目录

默认输出到当前目录；建议使用 `-o /tmp/dy` 等参数指定集中存放路径。文件名包含视频 ID，便于幂等复用。
