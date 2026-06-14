# agent-desktop — help

## Commands

```
agent-desktop clients [--json]
agent-desktop ping [--client ID] [--json]
agent-desktop exec <shell_cmd> [--client ID] [--json]
agent-desktop exec-file <local_script> [--cwd DIR] [--client ID] [--json]
agent-desktop sysinfo [--client ID] [--json]
agent-desktop device-info [--client ID] [--json]   # deviceId + egress IP + IP region + system language
agent-desktop rpc <tool> [json_args] [--client ID] [--json]
agent-desktop --help / -h / help
agent-desktop tools [--schema] [--names] [--tag <Tag>] [--static] [--client ID] [--json]
```

`exec-file` reads a **local** script, uploads its content to the desktop and
executes it there (desktop saves to a temp file). Runner by extension:
`.py` → `exec_python_file`, `.js`/`.mjs`/`.cjs` → `exec_node_file`, anything
else → `exec_shell_file` (bash; `.bat` on Windows).

`sysinfo` returns platform, arch, **os_version**, hostname, uptime, cpu
(model/cores/usage), memory, loadavg, **disk** (total/used/available/use%)
and network IPs. The desktop's `get_system_info` lacks os_version everywhere
and disk outside Linux, so `sysinfo` fills those via one extra `exec_shell`
(`sw_vers`/`os-release` + `df -h /`) — best-effort, works on deployed clients.

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
