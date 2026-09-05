---
name: tg-matrix
description: Open, focus, or check the Telegram 矩阵 panel on cicy-desktop machines over the fleet control socket; each machine's panel tab is discovered at runtime, never by a hard-coded id.
---

# TG Matrix Panel

Open (or focus) the **Telegram 矩阵** panel on one or more cicy-desktop
machines, or check whether it is already open. Commands reach each machine's
Electron **main process** over the same realtime control socket `wsd` uses
(config `~/cicy-ai/db/desktop-ctrl.json`), so this works on the whole fleet —
not only on hosts a local `cicy-code` / CDP endpoint can see.

## Scope

Use this skill when the task is to **open, bring to the foreground, or verify**
the Telegram 矩阵 panel tab on cicy-desktop machines addressed by name
(`xs-1001`, a comma list, or `all`). For driving the panel's contents —
profiles, cells, login, screenshots — use `telegram-matrix` / `tg-login`.

## Why nothing is hard-coded

The panel lives in profile 0's tab window as a
`cicyui://panel/<id>?preset=telegram-matrix` tab. **That tab's webContentsId
differs on every machine and changes over time.** Every command therefore
discovers the panel at runtime by matching `preset=telegram-matrix` in the
live tab list and acts on the id it finds; a newly created panel is given a
runtime-unique URL. No tab id or webContentsId is ever written into the skill.

## Quick start

```sh
tg-matrix ls                 # machines currently connected
tg-matrix open xs-1001       # open or focus the panel on one machine
tg-matrix open all           # …on every connected machine
tg-matrix status xs-1001     # is the panel open / in the foreground?
tg-matrix open xs-1001 --json
```

## Commands

| command | does |
|---|---|
| `ls` | List machines currently connected to the control socket |
| `open <target>` | Focus the panel; create it (new `cicyui://panel` tab) if absent. Idempotent |
| `status <target>` | Report whether the panel is open and whether it is the foreground tab |

`<target>` is a machine name, a comma list, or `all`. Add `--json` for
machine-readable output. Exit codes: 0 ok · 2 usage · 4 transport/main-process error.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
