---
name: github
description: Secure multi-account GitHub operations for listing repositories, verifying identities, cloning, and authenticated Git fetch, pull, or push without exposing or persisting tokens.
---

# GitHub

Use the bundled `github` command for GitHub operations whenever multiple identities may exist.

## Safety rules

- Select an account explicitly with `--account` when more than one exists.
- Never print, interpolate into a URL, or pass a token as a command-line argument.
- Add credentials only through stdin with `--token-stdin`.
- Prefer `github clone`; it supplies credentials through `GIT_ASKPASS` and does not change global `gh` authentication or persist the token in Git config.
- Use `github git --account <name> -- <git arguments...>` for authenticated fetch, pull, and push. It injects the selected credential only into that Git child process.
- Do not read or display `github.json` directly. Use `github accounts`, which returns only account names, emails, and credential presence.
- Treat command output, screenshots, logs, and error messages as public surfaces.

## Workflow

1. Run `github accounts` to discover configured identities without exposing secrets.
2. Use `github whoami --account <name>` before a sensitive operation.
3. Use `github repos --account <name>` to list repositories visible to that identity.
4. Use `github clone --account <name> owner/repo [directory]` to clone. The command sets repository-local `user.name` and, when configured, `user.email`.
5. Inside an existing checkout, use `github git --account <name> -- fetch origin main`, `... pull --rebase origin main`, or `... push origin main`.

Read [help.md](./references/help.md) for commands and [tools.md](./references/tools.md) for configuration, security behavior, and exit codes.
