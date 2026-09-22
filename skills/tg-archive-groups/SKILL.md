---
name: tg-archive-groups
description: Use when a Telegram Web K account should have its groups, channels, bots — or with --all every chat — moved into the Archive folder or brought back, in bulk, via agent-electron.
---

# TG Archive Groups

Moves every **group** (basic groups + supergroups) **and every broadcast
channel** of a Telegram Web K session into the **Archive** folder in one go — or
brings them back. `--groups-only` leaves channels alone; `--bots` also moves
chats with bots; **`--all` archives the entire main list** — groups, channels,
bots and private chats with people. Without `--all`, chats with people are
never touched. The official "Telegram" service-notification chat (id 777000)
is always skipped: Telegram refuses to archive it (`folders.editPeerFolders`
is accepted but returns no update). Saved Messages cannot be archived either.
`--drop-service` / `--drop-saved` delete those two chats instead (the latter
wipes everything saved — opt in deliberately).

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
3. **Groups and channels both move by default** (that is what "archive all my
   groups" means to users); `--groups-only` restricts it to groups; `--bots`
   adds bot chats; `--all` adds people too (everything). Without `--all`, chats
   with people are never included.
4. **Go through `agent-electron`**, never open your own RPC/CDP socket
   (cicy-skill-spec §4). `--client <id>` targets a specific cicy-desktop host.
5. **`archive` also switches on the account's "keep archived" settings**
   (`keep_archived_unmuted` + `keep_archived_folders`). Without them Telegram
   un-archives an unmuted chat the moment a new message arrives, so a spammy
   channel is back in the main list within minutes and the run looks like it
   never happened. `--no-keep` skips that.
6. Batches of 20 peers per `editPeerFolders` call with a 500 ms pause (`--batch`,
   `--delay`); use `--limit` to do very large accounts in slices.

## Quick start

```sh
tg-archive-groups targets                            # which Telegram windows exist
tg-archive-groups scan    --target wc:113            # groups / channels, what is archived
tg-archive-groups archive --target wc:113            # dry run
tg-archive-groups archive --target wc:113 --yes      # archive all groups + channels
tg-archive-groups archive --target wc:113 --yes --groups-only
tg-archive-groups archive --target wc:113 --yes --bots        # bots too
tg-archive-groups archive --target wc:113 --yes --all         # everything, people included
tg-archive-groups unarchive --target wc:113 --yes --all       # bring everything back
tg-archive-groups unarchive --target wc:113 --yes    # bring them back
```

## References

- [help.en.md](./references/help.en.md) / [help.cn.md](./references/help.cn.md) — commands, options, exit codes
- [tools.en.md](./references/tools.en.md) / [tools.cn.md](./references/tools.cn.md) — how it talks to the page
