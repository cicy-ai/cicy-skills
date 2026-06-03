---
name: agent-chrome
description: Control system Chrome on a connected cicy-desktop host with per-profile proxy support. CDP + ~/cicy-ai/db/chrome.json multi-profile via desktop_event RPC.
---

# Agent Chrome

This skill drives system-installed Google Chrome (or Chromium) on a
connected cicy-desktop host via the Chrome DevTools Protocol. Each profile
gets a dedicated `user-data-dir` and its own proxy.

Rides on the same `desktop_event` / `rpc_call` channel as `agent-desktop`,
but the work happens inside Chrome rather than Electron-main.

## Scope

Use this skill when the task involves:

- listing / adding / configuring Chrome profiles (each with its own proxy)
- spawning Chrome for a specific profile (with that profile's proxy applied)
- inspecting open page targets across profiles
- making raw CDP calls (`Page.navigate`, `Runtime.evaluate`, `Input.dispatchMouseEvent`, …)
- listing the gmail / github identities the host's Chrome profiles are signed into
- recording which accounts a profile holds (`accounts` tags) + a free-form `note`, and filtering by service (`profiles --with github`)
- checking a profile's egress IP + country (`ip <idx>`) to verify its proxy

## Rules

1. Each profile maps to `~/cicy-ai/db/chrome.json` on the cicy-desktop host, keyed by `account_<N>`. The CLI accepts the numeric `accountIdx` (the `<N>`).
2. Per-profile proxy: `agent-chrome proxy <idx> <url>` writes the proxy into chrome.json. The next `launch` picks it up via `--proxy-server=<url>`. Pass `""` to clear. **The proxy URL must point to a port that is actually listening** — Chrome refuses creds in URLs and fails silently on ECONNREFUSED. The intended pairing is with cicy-mihomo's per-profile listeners (one listener per Chrome profile, routed by IN-NAME). See [proxy.md](./references/proxy.md) for the full topology, setup flow, and known pitfalls.
3. `launch` resolves system Chrome (Mac: `/Applications/Google Chrome.app`, Windows: `%PROGRAMFILES%\Google\Chrome\Application\chrome.exe`, Linux: `google-chrome / chromium`). On missing binary it errors with "Chrome/Chromium binary not found" — the user must install Chrome / Chromium first.
4. Default profile layout: user-data-dir `~/chrome/account_<N>`, debugger port `11000 + N` (or chrome.json override). Profiles run concurrently with independent state.
5. `--client <client_id>` targets a specific cicy-desktop client. With no flag, auto-selects the single `ElectronMCP` client (refuses to guess if multiple are connected).

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
