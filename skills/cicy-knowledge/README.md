# Cicy Knowledge

CLI for the team's **Layer 2 knowledge store** — a server-side, cross-agent,
durable knowledge base in cicy-code (survives worker deletion). Wraps
`/api/knowledge`. Status machine: `pending → canon | rejected | superseded`.

## Install

Installed from the public registry (`skills.cicy-ai.com`) into
`~/cicy-ai/skills/cicy-knowledge/`. For local development:

```sh
cicy-code skill dev /home/cicy/projects/cicy-skills/skills/cicy-knowledge
```

## Quick usage

```bash
cicy-knowledge add "Deploy runbook" --body "dev.py --quick --preview" --tags "deploy ops"
cicy-knowledge list --status pending          # what's awaiting review
cicy-knowledge promote <id>                   # 知识专员: pending → canon
cicy-knowledge recall deploy                  # keyword/tag recall over canon (no RAG)
cicy-knowledge get <id>                        # full entry
cicy-knowledge reject <id>                     # not kept
cicy-knowledge supersede <oldId> <newId>       # replace an outdated entry
```

## Auth

Reads `api_token` from `~/cicy-ai/global.json` (or `CICY_API_TOKEN`); talks to
`http://127.0.0.1:${CICY_API_PORT:-8008}`. `X_AGENT_SHORT_ID` (set inside cicy
panes) is recorded as the source / reviewing pane.

See [references/help.md](./references/help.md) for the full command reference.

## License

MIT
