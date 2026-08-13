# cf-tunnel — 帮助

## 命令

```
cf-tunnel config                          在 $EDITOR 中打开配置
cf-tunnel status  [--json]                显示配置状态 + 已注册隧道
cf-tunnel tunnels [--json]                树形结构：每个隧道 → 其主机名（实时，来自 CF API）
cf-tunnel sync    [--json]                从 CF API 重新生成 ~/cicy-ai/db/cf-tunnel.json 中的 accounts.<key>.tunnels
                                          （包括 id + 连接器令牌 + 主机名列表）
cf-tunnel create <name> [--host <h>] [--service <url>|--port <n>] [--json]
                                          端到端配置命名隧道：创建/复用隧道，
                                          添加入口 <h>→服务，更新代理 DNS CNAME，
                                          获取连接器令牌，将条目保存到注册表。
                                          默认值：host=<name>.<domain>,
                                          service=http://localhost:8008
cf-tunnel rm <name> [--json]              删除命名隧道及其 DNS 和注册表条目
cf-tunnel list   [--json]                 （旧版）列出固定 tunnel_id 的所有路由
cf-tunnel add    <port> [<port> ...]      （旧版）添加 <port>.<domain> 路由
cf-tunnel del    <port> [<port> ...]      （旧版）删除 <port>.<domain> 路由（同时匹配旧的 g-<port>）
cf-tunnel --help / -h / help              打印此帮助
```

## 注册表（~/cicy-ai/db/cf-tunnel.json）

一个隧道 = 一个连接器令牌；主机名列表是通过该隧道提供的域名：

```json
{
  "default": "main",
  "accounts": { "main": {
    "api_token": "...", "account_id": "...", "domain": "...", "zone_id": "...",
    "tunnels": {
      "cloudshell": {
        "id": "744e1a6d-…",
        "token": "eyJ…",
        "hostnames": [
          { "hostname": "cloudshell.example.com", "service": "http://localhost:8008" }
        ]
      }
    }
  } }
}
```

## 示例

```bash
# 引导
cf-tunnel status
cf-tunnel config

# 命名隧道
cf-tunnel tunnels                          # 实时树：隧道 → 主机名
cf-tunnel sync                             # 将所有隧道（+令牌）写入注册表
cf-tunnel create cloudshell                # cloudshell.<domain> → http://localhost:8008
cf-tunnel create api --port 8009           # api.<domain> → http://localhost:8009
cf-tunnel create web --host www.example.com --service http://localhost:3000
cf-tunnel rm api

# 使用保存的令牌运行连接器（切勿打印令牌本身）
# 包装器会保护连接器 Token。请通过产品集成读取
# accounts.<key>.tunnels.<name>.token 并启动 cloudflared。

# 旧版固定隧道端口路由（添加 8080 → 8080.<domain> → localhost:8080）
cf-tunnel list
cf-tunnel add 8080
cf-tunnel del 8080

# 仅旧版环境块配置
CF_ENV=dev cf-tunnel sync
```

## 环境变量

- `CICY_CF_CONFIG` — 覆盖配置路径（默认 `~/cicy-ai/db/cf-tunnel.json`，
  若注册表不存在则回退到 `~/cicy-ai/db/cf.json` 获取凭据；
  写入始终保存到 `~/cicy-ai/db/cf-tunnel.json`）
- `CF_ACCOUNT`     — 选择 `accounts` 下的账号 key（默认使用顶层 `default`）
- `CF_ENV`         — 旧版环境块选择器（默认 `prod`）
- `EDITOR`/`VISUAL` — 用于 `cf-tunnel config` 的编辑器
