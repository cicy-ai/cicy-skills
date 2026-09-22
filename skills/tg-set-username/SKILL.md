---
name: tg-set-username
description: Use when a Telegram account running in Telegram Web K needs its public @username shown, checked, set or cleared through agent-electron, no patch required.
---

# TG Set Username

Shows, checks, sets or clears the public **@username** of the Telegram account
logged in to a Telegram Web K page inside cicy-desktop (a matrix cell or a
normal window). It drives the page through `agent-electron`
(CDP `Runtime.evaluate`) and calls Telegram Web K's own
`window.rootScope.managers` API — nothing is patched or installed.

## Scope

Use this skill when the task involves:

- reading which account a Telegram Web K webContents is logged in as and its current @username
- checking whether a username is valid and still available (`account.checkUsername`)
- setting a new username (`account.updateUsername`) or removing the current one
- doing that for one specific webContents (`--target wc:<id>`)

Do **not** use it for collectible/Fragment usernames (`USERNAME_PURCHASE_AVAILABLE`),
for other users' usernames, or for group/channel links — it only edits the
logged-in account's own username.

## Rules

1. **`set` and `clear` change nothing without `--yes`.** Without it they only
   validate + check availability and print what would happen.
2. **Pick the target explicitly when several Telegram Web pages are open.** Run
   `tg-set-username targets`, then pass `--target wc:<id>`; auto-selection only
   works when exactly one Telegram Web K webContents exists.
3. **Confirm the account first** (`show`) — `set` prints the account (id / phone)
   it is about to change; a matrix machine has dozens of them.
4. Telegram's rules are enforced locally before any request: 5–32 characters,
   `a-z 0-9 _`, must start with a letter, no trailing or double underscore.
   Server answers (`USERNAME_OCCUPIED`, `USERNAME_INVALID`, `FLOOD_WAIT_n`) are
   reported as-is.
5. **Go through `agent-electron`**, never open your own RPC/CDP socket
   (cicy-skill-spec §4). `--client <id>` targets a specific cicy-desktop host.
6. Changing a username often is rate-limited by Telegram; do not loop `set`.

## Quick start

```sh
tg-set-username targets                               # which Telegram Web pages exist
tg-set-username show  --target wc:121                 # who is logged in, current @username
tg-set-username check alice_shop --target wc:121      # valid? available?
tg-set-username set   alice_shop --target wc:121      # dry run: validate + availability
tg-set-username set   alice_shop --target wc:121 --yes
tg-set-username clear --target wc:121 --yes           # remove the username
```

## References

- [help.en.md](./references/help.en.md) / [help.cn.md](./references/help.cn.md) — commands, options, exit codes
- [tools.en.md](./references/tools.en.md) / [tools.cn.md](./references/tools.cn.md) — how it talks to the page
