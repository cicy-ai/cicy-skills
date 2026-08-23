# Telegram Web

A private, zero-dependency Node CLI for normalized Telegram Web A/K inspection and controlled operations through `agent-electron`.

```sh
telegram-web open-url https://web.telegram.org/k/ --profile 3 --apply
telegram-web status --target wc:5 --json
telegram-web patch --target wc:5 --json
telegram-web chats --target wc:5 --json
```

Mutations require `--apply`. Login copies authenticated local storage from a selected Chrome profile without persisting it, then stores only redacted session metadata in `~/cicy-ai/db/telegram-web.json` with mode `0600`.

See [Chinese help](references/help.cn.md), [English help](references/help.en.md), and [integration notes](references/tools.md).
