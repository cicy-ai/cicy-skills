# cicy-audit-policy

Conversational admin for the cicy AI-traffic **audit policy**.

The cicy audit pipeline scans every AI request/response that flows through the
gateway or MITM proxy and matches it against a policy (`~/cicy-ai/audit/policy.json`).
This skill lets the loaded agent (claude / codex / opencode / …) edit that
policy in **natural language**:

> "redact bank cards" · "let the billing agent see SSNs" ·
> "what rules am I running?" · "undo last change"

The agent reads the current policy, proposes a minimal patch, confirms
anything risky, then writes it back through `POST /api/audit/policy` — the
same path the UI Audit dashboard uses, so the running pipeline picks it up via
fsnotify within ~200ms.

This is the **conversational** path. The **unsupervised** path is the autonomy
tick loop (`cicy-code audit autonomy run`); this skill only acts when a human
in the conversation asks.

## Command surface

```
cicy-audit-policy show | summary
cicy-audit-policy patch '<json>' | set <key.path> <value> | unset <key.path>
cicy-audit-policy recent [--rule R] [--agent A] [--limit N]
cicy-audit-policy history
```

See [references/tools.md](references/tools.md) for details and
[SKILL.md](SKILL.md) for the agent workflow and safety rails.

## Requirements

- Runs against a local cicy-code instance on `$PORT` (default 8008).
- Reads the API token from `~/cicy-ai/global.json`.
- `git` on PATH (only for `history`).
- Node ≥ 18 (uses the built-in `fetch`; no npm dependencies).

## Permissions

- `network` — calls the local audit backend.
- `filesystem:home` — reads `~/cicy-ai/global.json` and `~/cicy-ai/audit`.
