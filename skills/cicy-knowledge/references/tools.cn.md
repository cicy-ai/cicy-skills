# cicy-knowledge — 端点 / 环境变量 / 退出码

## 后端端点（cicy-code，令牌认证）

- `GET  /api/knowledge?status=&tag=&q=` — 列表 / 召回
- `POST /api/knowledge` — 添加（请求体：`title`、`body`、`tags?`、`source_kind?`、`source_pane?`、`origin_ref?`）→ 返回 `{ id, status: "pending" }`
- `GET  /api/knowledge/{id}` — 获取单个条目
- `PATCH /api/knowledge/{id}` — 治理操作，请求体：`{ action: promote|reject|supersede, superseded_by?, verified_by? }`

## 状态机

`pending`（待处理） → `canon`（规范，通过 promote 操作） | `rejected`（已拒绝，通过 reject 操作） | `superseded`（已取代，通过 supersede 操作，并携带 `superseded_by` 指向替代条目的 id）。

## 配置

- 令牌与基础地址：`~/cicy-ai/global.json`（`api_token` 字段），端口由 `CICY_API_PORT` 指定（默认 8008）。可通过 `CICY_API_TOKEN` 覆盖令牌。

## 退出码

- `2` — 用法错误（缺少参数）
- `3` — 认证失败或无法连接到 cicy-code
- `4` — API 错误（服务器返回 4xx/5xx 状态码）
