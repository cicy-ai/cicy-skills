# redroid-matrix — tools

## Transport

| subcommand | what it calls |
|---|---|
| `open` | `agent-electron webcontents` → find `preset=redroid-matrix`; else `agent-desktop rpc electron_tab_open {accountIdx:0, url:cicyui://panel/<id>?preset=redroid-matrix, trusted:true}` |
| everything else | `agent-electron cdp tab:<panel> Runtime.evaluate` → `window.redroidAPI.<fn>(...)` (main-process IPC `redroid:*` → docker/adb in WSL) |
| `tap / swipe / key / text` | `redroidAPI.input(name, {type, ...})` |
| `screenshot --out` | `redroidAPI.screenshot(name)` → data-URL PNG written to the file |

## Requirements

- `agent-electron` and `agent-desktop` (public skills) on PATH; a cicy-desktop host connected to this cicy-code.
- No secrets of its own: the desktop token comes from `~/cicy-ai/global.json` via those skills.
