---
name: github
description: Secure multi-account GitHub operations for identity verification, repository discovery, cloning, and persistent per-repository account binding without exposing tokens.
---

# GitHub

Use the bundled `github` command for GitHub operations whenever multiple identities may exist.

## Safety rules

- Select an account explicitly with `--account` when more than one exists.
- Never print, interpolate into a URL, or pass a token as a command-line argument.
- Add credentials only through stdin with `--token-stdin`.
- Prefer `github clone`; it binds the repository to the selected account so later ordinary `git pull` and `git push` use the correct identity.
- Repository config stores only the account name and credential-helper command. The Token remains centralized in `github.json` and is supplied to Git only when requested.
- Do not read or display `github.json` directly. Use `github accounts`, which returns only account names, emails, and credential presence.
- Treat command output, screenshots, logs, and error messages as public surfaces.

## Workflow

1. Run `github accounts` to discover configured identities without exposing secrets.
2. Use `github whoami --account <name>` before a sensitive operation.
3. Use `github repos --account <name>` to list repositories visible to that identity.
4. Use `github clone --account <name> owner/repo [directory]` to clone and bind future HTTPS pull/push to that account.
5. For an existing HTTPS clone, run `github configure --account <name> [directory]` once.

Read [help.md](./references/help.md) for commands and [tools.md](./references/tools.md) for configuration, security behavior, and exit codes.
