---
name: agent-webpage
description: Talk to the live webpage client for an agent on this host. Run JS, ping, send custom events and await the real reply over the chat WebSocket.
---

# Agent Webpage

This skill covers the local `agent-webpage` wrapper from `PATH`.

It talks to the real webpage client through cicy-code's chat WebSocket
(`/api/chat/ws`) and returns the **actual** webpage response, not just
"event sent".

## Scope

Use this skill when the task involves:

- checking whether an agent's webpage client is connected
- running JS in the live webpage client (`exec-js`)
- sending custom WS events and awaiting the matching reply
- listing connected webpage / chat clients

## Rules

1. Prefer the local `agent-webpage` command first.
2. Target a specific connected webpage by `client_id`.
3. If no `client_id` is provided, only auto-target when the current agent has exactly one connected client.
4. For response-oriented calls, **report the actual returned payload**, not just the fact that the event was sent.
5. Use `agent-webpage help` and `agent-webpage tools` before guessing subcommand shapes.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
