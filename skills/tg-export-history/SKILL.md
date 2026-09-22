---
name: tg-export-history
description: Use when the messages of a Telegram group, channel or chat must be exported to JSON, JSONL or CSV through a logged-in Telegram Web K page via agent-electron, no patch and no media download.
---

# TG Export History

Exports the message history of a group, channel or private chat that the
account logged in to a Telegram Web K page (a cicy-desktop matrix cell or a
normal window) can read. It pages through `messages.getHistory` inside the
page via `agent-electron` (CDP `Runtime.evaluate`) and writes one normalized
record per message — text, sender, date, media kind, file name, reply / forward
info, views — as **JSON**, **JSONL** and/or **CSV**. Media files are not
downloaded; nothing is patched or installed.

## Scope

Use this skill when the task involves:

- dumping a whole chat (or the newest N messages, or everything after a date /
  message id) into a file for analysis, archiving or feeding another tool
- finding out first what a link / @username resolves to and how many messages it has (`info`)
- doing that for one specific Telegram Web webContents (`--target wc:<id>`)

Do **not** use it to download photos / documents (only their metadata is
recorded), or for chats the logged-in account cannot open — public channels
and groups work without joining, private ones only if the account is a member.

## Rules

1. **Read-only.** It never joins, sends, marks as read or changes anything.
2. **Pick the target explicitly when several Telegram Web pages are open.** Run
   `tg-export-history targets`, then pass `--target wc:<id>`; auto-selection
   only works when exactly one Telegram Web K webContents exists.
3. **Check `info` first for big chats** — it prints the title, type and message
   count so you know what you are pulling; ~100–150 messages/s is typical.
4. **Output goes where `--out` says** (a file or a directory; default: the
   current directory, name `<username-or-id>-messages.<ext>`). Existing files
   are overwritten.
5. **Go through `agent-electron`**, never open your own RPC/CDP socket
   (cicy-skill-spec §4). `--client <id>` targets a specific cicy-desktop host.
6. A page that is still booting answers "not logged in / still starting";
   matrix cells only boot while their panel tab is visible.

## Quick start

```sh
tg-export-history targets
tg-export-history info   @Shakethemap --target wc:121
tg-export-history export @Shakethemap --target wc:121                      # ./Shakethemap-messages.json
tg-export-history export https://t.me/Shakethemap/3894 --format csv --out ~/exports/
tg-export-history export @Shakethemap --limit 500 --format all --out ./dump   # newest 500, json+jsonl+csv
tg-export-history export -1002101513995 --since 2026-09-01 --json           # by peer id, machine output
tg-export-history export https://t.me/Shakethemap/4546 --format all         # a forum topic (link to its root) → *-topic4546-messages.*
tg-export-history export @Shakethemap --topic 4546 --out ./topics/
```

## References

- [help.en.md](./references/help.en.md) / [help.cn.md](./references/help.cn.md) — commands, options, record fields, exit codes
- [tools.en.md](./references/tools.en.md) / [tools.cn.md](./references/tools.cn.md) — how it talks to the page
