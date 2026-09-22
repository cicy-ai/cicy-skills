# tg-set-username — command reference

## Commands

| Command | What it does |
|---|---|
| `tg-set-username targets [--client <id>] [--json]` | List Telegram Web K webContents (`wc:<id>` + window title) that can be operated on. |
| `tg-set-username show [--target wc:<id>] [--client <id>] [--json]` | Print which account the page is logged in as (name, phone, id) and its current @username. |
| `tg-set-username check <username> [--target wc:<id>] [--client <id>] [--json]` | Validate the username locally, then ask Telegram (`account.checkUsername`) whether it is still available. |
| `tg-set-username set <username> [--target wc:<id>] [--client <id>] [--yes] [--json]` | Set the account's username (`account.updateUsername`). Without `--yes` it only validates + checks availability. |
| `tg-set-username clear [--target wc:<id>] [--client <id>] [--yes] [--json]` | Remove the current username. Without `--yes` it only prints what it would remove. |

## Options

| Option | Meaning |
|---|---|
| `--target wc:<id>` | Telegram Web K webContents id (a bare number is accepted). Auto-picked only when exactly one Telegram Web K target exists. |
| `--client <id>` | cicy-desktop client id, passed through to `agent-electron --client`. |
| `--yes` | Actually change the username (`set` / `clear`). |
| `--dry-run` | Explicitly keep it a dry run (default). |
| `--json` | Machine-readable output. |

## Username rules (checked before any request)

5–32 characters · `a-z 0-9 _` · must start with a letter · no trailing `_` · no `__`. A leading `@` is stripped.

## Output

`show --json`: `{ ok, target, self:{id,phone,username,name} }`
`check --json`: `{ ok, target, self, username, valid, available, own }` (server refusal: `{ ok:false, err, hint }`)
`set --json`: `{ ok, target, self, username, previous }` · dry run: `{ ok, dryRun:true, username, available:true }` · refused: `{ ok:false, err, hint }`
`clear --json`: `{ ok, target, self, previous }` · dry run: `{ ok, dryRun:true, would_clear }`

## Exit codes

| Code | Meaning |
|---|---|
| 0 | ok (also for dry runs and "nothing to do") |
| 1 | usage error or the username fails the local rules |
| 2 | agent-electron / page error (no target, page not logged in, CDP failure) |
| 3 | Telegram refused: taken (`USERNAME_OCCUPIED`), invalid, Fragment-only (`USERNAME_PURCHASE_AVAILABLE`), `FLOOD_WAIT_n`, … |

## Environment

- `AGENT_ELECTRON_BIN` — path to the agent-electron executable (default: `agent-electron` on PATH).
