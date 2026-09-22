---
name: tg-clean-deleted
description: Use when a Telegram Web K account has "Deleted Account" chats piling up: scan them and delete those chats through agent-electron, no patch required.
---

# TG Clean Deleted

Removes chats whose counterpart is a **Deleted Account** from a Telegram Web K
session running inside cicy-desktop. Those chats are usually 2021–2023
"X joined Telegram" notifications from users who have since deleted their
account; they clutter the chat list and are never worth keeping.

It drives the page through `agent-electron` (CDP `Runtime.evaluate`) and calls
Telegram Web K's own `window.rootScope.managers` API — no cache patch, no
mirror hook, nothing installed on the machine.

## Scope

Use this skill when the task involves:

- counting how many "Deleted Account" chats an account has
- deleting those chats (server-side `messages.deleteHistory`, dialog dropped locally)
- doing that for one specific Telegram Web webContents (`--target wc:<id>`)

Do **not** use it to delete chats with live users, groups or channels — it only
ever touches peers whose `user.pFlags.deleted` is set.

## Rules

1. **`clean` is dry-run by default.** Nothing is deleted without `--yes`.
2. **Pick the target explicitly when several Telegram windows are open.** Run
   `tg-clean-deleted targets`, then pass `--target wc:<id>`; auto-selection only
   works when exactly one Telegram Web K webContents exists.
3. **Deleting is server-side and permanent for that account** (same as the
   "Delete chat" menu item). Deleted accounts cannot message back, so nothing of
   value is lost, but there is no undo.
4. **Go through `agent-electron`**, never open your own RPC/CDP socket
   (cicy-skill-spec §4). `--client <id>` targets a specific cicy-desktop host.
5. Pace deletions (`--delay`, default 400 ms) — Telegram rate-limits bursts of
   `deleteHistory`; use `--limit` to do big backlogs in slices.

## Quick start

```sh
tg-clean-deleted targets                          # which Telegram windows exist
tg-clean-deleted scan  --target wc:121            # list deleted-account chats
tg-clean-deleted clean --target wc:121            # dry run
tg-clean-deleted clean --target wc:121 --yes      # delete them
tg-clean-deleted clean --target wc:121 --yes --limit 20 --json
```

## References

- [help.en.md](./references/help.en.md) / [help.cn.md](./references/help.cn.md) — commands, options, exit codes
- [tools.en.md](./references/tools.en.md) / [tools.cn.md](./references/tools.cn.md) — how it talks to the page
