# globalApiToken — 工具

供智能体使用：此技能读写的位置及返回内容。

## 文件操作

| 操作 | 路径 | 权限模式 | 触发时机 |
|------|------|----------|----------|
| 读取 | `~/cicy-ai/global.json` | — | `show`、`refresh` |
| 写入 | `~/cicy-ai/global.json` | 0600 | `refresh` |

## 环境变量

- `CICY_GLOBAL_JSON` — 覆盖默认路径

## JSON 输出结构

`show --json` 输出：

```json
{ "ok": true, "data": "abc123..." }
```

`refresh --json` 输出：

```json
{
  "ok": true,
  "data": {
    "api_token": "abc123...",
    "path": "/home/<用户>/cicy-ai/global.json",
    "refreshed_at": "2026-05-22T07:30:00.000Z"
  }
}
```

错误时输出：

```json
{ "ok": false, "error": { "code": "NOT_FOUND", "message": "..." } }
```

## 错误代码

| 代码 | 退出码 | 含义 |
|------|--------|------|
| `NOT_FOUND` | 3 | `~/cicy-ai/global.json` 文件不存在 |
| `MISSING_FIELD` | 3 | 缺少 `api_token` 字段 |
| `CORRUPT` | 1 | 文件存在但非有效JSON |
| `INVALID_COMMAND` | 2 | 未知子命令 |
