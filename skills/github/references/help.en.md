# GitHub multi-account command reference

```sh
github accounts [--json]
printf '%s' "$TOKEN" | github add <account> --token-stdin [--email <email>]
github remove <account> --yes
github whoami --account <account> [--json]
github repos --account <account> [--limit 1..1000] [--json]
github clone --account <account> <owner/repo> [directory]
github configure --account <account> [directory]
github gh --account <account> <gh arguments...>
```

Account resolution order: `--account`, `CICY_GITHUB_ACCOUNT`, then the only configured account. When multiple accounts exist, explicit selection is required.

`github clone` configures the account binding, `user.name`, and configured email in the cloned repository. Ordinary `git pull` and `git push` then use that account automatically.

Run `github configure --account <account> [directory]` once for an existing HTTPS clone. HTTP origins are upgraded to HTTPS; SSH origins are left unchanged.

Use `github gh --account <account> ...` for Actions, releases, PRs, and other GitHub CLI operations. It injects only the selected identity into that child process, rejects `gh auth token`, and does not modify global `gh` authentication state.
