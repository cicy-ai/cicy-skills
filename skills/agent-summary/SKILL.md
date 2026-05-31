---
name: agent-summary
description: Dump the raw basic conversation (text + thinking) of an agent session from its request/reply snapshots, for forking or restoring a conversation.
---

# Agent Summary

Dump the **raw basic conversation** of an agent on this host — `text` + `thinking`
in order, with the system prompt, `<system-reminder>` boilerplate, tool calls and
tool results stripped out. The result is a faithful, untruncated transcript you
can hand to a fork ("分身") to continue the agent, or replay to restore the
conversation.

The transcript is written to `<history>/summary/<conversation_id>.md`, a
`current.md` symlink in that dir is repointed at it, and the **path** is printed.

## Usage

```bash
agent-summary <agent-id>                 # write the file, print its path
agent-summary <path/to/current.json>     # explicit snapshot file
```

## Source

The only source is the gateway/MITM audit snapshot at the hardcoded path
`~/cicy-ai/workers/<agent-id>/.cicy/history/{current.json,reply.json}` — written
for every agent (gateway or not). Native agent logs (claude jsonl / codex /
opencode db / kiro) are deliberately **not** read. Anthropic, OpenAI Responses,
and OpenAI Chat Completions snapshot shapes are all supported.
