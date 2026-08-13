# cf — 帮助

## 命令

```
cf config                                   在 $EDITOR 中打开 ~/cicy-ai/db/cf.json
cf status [--json]                          显示配置状态（api_token 已隐藏）
cf curl <METHOD> <PATH> [json-body]         使用注入的令牌调用 CF API
cf exec <command> [args...]                 使用 CLOUDFLARE_API_TOKEN+ACCOUNT_ID 环境变量运行命令
cf --help / -h / help                       打印此帮助信息
```

## 示例

```bash
# 引导配置
cf config
cf status

# 列出区域
cf curl GET /zones | jq '.result[] | {id, name}'

# 某个区域的 DNS 记录
cf curl GET /zones/<zone_id>/dns_records | jq

# 创建 DNS 记录
cf curl POST /zones/<zone_id>/dns_records \
  '{"type":"A","name":"sub","content":"1.2.3.4","ttl":1}'

# 删除 DNS 记录
cf curl DELETE /zones/<zone_id>/dns_records/<record_id>

# 启动 wrangler 并注入凭证
cf exec npx wrangler deploy
cf exec npx wrangler kv namespace create FOO
```

## 环境变量

- `CICY_CF_CONFIG` — 覆盖配置文件路径（默认 `~/cicy-ai/db/cf.json`）
- `CF_ACCOUNT` — 选择 `accounts` 下的账号 key（默认使用配置中的 `default`）
- `EDITOR` / `VISUAL` — 用于 `cf config` 的编辑器
