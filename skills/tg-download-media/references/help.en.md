# tg-download-media — command reference

## Commands

| Command | What it does |
|---|---|
| `tg-download-media targets [--client <id>] [--json]` | List Telegram Web K webContents (`wc:<id>` + window title) that can be operated on. |
| `tg-download-media download <chat> (--ids … \| --from-jsonl …) [options]` | Fetch the selected messages, download their attachments, write them under `--out`. |

`<chat>` accepts `@username`, `https://t.me/<username>[/<msgid>]` (with `/<msgid>` and no `--ids` that single message is downloaded), `t.me/+<hash>` / `t.me/joinchat/<hash>` (only when the account is a member), or a peer id the page already knows.

## Selecting messages

| Option | Meaning |
|---|---|
| `--ids a,b,c-d` | Message ids, comma/space separated, ranges allowed (`100-250`). |
| `--from-jsonl <file>` | Read ids from a `tg-export-history` JSONL (`id` field). |
| `--codes x,y` | With `--from-jsonl`: only records whose `code` is listed (the 编号 extracted by the export post-processing). |
| `--match <regex>` | With `--from-jsonl`: only records whose `text` matches (case-insensitive). |

## Options

| Option | Meaning |
|---|---|
| `--out <dir>` | Output directory, created if missing. Default `./tg-media`. |
| `--album` | Messages sharing a `grouped_id` (an album) go into `album_<grouped_id>/`. |
| `--thumb` | Photos: download the smallest size instead of the largest. Documents are unaffected. |
| `--limit N` | Stop after N downloaded files (skipped ones do not count). |
| `--overwrite` | Re-download even if the file exists. Default: existing non-empty files are skipped (resumable). |
| `--target wc:<id>` | Telegram Web K webContents id (a bare number is accepted). Auto-picked only when exactly one Telegram Web K target exists. |
| `--client <id>` | cicy-desktop client id, passed through to `agent-electron --client`. |
| `--json` | Machine-readable summary on stdout; progress goes to stderr. |

## File naming

- photos and documents without a file name: `<msgid>_<media_id>.<ext>` (`ext` from the MIME type: jpg, mp4, mp3, pdf, …)
- documents with a file name: `<msgid>_<file name>` (unsafe characters replaced by `_`)
- the same `media_id` is written once per run; later messages carrying the same file are reported as skipped

## Output

`download --json`: `{ ok, target, chat:{id,title,username,type}, out, downloaded, bytes, skipped, failed, seconds, files:[{id,file,size,media_id,kind,mime,grouped_id}], skipped_items:[{id,reason,file?}], failed_items:[{id,err}] }`

## Exit codes

| Code | Meaning |
|---|---|
| 0 | all selected files downloaded or skipped as already present |
| 1 | usage error (no ids selected, bad id, unknown option) |
| 2 | agent-electron / page error (no target, page not logged in or still starting, CDP failure) |
| 3 | chat not found / not readable |
| 4 | finished, but at least one file failed (see `failed_items`) |

## Environment

- `AGENT_ELECTRON_BIN` — path to the agent-electron executable (default: `agent-electron` on PATH).
