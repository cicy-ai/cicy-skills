# telegram-matrix — help

## Commands

```
  telegram-matrix open
  telegram-matrix close
  telegram-matrix profiles --json
  telegram-matrix add-profile
  telegram-matrix remove-profile 3 --yes
  telegram-matrix set-proxy 2 http://127.0.0.1:20002
  telegram-matrix probe-ip 2
  telegram-matrix states --json
  telegram-matrix agents --json
  telegram-matrix select 2
  telegram-matrix reload 2
  telegram-matrix cell 2
  telegram-matrix eval 2 "document.title"
  telegram-matrix url 2 https://web.telegram.org/k/#@durov
  telegram-matrix snapshot 2
  telegram-matrix screenshot 2 --out shot.png
  telegram-matrix cdp 2 Page.reload "{}"
  telegram-matrix panel-eval "window.panelAPI.profiles()"

  telegram-matrix --client <client_id> ...
  telegram-matrix --json
  telegram-matrix --help
```

## Notes

- `accountIdx` = profile id = Electron session `persist:sandbox-<N>`; the same number `agent-electron` uses.
- The panel tab lives in profile 0's tab window (`cicyui://panel/...?preset=telegram-matrix`); `open` reuses an existing one.
- Cells stay alive in the background once opened; `select` only switches the preview.
- Never print or export a profile's auth keys / session storage. Screenshots need explicit user permission — prefer `snapshot`.
- Exit codes: 0 ok · 2 usage · 3 confirmation required (`--yes`) · 4 transport/page error.

## New in 0.2.0

### set-login <idx> <phone> [codeUrl]
Store the profile's phone number and 接码 (code-relay) URL — the panel list and
its 接码 button both read these fields.

### open-code <idx> [url]
Open the profile's 接码 page in **its own** window. The panel's native 接码
button reuses an existing tab **without navigating it**, so after the profile's
codeUrl changes (a replacement card) that tab still shows the previous card's
page and its stale error. This command compares the tab's URL and navigates it
when they differ.

### reset <idx> --yes
Clear the cell's localStorage / sessionStorage / IndexedDB, then reload, so the
page returns to the phone (or QR) login screen. `reload` cannot do this:
Telegram Web K keeps an unfinished login in localStorage, so a cell stuck on
"enter the code" reloads straight back onto the code step with no way to change
the number. This **destroys any Telegram login on that profile**, hence `--yes`.

### batch [on|off]
Report (no argument) or set the panel's 批量登录 grid. A bare `batch` is
read-only — asking what the mode is should not flip the user's grid.

### add-profile fix
Now clicks the panel's own "+ 添加 Profile" button. Only that handler re-renders
the profile list; calling `panelAPI.addProfile` directly creates the profile but
leaves the list stale, so the new profile has no row and `select` cannot find it.
