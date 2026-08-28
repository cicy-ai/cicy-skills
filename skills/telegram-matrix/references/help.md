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
