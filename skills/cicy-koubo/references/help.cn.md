# 命令参考

```text
cicy-koubo install [--force]
  运行 npx --yes cicy-koubo@latest --install-only。这将下载/缓存 npm 应用程序并准备 Python/运行时依赖项，但不包含源代码。

cicy-koubo start [--port N] [--no-open]
  以分离管理进程方式启动 npx --yes cicy-koubo@latest。
  默认端口：8770。
  等待 HTTP 就绪。除非设置 --no-open，否则使用 agent-electron 配置文件 1 打开本地 URL。

cicy-koubo stop
  仅向运行时状态文件中的 PID 发送 SIGTERM。仅当该进程在五秒内未退出时才升级为 SIGKILL。

cicy-koubo restart [--port N] [--no-open]
  先停止，再启动。

cicy-koubo rebuild
  仅供开发者使用。需要 CICY_KOUBO_PROJECT 指向源代码检出目录。

cicy-koubo update
  刷新 npm 包/依赖项并恢复先前的运行状态。

cicy-koubo status [--json]
  显示已安装/运行/健康状态、PID、端口、URL、包规范、日志路径，以及当可达时 GET /api/status 的响应。

cicy-koubo open
  需要服务处于健康状态，并通过以下方式打开其 URL：
  agent-electron tab-open 1 <url>

cicy-koubo open-or-start
  首先在 Electron 配置文件 1 中查找工作区 URL。如果找到，则激活其标签页并恢复、显示并聚焦所属窗口。否则在需要时启动管理服务，等待健康检查通过，然后在配置文件 1 中打开。

cicy-koubo douyin <douyin-url>
  验证 URL，通过 agent-electron 配置文件 1 打开它，然后聚焦健康的工作区。它本身不声明下载完成。

cicy-koubo logs [--lines N] [--follow|-f]
  打印最后 N 行（默认 100），或执行 tail -n N -f。

cicy-koubo doctor [--json]
  检查 Node/npm/npx、Python、Flask/Pillow、ffmpeg、agent-electron、操作系统/WSL、本地 GPU、配置的执行模式、Colab 和运行时系统数据。
```

测试或非默认安装的环境变量覆盖：

- `CICY_KOUBO_PROJECT`
- `CICY_KOUBO_STATE`
- `CICY_KOUBO_LOG`
- `CICY_KOUBO_PACKAGE`
