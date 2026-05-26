# cicy-todo — help

## Synopsis

```
cicy-todo <subcommand> [args] [--pane <w-xxxxx>] [--json]
```

All todos live in a single store under the **master pane** workspace
(`<master-ws>/.cicy/todos.yaml`). Each todo is stamped with the
`pane_id` of the worker that owns it.

- **Workers** (`X_AGENT_SHORT_ID=w-xxxxx`, ≠ `w-10001`) only see and
  modify their own todos. The server enforces this regardless of CLI
  flags.
- **Master pane** (`w-10001`) sees every todo by default; pass
  `--pane <w-xxxxx>` to scope a command to one worker, or to add a todo
  on behalf of that worker.

## Subcommands

| sub        | usage                                                                  |
|------------|------------------------------------------------------------------------|
| `list`     | `cicy-todo list [--status=todo\|doing\|done\|dropped] [-q <kw>] [--all] [--pane <w-xxxxx>]` |
| `add`      | `cicy-todo add "<title>" [--pane <w-xxxxx>]`                           |
| `show`     | `cicy-todo show <id-prefix>`                                           |
| `start`    | `cicy-todo start <id>`   → status=`doing`                               |
| `done`     | `cicy-todo done <id>`    → status=`done`                                |
| `drop`     | `cicy-todo drop <id>`    → status=`dropped`                             |
| `back`     | `cicy-todo back <id>`    → status=`todo`                                |
| `edit`     | `cicy-todo edit <id> "<new title>"`                                    |
| `rm`       | `cicy-todo rm <id>`                                                    |

## Referencing todos

Two forms work for `<id>` in `show / start / done / drop / back / edit / rm`:

| form              | meaning                                                                 |
|-------------------|-------------------------------------------------------------------------|
| `#N` or `N`       | the N-th row in the **active view** (status `todo` or `doing`), as printed by `cicy-todo list` (sorted by `created_at` ascending). `#1` = oldest open todo. |
| `<uuid-prefix>`   | leading 4–8 chars of the UUID; useful for done/dropped todos not in the active view, or when status will shift. Ambiguous prefix exits 4. |

Indices shift when the active set changes (add / done / drop). Re-run
`cicy-todo` before referring to `#N` if state may have changed.

`--pane` is master-only. From a worker pane it exits with code 2.

## Examples

```bash
# From any worker (e.g. w-10025) — sees only own todos.
cicy-todo                         # list own active todos (rows numbered #1, #2, ...)
cicy-todo --json                  # JSON output
cicy-todo list --all              # include done/dropped (non-active rows show short UUID)
cicy-todo list --status=done
cicy-todo list -q "release"       # title contains "release"

cicy-todo add "Migrate cf-tunnel skill"
cicy-todo start #1                # by positional ref
cicy-todo done 1                  # `#` is optional
cicy-todo done abcd               # by UUID prefix (works for any status)

# From master pane (w-10001).
cicy-todo                          # every worker's active todos (PANE col shown)
cicy-todo --pane w-10025           # scope to one worker
cicy-todo --pane w-10025 add "Coordinate handoff"
cicy-todo --pane w-10025 done #2
```

## Environment

- `X_AGENT_SHORT_ID` — caller's pane id (set by the cicy-code tmux boot
  script). Drives both the request header and the master/worker decision.
  **Required**; the CLI exits 2 if neither this nor `CICY_PANE_ID` is set.
- `CICY_PANE_ID`     — fallback when `X_AGENT_SHORT_ID` is unset.
- `CICY_API_PORT`    — local cicy-code port (default 8008).
- `CICY_API_TOKEN`   — overrides reading from `~/cicy-ai/global.json`.
- `CICY_GLOBAL_JSON` — overrides `~/cicy-ai/global.json` path.

## Security model

The per-worker isolation is **honor-system, not a security boundary**. All
panes share the same `api_token`, so any caller with the token can spoof
`X-Agent-Show-Id` and impersonate the master pane. Treat the worker scope
as a UX guard rail, not a privilege boundary.
