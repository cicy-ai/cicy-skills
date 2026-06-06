# agent-electron — tools

## Subcommand → electronRPC tool

| subcmd                          | tool                              | args                                       |
|---------------------------------|-----------------------------------|--------------------------------------------|
| `sessions`                      | `get_windows` (grouped)           | `{}` — derived from window list            |
| `session <idx>`                 | `get_windows` (filtered)          | `{}` — filtered by accountIdx              |
| `proxy <idx> <url>`             | `set_account_proxy`               | `{ accountIdx, proxy }`                    |
| `open <idx> --url <u>`          | `open_window`                     | `{ url, accountIdx, reuseWindow }`         |
| `close <winId>`                 | `close_window`                    | `{ win_id }`                               |
| `windows`                       | `get_windows`                     | `{}`                                       |
| `window <winId>`                | `get_window_info`                 | `{ win_id }`                               |
| `url <winId> <url>`             | `load_url`                        | `{ win_id, url }`                          |
| `cdp <winId> <method> [params]` | `cdp_sendcmd`                     | `{ win_id, method, params? }`              |
| `screenshot <winId>`            | `webpage_screenshot_to_clipboard` | `{ win_id }`                               |
| `screenshot <winId> --out P`    | `cdp_sendcmd Page.captureScreenshot` | `{ win_id, method, params:{format:"png"} }` |
| `snapshot <winId>`              | `webpage_snapshot`                | `{ win_id }`                               |
| `sysinfo`                       | `get_system_info`                 | `{}`                                       |

## Wire protocol

```
POST /api/chat/push
{
  "client_id":  "<desktop-client-id>",
  "type":       "desktop_event",
  "wait_ack":   true,
  "timeout_ms": 60000,
  "data": {
    "type":      "rpc_call",
    "tool":      "<electronRPC tool name>",
    "args":      { ... },
    "requestId": "<random>"
  }
}
```

Server injects its own requestId, registers a waiter, dispatches to the
client over WS, and replies on the HTTP response when the client writes
back any message with that requestId.

## Session layout

Each `accountIdx` (N) maps to:

- partition: `persist:sandbox-<N>`
- on-disk path: `<userData>/Partitions/sandbox-<N>/`
- proxy: whatever `set_account_proxy <N>` last applied (or none)
- windows: every `BrowserWindow` opened with `accountIdx: N`

Windows in the same session share cookies, localStorage, IndexedDB,
service workers, cache, and proxy.

## Open discipline (agent protocol)

Before `open <idx> --url <u>`, run `windows` (or `session <idx>`):

1. **URL already open in that session →** do NOT open a new window.
   Activate the existing one with native BrowserWindow methods and tell
   the user its winId (desktop RPC `control_electron_BrowserWindow`):
   ```bash
   agent-desktop rpc control_electron_BrowserWindow \
     '{"win_id":<winId>,"code":"(win.isMinimized()&&win.restore(), win.show(), win.focus(), {id:win.id, visible:win.isVisible(), focused:win.isFocused()})"}'
   ```
2. **Needs fresh content →** refresh in place instead of re-opening:
   `agent-electron url <winId> <u>`
3. **User explicitly wants a second window →** only then
   `agent-electron open <idx> --url <u> --no-reuse`

Note: `open` with default reuse does NOT match by URL on the desktop side
(it only reuses in oneWindow mode) — that's why the check above is the
agent's job.

## CDP examples

```bash
# evaluate JS in window 4
agent-electron cdp 4 Runtime.evaluate '{"expression":"document.title","returnByValue":true}'

# navigate window 4
agent-electron cdp 4 Page.navigate '{"url":"https://example.com"}'

# reload window 4
agent-electron cdp 4 Page.reload '{}'

# set a cookie on the session via CDP (any window in that session)
agent-electron cdp 4 Network.setCookie '{"name":"k","value":"v","domain":"example.com"}'
```

## Compared with agent-chrome

- `agent-chrome cdp <method> --idx <N>` operates on the active tab in
  system Chrome under profile N.
- `agent-electron cdp <winId> <method>` operates on a specific Electron
  BrowserWindow regardless of which session it lives in. To target a
  session-wide operation, pick any winId in that session.
