# cicy-keystore — 帮助

```
cicy-keystore list [--json]
cicy-keystore show <KEY> [--json]
cicy-keystore exec --env <KEY>[:<VAR>] [--env ...] -- <命令> [参数...]
cicy-keystore --help
```

| 命令 | 作用 |
|---|---|
| `list` | 列出所有 key、是否已设置值、说明。不会显示值。 |
| `show <KEY>` | 显示一个 key 的说明、状态和更新时间。 |
| `exec` | 运行 `<命令>`，把每个 KEY 的值放进环境变量 VAR（默认 VAR = KEY）。值在命令输出（stdout/stderr）中出现时替换为 `***`。退出码与子进程一致。 |

值只能在 cicy-code 界面的「密钥库」标签里设置，`set` / `get` 会被拒绝。

Key 命名：`[A-Za-z_][A-Za-z0-9_]*`，最长 64 个字符（同时作为环境变量名）。

退出码：0 成功 · 1 错误 · 2 key 不存在或未设置 · 3 无法连接 cicy-code 或认证失败。

环境变量：`CICY_API_BASE` / `CICY_API_PORT` / `CICY_API_TOKEN` 可覆盖 cicy-code 地址和 token（默认 `127.0.0.1:8008`，token 取自 `~/cicy-ai/global.json`）。
