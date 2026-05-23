# cicy-ssh — tools

## What it does

Read-and-list-focused. Edits append surgical minimal blocks; never rewrites
the file in place. Connections are delegated to the native `ssh` binary.

## Files touched

| op     | path             | mode | when     |
|--------|------------------|------|----------|
| read   | `~/.ssh/config`  | —    | always   |
| append | `~/.ssh/config`  | 0600 | `add`    |
| mkdir  | `~/.ssh/`        | 0700 | `add` (if missing) |

`list`, `show`, `resolve`, `exec` are **read-only**.

## Parser

Hand-rolled `Host` block parser:

- splits on `^Host <patterns>$`, captures everything up to the next `Host` line
- first occurrence of each key wins (per `ssh_config(5)` semantics)
- wildcard hosts (`Host *`) are skipped from `list` summary
- `Include` directives are not expanded — wrapper inspects only the top-level file

For full effective config, use `cicy-ssh resolve <alias>` which calls `ssh -G`
under the hood (which does follow `Include`).

## JSON output

`list --json`:
```json
{ "ok": true, "data": { "config": "/home/u/.ssh/config", "hosts": [
  { "alias": "my-box", "hostname": "1.2.3.4", "user": "root", "port": "22", "identity": "", "proxyjump": "" }
]}}
```

`show --json`:
```json
{ "ok": true, "data": { "alias": "my-box", "fields": { "hostname": "1.2.3.4", ... }, "raw": "Host my-box\n  HostName ..." } }
```

`resolve --json` returns full `ssh -G` parsed key/value map.

## Rules of thumb

- always `cicy-ssh list` before guessing aliases
- `cicy-ssh show <alias>` to see exact lines before editing
- `cicy-ssh add` only appends; for renames or deletes edit the file by hand
- for interactive ssh, **call `ssh` directly** — `exec` does NOT allocate a TTY
