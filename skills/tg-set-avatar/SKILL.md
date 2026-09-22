---
name: tg-set-avatar
description: Use when a Telegram account running in Telegram Web K needs its profile photo (avatar) shown, previewed or set through agent-electron, defaulting to a smiling cartoon girl avatar picked per account.
---

# TG Set Avatar

Shows, previews or sets the **profile photo** of the Telegram account logged in
to a Telegram Web K page inside cicy-desktop (a matrix cell or a normal window).
With no image given it uses a **smiling cartoon girl avatar** (long hair, pastel
background) seeded by the account id, so every account gets its own stable
avatar. You can also pick another built-in style or pass your own image
(file or URL). It drives the page through `agent-electron` (CDP
`Runtime.evaluate`) and calls Telegram Web K's own `window.rootScope.managers`
API — nothing is patched or installed.

## Scope

Use this skill when the task involves:

- checking which account a Telegram Web K page is logged in as and whether it has a photo
- giving an account a cute girl avatar (`photos.uploadProfilePhoto`)
- setting a specific image (local file or http(s) URL) as the avatar
- rendering the avatar to a local JPEG first to look at it (`preview`)

It does **not** delete old photos (they stay in the account's photo list, as in
the Telegram app), and it does not touch the name (`tg-set-name`), the
@username (`tg-set-username`) or the bio.

## Rules

1. **`set` changes nothing without `--yes`.** Without it, it prints the account,
   its current photo and what it would upload.
2. **Default to the `girl` style.** Only pass `--style` / `--image` when the user
   asked for something specific. Use `preview --out f.jpg` when the user wants to
   see the picture before it goes live.
3. **Pick the target explicitly when several Telegram Web pages are open**
   (`targets`, then `--target wc:<id>`); auto-selection only works with exactly one.
4. **Confirm the account first** (`show`) — a matrix machine has dozens of accounts.
5. `--if-none` leaves accounts that already have a photo alone; use it for bulk runs
   that should only fill in missing avatars.
6. **Go through `agent-electron`**, never open your own RPC/CDP socket
   (cicy-skill-spec §4). `--client <id>` targets a specific cicy-desktop host.
7. Telegram rate-limits photo uploads; when changing many accounts, pace the
   calls and stop on `FLOOD_WAIT_n`.

## Quick start

```sh
tg-set-avatar styles                                     # girl (default) · girl-cartoon · emoji
tg-set-avatar targets                                    # which Telegram Web pages exist
tg-set-avatar show --target wc:121                       # who is logged in, has a photo?
tg-set-avatar preview --target wc:121 --out avatar.jpg   # render it locally, change nothing
tg-set-avatar set --target wc:121                        # dry run
tg-set-avatar set --target wc:121 --yes                  # upload the cute girl avatar
tg-set-avatar set --target wc:121 --style emoji --yes    # offline pastel emoji avatar
tg-set-avatar set --target wc:121 --image ./me.png --yes # your own image (file or URL)
```

## References

- [help.en.md](./references/help.en.md) / [help.cn.md](./references/help.cn.md) — commands, options, exit codes
- [tools.en.md](./references/tools.en.md) / [tools.cn.md](./references/tools.cn.md) — how it talks to the page
