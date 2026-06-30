---
name: cicy-knowledge
description: Team knowledge Layer 2 store CLI over cicy-code's /api/knowledge: add/list/get/recall/promote/reject/supersede + specialist (pin the governing pane). Recall is keyword+tag over canon (no vector RAG).
---

# Cicy Knowledge

`cicy-knowledge` is the CLI for the team's **Layer 2 knowledge store** — a
server-side, cross-agent, durable knowledge base held in cicy-code (it does not
evaporate when a worker is deleted). It wraps the `/api/knowledge` endpoints.

Two layers of memory exist:

- **Layer 1** — each agent's private auto-memory drafts (per-worker, ephemeral).
- **Layer 2** — this store: the team's single source of truth, governed by the
  知识专员 via a status machine: `pending → canon | rejected | superseded`.

## Scope

Use this skill when:

- you want to **record** something the team should keep (`add` → a pending entry),
- you need to **recall** established team knowledge before acting (`recall <kw>`
  — keyword/tag search over canon only),
- you are the **知识专员** governing the store (`promote` / `reject` /
  `supersede`, `list --status pending`),
- you need to **pin which pane is the 知识专员** — the one that receives
  memory-hook briefs (`specialist <pane>` to set, `specialist` to show; config-file
  backed, defaults to the master pane w-1001).

`recall` is deliberately keyword + tag matching, **not** vector/RAG — exact-ish
recall over title/tags/body to avoid hallucinated retrieval.

## Quick start

```sh
cicy-knowledge add "Deploy runbook" --body "Run dev.py --quick --preview" --tags "deploy ops"
cicy-knowledge list --status pending
cicy-knowledge promote <id>
cicy-knowledge recall deploy
```

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
