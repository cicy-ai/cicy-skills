# cicy-team — endpoints & environment

## cicy-code API used

| method | path | purpose |
|--------|------|---------|
| POST | `/api/panes/create` | create a worker pane (agent_type, default_model, role, use_custom_gateway, master_pane_id, title); returns `{session, pane_id}` |

Auth: `Authorization: Bearer <api_token>`.

The new worker, being `use_custom_gateway=true`, routes through the local AI
gateway — its traffic is audited (`http_log`) and its `CLAUDE.md`/`AGENTS.md`
are injected into every request's system prompt.

## External commands

| command | when | purpose |
|---------|------|---------|
| `cicy-agent msg <pane> "<text>" [--callback]` | only with `--task` | deliver the task to the new worker; `--callback` notifies the master when it finishes |

## Environment

| var | default | meaning |
|-----|---------|---------|
| `CICY_API_PORT` | `8008` | cicy-code server port |
| `CICY_API_TOKEN` | (from `~/cicy-ai/global.json` `.api_token`) | bearer token |
| `CICY_GLOBAL_JSON` | `~/cicy-ai/global.json` | global config path |
| `CICY_ROLES_DIR` | `<skill>/roles` | role library location |
| `X_AGENT_SHORT_ID` | — | set inside a pane; default master for `--master` and the callback target |

## Role library (bundled)

`roles/<role>/SKILL.md` — frontmatter (`role`, `agent_type`, `model`,
`independent_from`, `ephemeral`) + charter body. `roles/_base.md` — worker
preamble template. See `roles/README.md`.
