---
name: agent-summary
description: Dump the raw conversation (text + thinking + compact tool traces) of an agent session from its request/reply snapshots, for forking or restoring a conversation.
---

# Agent Summary

Dump the **raw conversation** of an agent on this host — `text` + `thinking` in
full, plus a **compact tool trace** per call (tool name + key argument, and the
result truncated to its head — errors keep more), with the system prompt and
`<system-reminder>` boilerplate stripped out. The result is a faithful transcript
you can hand to a fork ("分身") to continue the agent, or replay to restore the
conversation — the fork sees what was said *and* what was read/edited/run,
without the full tool payloads blowing up its context.

The transcript is written to `<history>/summary/<conversation_id>.md`, a
`current.md` symlink in that dir is repointed at it, and the **path** is printed.

## Usage

```bash
agent-summary <agent-id>                 # write the file, print its path
agent-summary <path/to/current.json>     # explicit snapshot file
```

## Output shape

```
## Turn N
USER: <message>
AI (thinking): <reasoning>
AI (tool): Bash: npm run build …
TOOL RESULT: <first 400 chars> …[+N chars]     # errors keep 1000
AI: <reply text>
```

## Source

The only source is the gateway/MITM audit snapshot at the hardcoded path
`~/cicy-ai/workers/<agent-id>/.cicy/history/{current.json,reply.json}` — written
for every agent (gateway or not). Native agent logs (claude jsonl / codex /
opencode db / kiro) are deliberately **not** read. Anthropic, OpenAI Responses,
and OpenAI Chat Completions snapshot shapes are all supported. Note this covers
the agent's **current context window** only — history the agent itself already
compacted survives only as the compact-summary message it left behind.
