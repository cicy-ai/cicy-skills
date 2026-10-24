# TG Web Mirror Hook Help

```sh
tg-web-mirror-hook host-install [--client ID | --host M] [--json]
tg-web-mirror-hook status [--client ID | --host M] [--target wc:ID] [--json]
tg-web-mirror-hook install [--client ID | --host M] [--target wc:ID] [--version X.Y.Z] [--json]
tg-web-mirror-hook verify [--client ID | --host M] [--target wc:ID] [--version X.Y.Z] [--json]
```

- `host-install` saves the bundled readable hook to `~/cicy-ai/electron/extension/inject/telegram.org.js` (cicy-desktop's domain-inject directory; the old `~/data/electron` location is no longer read). Local Desktops go through `agent-desktop`; fleet machines use `--host`.
- `status` reads cache and runtime state.
- `install` writes or upgrades the cache, reloads only after a change, then verifies.
- `verify` is read-only and exits `2` when the requested version is not active.
- `--client` is forwarded to `agent-electron --client` (locally connected Desktop).
- `--host` is fleet mode: a machine id (`xs-3006`), a comma list, or `all`, executed in the target's Electron main process via the control plane in `~/cicy-ai/db/desktop-ctrl.json`. `status/install/verify` act on every Telegram Web K webContents (matrix cells) of the machine; `--target wc:ID` narrows to one cell.
- `--target` accepts a window id or `wc:<webContentsId>` and is required when local discovery is ambiguous.
- `--json` emits one-line JSON.

A successful first install reports `changed: true` and `verified: true`; a second reports `changed: false`. Bundle, anchor, or marker invariant failures do not write. Refresh Telegram to obtain a new bundle before retrying; never weaken uniqueness checks.

Matrix-panel cells are BrowserViews and do not run the domain-inject script, so `host-install` only covers Telegram opened in BrowserWindow tabs; use `install --host` for matrix machines.
