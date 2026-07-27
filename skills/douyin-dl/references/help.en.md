# douyin-dl — 命令参考

```
douyin-dl <抖音链接|完整URL|视频ID> [选项]
```

## 选项

| 选项 | 说明 | 默认 |
|------|------|------|
| `-o, --out DIR` | 输出目录 | 当前目录 |
| `-a, --audio` | 只下音频 mp3 | ✓(默认) |
| `-v, --video` | 下视频 mp4 | |
| `-t, --transcribe` | 下完用本地 Whisper 转文字(.txt) | 关 |
| `--model NAME` | whisper 模型 `tiny\|base\|small\|medium\|large-v3` | `small` |
| `--lang LANG` | 语言提示 | `zh` |
| `--proxy URL` | 出站代理 | `$HTTPS_PROXY` → 探测 `127.0.0.1:1087` |
| `--json` | 机器可读输出(video_id/title/media/duration/text) | 关 |
| `-h, --help` | 帮助 | |

## 输出文件命名

- 音频:`<out>/dy_<videoid>.mp3`
- 视频:`<out>/dy_<videoid>.mp4`
- 文字稿:`<out>/dy_<videoid>.txt`
- 标题:`<out>/dy_<videoid>.title.txt`

## 退出码

- `0` 成功;`1` 参数错 / 解析不到 ID / 下载失败 / 缺依赖。

## 常见失败

- **下载被 TLS 重置** → 代理没生效或出口被拦。确认 `$HTTPS_PROXY`,或 `--proxy` 指定可用节点。
- **解析不到视频 ID** → 短链失效。改用完整 `www.douyin.com/video/<id>` 或直接传 ID。
- **转写报缺 faster-whisper** → `python3 -m pip install --user --break-system-packages faster-whisper`。
