# agent-summary help

Dump the raw basic conversation of an agent: `text` + `thinking` in order, with
the system prompt, `<system-reminder>` boilerplate, tool calls and tool results
stripped. Writes `<history>/summary/<conversation_id>.md`, repoints a `current.md`
symlink at it, and prints that path. Hand it to a fork ("分身") or replay it to
restore the conversation.

```
agent-summary <agent-id>                 # write the file, print its path
agent-summary <path/to/current.json>     # explicit snapshot file
```

Source (hardcoded): `~/cicy-ai/workers/<agent-id>/.cicy/history/{current.json,reply.json}`
only — native agent logs (jsonl / codex / opencode db / kiro) are not read.
