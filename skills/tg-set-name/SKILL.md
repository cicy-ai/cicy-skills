---
name: tg-set-name
description: Use when a Telegram account running in Telegram Web K needs its display name (first + last name) shown or set through agent-electron, defaulting to a cute Chinese girl name picked per account.
---

# TG Set Name

Shows or sets the **display name** (first name + last name) of the Telegram
account logged in to a Telegram Web K page inside cicy-desktop (a matrix cell
or a normal window). When no name is given it picks a **cute Chinese girl
name** of 2–5 characters — e.g. `糖糖`, `棉花糖`, `小熊软糖`, `樱桃小丸子` (first name only, last name empty;
`--lang en` gives `Luna Peach` style) — seeded by the account id, so
every account gets its own stable name and re-running is a no-op. It drives
the page through `agent-electron` (CDP `Runtime.evaluate`) and calls Telegram
Web K's own `window.rootScope.managers` API — nothing is patched or installed.

## Scope

Use this skill when the task involves:

- reading which account a Telegram Web K webContents is logged in as and its current name
- giving an account a cute Chinese (or English) girl display name (`account.updateProfile`)
- setting an explicit first / last name
- listing cute girl name suggestions offline (`suggest`)

It does **not** touch the @username (use `tg-set-username`), the bio, the
profile photo, or other users' names.

## Rules

1. **`set` changes nothing without `--yes`.** Without it, it prints the account
   and the name it would set.
2. **Default to a cute Chinese girl name.** Run `set` without a name to let the skill
   pick one; only pass explicit names when the user asked for a specific one.
3. **Pick the target explicitly when several Telegram Web pages are open**
   (`targets`, then `--target wc:<id>`); auto-selection only works with exactly one.
4. **Confirm the account first** (`show`) — a matrix machine has dozens of accounts.
5. Names are checked locally before any request: first name 1–64 characters,
   last name 0–64. Server refusals (`FIRSTNAME_INVALID`, `FLOOD_WAIT_n`) are reported as-is.
6. **Go through `agent-electron`**, never open your own RPC/CDP socket
   (cicy-skill-spec §4). `--client <id>` targets a specific cicy-desktop host.
7. Telegram rate-limits profile edits; when renaming many accounts, pace the
   calls and stop on `FLOOD_WAIT_n`.

## Quick start

```sh
tg-set-name suggest --count 5                    # cute girl names, offline
tg-set-name targets                              # which Telegram Web pages exist
tg-set-name show --target wc:121                 # who is logged in, current name
tg-set-name set --target wc:121                  # dry run: shows the cute name it would pick
tg-set-name set --target wc:121 --yes            # apply it
tg-set-name set --target wc:121 --emoji --yes    # e.g. "糖糖" "🍓"
tg-set-name set --target wc:121 --lang en --yes  # e.g. "Luna" "Peach"
tg-set-name set 小桃 --target wc:121 --yes        # explicit name
```

## References

- [help.en.md](./references/help.en.md) / [help.cn.md](./references/help.cn.md) — commands, options, exit codes
- [tools.en.md](./references/tools.en.md) / [tools.cn.md](./references/tools.cn.md) — how it talks to the page
