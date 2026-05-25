# telegram-web — help

## Commands

```
telegram-web login [--from-profile N] [--to-account M] [--proxy URL|--no-proxy] [--url URL] [--from-client ID]
telegram-web status
telegram-web patch
telegram-web account
telegram-web chats
telegram-web dialogs [--limit N] [--folder active|archived]
telegram-web users
telegram-web messages <chatId> [--limit N]
telegram-web open <chatId>
telegram-web send <chatId> <text...>
telegram-web eval <jsExpression>
telegram-web close

telegram-web --client <client_id> ...
telegram-web --win <winId> ...
telegram-web --help / -h / help
```

## Flow

```
login flow:
  1. Read localStorage from system Chrome profile N (via chrome_cdp_call)
  2. set_account_proxy <to-account> <proxy>
  3. open_window url=https://web.telegram.org/a/ accountIdx=<to-account>
  4. Wait dom-ready (poll get_window_info up to 45s)
  5. Inject 20-ish localStorage keys
  6. Page.reload
  7. Poll for .chat-list to appear (up to 60s)
  8. Run webpack patch → window.__tt / __getGlobal / __getActions
  9. Persist session to ~/cicy-ai/db/telegram-web.json

subsequent commands:
  - Resolve winId from session file (or --win)
  - ensurePatched() → re-attach if reloaded
  - For reads: window.__getGlobal() → JSON path expression
  - For writes: window.__getActions()[name](payload)
```

## Defaults

| flag             | default                       |
|------------------|-------------------------------|
| `--from-profile` | `0`                           |
| `--to-account`   | `99`                          |
| `--proxy`        | `socks5://127.0.0.1:9001`     |
| `--url`          | `https://web.telegram.org/a/` |

`accountIdx=99` is chosen to avoid collision with cicy-code's master
account 0. Override if 99 is taken.

## `eval` examples (escape hatch)

`eval` exposes `g` (global state), `actions` (dispatcher), `tt` (typed
accessor) as shortcuts:

```bash
telegram-web eval 'Object.keys(g).filter(k => k.startsWith("auth"))'
telegram-web eval 'g.chats.listIds.archived'
telegram-web eval 'g.messages.byChatId[g.currentUserId]?.byId'
telegram-web eval 'actions.openChat({id: "777000"})'
telegram-web eval 'actions.markMessageListRead({chatId: "777000"})'
```

## Environment

- `CICY_API_TOKEN`              — bearer token override
- `CICY_API_PORT`               — server port (default 8008)
- `CICY_GLOBAL_JSON`            — global.json path override
- `CICY_TELEGRAM_WEB_SESSION`   — session file override (default `~/cicy-ai/db/telegram-web.json`)
- `CICY_AGENT_TIMEOUT_MS`       — RPC timeout (default 90000 — Web A boot can be slow)

## Related skills

- `agent-chrome` — read source profile's `localStorage` (via `chrome_cdp_call`)
- `agent-electron` — manage the target Electron session/window the skill drives
- `agent-desktop` — underlying RPC bus to cicy-desktop
