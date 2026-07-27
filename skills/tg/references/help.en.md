# tg — help

## Commands

```
tg send <message>            Send a plain text message
tg photo <url> [caption]     Send a photo by URL, optional caption
tg --json ...                JSON output mode
tg --help / -h / help
```

## Environment

- `CICY_API_TOKEN`   — bearer token override
- `CICY_API_PORT`    — server port (default 8008)
- `CICY_GLOBAL_JSON` — global.json path override

## Server-side config

Bot token + chat id are kept in cicy-code's own config (not in
`global.json`). If sending fails with auth/chat errors, fix cicy-code.
