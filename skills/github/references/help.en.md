# GitHub multi-account command reference

```sh
github accounts [--json]
printf '%s' "$TOKEN" | github add <account> --token-stdin [--email <email>]
github remove <account> --yes
github whoami --account <account> [--json]
github repos --account <account> [--limit 1..1000] [--json]
github clone --account <account> <owner/repo> [directory]
```

Account resolution order: `--account`, `CICY_GITHUB_ACCOUNT`, then the only configured account. When multiple accounts exist, explicit selection is required.

`github clone` configures `user.name` and the configured email only in the cloned repository. It does not modify global Git or `gh` authentication.
