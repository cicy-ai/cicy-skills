# chrome-cli — local architecture

The CLI reads/writes `~/cicy-ai/db/chrome.json`, starts local Chrome/Chromium,
and connects directly to loopback CDP using HTTP and WebSocket. It has no
cicy-code, cicy-desktop, Electron RPC, or `--client` dependency.

`accountIdx` and profile ID are the same `N` in `profile_N`. Browser-level CDP
domains use the browser endpoint; page-level calls use the first page or
`--target <targetId>`.
