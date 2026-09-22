# tg-set-name — command reference

## Commands

| Command | What it does |
|---|---|
| `tg-set-name targets [--client <id>] [--json]` | List Telegram Web K webContents (`wc:<id>` + window title) that can be operated on. |
| `tg-set-name show [--target wc:<id>] [--client <id>] [--json]` | Print which account the page is logged in as (name, phone, id, @username). |
| `tg-set-name suggest [--count <n>] [--seed <s>] [--lang zh\|en] [--emoji] [--no-last] [--json]` | Print cute girl names (Chinese by default). Offline, no page needed. Same seed → same list. |
| `tg-set-name set [<first> [<last>]] [--target wc:<id>] [--client <id>] [--seed <s>] [--lang zh\|en] [--emoji] [--no-last] [--yes] [--json]` | Set the display name (`account.updateProfile`). Without `<first>` a cute girl name is picked, seeded by the account id. Without `--yes` it only prints what it would set. |

## Options

| Option | Meaning |
|---|---|
| `--target wc:<id>` | Telegram Web K webContents id (a bare number is accepted). Auto-picked only when exactly one Telegram Web K target exists. |
| `--client <id>` | cicy-desktop client id, passed through to `agent-electron --client`. |
| `--seed <s>` | Seed for the name pick. Default for `set`: the account id (stable per account). Default for `suggest`: the current time. |
| `--lang zh\|en` | `zh` (default): a cute Chinese girl name of 2–5 characters (`糖糖`, `棉花糖`, `小熊软糖`, `樱桃小丸子`, … 120 names, 30 per length) as the first name, last name empty. `en`: English first name + cute last name (`Luna Peach`). |
| `--emoji` | Put a cute emoji in the last name (`🌸 🎀 🍓 🍑 🐰 …`). |
| `--no-last` | (en) First name only (last name empty; with `--emoji` the last name is just the emoji). |
| `--count <n>` | Number of names `suggest` prints (1–200, default 10). |
| `--yes` | Actually change the name (`set`). |
| `--dry-run` | Explicitly keep it a dry run (default). |
| `--json` | Machine-readable output. |

Names containing spaces must be quoted: `tg-set-name set "Mary Jane" Rose`.

## Name rules (checked before any request)

First name 1–64 characters (not blank) · last name 0–64 characters.

## Output

`show --json`: `{ ok, target, self:{id,phone,username,first,last} }`
`suggest --json`: `{ ok, names:[{first,last}] }`
`set --json`: `{ ok, target, self, first, last, previous:{first,last}, picked }` · dry run: `{ ok, dryRun:true, first, last, picked }` · already set: `{ ok, unchanged:true }` · refused: `{ ok:false, err, hint }`

## Exit codes

| Code | Meaning |
|---|---|
| 0 | ok (also for dry runs and "nothing to do") |
| 1 | usage error or the name fails the local rules |
| 2 | agent-electron / page error (no target, page not logged in, CDP failure) |
| 3 | Telegram refused (`FIRSTNAME_INVALID`, `LASTNAME_INVALID`, `FLOOD_WAIT_n`, …) |

## Environment

- `AGENT_ELECTRON_BIN` — path to the agent-electron executable (default: `agent-electron` on PATH).
