# facebook-matrix — help

## Commands

```
  facebook-matrix open
  facebook-matrix close
  facebook-matrix profiles --json
  facebook-matrix add-profile
  facebook-matrix remove-profile 3 --yes
  facebook-matrix set-proxy 2 http://127.0.0.1:20002
  facebook-matrix probe-ip 2
  facebook-matrix states --json
  facebook-matrix agents --json
  facebook-matrix select 2
  facebook-matrix reload 2
  facebook-matrix cell 2
  facebook-matrix eval 2 "document.title"
  facebook-matrix url 2 https://web.facebook.com/k/#@durov
  facebook-matrix snapshot 2
  facebook-matrix screenshot 2 --out shot.png
  facebook-matrix cdp 2 Page.reload "{}"
  facebook-matrix panel-eval "window.panelAPI.profiles()"

  facebook-matrix --client <client_id> ...
  facebook-matrix --json
  facebook-matrix --help
```

## Notes

- `accountIdx` = profile id = Electron session `persist:sandbox-<N>`; the same number `agent-electron` uses.
- The panel tab lives in profile 0's tab window (`cicyui://panel/...?preset=facebook-matrix`); `open` reuses an existing one.
- Cells stay alive in the background once opened; `select` only switches the preview.
- Never print or export a profile's auth keys / session storage. Screenshots need explicit user permission — prefer `snapshot`.
- Exit codes: 0 ok · 2 usage · 3 confirmation required (`--yes`) · 4 transport/page error.
