# tg-set-avatar

Use when a Telegram account running in Telegram Web K needs its profile photo (avatar) shown, previewed or set through agent-electron, defaulting to a smiling cartoon girl avatar picked per account.

```sh
tg-set-avatar styles
tg-set-avatar targets
tg-set-avatar show    --target wc:<id>
tg-set-avatar preview --target wc:<id> --out avatar.jpg
tg-set-avatar set     --target wc:<id> --yes                 # cute girl avatar, stable per account
tg-set-avatar set     --target wc:<id> --image ./me.png --yes
```

Requires `agent-electron` (cicy-desktop) with a logged-in Telegram Web K page.
The `girl` / `girl-cartoon` styles download from api.dicebear.com; `emoji` works offline.
See [SKILL.md](./SKILL.md).
