---
name: tg-login
description: Automate Telegram Web login in cicy-desktop's 矩阵 panel: phone → SMS code (read from a 接码/getcode URL, rate-limit aware) → 2FA, driven over the Electron CDP endpoint.
---

# tg-login

Automate **Telegram Web** login for the accounts in cicy-desktop's
**Telegram 矩阵** panel. Each profile is a separate `persist:sandbox-N`
session with its own proxy; this tool drives that profile's Telegram
BrowserView over the Electron **CDP** endpoint and walks the login:

```
phone number  →  SMS login code  →  (optional) 2FA cloud password
```

The code is delivered to the number's already-logged-in device and surfaced by
a **接码 / getcode** service URL. `tg-login` reads the code from that URL
(respecting its ~1 request/minute rate limit), types it into the right view,
and — if the account has a cloud password — fills the 2FA field.

## Prerequisites

- **cicy-desktop** running with the Telegram 矩阵 panel open and the target
  profile's view loaded (`https://web.telegram.org/k/`).
- CDP reachable at `127.0.0.1:9221` (default on; `CICY_DESKTOP_CDP=0`
  disables it). Override with `TG_CDP_HOST` / `TG_CDP_PORT`.

## Commands

```sh
tg-login code  <codeUrl>                    # read code / time / 2fa from a 接码 URL
tg-login poll  <codeUrl>                     # poll it until a code appears (rate-limit aware)
tg-login parse accounts.txt                  # parse "phone----codeUrl" lines
tg-login targets                             # list open Telegram Web CDP views
tg-login login <phone> <codeUrl> --2fa <pw>  # drive the visible view end to end
tg-login login <phone> <codeUrl> --code 12345 --target <id>
```

Add `--json` to any command for machine-readable output.

## Gotchas baked in

- **Codes expire in minutes.** Don't reuse a code you fetched a while ago —
  `login` polls for a fresh one unless you pass `--code`.
- **接码 rate limit** is ~1 request/minute (`请求过于频繁，请等待 N 秒`);
  `poll`/`login` back off automatically. Don't hammer it.
- **The 2FA page has decoy inputs.** Telegram web-k renders three
  `input[type=password]`: two `.stealthy` autofill traps and one real
  `input.input-field-input`. Filling the wrong one submits an empty password
  with no error. This tool always targets the real input.
- **Controlled inputs need real keystrokes** — synthetic `.click()` /
  `el.value=` are ignored; the tool uses CDP `Input` events.

See [references/help.md](references/help.md) and
[references/tools.md](references/tools.md).
