# agent-desktop — tools

> **Static snapshot.** For the live, authoritative tool set on a connected
> client, run `agent-desktop tools` (queries the `list_tools` meta-tool;
> `--schema` / `--names` / `--tag <Tag>` / `--json`). This doc is the offline
> fallback and may lag the actual ~100+ tools.

## Wire protocol

```
1. Open WS: ws://127.0.0.1:$CICY_API_PORT/api/chat/ws?agent_id=...&token=...
2. POST /api/chat/push:
     { agent_id, client_id, type:'desktop_event',
       data:{ type:'rpc_call', tool, args, requestId } }
3. Await WS message:
     msg.type === 'rpc_result' && msg.data.requestId === requestId
4. Result is msg.data.result; error is msg.data.error.
```

## Subcommand → electronRPC tool

| subcmd          | tool                                |
|-----------------|-------------------------------------|
| `ping`          | `get_system_info` (any responsive call) |
| `exec`          | `exec_shell`                        |
| `exec-file`     | `exec_shell_file` / `exec_python_file` / `exec_node_file` (by ext, content upload) |
| `sysinfo`       | `get_system_info` + `exec_shell` gap fill (os_version, disk on darwin) |
| `rpc <tool>`    | `<tool>` (passthrough)              |
| `clients`       | (no rpc — GET `/api/chat/clients`)  |

## Configuration

| path                       | mode | secret_fields  |
|----------------------------|------|----------------|
| `~/cicy-ai/global.json`    | 0600 | `api_token`    |

## Targeting

- explicit: `--client <client_id>`
- implicit: single connected client whose UA contains `ElectronMCP`

## Examples

```bash
agent-desktop rpc clipboard_read_text '{}' --json
agent-desktop rpc exec_shell '{"command":"ls -la"}'
```
