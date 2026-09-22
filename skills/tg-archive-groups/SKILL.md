---
name: tg-archive-groups
description: Use when a Telegram Web K account should have all its groups (optionally channels) moved into the Archive folder or brought back, in bulk, through agent-electron.
---

# TG Archive Groups

Moves every **group** (basic groups + supergroups) of a Telegram Web K session
into the **Archive** folder in one go — or brings them back. Channels can be
included with `--channels`. Private chats and bots are never touched.

It drives the page through `agent-electron` (CDP `Runtime.evaluate`) and calls
Telegram Web K's own `window.rootScope.managers` API
(`folders.editPeerFolders`) — no patch, nothing installed on the machine.

## Scope

Use this skill when the task involves:

- counting how many groups / channels an account has and which are already archived
- archiving all groups (and optionally channels) of one Telegram Web webContents
- un-archiving them again (`unarchive`)

Do **not** use it to leave or delete chats — archiving only moves them to the
Archive folder; membership, history and notifications are unchanged.

## Rules

1. **`archive` / `unarchive` are dry-run by default.** Nothing moves without `--yes`.
2. **Pick the target explicitly when several Telegram windows are open.** Run
   `tg-archive-groups targets`, then pass `--target wc:<id>`; auto-selection only
   works when exactly one Telegram Web K webContents exists.
3. **Groups only unless told otherwise.** `--channels` adds broadcast channels;
   private chats are never included.
4. **Go through `agent-electron`**, never open your own RPC/CDP socket
   (cicy-skill-spec §4). `--client <id>` targets a specific cicy-desktop host.
5. Batches of 20 peers per `editPeerFolders` call with a 500 ms pause (`--batch`,
   `--delay`); use `--limit` to do very large accounts in slices.

## Quick start

```sh
tg-archive-groups targets                            # which Telegram windows exist
tg-archive-groups scan    --target wc:113            # groups / channels, what is archived
tg-archive-groups archive --target wc:113            # dry run
tg-archive-groups archive --target wc:113 --yes      # archive all groups
tg-archive-groups archive --target wc:113 --yes --channels
tg-archive-groups unarchive --target wc:113 --yes    # bring them back
```

## References

- [help.en.md](./references/help.en.md) / [help.cn.md](./references/help.cn.md) — commands, options, exit codes
- [tools.en.md](./references/tools.en.md) / [tools.cn.md](./references/tools.cn.md) — how it talks to the page
