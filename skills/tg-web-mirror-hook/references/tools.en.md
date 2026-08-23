# Tools and Boundaries

- Sole external driver: `agent-electron`.
- Discovery: `agent-electron webcontents --json`.
- Page execution: `agent-electron cdp <target> Runtime.evaluate <params>`.
- Reload: `agent-electron cdp <target> Page.reload <params>`, only after a cache change.
- Address webContents as `wc:<id>` to avoid numeric BrowserWindow collisions.
- Do not use `agent-desktop`, screenshots, or direct edits to the remote Mac extension file.

`lib/patch.js` owns pure source transformation, `lib/expressions.js` builds Cache Storage CDP expressions, and `bin/tg-web-mirror-hook` owns discovery, orchestration, and verification.
