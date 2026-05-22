# agent-chrome — tools

## Subcommand → electronRPC tool

| subcmd                  | tool                          | args                                |
|-------------------------|-------------------------------|-------------------------------------|
| `profiles [--all]`      | `chrome_list_profiles`        | `{ includeHidden }`                 |
| `profile <idx>`         | `chrome_get_profile`          | `{ accountIdx }`                    |
| `add`                   | `chrome_add_profile`          | `{ gmail?, orgPath?, launchAfterCreate? }` |
| `proxy <idx> <url>`     | `chrome_set_profile_proxy`    | `{ accountIdx, proxy }`             |
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
  "account_1": {
    "gmail": "x@y.com",
    "userDataDir": "~/chrome/account_1",
    "debuggerPort": 11001,
    "proxy": "socks5://127.0.0.1:1080"
  }
}
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

## Exit codes

See [help.md](./help.md).
