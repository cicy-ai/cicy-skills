# agent-chrome — 工具

## 子命令 → electronRPC 工具

`accountIdx` 就是 profile ID（即 `profile_N` 中的 `N`），不是两个不同的编号。

| 子命令                          | 工具                          | 参数                                |
|-------------------------------|-------------------------------|-------------------------------------|
| `list` / `profiles [--all] [--with <svc>]` | `chrome_list_profiles` | `{ includeHidden }` (`--with` 在客户端过滤) |
| `profile <id>`          | `chrome_get_profile`          | `{ accountIdx }`                    |
| `add`                   | `chrome_add_profile`          | `{ gmail?, orgPath?, launchAfterCreate? }` |
| `proxy <id> <url>`      | `chrome_set_profile_proxy`    | `{ accountIdx, proxy }` — 持久化 `{url,enabled}` |
| `login set <id> --name N ...` | `chrome_profile_login_set` | 丰富参数: `{ accountIdx, name, url?, username?, email?, mobile?, twofa?, secondEmail?, note? }` |
| `login rm <id> <name>`  | `chrome_profile_login_rm`     | `{ accountIdx, name }`              |
| `logins <id>`           | `chrome_profile_logins`       | `{ accountIdx }`                    |
| `detect-logins <id>`    | `chrome_detect_logins`        | `{ accountIdx }` — 从 Cookie 推断已登录站点 |
| `probe-ip <id>`         | `chrome_probe_ip`             | `{ accountIdx }` — 通过代理获取出口 IP 地址及区域 (api.myip.com)，并存储 |
| `note <idx> <text>`     | `chrome_set_profile_meta`     | `{ accountIdx, note }`              |
| `account <idx> <svc> <id>` | `chrome_set_profile_meta`  | `{ accountIdx, accounts:{[svc]:{account:id}} }` |
| `password <idx> <svc> <pwd>` | `chrome_set_profile_meta` | `{ accountIdx, accounts:{[svc]:{password}} }` |
| `2fa <idx> <svc> <secret>` | `chrome_set_profile_meta`  | `{ accountIdx, accounts:{[svc]:{totp}} }` |
| `otp <idx> <svc>`       | `chrome_get_profile`          | 读取 `totp`，在本地计算 TOTP |
| `accounts <idx> [--show]` | `chrome_get_profile`        | 读取 `accounts`；除非指定 `--show`，否则隐藏密钥 |
| `ip <idx> [--url U]`    | `chrome_cdp_call`             | `Runtime.evaluate` fetch → `{ip,country,cc}` |
| `launch <idx>`          | `chrome_launch_profile`       | `{ accountIdx, url?, activateIfRunning? }` |
| `close <idx>`           | `chrome_close_profile`        | `{ accountIdx }`                    |
| `targets [--idx N]`     | `chrome_get_targets`          | `{ accountIdx? }`                   |
| `cdp <method> [params]` | `chrome_cdp_call`             | `{ method, params?, accountIdx? }`  |
| `gmails`                | `chrome_list_gmails`          | `{}`                                |
| `github`                | `chrome_list_github_accounts` | `{}`                                |

## 通信协议

与 `agent-desktop` 相同：打开 WebSocket 连接到 `/api/chat/ws?agent_id=…&token=…`，
推送 `desktop_event { rpc_call, tool, args, requestId }`，
等待并接收具有匹配 `requestId` 的 `rpc_result`。

## chrome.json 结构 (位于 cicy-desktop 主机上)

```json
{
  "profile_1": {
    "gmail": "x@y.com",
    "userDataDir": "~/chrome/profile_1",
    "debuggerPort": 11001,
    "proxy": "socks5://127.0.0.1:1080",
    "note": "主要工作身份",
    "accounts": {
      "github": { "account": "octocat", "password": "•••", "totp": "JBSWY3DPEHPK3PXP" },
      "gmail":  { "account": "me@gmail.com", "password": "•••" }
    }
  }
}
```

`note` + `accounts` 字段需要 cicy-desktop 版本 ≥ 2.1.37（`chrome_set_profile_meta` RPC 会逐字段合并 `service → {account,password,totp}` 映射，以 `0600` 权限写入 chrome.json，并在 `chrome_list_profiles` / `chrome_get_profile` 返回结果中同时包含这两个字段）。CLI 从不打印密钥，除非指定 `--show`。

## 出口 IP 地址

```bash
agent-chrome ip 1                          # 通过 api.myip.com → {ip,country,cc}
agent-chrome ip 1 --url https://ipinfo.io/json
```

## CDP 示例

```bash
# 在配置文件 1 的活动标签页中导航
agent-chrome cdp Page.navigate '{"url":"https://example.com"}' --idx 1

# 在配置文件 1 的活动标签页中执行 JavaScript
agent-chrome cdp Runtime.evaluate '{"expression":"document.title"}' --idx 1

# 对活动标签页进行屏幕截图
agent-chrome cdp Page.captureScreenshot '{}' --idx 1
```
