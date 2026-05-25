---
name: telegram-web
description: Drive Telegram Web A inside a cicy-desktop BrowserWindow. Login by syncing localStorage from a system-Chrome profile; query/dispatch via webpack-extracted typify() to read GlobalState and fire actions — no inject file required.
---

# Telegram Web

This skill runs Telegram Web A (`web.telegram.org/a/`) inside a
cicy-desktop Electron BrowserWindow and drives it programmatically. It
sidesteps two historically painful problems:

1. **No login flow.** Auth is copied from an already-logged-in system
   Chrome profile (read via `agent-chrome cdp` / `chrome_cdp_call`) into
   the Electron session's `localStorage`. After reload, Telegram boots up
   logged in — no QR code, no phone number, no 2FA prompt.
2. **No DOM scraping.** Web A's entire client state lives in a single
   webpack-closure variable (`currentGlobal` in `lib/teact/teactn`). This
   skill extracts the `typify()` factory by walking
   `webpackChunktelegram_t`, then exposes `window.__getGlobal` and
   `window.__getActions` so reads and dispatches become one-line CDP eval.

## Scope

Use this skill when the task involves:

- logging Telegram Web into an Electron BrowserWindow without phone/QR
- reading the logged-in account's chats, dialogs, users, messages
- sending text messages to a chat
- triggering actions (`openChat`, `sendMessage`, etc.) on the live client

## Rules

1. **Source profile must already be logged in.** `login --from-profile N`
   reads `localStorage` from system Chrome profile N. If the profile isn't
   logged into Telegram (no `user_auth` / `account1` keys), the command
   errors out — log in via system Chrome first.
2. **Target session needs a working proxy.** Web A's MTProto endpoint is
   typically unreachable without one. `login --proxy URL` calls
   `set_account_proxy <to-account> <url>` first; default is
   `socks5://127.0.0.1:9001` (the local mihomo mixed port). Pass
   `--no-proxy` only if the host's direct network reaches Telegram.
3. **Session state is persisted to `~/cicy-ai/db/telegram-web.json`** —
   `winId`, `accountIdx`, `clientId`, `currentUserId`. Subsequent commands
   default to this session; pass `--win N` to target a different window
   explicitly.
4. **The webpack patch re-runs after every page reload.** `__getGlobal`
   lives in the page's JS world; `Page.reload` drops it. Every state-read
   command calls `ensurePatched()` first, which is idempotent and cheap if
   already patched.
5. **Telegram-tt module IDs change per release.** The patch feature-detects
   `typify` by signature (0-arg function whose return value has
   `getGlobal`+`setGlobal`+`getActions` as function keys) — no hard-coded
   module ID. Resilient across upstream rebuilds.
6. **`--client <client_id>` targets a specific cicy-desktop host.** With
   no flag, auto-selects the single connected host.

## References

- [help.md](./references/help.md)
