# tg-clean-deleted

Use when a Telegram Web K account has "Deleted Account" chats piling up: scan them and delete those chats through agent-electron, no patch required.

```sh
tg-clean-deleted targets
tg-clean-deleted scan  --target wc:<id>
tg-clean-deleted clean --target wc:<id> --yes
```

Requires `agent-electron` (cicy-desktop) with a logged-in Telegram Web K window.
See [SKILL.md](./SKILL.md).
