# Tools and Boundaries

- `host-install` uses `agent-desktop clients`, `rpc exec_shell`, and `rpc file_write`.
- Cache hook operations use `agent-electron`.
- Discovery: `agent-electron webcontents --json`.
- Page execution: `agent-electron cdp <target> Runtime.evaluate <params>`.
- Reload: `agent-electron cdp <target> Page.reload <params>`, only after a cache change.
- Address webContents as `wc:<id>` to avoid numeric BrowserWindow collisions.
- Never take screenshots. Only `host-install` may write the fixed `telegram.org.js` injection path.

`lib/patch.js` owns pure source transformation, `lib/expressions.js` builds Cache Storage CDP expressions, and `bin/tg-web-mirror-hook` owns discovery, orchestration, and verification.
