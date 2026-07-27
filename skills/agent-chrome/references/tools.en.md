# agent-chrome — tools

## Subcommand → electronRPC tool

| subcmd                  | tool                          | args                                |
|-------------------------|-------------------------------|-------------------------------------|
| `list` / `profiles [--all] [--with <svc>]` | `chrome_list_profiles` | `{ includeHidden }` (`--with` filters client-side) |
| `profile <id>`          | `chrome_get_profile`          | `{ accountIdx }`                    |
| `add`                   | `chrome_add_profile`          | `{ gmail?, orgPath?, launchAfterCreate? }` |
| `proxy <id> <url>`      | `chrome_set_profile_proxy`    | `{ accountIdx, proxy }` — persists `{url,enabled}` |
| `login set <id> --name N ...` | `chrome_profile_login_set` | rich: `{ accountIdx, name, url?, username?, email?, mobile?, twofa?, secondEmail?, note? }` |
| `login rm <id> <name>`  | `chrome_profile_login_rm`     | `{ accountIdx, name }`              |
| `logins <id>`           | `chrome_profile_logins`       | `{ accountIdx }`                    |
| `detect-logins <id>`    | `chrome_detect_logins`        | `{ accountIdx }` — infer signed-in sites from cookies |
| `probe-ip <id>`         | `chrome_probe_ip`             | `{ accountIdx }` — egress IP+area via proxy (api.myip.com), stored |
| `note <idx> <text>`     | `chrome_set_profile_meta`     | `{ accountIdx, note }`              |
| `account <idx> <svc> <id>` | `chrome_set_profile_meta`  | `{ accountIdx, accounts:{[svc]:{account:id}} }` |
| `password <idx> <svc> <pwd>` | `chrome_set_profile_meta` | `{ accountIdx, accounts:{[svc]:{password}} }` |
| `2fa <idx> <svc> <secret>` | `chrome_set_profile_meta`  | `{ accountIdx, accounts:{[svc]:{totp}} }` |
| `otp <idx> <svc>`       | `chrome_get_profile`          | reads `totp`, computes TOTP locally |
| `accounts <idx> [--show]` | `chrome_get_profile`        | reads `accounts`; masks secrets unless `--show` |
| `ip <idx> [--url U]`    | `chrome_cdp_call`             | `Runtime.evaluate` fetch → `{ip,country,cc}` |
| `launch <idx>`          | `chrome_launch_profile`       | `{ accountIdx, url?, activateIfRunning? }` |
| `close <idx>`           | `chrome_close_profile`        | `{ accountIdx }`                    |
| `targets [--idx N]`     | `chrome_get_targets`          | `{ accountIdx? }`                   |
| `cdp <method> [params]` | `chrome_cdp_call`             | `{ method, params?, accountIdx? }`  |
| `gmails`                | `chrome_list_gmails`          | `{}`                                |
| `github`                | `chrome_list_github_accounts` | `{}`                                |

## Wire protocol

Same as `agent-desktop`: open WS to `/api/chat/ws?agent_id=…&token=…`,
push `desktop_event { rpc_call, tool, args, requestId }`, await
`rpc_result` with matching requestId.

## chrome.json shape (on cicy-desktop host)

```json
{
  "profile_1": {
    "gmail": "x@y.com",
    "userDataDir": "~/chrome/profile_1",
    "debuggerPort": 11001,
    "proxy": "socks5://127.0.0.1:1080",
    "note": "main work identity",
    "accounts": {
      "github": { "account": "octocat", "password": "•••", "totp": "JBSWY3DPEHPK3PXP" },
      "gmail":  { "account": "me@gmail.com", "password": "•••" }
    }
  }
}
```

`note` + `accounts` need cicy-desktop ≥ 2.1.37 (the `chrome_set_profile_meta`
RPC merges the `service → {account,password,totp}` map field-by-field, writes
chrome.json `0600`, and returns both fields from `chrome_list_profiles` /
`chrome_get_profile`). Secrets are never printed by the CLI unless `--show`.

## Egress IP

```bash
agent-chrome ip 1                          # via api.myip.com → {ip,country,cc}
agent-chrome ip 1 --url https://ipinfo.io/json
```

## CDP examples

```bash
# navigate the active tab in profile 1
agent-chrome cdp Page.navigate '{"url":"https://example.com"}' --idx 1

# evaluate JS in profile 1's active tab
agent-chrome cdp Runtime.evaluate '{"expression":"document.title"}' --idx 1

# screenshot the active tab
agent-chrome cdp Page.captureScreenshot '{}' --idx 1
```
