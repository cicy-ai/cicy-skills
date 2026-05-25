---
name: agent-editor
description: Open files in the page-bound native editor on this host. Bridges to the live :code-ext extension via cicy-code's chat push channel.
---

# Agent Editor

This skill covers the local `agent-editor` wrapper from `PATH`.

It sends `host.*` events to the page-bound `:code-ext` extension via
cicy-code's `/api/chat/push` channel, with `wait_ack:true` for sync RPC
(the server injects requestId, blocks until extension replies).

## Scope

Use this skill when the task involves:

- opening a file in the current page's native editor
- targeting a specific connected page by `page_client_id`
- checking available page clients and `:code-ext` connectivity
- inspecting the focused editor (path/language/line/column)
- listing all open file tabs

## Rules

1. Prefer the local `agent-editor` command first.
2. Target a specific page by `page_client_id`.
3. If no `page_client_id` is provided, only auto-target when the current agent has exactly one connected page client.
4. `ping` checks whether the matching `:code-ext` client is online.
5. The `open` action accepts plain paths, `file://` URIs, and optional `:line[:column]` or range suffixes.
6. If the extension returns "client not found", `open` retries for up to 30s while a UX hint coaxes the iframe forward.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
