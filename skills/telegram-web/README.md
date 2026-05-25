# telegram-web

> Source-only Node.js. Read [`bin/telegram-web`](./bin/telegram-web).
> Requires Node **22+** for native `fetch`.

Drive Telegram Web A inside a cicy-desktop Electron BrowserWindow:

- **Login** by syncing `localStorage` from a logged-in system Chrome profile
- **Query** GlobalState directly via webpack-extracted `typify()` (no DOM scraping, no inject file)
- **Dispatch** actions (`openChat`, `sendMessage`, …) the same way Web A itself does internally

## Install

```bash
cicy-code skill install telegram-web
```

## Quick usage

```bash
# Log in by copying auth from system Chrome profile 0 into Electron account 99
telegram-web login --from-profile 0 --proxy socks5://127.0.0.1:9001

# Now everything is one-line:
telegram-web account                    # me { id, firstName, ... }
telegram-web dialogs --limit 10         # 10 most recent chats
telegram-web messages 7943234085 --limit 5
telegram-web send 7943234085 'hello'    # opens chat then sends

# Escape hatch — raw eval with g/actions/tt shortcuts
telegram-web eval 'g.chats.listIds.archived.length'
telegram-web eval 'actions.markMessageListRead({chatId:"777000"})'
```

## How it works

1. **Auth sync** — `chrome_cdp_call` reads `localStorage` from the source
   profile's open Telegram tab, then `cdp_sendcmd Runtime.evaluate` writes
   the same 20-ish keys into the Electron window. `Page.reload` and
   Telegram boots up already-logged-in.
2. **State extraction** — `webpackChunktelegram_t.push([...])` exposes
   `__webpack_require__`. The skill walks every loaded module looking for
   a 0-arg function whose return object has `getGlobal`+`setGlobal`+`getActions`
   as function keys. That's `typify()`. Calling it once gives the typed
   accessor, which is then mounted on `window.__tt` / `window.__getGlobal`
   / `window.__getActions` for subsequent CDP eval to use directly.

## License

MIT
