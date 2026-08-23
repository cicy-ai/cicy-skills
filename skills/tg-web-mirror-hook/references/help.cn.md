# TG Web Mirror Hook 帮助

```sh
tg-web-mirror-hook host-install [--client ID] [--json]
tg-web-mirror-hook status [--client ID] [--target wc:ID] [--json]
tg-web-mirror-hook install [--client ID] [--target wc:ID] [--version X.Y.Z] [--json]
tg-web-mirror-hook verify [--client ID] [--target wc:ID] [--version X.Y.Z] [--json]
```

- `host-install`：通过 `agent-desktop` 将 Skill 内置的可读版脚本保存到 Desktop 主机的 `~/data/electron/extension/inject/telegram.org.js`，兼容 Windows 和 macOS。
- `status`：只读检查缓存补丁和运行态 `window.__mirrors`。
- `install`：安全写入或升级缓存，仅在内容变化后刷新页面，再自动验证。
- `verify`：只读验证指定版本；失败时退出码为 `2`。
- `--client`：传给 `agent-electron --client`，指定 cicy-desktop。
- `--target`：指定 `winId` 或 `wc:<webContentsId>`；多个 TG 页面同时存在时必须提供。
- `--json`：输出单行 JSON。

首次安装成功应为 `changed: true`、`verified: true`；再次运行应为 `changed: false`、`verified: true`。bundle、anchor 或 marker 数量异常时不会写入缓存。先刷新 TG 获取新 bundle 后重试，不要放宽唯一性检查。
