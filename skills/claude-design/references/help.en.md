# claude-design — help

Drive **claude.ai/design** from the CLI through `agent-chrome` CDP.

## Synopsis

```
claude-design <command> [args...] [global flags]
```

## Commands

### `open [--url <u>]`

Launch the chrome profile (via `agent-chrome launch`) and navigate it to
`https://claude.ai/design` (or `--url` if given). If the profile is already
running, the URL is still set on the active tab.

### `new`

`Page.navigate` to `https://claude.ai/design` (the project list). Use this
when you want to leave a project. **The landing page does NOT have a chat
composer** — to start sending prompts, run `create` next.

### `create [name] [--mode wireframe|high-fidelity] [--template prototype|slide-deck|from-template|other]`

Click into a new project from the `/design` landing page:

1. Picks the template tab (default `prototype`)
2. Picks the fidelity mode (default `high-fidelity`; alias `hifi`)
3. Fills the "Project name" input if `name` is given
4. Clicks the `[data-testid="create-project-button"]` button
5. Waits up to 60 s for the URL to become `/design/p/<uuid>`
6. Returns the new project URL as JSON

Aliases: `--mode hifi` = `high-fidelity`.

```sh
claude-design create "CiCy AI Landing" --mode hifi --template prototype
# → {"ok":true,"action":"create",...,"url":"https://claude.ai/design/p/..."}
```

### `prompt <text|-> [--file <path>] [--wait] [--timeout <ms>]`

Inject text into the composer and click Send.

Text source (in order):
1. `--file <path>` — read from a file
2. Positional `-` (or no positional) — read from stdin
3. Positional words — joined with spaces

`--wait` polls the send button: first waits for it to go disabled (= sending),
then waits for it to come back enabled (= assistant finished). Default timeout
600 000 ms (10 min) — override with `--timeout <ms>`.

The text is round-tripped via base64 + `TextDecoder('utf-8')`, so any UTF-8 is
safe (Chinese, Japanese, emoji).

### `download [--type editable|standalone|zip] [--out <dir>] [--timeout <ms>]`

Click Share, then click the export menu item matching `--type`:

| `--type`     | menu item it looks for                          | typical size |
|--------------|--------------------------------------------------|--------------|
| `editable`   | "editable" / "可编辑"                            | ~150 KB      |
| `standalone` | "standalone" / "独立" (fonts inlined)           | ~14 MB       |
| `zip`        | "Download project as .zip"                       | ~10 MB       |

Optionally calls `Page.setDownloadBehavior` to set the download directory (only
when `--out` is an absolute path; relative paths like `~/Downloads` are left to
the browser's default).

The skill does NOT pull the file back to your worker — it only triggers the
download on the host. See `references/pull.md` for the chunked-base64 recipe.

### `exec <js>`

Run an arbitrary JavaScript expression in the page via `Runtime.evaluate`,
return its value as JSON. Useful for one-off poking around.

```sh
claude-design exec 'location.href' --idx 6
claude-design exec 'document.querySelectorAll("button").length' --idx 6
```

### `status [--json]`

Report whether the chrome profile is running, the current URL, and whether the
design composer is mounted.

## Global flags

| flag             | env                       | required? | meaning                                  |
|------------------|---------------------------|-----------|------------------------------------------|
| `--idx <n>`      | `CLAUDE_DESIGN_IDX`       | yes       | chrome profile account index             |
| `--client <id>`  | `CLAUDE_DESIGN_CLIENT`    | no        | agent-chrome remote client (omit=local)  |

## Exit codes

| code | meaning                                                   |
|------|-----------------------------------------------------------|
| 0    | success                                                   |
| 1    | runtime failure (CDP error, page JS threw, missing menu)  |
| 2    | usage error (missing flag, unknown subcommand)            |
| 3    | dependency missing (`agent-chrome` not on PATH)           |
