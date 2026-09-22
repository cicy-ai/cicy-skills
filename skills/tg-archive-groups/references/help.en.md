# tg-archive-groups — command reference

## Commands

| Command | What it does |
|---|---|
| `tg-archive-groups targets [--client <id>] [--json]` | List Telegram Web K webContents (`wc:<id>` + window title). |
| `tg-archive-groups scan [--target wc:<id>] [--groups-only|--bots|--all] [--json]` | Count groups / channels / private chats, show which groups and channels (groups only with `--groups-only`) are already in the Archive and which would move. |
| `tg-archive-groups archive [...] [--yes]` | Move groups and channels (groups only with `--groups-only`) that are not yet archived into the Archive folder. Dry run without `--yes`. |
| `tg-archive-groups unarchive [...] [--yes]` | Move them back to the main list. Dry run without `--yes`. |

## Options

| Option | Meaning |
|---|---|
| `--target wc:<id>` | Telegram Web K webContents id (a bare number is accepted). Auto-picked only when exactly one Telegram Web K target exists. |
| `--client <id>` | cicy-desktop client id, passed through to `agent-electron --client`. |
| `--all` | Archive everything in the main list: groups, channels, bots and private chats with people (implies `--bots`). |
| `--bots` | Also move chats with bots; people are never touched. The official "Telegram" service chat (777000) is skipped — the server silently refuses to archive it. |
| `--drop-service` | Delete the official "Telegram" service chat (777000) — Telegram refuses to archive it; deleting its history removes it from the list until the next service message. |
| `--drop-saved` | Delete Saved Messages (clears everything saved) — likewise not archivable. |
| `--clear-drafts` | Discard unsent drafts (`messages.saveDraft` with an empty message). A chat that exists only as a draft has no server-side dialog, so this is the only way to remove it from the main list. |
| `--groups-only` | Only move groups; leave broadcast channels where they are (default: groups + channels). |
| `--channels` | Accepted for compatibility; channels are included by default. |
| `--yes` | Actually move chats. |
| `--no-keep` | Do not change the account's keep-archived settings (default: `archive` turns on `keep_archived_unmuted` + `keep_archived_folders`, otherwise chats un-archive themselves on the next message). |
| `--dry-run` | Explicitly keep it a dry run (default). |
| `--limit N` | Move at most N chats in this run. |
| `--batch N` | Peers per `folders.editPeerFolders` call (default 20). |
| `--delay ms` | Pause between batches (default 500). |
| `--json` | Machine-readable output. |

## Output

`scan --json`: `{ ok, target, self:{id,phone,username}, total, users, groups, channels, included, archived, not_archived, items:[{peerId,title,kind,folder,unread}] }`
`archive|unarchive --json`: `{ ok, target, self, moved, failed, remaining, keep:{ok,changed}|null, errors:[{peers,err}] }` (dry run: `{ ok, dryRun:true, would_move:[...], already }`)

## Exit codes

| Code | Meaning |
|---|---|
| 0 | ok (also for dry runs and "nothing to do") |
| 1 | usage error |
| 2 | agent-electron / page error, or at least one batch failed |

## Environment

- `AGENT_ELECTRON_BIN` — path to the agent-electron executable (default: `agent-electron` on PATH).
