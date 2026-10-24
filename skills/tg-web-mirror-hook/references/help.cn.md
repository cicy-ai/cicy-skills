# TG Web Mirror Hook 帮助

```sh
tg-web-mirror-hook host-install [--client ID | --host M] [--json]
tg-web-mirror-hook status [--client ID | --host M] [--target wc:ID] [--json]
tg-web-mirror-hook install [--client ID | --host M] [--target wc:ID] [--version X.Y.Z] [--json]
tg-web-mirror-hook verify [--client ID | --host M] [--target wc:ID] [--version X.Y.Z] [--json]
```

- `host-install`：把 Skill 内置的可读版脚本保存到 Desktop 主机的 `~/cicy-ai/electron/extension/inject/telegram.org.js`（cicy-desktop 域名注入目录；旧的 `~/data/electron` 已不再读取）。本地 Desktop 走 `agent-desktop`，fleet 机器走 `--host`。
- `status`：只读检查缓存补丁和运行态 `window.__mirrors`。
- `install`：安全写入或升级缓存，仅在内容变化后刷新页面，再自动验证。
- `verify`：只读验证指定版本；失败时退出码为 `2`。
- `--client`：传给 `agent-electron --client`，指定本地连接的 cicy-desktop。
- `--host`：fleet 模式。机器 id（如 `xs-3006`）、逗号列表或 `all`，通过 `~/cicy-ai/db/desktop-ctrl.json` 的控制面在目标机主进程执行；`status/install/verify` 会作用于该机所有 Telegram Web K 的 webContents（矩阵格子），`--target wc:ID` 可只选一格。
- `--target`：本地模式指定 `winId` 或 `wc:<webContentsId>`；多个 TG 页面同时存在时必须提供。
- `--json`：输出单行 JSON。

首次安装成功应为 `changed: true`、`verified: true`；再次运行应为 `changed: false`、`verified: true`。bundle、anchor 或 marker 数量异常时不会写入缓存。先刷新 TG 获取新 bundle 后重试，不要放宽唯一性检查。

矩阵面板的格子是 BrowserView，不执行域名注入脚本，所以 `host-install` 只对 BrowserWindow 里打开的 Telegram 生效；矩阵机请用 `install --host`。
