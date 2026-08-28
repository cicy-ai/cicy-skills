# telegram-matrix — tools

## Transport

| subcommand | what it calls |
|---|---|
| `open` | `agent-electron webcontents` → find `preset=telegram-matrix`; else `agent-desktop rpc electron_tab_open {accountIdx:0, url:cicyui://panel/<id>?preset=telegram-matrix, trusted:true}` |
| `profiles / add-profile / remove-profile / set-proxy / probe-ip / states / agents` | `agent-electron cdp tab:<panel> Runtime.evaluate` → `window.panelAPI.<fn>(...)` |
| `select` | clicks `.row[data-id=<idx>]` in the panel page; the main process creates the BrowserView `telegram-preview-<idx>` |
| `cell / eval / url / snapshot / screenshot / cdp / reload` | resolve the cell by `profileId == idx && url ~ telegram.org` in `agent-electron webcontents`, then `agent-electron cdp/url/snapshot/screenshot tab:<wc>` |

## Requirements

- `agent-electron` and `agent-desktop` (public skills) on PATH; a cicy-desktop host connected to this cicy-code.
- No secrets of its own: the desktop token comes from `~/cicy-ai/global.json` via those skills.
