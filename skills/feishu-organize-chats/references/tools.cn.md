# 工具

- `list`：展示匹配会话及分类。
- `plan`：生成只读整理计划。
- `sync`：把有效绑定群改为 `Agent Title · w-xxxxx`。
- `cleanup`：只删除 `orphan`。

分类：`bound` 必须保留，`orphan` 是清理候选，`user_chat` 绝不删除，
`direct` 绝不改名或删除。

权限：盘点需要 `im:chat:readonly` 或 `im:chat`；同步需要
`im:chat:update` 或 `im:chat`；清理需要解散群权限。
