# telegram-web — 集成与安全边界

- 运行环境：Node.js 22+、`agent-electron`；登录还需要 `agent-chrome`；Web K patch 需要 `tg-web-mirror-hook`。
- 会话元数据：`~/cicy-ai/db/telegram-web.json`，以 `0600` 权限原子写入；测试可用 `CICY_TELEGRAM_WEB_SESSION` 覆盖。
- 后端：Web A 按能力探测 typify，并暴露 `window.__tt`、`window.__getGlobal`、`window.__setGlobal`、`window.__getActions`；Web K 严格校验并读取 `window.__mirrors`。
- 目标选择会拒绝零匹配、多匹配和非 Telegram 页面。显式 `--backend` 也必须与目标内容相符。
- 登录期间认证 storage 只存在于进程/CDP 参数中；不得进入会话元数据、日志、错误、fixture 或文档。
- 修改操作必须显式添加 `--apply`，不得绕过。不要把截图当作数据接口。
- `open-url --profile N` 映射到 `agent-electron open --idx N`，保留默认窗口复用；已有匹配窗口时激活，不传 `--no-reuse`。
