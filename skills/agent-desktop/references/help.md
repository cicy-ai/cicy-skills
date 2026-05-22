# agent-desktop — help

## Commands

```
agent-desktop clients [--json]
agent-desktop ping [--client ID] [--json]
agent-desktop screenshot [--client ID] [--json]
agent-desktop clipboard get [--client ID] [--json]
agent-desktop clipboard set <text> [--client ID] [--json]
agent-desktop exec <shell_cmd> [--client ID] [--json]
agent-desktop windows [--client ID] [--json]
agent-desktop sysinfo [--client ID] [--json]
agent-desktop rpc <tool> [json_args] [--client ID] [--json]
agent-desktop --help / -h / help
agent-desktop tools
```

## Options

- `--client <client_id>` — target a specific cicy-desktop client. With no flag, auto-selects the single client whose UA contains `ElectronMCP`.

## Environment

- `CICY_API_TOKEN`        — bearer token override
- `CICY_API_PORT`         — server port (default 8008)
- `CICY_PANE_ID`          — default agent pane
- `CICY_GLOBAL_JSON`      — global.json path override
- `CICY_AGENT_TIMEOUT_MS` — RPC timeout (default 30000)

## Exit codes

| code | meaning                              |
|------|--------------------------------------|
| 0    | success                              |
| 1    | generic / WebSocket missing          |
| 2    | invalid arguments / multiple clients |
| 3    | missing config / cicy-code unreachable / no desktop client |
| 4    | api error / rpc error / timeout      |
