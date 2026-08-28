# telegram-matrix — 工具说明

## 传输方式

| subcommand | what it calls |
|---|---|
| `open` | `agent-electron webcontents` → find `preset=telegram-matrix`; else `agent-desktop rpc electron_tab_open {accountIdx:0, url:cicyui://panel/<id>?preset=telegram-matrix, trusted:true}` |
| `profiles / add-profile / remove-profile / set-proxy / set-note / probe-ip / states / agents` | `agent-electron cdp tab:<panel> Runtime.evaluate` → `window.panelAPI.<fn>(...)` |
| `select` | clicks `.row[data-id=<idx>]` in the panel page; the main process creates the BrowserView `telegram-preview-<idx>` |
| `cell / eval / url / snapshot / screenshot / cdp / reload` | resolve the cell by `profileId == idx && url ~ telegram.org` in `agent-electron webcontents`, then `agent-electron cdp/url/snapshot/screenshot tab:<wc>` |

## 依赖

- PATH 上有 `agent-electron`、`agent-desktop`（公共 skill），且有一台 cicy-desktop 连到本 cicy-code。
- 本 skill 不保存任何密钥，桌面端 token 由上述 skill 从 `~/cicy-ai/global.json` 读取。
