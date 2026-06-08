# cicy-team — command reference

```
cicy-team roles                       List roles in the bundled library (name, agent_type, model)
cicy-team spawn-role <role> [opts]    Create a one-shot gateway worker for <role>, optionally dispatch a task
cicy-team --help | help               This help
```

## spawn-role options

| flag | default | meaning |
|------|---------|---------|
| `--model M` | role frontmatter `model` | gateway model for the worker |
| `--title T` | `<role>` | pane title |
| `--master w-x` | `$X_AGENT_SHORT_ID` or `w-1001` | master pane to bind under |
| `--task "..."` | — | dispatch this self-contained task (context + task + acceptance criteria) to the new worker via `cicy-agent` |
| `--no-callback` | (callback on) | dispatch without `--callback` |

## What spawn-role does

1. read `roles/<role>/SKILL.md` frontmatter → `agent_type`, `model`
2. `POST /api/panes/create` `{agent_type, default_model, role:"worker", use_custom_gateway:true, master_pane_id, title}` → `{session}`
3. write `~/cicy-ai/workers/<session>/CLAUDE.md` (claude) or `AGENTS.md` (codex/opencode) = base preamble + role charter
4. if `--task`: `cicy-agent msg <session> "<task>" [--callback]`

## Exit codes

| code | meaning |
|------|---------|
| 0 | success |
| 1 | generic / dispatch failed |
| 2 | bad arguments / unknown role |
| 3 | missing api_token |
| 4 | create API error / server unreachable |
