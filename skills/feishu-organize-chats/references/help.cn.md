# 飞书会话整理

```text
feishu-organize-chats list    --prefix 文本 [--account ID] [--json]
feishu-organize-chats plan    --prefix 文本 [--account ID] [--json]
feishu-organize-chats sync    --prefix 文本 [--account ID] [--apply] [--json]
feishu-organize-chats cleanup --prefix 文本 [--account ID] [--apply]
                              [--confirm-prefix 文本] [--json]
```

`list`、`plan` 只读。`sync` 默认预览，加 `--apply` 才同步群名。
`cleanup` 只删除无本地绑定且由 cicy-code 创建的孤儿群；实际删除时必须提供
与 `--prefix` 完全相同的 `--confirm-prefix`。

环境变量：`CICY_DB_PATH`、`FEISHU_BASE_URL`、`FEISHU_TIMEOUT_MS`。
