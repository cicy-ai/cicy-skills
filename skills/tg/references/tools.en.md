# tg — tools

## Wire protocol

```
POST http://127.0.0.1:$CICY_API_PORT/api/tg/send
  Authorization: Bearer <api_token>
  Content-Type: application/json
  { "text": "..." }

POST .../api/tg/photo
  { "photo": "<url>", "caption": "..." }

→ Telegram bot api response: { ok: true, result: ... }
                            or { ok: false, description: "...", error_code: 400 }
```

The wrapper prints `✓ Sent.` on `ok: true`, `✗ <description>` on
`ok: false`. With `--json` it returns the raw response wrapped in
`{ ok: true, data: ... }` / `{ ok: false, error: ... }`.

## Configuration

| path                    | mode | secret_fields  |
|-------------------------|------|----------------|
| `~/cicy-ai/global.json` | 0600 | `api_token`    |

Telegram bot token / chat_id are **not** here — they're in cicy-code's own
server-side config.
