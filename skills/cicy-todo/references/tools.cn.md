# cicy-todo — 工具

## 端点

全部位于 `http://127.0.0.1:$CICY_API_PORT/api/todo`（默认端口 8008）。

| 调用                 | 用途                                         |
|---------------------|----------------------------------------------|
| `GET    /list`      | 列出请求窗格的待办事项                        |
| `POST   /add`       | 创建待办事项（`{title}`）                    |
| `PATCH  /<id>`      | 更新（`{status?, title?}`）                  |
| `DELETE /<id>`      | 删除                                         |

每个请求需携带：
- `Authorization: Bearer <api_token>`
- `X-Agent-Show-Id: <pane>`

## 配置

| 路径                       | 权限模式 | 敏感字段      |
|----------------------------|----------|--------------|
| `~/cicy-ai/global.json`    | 0600     | `api_token`  |

令牌也可从环境变量 `CICY_API_TOKEN` 获取（覆盖文件配置）。

## 环境变量

- `CICY_PANE_ID`     — 默认窗格（w-xxxxx）
- `CICY_API_PORT`    — 服务器端口（默认 8008）
- `CICY_API_TOKEN`   — 覆盖的承载令牌
- `CICY_GLOBAL_JSON` — 覆盖 global.json 路径

## JSON 输出

`list --json`：
```json
{
  "ok": true,
  "data": {
    "pane": "w-1001",
    "todos": [
      { "id": "abc-123", "title": "...", "status": "todo", "created_at": "...", "updated_at": "..." }
    ]
  }
}
```

`add`/`start`/`done`/`drop`/`back`/`edit` `--json` 返回服务器返回的内容（通常是 `{ todo: {...} }`），并包装在 `{ ok, data }` 中。

`rm --json` 返回 `{ ok: true, data: { ... } }`。
