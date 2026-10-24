# Tools and Boundaries

- Local `host-install` uses `agent-desktop clients`, `rpc exec_shell`, and `rpc file_write`.
- Local cache hook operations use `agent-electron`: discovery `agent-electron webcontents --json`, page execution `agent-electron cdp <target> Runtime.evaluate <params>`, reload `Page.reload` only after a cache change.
- Fleet mode (`--host`) reads `~/cicy-ai/db/desktop-ctrl.json` (override with `CICY_DESKTOP_CTRL`), lists machines with `GET /api/fleet`, and runs code in the target's Electron main process with `POST /api/rpc`; page expressions run through `webContents.executeJavaScript`, reloads through `webContents.reload()`.
- Address webContents as `wc:<id>` to avoid numeric BrowserWindow collisions.
- Never take screenshots. Only the fixed `~/cicy-ai/electron/extension/inject/telegram.org.js` injection path is written.

`lib/patch.js` owns pure source transformation, `lib/expressions.js` builds Cache Storage expressions (shared by CDP and executeJavaScript), and `bin/tg-web-mirror-hook` owns discovery, orchestration, and verification.
