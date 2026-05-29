---
name: agent-teams
description: Manage local cicy-code teams from the Team Helper pane. Subcommands wrap window.cicy.localTeams.* IPCs (list/add/remove/update/upgrade/open) so the agent doesn't hand-roll JS.
---

# agent-teams

Manage local cicy-code teams from a CLI. Each subcommand is one round-trip
through `agent-webpage exec-js` → cicy-desktop renderer → main →
`local-teams.js`, so the desktop stays authoritative for
`~/cicy-ai/global.json` writes.

## Usage

```
agent-teams list
agent-teams add --name <name> --base-url <url> [--token <tok>] [...]
agent-teams update <id> [--name X] [--token Y] [--base-url Z]
agent-teams remove <id>
agent-teams upgrade <id>
agent-teams open <id>
```

All subcommands accept `--json` for machine-readable output.

## Why this exists

The Team Helper persona (`w-6002`) used to compose raw
`agent-webpage exec-js '(async () => await window.cicy.localTeams.list())()'`
on every call. LLMs got the async/await + single-quote escaping wrong
often enough to be a daily problem. This skill is a thin wrapper so the
agent calls `agent-teams list` and gets a clean text or JSON answer.

## Requirements

- `agent-webpage` ≥ 1.1.2 on `$PATH` (this skill spawns it as a subprocess)
- An active cicy-desktop client connected to the chat WebSocket for the
  current pane — the desktop is what actually performs the IPC.
