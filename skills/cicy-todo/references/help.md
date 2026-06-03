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
| `list`     | `cicy-todo list [--status=todo\|test\|done\|dropped] [-q <kw>] [--all] [--pane <w-xxxxx>]` |
| `add`      | `cicy-todo add "<title>" [--pane <w-xxxxx>]`                           |
| `show`     | `cicy-todo show <id-prefix>`                                           |
| `test`     | `cicy-todo test <id>`    → status=`test` (done coding, awaiting review) |
| `done`     | `cicy-todo done <id>`    → status=`done`                                |
| `drop`     | `cicy-todo drop <id>`    → status=`dropped`                             |
| `back`     | `cicy-todo back <id>`    → status=`todo`                                |
| `edit`     | `cicy-todo edit <id> "<new title>"`                                    |
| `rm`       | `cicy-todo rm <id>`                                                    |

## Referencing todos

Every todo has a stable, auto-incrementing integer **id** (the `ID` column in
`cicy-todo list`). It never shifts when todos are completed or dropped, so it's
the form to use for `show / test / done / drop / back / edit / rm`:

| form            | meaning                                                                 |
|-----------------|-------------------------------------------------------------------------|
| `N`             | the stable todo id (what the `ID` column prints, what the UI shows). Preferred — survives status changes. Falls back to a positional ref only if no todo has id `N`. |
| `#N`            | explicit positional index into the **active view** (status `todo`/`test`, sorted by `created_at` asc). Shifts when the active set changes, so prefer the bare id. |
| `<id-prefix>`   | leading chars of the id (rarely needed now ids are short). Ambiguous prefix exits 4. |

`--pane` is master-only. From a worker pane it exits with code 2.

## Examples

```bash
# From any worker (e.g. w-10025) — sees only own todos.
cicy-todo                         # list own active todos (ID column shown)
cicy-todo --json                  # JSON output
cicy-todo list --all              # include done/dropped
cicy-todo list --status=done
cicy-todo list -q "release"       # title contains "release"

cicy-todo add "Migrate cf-tunnel skill"
cicy-todo done 7                  # by stable id (the ID column)
cicy-todo test #1                 # by positional ref into the active view
cicy-todo done ab                 # by id prefix (works for any status)

# From master pane (w-10001).
cicy-todo                          # every worker's active todos (PANE col shown)
cicy-todo --pane w-10025           # scope to one worker
cicy-todo --pane w-10025 add "Coordinate handoff"
cicy-todo --pane w-10025 done 12
```

## Environment

- `X_AGENT_SHORT_ID` — caller's pane id (set by the cicy-code tmux boot
  script). Drives both the request header and the master/worker decision.
- `CICY_PANE_ID`     — fallback when `X_AGENT_SHORT_ID` is unset.
- `X_AGENT_ID`       — last-resort fallback (full form, e.g. `w-10029:main.0`);
  the pane id is taken from the prefix before `:`. Lets sub-agents that only
  inherit `X_AGENT_ID` still resolve their pane. The CLI exits 2 only if none
  of the three is set.
- `CICY_API_PORT`    — local cicy-code port (default 8008).
- `CICY_API_TOKEN`   — overrides reading from `~/cicy-ai/global.json`.
- `CICY_GLOBAL_JSON` — overrides `~/cicy-ai/global.json` path.

## Security model

The per-worker isolation is **honor-system, not a security boundary**. All
panes share the same `api_token`, so any caller with the token can spoof
`X-Agent-Show-Id` and impersonate the master pane. Treat the worker scope
as a UX guard rail, not a privilege boundary.
