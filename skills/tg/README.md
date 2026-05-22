# tg

> Source-only Node.js, 92 LOC. Read [`bin/tg`](./bin/tg).

Sends a Telegram message or photo via cicy-code's `/api/tg/*` endpoints.

## Install

```bash
cicy-code skill install tg
```

## Quick usage

```bash
tg send "build finished ✓"
tg photo https://example.com/img.png "screenshot at $(date)"
tg --json send "text"
```

Bot token + chat id are configured server-side in cicy-code, not here.

## Auth

Reads `~/cicy-ai/global.json` `api_token` (mode 0600). Override with
`CICY_API_TOKEN`. cicy-code must be running locally.

## License

MIT
