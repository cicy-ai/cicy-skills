# agent-editor — 帮助

## 命令

```
agent-editor ping [page_client_id] [--json]
agent-editor list / clients [--json]
agent-editor open <path> [page_client_id] [--json]
agent-editor active [page_client_id] [--json]
agent-editor tabs [page_client_id] [--json]
agent-editor --help / -h / help
agent-editor tools
```

## `open` 路径语法

| 形式                                | 效果                          |
|-------------------------------------|-------------------------------|
| `open /abs/path/foo.ts`             | 打开文件                      |
| `open /abs/path/foo.ts:42`          | 打开至第 42 行                 |
| `open /abs/path/foo.ts:42:7`        | 打开至第 42 行，第 7 列        |
| `open /abs/path/foo.ts:42:7-50:1`   | 选择范围 42:7 → 50:1          |
| `open file:///abs/path/foo.ts`      | `file://` URI 形式            |

## 环境变量

- `CICY_API_TOKEN` — 覆盖 Bearer 令牌
- `CICY_API_PORT`  — 服务器端口（默认 8008）
- `CICY_PANE_ID`   — 默认代理窗格（例如 `w-1001`）
- `CICY_GLOBAL_JSON` — 覆盖 global.json 路径
