# tg-set-username

Use when a Telegram account running in Telegram Web K needs its public @username shown, checked, set or cleared through agent-electron, no patch required.

```sh
tg-set-username targets
tg-set-username show  --target wc:<id>
tg-set-username check <username> --target wc:<id>
tg-set-username set   <username> --target wc:<id> --yes
tg-set-username clear --target wc:<id> --yes
```

Requires `agent-electron` (cicy-desktop) with a logged-in Telegram Web K page.
See [SKILL.md](./SKILL.md).
