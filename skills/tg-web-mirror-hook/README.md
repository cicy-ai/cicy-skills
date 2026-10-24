# TG Web Mirror Hook

Public CiCy Skill for installing the Desktop host injection script and safely installing, upgrading, and verifying the Telegram Web K `window.__mirrors` cache hook.

```sh
tg-web-mirror-hook host-install --client <client_id>   # local Desktop
tg-web-mirror-hook host-install --host all              # fleet machines
tg-web-mirror-hook install --host xs-3006               # patch every TG cell on a matrix host
```

Injection path: `~/cicy-ai/electron/extension/inject/telegram.org.js`.
