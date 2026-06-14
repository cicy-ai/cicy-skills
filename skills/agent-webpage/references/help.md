# agent-webpage — help

## Commands

```
agent-webpage clients [--json]
agent-webpage ping [client_id] [--json]
agent-webpage ipc-ping [client_id] [--json]
agent-webpage exec-js '<js>' [client_id] [--json]
agent-webpage current-active-agent-id [client_id] [--json]
agent-webpage current-master-agent-id [client_id] [--json]
agent-webpage send <type> '<data_json>' [client_id] [expect_type] [--json]
agent-webpage helper-init [--json]
agent-webpage --help / -h / help
agent-webpage tools
```

## Notes

- `clients` lists every connected webpage/desktop client. For clients running
  inside **cicy-desktop** it also surfaces that machine's `device_id`,
  `public_ip`, `ip_region` (country / region / city), and `system_language`
  (forwarded by the desktop on the chat-WS register; empty for plain browsers).
- target by `client_id`, not `agent_id`
- if omitted, current agent must have exactly one connected client
- response-oriented calls wait for and print the real webpage response
- requires Node 22+ for native WebSocket

## Environment

- `CICY_API_TOKEN`        — bearer token override
- `CICY_API_PORT`         — server port (default 8008)
- `CICY_PANE_ID`          — default agent pane (e.g. `w-1001`)
- `CICY_GLOBAL_JSON`      — global.json path override
- `CICY_AGENT_TIMEOUT_MS` — default RPC timeout (default 15000)
