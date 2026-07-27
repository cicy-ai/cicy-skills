# agent-creator — endpoints / env / exit codes

## Backing API (local cicy-code)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/custom-agents` | `{ agents: [...], toolGroups: [...], dir }` |
| POST | `/api/custom-agents` | body `{ name, tools[], model, body }` → create/overwrite |
| DELETE | `/api/custom-agents/<slug>` | delete one |

Each agent is stored on the host at `~/cicy-ai/agents/<slug>/AGENT.md`:

```
---
name: 销售助手
tools: [coordinate, shell]
model: claude-opus-4-8
---
你是销售助手,主动热情,擅长挖掘需求。
```

The file is hot-read by cicy-code — edits/new agents take effect on the next
request, no restart.

## Config / auth

- `config.path`: `~/cicy-ai/global.json` (perms `0600`), secret field `api_token`.
- Resolution: `CICY_API_TOKEN` env var wins; otherwise `api_token` from
  `~/cicy-ai/global.json`.

## Environment

| var | default | meaning |
|-----|---------|---------|
| `CICY_API_TOKEN` | — | bearer token (overrides global.json) |
| `CICY_API_PORT` | `8008` | cicy-code API port |
| `CICY_GLOBAL_JSON` | `~/cicy-ai/global.json` | override config path |

## Exit codes

| code | meaning |
|------|---------|
| 0 | success |
| 1 | request/server error (non-2xx) |
| 2 | usage error / unknown command / missing argument / not found |
| 3 | cannot reach cicy-code, or auth failed / token missing |

## Related

- `cicy-skill-spec` — skill packaging conventions
- `cicy-agent` — operate live panes (spawn/observe running agents)
