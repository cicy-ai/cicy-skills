---
name: cicy-ssh
description: Inspect and manage ~/.ssh/config Host entries on this host. Trigger when the task mentions ssh aliases, jump hosts, or adding/listing/using SSH nodes. For real connections use ssh directly.
---

# CiCy SSH

This skill inspects and manages `~/.ssh/config` Host entries via a thin
wrapper. **For real connections use the native `ssh` command directly** —
the wrapper does not proxy ssh.

## Two different commands

- `cicy-ssh` — bootstrap-only: `list / show / add / resolve / exec`. Inspects and edits `~/.ssh/config`.
- `ssh`      — the real OpenSSH client. Use directly for actual connections.

## Scope

Use this skill for:

- listing configured `Host` entries from `~/.ssh/config`
- showing the raw block of a single Host alias
- adding a new minimal Host block (alias + hostname [+ user/port/identity/jump])
- resolving a Host alias to its effective config (`ssh -G`)
- running a one-off command (delegates to `ssh <alias> '<cmd>'`)

## Rules

1. Read `~/.ssh/config` before guessing host aliases.
2. Prefer existing `Host` aliases from config over raw hostnames.
3. Never overwrite `~/.ssh/config`; `add` only **appends** a minimal block.
4. If the config uses `Include`, inspect `~/.ssh/config` first, then follow includes only when needed.
5. For interactive SSH sessions (TTY-bound), call `ssh <alias>` directly — do NOT pipe through `cicy-ssh exec`.
6. `cicy-ssh exec` is for **non-interactive** one-shots only; password / MFA prompts are not handled.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
