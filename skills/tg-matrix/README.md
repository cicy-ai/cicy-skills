# tg-matrix

Open / focus / check the **Telegram 矩阵** panel on cicy-desktop machines,
across the whole fleet, over the same realtime control socket `wsd` uses.

```sh
tg-matrix ls
tg-matrix open xs-1001
tg-matrix open all
tg-matrix status xs-1001
```

- **No hard-coded ids.** Each machine's panel tab (`preset=telegram-matrix`)
  has a different, changing webContentsId; every command discovers it at
  runtime and a new panel gets a runtime-unique URL.
- Zero runtime deps, Node 18+.
- Config: `{base, token}` in `~/cicy-ai/db/desktop-ctrl.json`
  (override with `CICY_DESKTOP_CTRL`).

For driving what's *inside* the panel (profiles, cells, login, screenshots),
use the `telegram-matrix` and `tg-login` skills.
