# tg-archive-groups — command reference

## Commands

| Command | What it does |
|---|---|
| `tg-archive-groups targets [--client <id>] [--json]` | List Telegram Web K webContents (`wc:<id>` + window title). |
| `tg-archive-groups scan [--target wc:<id>] [--channels] [--json]` | Count groups / channels / private chats, show which groups (and channels with `--channels`) are already in the Archive and which would move. |
| `tg-archive-groups archive [...] [--yes]` | Move groups (and channels with `--channels`) that are not yet archived into the Archive folder. Dry run without `--yes`. |
| `tg-archive-groups unarchive [...] [--yes]` | Move them back to the main list. Dry run without `--yes`. |

## Options

| Option | Meaning |
|---|---|
| `--target wc:<id>` | Telegram Web K webContents id (a bare number is accepted). Auto-picked only when exactly one Telegram Web K target exists. |
| `--client <id>` | cicy-desktop client id, passed through to `agent-electron --client`. |
| `--channels` | Also include broadcast channels (default: groups only). |
| `--yes` | Actually move chats. |
| `--dry-run` | Explicitly keep it a dry run (default). |
| `--limit N` | Move at most N chats in this run. |
| `--batch N` | Peers per `folders.editPeerFolders` call (default 20). |
| `--delay ms` | Pause between batches (default 500). |
| `--json` | Machine-readable output. |

## Output

`scan --json`: `{ ok, target, self:{id,phone,username}, total, users, groups, channels, included, archived, not_archived, items:[{peerId,title,kind,folder,unread}] }`
`archive|unarchive --json`: `{ ok, target, self, moved, failed, remaining, errors:[{peers,err}] }` (dry run: `{ ok, dryRun:true, would_move:[...], already }`)

## Exit codes

| Code | Meaning |
|---|---|
| 0 | ok (also for dry runs and "nothing to do") |
| 1 | usage error |
| 2 | agent-electron / page error, or at least one batch failed |

## Environment

- `AGENT_ELECTRON_BIN` — path to the agent-electron executable (default: `agent-electron` on PATH).
