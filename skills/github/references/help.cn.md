# GitHub 多账号命令参考

```sh
github accounts [--json]
printf '%s' "$TOKEN" | github add <账号名> --token-stdin [--email <邮箱>]
github remove <账号名> --yes
github whoami --account <账号名> [--json]
github repos --account <账号名> [--limit 1..1000] [--json]
github clone --account <账号名> <owner/repo> [目录]
```

账号选择顺序：`--account`、`CICY_GITHUB_ACCOUNT`、唯一已配置账号。存在多个账号时必须明确选择。

`github clone` 只在新仓库中配置 `user.name` 和已保存的邮箱，不修改全局 Git 配置或 `gh` 登录状态。
