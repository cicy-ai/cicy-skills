# agent-chrome — 帮助

本 Skill 主要用于通过 Electron RPC 远程连接 cicy-desktop client 来管理
Chrome。本机原生 macOS/Linux Chrome 请使用 `chrome-cli`。

## 命令

```
agent-chrome list [--all] [--json]               配置文件的别名（统一动词）
agent-chrome profiles [--all] [--with <服务>] [--json]
agent-chrome profile <id> [--json]               id = chrome-N 或 N
agent-chrome add [--gmail <地址>] [--org-path <路径>] [--launch] [--json]
agent-chrome proxy <id> <url|"">
agent-chrome login set <id> --name <名称> [--url --username --email --mobile --2fa --second-email --note]  丰富的登录记录
agent-chrome login rm <id> <name>
agent-chrome logins <id>                          列出已记录的登录信息
agent-chrome detect-logins <id>                   根据Cookie推断已登录的网站
agent-chrome probe-ip <id>                        通过配置文件的代理获取出口IP+区域 (api.myip.com, 已存储)
agent-chrome note <accountIdx> <文本>            设置/清除自由格式的备注
agent-chrome account <accountIdx> <服务> <accountId>   记录服务的登录ID
agent-chrome password <accountIdx> <服务> <密码>        记录密码
agent-chrome 2fa <accountIdx> <服务> <base32密钥>   记录TOTP (2FA) 密钥
agent-chrome otp <accountIdx> <服务>          生成当前的2FA验证码
agent-chrome accounts <accountIdx> [--show]      列出账户（密钥默认隐藏，除非使用--show）
agent-chrome ip <accountIdx> [--url <ipApi>]     通过CDP获取出口IP+国家
agent-chrome launch <accountIdx> [--url <url>] [--no-activate]
agent-chrome close <accountIdx>
agent-chrome targets [--idx <n>] [--json]
agent-chrome cdp <method> [json_params] [--idx <n>] [--json]
agent-chrome gmails [--json]
agent-chrome github [--json]

agent-chrome --client <client_id> ...
agent-chrome --help / -h / help
agent-chrome tools
```

`accountIdx` 和 profile ID 是同一个编号，也就是 `profile_N` 中的 `N`。
例如 profile ID `3`、`accountIdx=3` 和 `profile_3` 都表示同一个 Chrome 配置文件。

## 每个配置文件的账户（ID + 密码 + 2FA）+ 备注

每个配置文件按服务记录 **账户ID、密码和TOTP（2FA）密钥** — 一个 `服务 → {账户, 密码, totp}` 的映射 — 加上一个自由格式的配置文件 `备注`，存储在其 `~/cicy-ai/db/chrome.json` 条目中：

```
agent-chrome account  3 github octocat            # 登录ID
agent-chrome password 3 github 's3cr3t!'          # 密码
agent-chrome 2fa      3 github JBSWY3DPEHPK3PXP   # TOTP密钥 (base32)
agent-chrome otp      3 github                    # → 492039 (剩余17秒)
agent-chrome accounts 3                           # 列表（密码/OTP显示为“✓ 已设置”）
agent-chrome accounts 3 --show                    # 显示密钥
agent-chrome password 3 github ""                 # 空字符串清除该字段
agent-chrome note 3 "主要工作身份"
agent-chrome profiles --with github               # 每个具有github账户的配置文件
```

- **默认情况下，密钥会隐藏**在 `accounts` / 设置器输出中（显示为 `✓ 已设置`）；传递 `--show` 以揭示。chrome.json 以 `0600` 权限写入。
- `otp` 从存储的密钥在本地计算标准的 RFC-6238 TOTP（SHA1, 6位数字，30秒有效期）——便于编写需要2FA的登录脚本。
- `--with <服务>` 匹配已记录的 `accounts[<服务>]` 和任何已登录的 `platform.<服务>`（github/gmail检测），不区分大小写。

## 出口IP

`agent-chrome ip <idx>` 从该配置文件Chrome的*内部*获取IP信息API，因此结果反映该配置文件的代理出口。配置文件必须已启动（有一个活动标签页）：

```
agent-chrome ip 3                          # 通过api.myip.com获取 {"ip","country","cc"}
agent-chrome ip 3 --url https://ipinfo.io/json
```

## 注意事项

- 桌面机器上需要系统Chrome。
- 每个配置文件 = `~/cicy-ai/db/chrome.json` 下以 `profile_<N>` 为键的条目。
- 默认用户数据目录：`~/chrome/profile_<N>`。默认CDP端口：`11000 + N`。
- 每个配置文件的代理在**下次**启动时应用；作为 `{url,enabled}` 持久化在 chrome.json 中（旧版字符串代理仍可正常读取——一个共享的规范化器位于 cicy-desktop `src/profiles/profile-store.js`）。
- **`login`/`logins` 与 `account`/`accounts` 的区别：** `logins` 是*统一的*跨后端记录（与 `agent-electron` 共享动词），记录配置文件登录了哪些平台账户——仅包含 `平台` + `账户`，无密钥，存储为 `logins[]`。`account`/`password`/`2fa`/`accounts` 是更丰富的Chrome专用**凭据**映射（ID + 密码 + TOTP），用于自动登录。
- `proxy` URL 必须指向一个活动的监听器。推荐设置为每个配置文件配备一个专用的 cicy-mihomo 监听器——有关 cicy-mihomo 集成拓扑、设置流程和六种最常见故障模式（端口过期、默认路由损坏、MATCH,REJECT、监听器静默跳过、reload安全路径限制、代理更改需要重启）的信息，请参见 [proxy.md](./proxy.md)。

## 环境变量

- `CICY_API_TOKEN`        — 覆盖的承载令牌
- `CICY_API_PORT`         — 服务器端口（默认 8008）
- `CICY_GLOBAL_JSON`      — 覆盖的 global.json 路径
- `CICY_AGENT_TIMEOUT_MS` — RPC超时时间（默认 60000 — Chrome操作可能较慢）
