# tg-clean-deleted — command reference

## Commands

| Command | What it does |
|---|---|
| `tg-clean-deleted targets [--client <id>] [--json]` | List Telegram Web K webContents (`wc:<id>` + window title) that can be operated on. |
| `tg-clean-deleted scan [--target wc:<id>] [--client <id>] [--json]` | List chats whose peer is a deleted account (`user.pFlags.deleted`), newest first, with last-message date and unread count. |
| `tg-clean-deleted clean [--target wc:<id>] [--client <id>] [--yes] [--dry-run] [--limit N] [--delay ms] [--json]` | Delete those chats. Without `--yes` it only prints what it would delete. |

## Options

| Option | Meaning |
|---|---|
| `--target wc:<id>` | Telegram Web K webContents id (a bare number is accepted). Auto-picked only when exactly one Telegram Web K target exists. |
| `--client <id>` | cicy-desktop client id, passed through to `agent-electron --client`. |
| `--yes` | Actually delete. |
| `--dry-run` | Explicitly keep it a dry run (default). |
| `--limit N` | Delete at most N chats in this run (newest first). |
| `--delay ms` | Pause between deletions, default 400. |
| `--json` | Machine-readable output. |

## Output

`scan --json`: `{ ok, target, self:{id,phone,username}, total, count, deleted:[{peerId,date,unread}] }`
`clean --json`: `{ ok, target, self, deleted, failed, remaining, errors:[{peerId,err}] }` (dry run: `{ ok, dryRun:true, would_delete:[...] }`)

## Exit codes

| Code | Meaning |
|---|---|
| 0 | ok (also for dry runs and "nothing to clean") |
| 1 | usage error |
| 2 | agent-electron / page error, or at least one deletion failed |

## Environment

- `AGENT_ELECTRON_BIN` — path to the agent-electron executable (default: `agent-electron` on PATH).
