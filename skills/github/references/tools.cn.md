# 配置与安全

- 配置文件：`~/cicy-ai/db/github.json`
- 自定义路径：`CICY_GITHUB_CONFIG`
- 默认账号：`CICY_GITHUB_ACCOUNT`
- 格式：以账号名为键的对象，字段为 `api_token` 和可选的 `email`。
- 配置采用原子写入，并强制权限为 `0600`。
- Token 只能从标准输入写入；账号列表绝不返回 Token。
- `github gh --account` 仅在单个 `gh` 子进程中设置所选账号的 `GH_TOKEN`，不会污染全局环境或写入 `gh` 配置；禁止执行会直接显示凭据的 `gh auth token`。
- Clone 首次鉴权使用临时 `GIT_ASKPASS`。仓库本地保存账号名和 credential helper；后续 pull/push 由 helper 从 `github.json` 动态取 Token。Token 不写入 URL、Git 配置、全局 `gh` 状态或 Git 凭据库。
- GitHub API 失败时只显示 HTTP 状态，不输出响应正文。

退出码：`0` 成功，`2` 命令错误，`4` 鉴权失败，其他错误为 `1` 或 Git 原始退出码。
