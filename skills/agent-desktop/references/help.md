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
agent-desktop tools [--schema] [--names] [--tag <Tag>] [--static] [--client ID] [--json]
```

`tools` queries the connected cicy-desktop **live** via the `list_tools`
meta-tool (name/description/tag; `--schema` adds each inputSchema, `--names`
returns just names, `--tag` filters by tag). It falls back to the bundled
static `references/tools.md` when no client is connected or the client predates
`list_tools` — or force the static doc with `--static`.

## Options

- `--client <client_id>` — target a specific cicy-desktop client. With no flag, auto-selects the single client whose UA contains `ElectronMCP`.

## Environment

- `CICY_API_TOKEN`        — bearer token override
- `CICY_API_PORT`         — server port (default 8008)
- `CICY_PANE_ID`          — default agent pane
- `CICY_GLOBAL_JSON`      — global.json path override
- `CICY_AGENT_TIMEOUT_MS` — RPC timeout (default 30000)
