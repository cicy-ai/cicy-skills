---
name: tg
description: Send a Telegram message or photo via cicy-code's /api/tg/{send,photo} endpoints. Subcommands - send / photo.
---

# Telegram

Local `tg` wrapper that posts to cicy-code's `/api/tg/*` endpoints. The
actual bot token + chat id are configured server-side in cicy-code.

## Scope

Use this skill when the task involves sending a one-shot Telegram
notification — a status message, a screenshot URL, etc.

## Rules

1. `tg send <message>` for plain text.
2. `tg photo <url> [caption]` to forward an image URL with optional caption.
3. The bot/chat configuration is **not** managed here — cicy-code holds the
   bot token. If sending fails with `chat not found` or `Unauthorized`,
   ask the user to fix cicy-code's bot config.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
