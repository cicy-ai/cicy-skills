# youtube-shorts-download — 运行机制与错误

- 支持 macOS、Linux、Windows。
- macOS/Linux 使用官方 Python zipapp；Windows 使用官方可执行文件。
- 新下载的 yt-dlp 必须通过官方 `SHA2-256SUMS` 校验。
- 合并视频流和提取 MP3 需要 ffmpeg。
- YouTube 挑战处理启用 Node.js 和官方 EJS 组件。
- 遇到挑战失败或 HTTP 403 时，只强制刷新工具并重试一次，不无限循环。
- 普通进度写 stderr；使用 `--json` 时 stdout 只输出最终结果。

输入无效、依赖缺失、校验失败、访问受限、下载失败或找不到成品时返回非零退出码。
