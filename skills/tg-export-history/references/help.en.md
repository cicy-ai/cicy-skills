# tg-export-history — command reference

## Commands

| Command | What it does |
|---|---|
| `tg-export-history targets [--client <id>] [--json]` | List Telegram Web K webContents (`wc:<id>` + window title) that can be operated on. |
| `tg-export-history info <chat> [--target wc:<id>] [--client <id>] [--json]` | Resolve `<chat>` and print title, type (channel / supergroup / group / user / bot), id, member count, whether the account is a member, total message count and the newest message. |
| `tg-export-history export <chat> [--target wc:<id>] [--client <id>] [--out <file\|dir>] [--format json\|jsonl\|csv\|all] [--limit N] [--since DATE] [--min-id N] [--batch N] [--json]` | Page through the history and write it. Progress goes to stderr; the summary (or `--json`) to stdout. |

`<chat>` accepts `@username`, `https://t.me/<username>[/<msgid>]`, `t.me/+<hash>` / `t.me/joinchat/<hash>` (only when the account is already a member), or a peer id (`-100<channel_id>`, `-<channel_id>`, `-<chat_id>` for basic groups, positive id for users — the chat must already be known to the page, otherwise use its @username / link).

## Options

| Option | Meaning |
|---|---|
| `--target wc:<id>` | Telegram Web K webContents id (a bare number is accepted). Auto-picked only when exactly one Telegram Web K target exists. |
| `--client <id>` | cicy-desktop client id, passed through to `agent-electron --client`. |
| `--out <path>` | Output file (its extension picks the format) or directory (trailing `/` or an existing directory). Default: `./<username-or-id>-messages.<ext>`. Existing files are overwritten. |
| `--format` | `json` (default, `{meta, messages[]}`), `jsonl` (one record per line), `csv` (UTF-8 with BOM, opens in Excel), `all` (all three next to each other). |
| `--topic <msgid>` | Forum chats: export only the topic whose root message id is `<msgid>` (`messages.getReplies`). A `t.me/<chat>/<id>` link that points at a topic root selects that topic automatically. Output file gets `-topic<id>` in its name. |
| `--limit N` | Stop after the newest N messages. |
| `--since DATE` | Only messages on/after `YYYY-MM-DD` (UTC) or a unix timestamp; paging stops at the first older message. |
| `--min-id N` | Only messages with id > N (incremental export: pass the last id you already have). |
| `--batch N` | `messages.getHistory` calls (100 messages each) per page evaluation, default 8, max 20. |
| `--json` | Machine-readable summary on stdout. |

## Record fields

`id`, `date` (ISO 8601 UTC), `from` (display name + @username of the sender, or the channel), `from_id` (`u<id>` / `c<id>`), `text`, `media` (`photo`, `document`, `webpage`, `poll`, … or empty), `media_id` (Telegram's photo / document id), `mime`, `size` (bytes), `file` (document file name), `reply_to` (replied message id), `fwd` (forward origin), `views`, `service` (service-message action, e.g. `ChatAddUser`), `edit_date`, `grouped_id` (album id). Records are written oldest first.

## Output

`info --json`: `{ ok, target, chat, info:{id,title,username,type,members,member}, topic, topicInfo:{id,title}?, count, latest:{id,date} }`
`export --json`: `{ ok, target, chat, count, total_in_chat, files:{json?,jsonl?,csv?}, seconds, err? }`

## Exit codes

| Code | Meaning |
|---|---|
| 0 | ok |
| 1 | usage error (bad option, missing `<chat>`, unparsable `--since`) |
| 2 | agent-electron / page error (no target, page not logged in or still starting, CDP failure, export interrupted by an RPC error — partial output is kept) |
| 3 | chat not found / not readable (`USERNAME_NOT_OCCUPIED`, `CHANNEL_PRIVATE`, not a member of the invite link, unknown peer id) |

## Environment

- `AGENT_ELECTRON_BIN` — path to the agent-electron executable (default: `agent-electron` on PATH).
