# agent-summary help

Dump the raw conversation of an agent: `text` + `thinking` in full, plus a
compact trace per tool call (name + key argument, result truncated to its head;
errors keep more), with the system prompt and `<system-reminder>` boilerplate
stripped. Each file starts with a `Date: YYYY-MM-DD HH:mm:ss +08:00` timestamp.
Writes `<history>/summary/<conversation_id>.md`, repoints a `current.md`
symlink at it, and prints that path. Hand it to a fork ("分身") or replay it to
restore the conversation.

```
agent-summary <agent-id>                 # write the file, print its path
agent-summary <path/to/current.json>     # explicit snapshot file
```

Source (hardcoded): `~/cicy-ai/workers/<agent-id>/.cicy/history/{current.json,reply.json}`
only — native agent logs (jsonl / codex / opencode db / kiro) are not read.
Covers the agent's current context window only — pre-compaction history survives
only as the compact-summary message.
