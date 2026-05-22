# agent-webpage

> Source-only Node.js, 271 LOC. Read [`bin/agent-webpage`](./bin/agent-webpage).
> Requires Node **22+** for native WebSocket.

Talks to the live webpage client over cicy-code's chat WebSocket. Sends
events via POST `/api/chat/push`, awaits the matching reply on
`/api/chat/ws` (matched by `data.requestId`).

## Install

```bash
cicy-code skill install agent-webpage
```

## Quick usage

```bash
agent-webpage clients                            # connected clients per agent (JSON)
agent-webpage ping                               # round-trip to auto-selected client
agent-webpage ping web-abc123                    # specific client
agent-webpage ipc-ping web-abc123                # ping desktop-side IPC bridge
agent-webpage exec-js 'document.title' web-abc123
agent-webpage exec-js 'JSON.stringify(performance.timing)' web-abc123
agent-webpage send custom_event '{"foo":1}' web-abc123 custom_event_reply
```

## Auth

Reads `~/cicy-ai/global.json` `api_token` (mode 0600). Override via
`CICY_API_TOKEN` env. cicy-code must be running locally.

## License

MIT
