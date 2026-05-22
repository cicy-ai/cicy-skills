# agent-desktop

> Source-only Node.js, 262 LOC. Read [`bin/agent-desktop`](./bin/agent-desktop).
> Requires Node **22+** for native WebSocket.

Talks to a connected cicy-desktop (Electron) client through cicy-code's chat
WebSocket. Sends `desktop_event` rpc_call events, awaits the matching
`rpc_result`.

## Install

```bash
cicy-code skill install agent-desktop
```

## Quick usage

```bash
agent-desktop clients                    # list connected clients
agent-desktop ping                       # round-trip via get_system_info
agent-desktop clipboard get
agent-desktop clipboard set 'hello'
agent-desktop screenshot                 # → base64 PNG (also written to clipboard)
agent-desktop exec 'uname -a'
agent-desktop windows                    # system window list (JSON)
agent-desktop sysinfo                    # OS / hw summary (JSON)
agent-desktop rpc <tool_name> '{"json":"args"}'
agent-desktop --client mcp-1 ...
```

## Auth

Reads `~/cicy-ai/global.json` `api_token` (mode 0600). Override via
`CICY_API_TOKEN` env. cicy-code must be running locally.

## License

MIT
