# tg-web-pull

Pull messages from a group open in a Telegram Web K webview on cicy-desktop.
Lists webviews and group dialogs, then scrapes the active (or peer-matched)
chat via the `agent-electron` skill.

```sh
tg-web-pull webviews
tg-web-pull groups wc:42
tg-web-pull pull wc:42 --peer -1770576689 --limit 20
```

See [SKILL.md](./SKILL.md) and [references/help.md](./references/help.md).
