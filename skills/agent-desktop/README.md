# agent-desktop

> Source-only Node.js, 324 LOC. Read [`bin/agent-desktop`](./bin/agent-desktop).
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
agent-desktop exec 'uname -a'
agent-desktop exec-file ./setup.sh       # upload local script, run on desktop (.py/.js auto-detected)
agent-desktop sysinfo                    # platform/arch/os version/cpu/mem/disk (JSON)
agent-desktop rpc <tool_name> '{"json":"args"}'
agent-desktop --client mcp-1 ...
```

## Auth

Reads `~/cicy-ai/global.json` `api_token` (mode 0600). Override via
`CICY_API_TOKEN` env. cicy-code must be running locally.

## License

MIT
