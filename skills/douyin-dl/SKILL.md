---
name: douyin-dl
description: Download audio or video from a Douyin share link (yt-dlp via proxy to bypass anti-scraping); optionally transcribe via Groq whisper-large-v3-turbo (default), cicy gateway STT, or local Whisper; auto-falls back to CDP sniffing through a local agent-chrome profile when Douyin blocks yt-dlp.
---

# Douyin 下载 / 转写

给一个抖音分享链接(`https://v.douyin.com/xxxx/`)、完整 URL 或视频 ID,
就能下到**音频(mp3)或视频(mp4)**,并可选**本地 Whisper 转写成文字稿**。

## 何时用

- 用户发来抖音链接,要把里面的**视频/音频下载**下来。
- 用户要把抖音视频**转成文字稿**(口播文案、字幕、做内容/分析)。
- 任何 "抖音转文字 / 抖音下载 / 提取抖音文案" 的请求。

## 反爬怎么绕(核心,别绕开)

抖音直连会被 TLS 重置。本 skill 已内置绕法,默认自动生效:

1. **走代理**:默认读 `$HTTPS_PROXY`,没有就探测本机 `127.0.0.1:1087`;也可 `--proxy` 指定。
2. **解析短链 → 规范地址**:跟随 302 抠出 `video id`,改用
   `https://www.douyin.com/video/<id>` 命中 yt-dlp 的**抖音专用提取器**(不是通用爬)。

没有代理、或代理出口被抖音拦时仍可能失败 —— 这时换一个可用出口节点再试。

## Quick start

```sh
# 下音频(默认)
douyin-dl "https://v.douyin.com/S_3bpkTWdMc/"

# 下载并转写成文字
douyin-dl "https://v.douyin.com/xxxx/" -t -o /tmp/dy

# 下视频 / 机器可读输出
douyin-dl 7643416724482230710 -v
douyin-dl "<link>" -t --json
```

## 依赖

- 必需:`yt-dlp`(缺则自动下载独立二进制)、`ffmpeg`、`ffprobe`、`curl`。
- 转写(`-t`)另需:`python3` + `faster-whisper`
  (`python3 -m pip install --user --break-system-packages faster-whisper`)。
- 注:本机 CPU 转写较慢;生产建议把转写引擎换成 Cloudflare Workers AI 的 whisper。

## References

- [help.md](./references/help.md) — 完整命令/选项
- [tools.md](./references/tools.md) — 依赖、代理、目录约定
