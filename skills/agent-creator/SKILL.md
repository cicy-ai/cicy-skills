---
name: agent-creator
description: Create and manage custom cicy agents (persona + tools + model) via /api/custom-agents on the local cicy-code server. Subcommands: list/create/show/delete/tools.
---

# Agent Creator

Author your own **custom cicy agents** — "build an agent like you build a skill".
A custom agent is a reusable cicy persona: a name, a persona prompt, a tool-group
selection, and a default model. It is stored on the cicy-code host at
`~/cicy-ai/agents/<slug>/AGENT.md` and, once created, shows up as its **own agent
type** (`custom:<slug>`) in the cicy-code "new worker" picker — so you author a
persona once and spin up instances of it on demand.

This CLI is a thin client over cicy-code's `/api/custom-agents`; all state lives
server-side and is hot-read (no restart needed).

## Scope

Use this skill when:

- the user wants to **create / save a reusable agent persona** (e.g. "销售助手",
  "客服小美") rather than a one-off worker,
- you need to **list, inspect, update, or delete** existing custom agents,
- you want to know which **tool groups** a custom agent may select.

Do **not** use it to spawn a normal worker of a built-in type (use the cicy-code
"new worker" UI / `cicy-agent`), or to manage skills (use `cicy-skill-spec`).

## Quick start

```sh
agent-creator tools                      # what tool groups can I pick?
agent-creator create 销售助手 \
  --tools coordinate,shell \
  --model claude-opus-4-8 \
  --prompt "你是销售助手,主动热情,擅长挖掘需求。"
agent-creator list                       # see it
agent-creator show 销售助手               # inspect persona/tools/model
agent-creator delete 销售助手             # remove
```

The persona can also come from a file or stdin:

```sh
agent-creator create 客服小美 --tools coordinate --prompt-file persona.md
cat persona.md | agent-creator create 客服小美 --tools coordinate
```

After creating, open the cicy-code **新建员工** picker — the agent appears as
`★ <name>` (agent_type `custom:<slug>`). Selecting it creates an instance with
that persona, tools and model applied.

## Auth & server

Reads `api_token` from `~/cicy-ai/global.json` (or the `CICY_API_TOKEN` env var)
and talks to `http://127.0.0.1:8008` (override with `CICY_API_PORT`).

## References

- [help.md](./references/help.md) — full command reference
- [tools.md](./references/tools.md) — file layout, env, related commands
