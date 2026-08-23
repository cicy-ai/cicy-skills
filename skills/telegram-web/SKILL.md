---
name: telegram-web
description: Use when inspecting or operating an authenticated Telegram Web A or K session through agent-electron.
---

# Telegram Web

Operate Telegram Web through a stable JSON CLI while keeping authentication data private. Electron work must go through `agent-electron`; login alone reads the source profile through `agent-chrome`.

## Scope

Use for login status, patching, account/chat/dialog/user/message reads, opening chats, sending text, safe evaluation, or closing a Telegram Web A/K window.

Do not use it to export authentication storage, tokens, passwords, or login codes. Do not take screenshots unless the user separately authorizes them.

## Quick start

1. Run `telegram-web status --target <target> --json` (or rely on the saved session).
2. Run `telegram-web patch --target <target> --json` before reads. Web K patching is delegated to `tg-web-mirror-hook` and reads `window.__mirrors`.
3. Use `account`, `chats`, `dialogs`, `users`, or `messages` for normalized data.
4. Add `--apply` to `login`, `open`, `send`, `close`, and any evaluation that can mutate state.

Read-only `eval` receives a deep-frozen snapshot. Never weaken mirror shape validation merely to accept unexpected live state; add a red fixture and deliberately extend normalization first. Web K `open` and `send` remain unsupported until a verified action capability exists.

## References

- [Chinese command reference](./references/help.cn.md)
- [English command reference](./references/help.en.md)
- [Safety and integration notes](./references/tools.md)
