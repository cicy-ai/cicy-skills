---
name: agent-summary
description: Generate conversation summaries and handoff documents from agent sessions (claude/codex/opencode).
---

# Agent Summary

Use the local agent-summary wrapper to generate conversation summaries and handoff documents for agents on this host.

## Usage

```bash
agent-summary <agent-id>                    # Generate text summary
agent-summary <agent-id> --stats            # Show token stats only
agent-summary <agent-id> --slim             # Output slim conversation JSON
agent-summary <agent-id> --text             # Output structured text for AI
agent-summary <agent-id> --ai               # Generate AI summary (default provider)
agent-summary <agent-id> --ai --provider=deepseek
agent-summary <agent-id> --ai --model=deepseek-chat
agent-summary <agent-id> --ai --prompt="custom prompt"
```

## Supported sources

- **claude** — gateway `current.json` or `~/.claude/projects/*.jsonl`
- **codex** — `~/.codex/sessions/*.jsonl`
- **opencode** — `~/.local/share/opencode/opencode.db`
