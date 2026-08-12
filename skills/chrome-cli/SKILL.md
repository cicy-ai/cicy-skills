---
name: chrome-cli
description: Manage local native Chrome profiles and CDP directly on macOS or Linux without cicy-desktop or Electron RPC. Use agent-chrome instead for remote Chrome on a connected cicy-desktop client.
---

# Chrome CLI

Use `chrome-cli` for Chrome running on the same native macOS or Linux host as
the agent. It starts local Chrome processes and talks directly to their loopback
CDP ports. It does not use cicy-code, cicy-desktop, Electron RPC, or a desktop
client connection.

Use `agent-chrome` instead when Chrome lives on a remote machine connected as a
cicy-desktop client. `agent-chrome` sends `desktop_event/rpc_call` requests to
that Electron client.

## Rules

1. `accountIdx` and profile ID are the same numeric ID: `3`, `chrome-3`, and `profile_3` identify one profile.
2. Store profiles in `~/cicy-ai/db/chrome.json`; store browser data in `~/chrome/profile_N` by default.
3. Bind CDP to `127.0.0.1`; default port is `11000 + profile ID`.
4. Apply proxy changes on the next launch.
5. Do not use this Skill for Windows or remote Desktop clients; use `agent-chrome` there.

## Quick start

```sh
chrome-cli profiles
chrome-cli add --id 1
chrome-cli launch 1 --url https://example.com
chrome-cli targets --idx 1
chrome-cli cdp Runtime.evaluate '{"expression":"document.title","returnByValue":true}' --idx 1
chrome-cli close 1
```

Read [help.md](./references/help.md) for commands and [tools.md](./references/tools.md) for storage, environment variables, and CDP behavior.
