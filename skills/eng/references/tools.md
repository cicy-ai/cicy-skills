# eng — tools

## What it does

Single endpoint: POST `/api/ai/correct` with `{ text }`. cicy-code runs
the configured LLM (server-side decision) and returns
`{ result: "<corrected text>" }`.

## Wire protocol

```
POST http://127.0.0.1:$CICY_API_PORT/api/ai/correct
  Authorization: Bearer <api_token>
  Content-Type: application/json

  { "text": "..." }

→ { "result": "..." }
```

## Configuration

| path                    | mode | secret_fields  |
|-------------------------|------|----------------|
| `~/cicy-ai/global.json` | 0600 | `api_token`    |

## JSON output

`eng --json "she dont know"`:
```json
{ "ok": true, "data": { "result": "She doesn't know.", "input": "she dont know" } }
```
