# Feishu Organize Chats

```text
feishu-organize-chats list    --prefix TEXT [--account ID] [--json]
feishu-organize-chats plan    --prefix TEXT [--account ID] [--json]
feishu-organize-chats sync    --prefix TEXT [--account ID] [--apply] [--json]
feishu-organize-chats cleanup --prefix TEXT [--account ID] [--apply]
                              [--confirm-prefix TEXT] [--json]
```

`list` and `plan` are read-only. `sync` previews title updates unless `--apply`
is present. `cleanup` deletes only unbound cicy-code-created groups and requires
an exact `--confirm-prefix` when applying.

Environment: `CICY_DB_PATH`, `FEISHU_BASE_URL`, `FEISHU_TIMEOUT_MS`.
