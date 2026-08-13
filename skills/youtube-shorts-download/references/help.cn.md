# youtube-shorts-download — 命令参考

```sh
youtube-shorts-download <链接> [参数]
```

| 参数 | 说明 |
| --- | --- |
| `-d, --dir <目录>` | 输出目录，默认当前目录 |
| `-o, --output <模板>` | yt-dlp 输出文件名模板 |
| `--audio` | 只提取 MP3；默认下载 MP4 |
| `--cookies-from-browser <浏览器[:配置]>` | 经用户明确授权后读取浏览器登录信息 |
| `--force-update` | 下载前刷新并校验官方 yt-dlp |
| `--json` | stdout 仅输出最终 JSON，实时进度写 stderr |
| `-h, --help` | 显示帮助 |

示例：

```sh
youtube-shorts-download "https://www.youtube.com/shorts/VIDEO_ID" --dir ./downloads
youtube-shorts-download "https://youtu.be/VIDEO_ID" --audio --dir ./audio
```
