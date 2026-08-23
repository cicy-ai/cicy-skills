# TG Web Mirror Hook Help

```sh
tg-web-mirror-hook status [--client ID] [--target wc:ID] [--json]
tg-web-mirror-hook install [--client ID] [--target wc:ID] [--version X.Y.Z] [--json]
tg-web-mirror-hook verify [--client ID] [--target wc:ID] [--version X.Y.Z] [--json]
```

- `status` reads cache and runtime state.
- `install` writes or upgrades the cache, reloads only after a change, then verifies.
- `verify` is read-only and exits `2` when the requested version is not active.
- `--client` is forwarded to `agent-electron --client`.
- `--target` accepts a window id or `wc:<webContentsId>` and is required when discovery is ambiguous.
- `--json` emits one-line JSON.

A successful first install reports `changed: true` and `verified: true`; a second reports `changed: false`. Bundle, anchor, or marker invariant failures do not write. Refresh Telegram to obtain a new bundle before retrying; never weaken uniqueness checks.
