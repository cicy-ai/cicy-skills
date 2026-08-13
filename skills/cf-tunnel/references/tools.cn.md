# cf-tunnel — 工具

## 外部 API

| 调用                                                                   | 用途                                        |
|------------------------------------------------------------------------|--------------------------------------------|
| `GET    /accounts/<account_id>/cfd_tunnel?is_deleted=false`             | 列出命名隧道 (tunnels / sync / create) |
| `POST   /accounts/<account_id>/cfd_tunnel`                              | 创建命名隧道 (create)             |
| `DELETE /accounts/<account_id>/cfd_tunnel/<id>?cascade=true`            | 删除命名隧道 (rm)                 |
| `GET    /accounts/<account_id>/cfd_tunnel/<id>/token`                   | 获取连接器令牌 (sync / create)      |
| `GET    /accounts/<account_id>/cfd_tunnel/<id>/configurations`          | 读取入口                               |
| `PUT    /accounts/<account_id>/cfd_tunnel/<id>/configurations`          | 替换入口 (create / add / del)       |
| `GET    /zones/<zone_id>/dns_records`                                   | 列出 CNAME 记录                         |
| `POST   /zones/<zone_id>/dns_records`                                   | 创建 CNAME (create / add)                |
| `PATCH  /zones/<zone_id>/dns_records/<id>`                              | 修复不匹配的 CNAME                       |
| `DELETE /zones/<zone_id>/dns_records/<id>`                              | 删除 CNAME (rm / del)                    |

DNS CNAME 始终指向 `<tunnel_id>.cfargotunnel.com` 并且是代理的。

## 配置 / 注册表

| 路径                          | 模式 | 机密字段                                         |
|-------------------------------|------|---------------------------------------------------|
| `~/cicy-ai/db/cf-tunnel.json` | 0600 | `accounts.*.api_token`, `accounts.*.account_id`, `accounts.*.zone_id`, `accounts.*.tunnels.*.token` |
| `~/cicy-ai/db/cf.json`        | 0600 | 注册表不存在时的凭据回退（只读）                     |

注册表布局 (`sync` 重新生成 `tunnels`；`create` 追加到其中)：

```json
{
  "default": "main",
  "accounts": { "main": {
    "api_token": "...", "account_id": "...", "domain": "...", "zone_id": "...",
    "tunnels": {
      "<name>": {
        "id": "<tunnel uuid>",
        "token": "<connector token — pass to `cloudflared tunnel run --token`>",
        "hostnames": [ { "hostname": "<fqdn>", "service": "http://localhost:<port>" } ]
      }
    }
  } }
}
```

传统的 `tunnel_id`（一个用于 `add`/`del`/`list` 端口路由、主机名 `<port>.<domain>` 的单个固定隧道）仍然有效，但对于命名隧道命令不再是必需的。旧版扁平 / `prod` 形式仍可读取；新写入统一使用 `accounts.<key>`。

## 环境变量

- `CICY_CF_CONFIG` — 覆盖配置路径
- `CF_ACCOUNT` — 覆盖账号 key；默认使用顶层 `default`
- `CF_ENV` — 旧版环境块选择器（默认 `prod`）

## JSON 输出

`tunnels --json`:
```json
{ "ok": true, "data": { "env": "prod", "tunnels": [
  { "name": "cloudshell", "id": "…", "status": "healthy",
    "hostnames": [{ "hostname": "cloudshell.example.com", "service": "http://localhost:8008" }] }
] } }
```

`sync --json`（输出中令牌已掩码；完整令牌仅写入注册表文件）:
```json
{ "ok": true, "data": { "env": "prod", "path": "~/cicy-ai/db/cf-tunnel.json", "tunnels": [
  { "name": "cloudshell", "id": "…", "status": "down", "hostnames": [ … ], "token_masked": "eyJh***dQ==" }
] } }
```

`create --json`:
```json
{ "ok": true, "data": { "env": "prod", "name": "api", "id": "…", "created": true,
  "hostname": "api.example.com", "service": "http://localhost:8009",
  "dns": "created", "token_masked": "eyJh***dQ==", "registry": "~/cicy-ai/db/cf-tunnel.json" } }
```

`rm --json`:
```json
{ "ok": true, "data": { "env": "prod", "name": "api", "id": "…", "dns_deleted": ["api.example.com"] } }
```

`status --json` 添加 `tunnels`：注册表中已注册的隧道名称。
传统的 `list/add/del --json` 输出格式保持不变。
