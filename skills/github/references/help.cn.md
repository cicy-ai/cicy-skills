# GitHub 多账号命令参考

```sh
github accounts [--json]
printf '%s' "$TOKEN" | github add <账号名> --token-stdin [--email <邮箱>]
github remove <账号名> --yes
github whoami --account <账号名> [--json]
github repos --account <账号名> [--limit 1..1000] [--json]
github clone --account <账号名> <owner/repo> [目录]
github configure --account <账号名> [目录]
github gh --account <账号名> <gh 参数...>
```

账号选择顺序：`--account`、`CICY_GITHUB_ACCOUNT`、唯一已配置账号。存在多个账号时必须明确选择。

`github clone` 会在新仓库中配置账号绑定、`user.name` 和已保存的邮箱。此后普通 `git pull` / `git push` 会自动使用该账号。

已有的 HTTPS clone 运行一次 `github configure --account <账号名> [目录]` 即可修复。HTTP origin 会自动升级为 HTTPS；SSH origin 不会改动。

Actions、Release、PR 等 GitHub CLI 操作使用 `github gh --account <账号名> ...`。该命令只为当前子进程注入所选账号，禁止 `gh auth token`，不会修改全局 `gh` 登录状态。
