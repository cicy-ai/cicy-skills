# tg-login — how it works

- **Transport**: a tiny built-in CDP-over-WebSocket client (node `net` +
  `crypto`, zero deps). Targets come from `http://TG_CDP_HOST:TG_CDP_PORT/json`.
- **Target selection**: `--target <id>`, else the first *visible*
  `https://web.telegram.org/k/` page.
- **Form driving**: real CDP `Input` key/mouse events (Telegram inputs ignore
  synthetic events). The 2FA field is `input.input-field-input[type=password]`
  — NOT the two `.stealthy` decoys.
- **Code source**: the 接码/getcode HTML is scraped for `设备验证码`,
  `登录时间`, `2fa/密码`. Rate-limit text pauses polling.

Files: `~/cicy-ai/electron/account-<N>.json` holds each profile's phone/接码
(when set via the panel). This tool does not write them.
