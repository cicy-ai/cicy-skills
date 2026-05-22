# cicy-todo — help

## Synopsis

```
cicy-todo [pane] <subcommand> [args] [--json]
```

The optional leading `pane` matches `^w-\d+$`. Without it, the CLI uses
`$CICY_PANE_ID` (else `w-10001`).

## Subcommands

| sub        | usage                                                                  |
|------------|------------------------------------------------------------------------|
| `list`     | `cicy-todo [pane] list [--status=todo\|doing\|done\|dropped] [-q <kw>] [--all]` |
| `add`      | `cicy-todo [pane] add "<title>"`                                       |
| `show`     | `cicy-todo [pane] show <id-prefix>`                                    |
| `start`    | `cicy-todo [pane] start <id>`   → status=`doing`                        |
| `done`     | `cicy-todo [pane] done <id>`    → status=`done`                         |
| `drop`     | `cicy-todo [pane] drop <id>`    → status=`dropped`                      |
| `back`     | `cicy-todo [pane] back <id>`    → status=`todo`                         |
| `edit`     | `cicy-todo [pane] edit <id> "<new title>"`                             |
| `rm`       | `cicy-todo [pane] rm <id>`                                             |

`<id-prefix>` accepts the leading 4–8 chars when unique. Ambiguous prefixes
exit with code 4 and print candidates to stderr.

## Examples

```bash
cicy-todo                         # default = list own active
cicy-todo --json                  # JSON output
cicy-todo list --all              # include done/dropped
cicy-todo list --status=done
cicy-todo list -q "release"       # title contains "release"

cicy-todo add "Migrate cf-tunnel skill"
cicy-todo start abcd1234
cicy-todo done abcd
cicy-todo edit abcd "Migrate cf-tunnel + cicy-todo skills"

cicy-todo w-10003                  # list another pane
cicy-todo w-10003 add "Coordinate handoff"
cicy-todo w-10003 done t-1779
```

## Environment

- `CICY_PANE_ID`     — default pane when no positional pane given
- `CICY_API_PORT`    — local cicy-code port (default 8008)
- `CICY_API_TOKEN`   — overrides reading from `~/cicy-ai/global.json`
- `CICY_GLOBAL_JSON` — overrides `~/cicy-ai/global.json` path

## Exit codes

| code | meaning                                       |
|------|-----------------------------------------------|
| 0    | success                                       |
| 1    | generic / API failure                         |
| 2    | invalid args / 404                            |
| 3    | server unreachable / auth failure / no config |
| 4    | ambiguous id prefix                           |
