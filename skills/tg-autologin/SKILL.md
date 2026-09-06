---
name: tg-autologin
description: Automate Telegram Web login on cicy-desktop over the wsd socket: send phone, overlay a same-size 接码/getcode webview on the profile cell to read the SMS code + 2FA, then type them. CLI-side cooldowns.
---

# TG Auto Login

Log a cicy-desktop **Telegram 矩阵** profile into Telegram Web end-to-end,
driving the machine's Electron **main process** over the same realtime control
socket `wsd` uses. Per profile:

1. **send** — reset the cell, switch to phone login, type the phone, click NEXT → code requested.
2. **overlay** — stack a **接码/getcode** `BrowserView` **on top of the profile cell**
   (same bounds as the TG webview, higher z-order), read the SMS **code** and
   **2FA password** off it, then destroy it.
3. **finish** — type the code; if a cloud-password (2FA) prompt appears, type the password → login.

## Scope

Use when a Telegram 矩阵 profile needs to be logged in and it has (or you pass)
a phone number + a 接码 `codeUrl`. Not for opening the panel (`tg-matrix`) or
generic web automation.

## Use this — do not hand-roll

- **Remote (you are NOT on the desktop) = this skill.** It drives the target's
  Electron **main process** over the `wsd` socket, so it needs no local CDP. Do
  **not** hand-drive the login with ad-hoc `wsd main` DOM calls, and do **not**
  reach for `tg-login` in the remote case — `tg-login` needs CDP at
  `127.0.0.1:9221`, which is **loopback-only on the target** and unreachable
  from a management host. (`tg-login` is for when you are on the desktop itself.)
- **Read the code through the profile's OWN cell overlay** — a same-partition
  (`persist:sandbox-N`) 接码 `BrowserView` on top of the cell, so it egresses via
  **that profile's proxy / exit IP**. Never fetch the `codeUrl` from another host,
  or via `openTab` as a standalone tab: that leaves the account's IP path and
  defeats the per-profile proxy (the account's IP consistency is the whole point).
- **The 接码 page reflects the account's real device, not you.** "无三十分钟内的登录消息"
  just means no code was requested yet — trigger `send` first; a rate-limit
  ("请求过于频繁，请等待 N 秒") is alive-but-throttled, not dead.

## Quick start

```sh
tg-autologin login xs-1004 4                     # login profile #4 (reads its stored phone/codeUrl)
tg-autologin login xs-1004 2,3,4                 # several, sequentially (never concurrent on one machine)
tg-autologin login xs-1004 1 --phone +57... --code-url https://jiema.didiapi.uk/getcode?id=...
tg-autologin login xs-1004 4 --cooldown 62 --tries 6 --json
```

## Hard-won details baked in

- **接码 webview is stacked ABOVE the cell, same size** (`addBrowserView` last = higher z; bounds = the cell's), then **destroyed after reading** — no leaked windows.
- **Typing uses one key event per char** (keyDown+keyUp, no separate `char`) — the old double-`char` bug typed `didi`→8 chars and failed 2FA with an `error` field.
- **The code field is a CSS-module class** (`_input_...`) in new web-K, not `.input-field-input` — the payloads select by `input` visibility, not that class.
- **接码 rate-limits ~1 req/min** ("请求过于频繁"). Reads are spaced with a CLI-side cooldown so control calls stay sub-second and never trip the socket timeout — **never** sleep 60s inside a single `wsd main` call.
- **Single machine = sequential.** Concurrent logins on one machine fight over CDP/接码; multiple idxs run one after another.
- 2FA password prefers the 接码 page's `pass2fa`, else `didi`.
- Logged-in truth = `localStorage.user_auth` (not the chat list).

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
