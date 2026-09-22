# tg-set-name

Use when a Telegram account running in Telegram Web K needs its display name (first + last name) shown or set through agent-electron, defaulting to a cute girl name picked per account.

```sh
tg-set-name suggest --count 5
tg-set-name targets
tg-set-name show --target wc:<id>
tg-set-name set  --target wc:<id> --yes            # cute girl name, stable per account
tg-set-name set  Lily Bloom --target wc:<id> --yes
```

Requires `agent-electron` (cicy-desktop) with a logged-in Telegram Web K page.
See [SKILL.md](./SKILL.md).
