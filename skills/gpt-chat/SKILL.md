---
name: gpt-chat
description: Multi-turn chat against cicy-code's /api/ai/chat with persistent history at ~/Private/data/gpt-chat-history.json. Optional system prompt. Subcommands - --clear, --system, --show-system.
---

# GPT Chat

Multi-turn chat with persistent history. Each invocation appends one
user/assistant turn to the JSON history file. Optional system prompt lives
in a separate text file.

## Scope

Use this skill when the task involves:

- continuing a chat thread across calls
- setting / inspecting a system prompt
- clearing the chat history

For one-shot questions (no history) prefer the original `gpt` command.
For English correction prefer `eng`.

## Files

- `~/Private/data/gpt-chat-history.json` — array of `{role, content}`
- `~/Private/data/gpt-chat-system.txt`   — single-line system prompt

## Rules

1. Each `gpt-chat <msg>` call appends one user + one assistant turn.
2. `--clear` deletes history; system prompt is preserved.
3. `--system <text>` overwrites the system prompt; pass empty to remove (`gpt-chat --system ""`).
4. The wrapper does not stream — full reply prints when complete.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
