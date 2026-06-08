# cicy-agent

> Source-only Node.js, 230 LOC. Read [`bin/cicy-agent`](./bin/cicy-agent).

Operates tmux panes via cicy-code's `/api/tmux/*` REST endpoints.

## Install

```bash
cicy-code skill install cicy-agent
```

## Quick usage

```bash
cicy-agent list                  # all panes (id, agent_type, title, workspace)
cicy-agent ls                    # short variant
cicy-agent tree                  # pane → window hierarchy (JSON)
cicy-agent windows               # tmux window list (JSON)
cicy-agent capture w-1001       # raw pane text
cicy-agent reply w-1001         # last reply (parsed)
cicy-agent reply w-1001 --full  # include tool_use entries

cicy-agent msg w-10002 'hello there'
cicy-agent msg w-10002 'do this' --callback   # notify me when their next turn finishes

cicy-agent send-keys w-1001 'ls -la' Enter
cicy-agent clear w-1001
cicy-agent restart                # restart_all

# remote node
cicy-agent --node prod-box list
```

## Auth

Local: `~/cicy-ai/global.json` `api_token` (mode 0600), or `CICY_API_TOKEN` env.

Remote: entries in `~/cicy-ai/db/cicy-agent.json`:

```json
[
  { "name": "prod-box", "api": "https://prod-box.example.com:8008", "api_token": "..." }
]
```

## License

MIT
