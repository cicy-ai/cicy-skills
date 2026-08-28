# redroid-matrix — 工具说明

## 传输方式

| subcommand | what it calls |
|---|---|
| `open` | `agent-electron webcontents` → find `preset=redroid-matrix`; else `agent-desktop rpc electron_tab_open {accountIdx:0, url:cicyui://panel/<id>?preset=redroid-matrix, trusted:true}` |
| everything else | `agent-electron cdp tab:<panel> Runtime.evaluate` → `window.redroidAPI.<fn>(...)` (main-process IPC `redroid:*` → docker/adb in WSL) |
| `tap / swipe / key / text` | `redroidAPI.input(name, {type, ...})` |
| `screenshot --out` | `redroidAPI.screenshot(name)` → data-URL PNG written to the file |

## 依赖

- PATH 上有 `agent-electron`、`agent-desktop`（公共 skill），且有一台 cicy-desktop 连到本 cicy-code。
- 本 skill 不保存任何密钥，桌面端 token 由上述 skill 从 `~/cicy-ai/global.json` 读取。
