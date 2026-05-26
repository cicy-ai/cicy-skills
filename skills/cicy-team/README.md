# cicy-team

Team-builder for the cicy-code AI org. The master/architect agent (`w-10001`)
uses it to staff a project with **one-shot, gateway-routed worker agents** drawn
from a bundled **role library**.

`cicy-team spawn-role <role>`:

1. reads `roles/<role>/SKILL.md` frontmatter for `agent_type` + `model`
2. `POST /api/panes/create` (`use_custom_gateway=true`, bound to the master)
3. composes the new worker's `<workspace>/CLAUDE.md` (claude) or `AGENTS.md`
   (codex/opencode) = base preamble + the role charter — so the worker *is*
   that role from its first request (via the gateway's CLAUDE.md/AGENTS.md
   injection)
4. optionally dispatches a task via `cicy-agent msg <new> --callback`

## Usage

```sh
cicy-team roles
cicy-team spawn-role qa --task "context + task + acceptance criteria"
cicy-team spawn-role dev-senior --model gpt-5.5 --task "..."
```

Roles: `dev-senior`, `dev-junior`, `qa`, `reviewer`, `security`, `release`, `ops`.

## Requirements

- A running cicy-code server (default `127.0.0.1:8008`).
- `api_token` in `~/cicy-ai/global.json` (or `CICY_API_TOKEN`).
- `cicy-agent` on PATH (only for `--task` dispatch).

See [SKILL.md](./SKILL.md) for the orchestration playbook and [references/](./references).

License: MIT
