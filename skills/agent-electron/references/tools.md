# agent-electron — tools

## Subcommand → electronRPC tool

| subcmd                          | tool                              | args                                       |
|---------------------------------|-----------------------------------|--------------------------------------------|
| `sessions`                      | `get_windows` (grouped)           | `{}` — derived from window list            |
| `session <idx>`                 | `get_windows` (filtered)          | `{}` — filtered by accountIdx              |
| `profiles`                      | `electron_list_profiles`          | `{}`                                       |
| `tabs [idx]`                    | `electron_tabs`                   | `{ accountIdx }`                           |
| `webcontents`                   | `electron_webcontents`            | `{}` — all live WebContents                |
| `proxy <idx> <url>`             | `set_account_proxy`               | `{ accountIdx, proxy }`                    |
| `open <url> [--idx 1]`          | `open_window`                     | `{ url, accountIdx, reuseWindow }`         |
| `close <winId\|webContentsId>` | `close_window` / `electron_tab_close` | `{ win_id }` / `{ webContentsId }`     |
| `windows`                       | `get_windows`                     | `{}`                                       |
| `window <winId\|webContentsId>`| `get_window_info` / `electron_tab_eval` | target details                         |
| `url <winId\|webContentsId> <url>` | `load_url` / `electron_tab_navigate` | target + URL                         |
| `cdp <winId\|webContentsId> ...` | `cdp_sendcmd` / `electron_tab_cdp` | target + method + params                |
| `screenshot <winId\|webContentsId>` | window/tab screenshot tool    | target id                                  |
| `screenshot <winId> --out P`    | `cdp_sendcmd Page.captureScreenshot` | `{ win_id, method, params:{format:"png"} }` |
| `snapshot <winId\|webContentsId>` | `webpage_snapshot` / `electron_tab_snapshot` | target id                    |
| `sysinfo`                       | `get_system_info`                 | `{}`                                       |
| `inject install` | `exec_shell`, `file_write` | resolve host home, then `{path,content}` |
| `inject status/uninstall` | `electron_inject` | `{operation,name}` |

Target syntax is intentionally explicit because Electron may assign the same
number to a `BrowserWindow.id` and a `webContents.id`: bare `4` (or `win:4`)
means a window, while `tab:4` / `wc:4` means a BrowserView tab.

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

`accountIdx` = profile id = session id. The names differ by context, but the
number is identical and maps directly to `persist:sandbox-<N>`.

Each `accountIdx` (N) maps to:

- partition: `persist:sandbox-<N>`
- on-disk path: `<userData>/Partitions/sandbox-<N>/`
- proxy: whatever `set_account_proxy <N>` last applied (or none)
- windows: every `BrowserWindow` opened with `accountIdx: N`

Windows in the same session share cookies, localStorage, IndexedDB,
service workers, cache, and proxy.

## Open discipline (agent protocol)

Before `open <url> [--idx N]`, run `windows` (or `session <idx>`):

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
   `agent-electron open <url> --no-reuse`

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
