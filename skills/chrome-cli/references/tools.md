# chrome-cli — local architecture

```text
chrome-cli
  ├─ read/write ~/cicy-ai/db/chrome.json (0600)
  ├─ spawn local Chrome/Chromium
  └─ HTTP + WebSocket → 127.0.0.1:(11000 + profile ID) → Chrome CDP
```

There is no cicy-code chat push, Desktop connection, `desktop_event`,
Electron RPC, or `--client`. Browser-level CDP domains (`Browser`, `Target`,
`SystemInfo`) use `/json/version`; page-level methods use the first page target
unless `--target` specifies another target ID.

Profile writes are atomic. The default config key is `profile_N`; `accountIdx`
and profile ID both mean `N`. Proxy supports legacy strings and
`{ "url": "...", "enabled": true }` objects.
