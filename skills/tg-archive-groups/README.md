# tg-archive-groups

Use when a Telegram Web K account should have its groups, channels, bots — or with --all every chat — moved into the Archive folder or brought back, in bulk, via agent-electron.

```sh
tg-archive-groups targets
tg-archive-groups scan    --target wc:<id>
tg-archive-groups archive --target wc:<id> --yes [--groups-only|--bots|--all]
tg-archive-groups unarchive --target wc:<id> --yes
```

Requires `agent-electron` (cicy-desktop) with a logged-in Telegram Web K window.
See [SKILL.md](./SKILL.md).
