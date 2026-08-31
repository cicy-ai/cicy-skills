---
name: telegram-matrix
description: Use when controlling the cicy-desktop Telegram 矩阵 panel: manage Telegram profiles (add/remove/proxy/IP probe) and drive each profile's Telegram Web view (select, reload, eval, snapshot, CDP).
---

# Telegram Matrix

Drive the cicy-desktop **Telegram 矩阵** panel from an agent. The panel is a
`cicyui://panel/…?preset=telegram-matrix` tab in the host's profile-0 tab window; this
skill opens it, then calls the page's bridge API through CDP via the public
`agent-electron` / `agent-desktop` skills — so every button in the panel has a
command here, and every profile / device / webview can be addressed by id.

## Scope

Use this skill when the task mentions the Telegram 矩阵 panel, or needs to
manage what it manages (Telegram profiles and their Telegram Web sessions).
Do not use it for the host's system Chrome (`agent-chrome`) or for generic
Electron windows (`agent-electron`).

## Quick start

```sh
telegram-matrix open
telegram-matrix profiles --json
telegram-matrix --help
```

## Commands

| command | example | does |
|---|---|---|
| `open` | `telegram-matrix open` | Open (or find) the Telegram 矩阵 panel tab in profile 0; prints its webContentsId |
| `close` | `telegram-matrix close` | Close the panel tab |
| `profiles` | `telegram-matrix profiles --json` | List profiles: accountIdx, name, proxy, Telegram @username, last egress IP |
| `add-profile` | `telegram-matrix add-profile` | Create the next profile (persist:sandbox-N) with the default proxy |
| `remove-profile` | `telegram-matrix remove-profile 3 --yes` | Delete a profile and its session data — irreversible, needs --yes |
| `set-proxy` | `telegram-matrix set-proxy 2 http://127.0.0.1:20002` | Set (or clear with "") the proxy of a profile; an open cell reloads |
| `set-login` | `telegram-matrix set-login 2 +8801709299917 https://jiema…/getcode?id=…` | Set the profile's phone + 接码 URL (both show in the panel list) |
| `open-code` | `telegram-matrix open-code 2` | Open the profile's 接码 page in **its own** window; force-navigates a reused tab |
| `probe-ip` | `telegram-matrix probe-ip 2` | Egress IP + region through the profile's proxy |
| `states` | `telegram-matrix states --json` | Load state of every open cell (loaded / failed + error) |
| `agents` | `telegram-matrix agents --json` | Per-cell helper agents known to the panel |
| `cells` | `telegram-matrix cells --json` | Map every open profile to its Telegram Web webContentsId + load state |
| `select` | `telegram-matrix select 2` | Open the profile in the panel preview (creates its Telegram Web cell) |
| `reload` | `telegram-matrix reload 2` | Reload the profile's cell (keeps the login state) |
| `reset` | `telegram-matrix reset 2 --yes` | Wipe the cell's web storage + reload → back to the login screen — irreversible, needs --yes |
| `batch` | `telegram-matrix batch on` | Report (no arg) or set the panel's 批量登录 grid |
| `cell` | `telegram-matrix cell 2` | Find (opening if needed) the cell's webContentsId |
| `eval` | `telegram-matrix eval 2 "document.title"` | Run JS inside the profile's Telegram Web page |
| `url` | `telegram-matrix url 2 https://web.telegram.org/k/#@durov` | Navigate the cell |
| `snapshot` | `telegram-matrix snapshot 2` | DOM snapshot of the cell — the default way to inspect state |
| `screenshot` | `telegram-matrix screenshot 2 --out shot.png` | Screenshot the cell (only with explicit user permission) |
| `cdp` | `telegram-matrix cdp 2 Page.reload "{}"` | Raw CDP on the cell |
| `panel-eval` | `telegram-matrix panel-eval "window.panelAPI.profiles()"` | Run JS in the panel page itself |

## Notes

- `accountIdx` = profile id = Electron session `persist:sandbox-<N>`; the same number `agent-electron` uses.
- The panel tab lives in profile 0's tab window (`cicyui://panel/...?preset=telegram-matrix`); `open` reuses an existing one.
- Cells stay alive in the background once opened; `select` only switches the preview.
- **`reload` is not a reset.** Telegram Web K keeps a half-finished login in
  `localStorage`, so reloading a cell stuck on "enter the code" lands right back
  on the code step with no way to change the number. `reset` clears that
  storage (and IndexedDB) so the cell returns to the phone/QR screen — use it
  when a number has to be replaced.
- **`open-code` force-navigates.** The panel reuses the profile's existing 接码
  tab without navigating it, so after `set-login` points at a replacement card
  the tab would still render the old card's page (stale code, stale error).
  `open-code` checks the tab's URL and navigates it when it differs.
- **`add-profile` drives the panel's own button**, because only that handler
  re-renders the profile list. A profile created any other way exists in the
  store but has no row, and `select` cannot reach it until the panel reopens.
- Never print or export a profile's auth keys / session storage. Screenshots need explicit user permission — prefer `snapshot`.
- Exit codes: 0 ok · 2 usage · 3 confirmation required (`--yes`) · 4 transport/page error.

## References

- [help.en.md](./references/help.en.md) / [help.cn.md](./references/help.cn.md) — command reference
- [tools.en.md](./references/tools.en.md) / [tools.cn.md](./references/tools.cn.md) — transport and integration notes
