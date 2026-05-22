# gpt-chat — tools

## Wire protocol

```
POST http://127.0.0.1:$CICY_API_PORT/api/ai/chat
  Authorization: Bearer <api_token>
  Content-Type: application/json

  { "messages": [
      { "role": "system",    "content": "..." },   // optional, from system file
      { "role": "user",      "content": "..." },   // history turns
      { "role": "assistant", "content": "..." },
      ...
      { "role": "user",      "content": "<this call>" }
  ] }

→ { "result": "..." }
```

After the call:
1. append `{ user, assistant }` to history JSON
2. system prompt is **never** persisted in history JSON (lives only in `gpt-chat-system.txt`)

## Files touched

| op    | path                                        | mode |
|-------|---------------------------------------------|------|
| read  | `~/cicy-ai/global.json`                     | 0600 |
| read  | `~/Private/data/gpt-chat-history.json`      | —    |
| write | `~/Private/data/gpt-chat-history.json`      | 0644 |
| read  | `~/Private/data/gpt-chat-system.txt`        | —    |
| write | `~/Private/data/gpt-chat-system.txt`        | 0644 |

## Configuration

| path                    | mode | secret_fields  |
|-------------------------|------|----------------|
| `~/cicy-ai/global.json` | 0600 | `api_token`    |

## Exit codes

See [help.md](./help.md).
