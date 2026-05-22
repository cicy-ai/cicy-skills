# gemini-ask — tools

## Wire protocol

```
1. Open WS: ws://127.0.0.1:$CICY_API_PORT/api/chat/ws?agent_id=<pane>&token=<api_token>
2. POST /api/chat/push:
     { agent_id, type:'desktop_event',
       data:{ type:'gemini_ask', prompt, win_id, requestId } }
3. Await WS message:
     msg.type === 'gemini_ask_result' && msg.data.requestId === requestId
4. Result is msg.data.result; error is msg.data.error.
```

Note: this push is **broadcast to all clients of the agent** (no
`client_id` set), letting the cicy-desktop side pick it up.

## Configuration

| path                    | mode | secret_fields  |
|-------------------------|------|----------------|
| `~/cicy-ai/global.json` | 0600 | `api_token`    |

## Targeting windows

- `win_id` is the cicy-desktop window index showing Gemini (default 4).
- If multiple Gemini windows exist, pass an explicit `win_id`.

## Exit codes

See [help.md](./help.md).
