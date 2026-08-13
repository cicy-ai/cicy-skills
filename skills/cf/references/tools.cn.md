# cf — 工具

## 外部API

- `https://api.cloudflare.com/client/v4{path}` — 所有 `cf curl` 调用

## 配置

| 路径                       | 模式 | 敏感字段           |
|----------------------------|------|-------------------|
| `~/cicy-ai/db/cf.json`     | 0600 | `accounts.*.api_token`, `accounts.*.account_id` |

若文件不存在，执行 `cf config` 时包装器会自动创建模式为 0600 的占位文件（包含字面量 `<paste-...-here>` 字符串）。

## 环境变量

- `CICY_CF_CONFIG` — 覆盖配置文件路径
- `CF_ACCOUNT` — 覆盖账号 key；默认使用顶层 `default`
- `EDITOR`, `VISUAL` — 用于 `cf config` 的编辑器

当调用 `cf exec` 时，子进程还将看到：
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`（若在配置中已设置）

## 输出

`cf curl` 输出原始 Cloudflare JSON 响应。可使用 `jq` 提取字段。

`cf status`（文本模式）输出 5 行配置状态。使用 `--json` 参数时：

```json
{
  "ok": true,
  "data": {
    "config_path": "...",
    "exists": true,
    "permissions": "0600",
    "api_token_set": true,
    "account_id_set": true,
    "api_token_masked": "abcd***wxyz"
  }
}
```
