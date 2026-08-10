# Configuration and security

- Config: `~/cicy-ai/db/github.json`
- Override path: `CICY_GITHUB_CONFIG`
- Default account: `CICY_GITHUB_ACCOUNT`
- Format: an object keyed by account name, with `api_token` and optional `email`.
- Config writes are atomic and force mode `0600`.
- Token input is accepted only through stdin. Tokens are never returned by account-listing commands.
- `github gh --account` sets the selected account's `GH_TOKEN` only for one `gh` child process. It does not alter the global environment or `gh` config, and rejects credential-disclosing `gh auth token`.
- Initial clone authentication uses temporary `GIT_ASKPASS`. Repository-local config stores the account name and credential helper; later pull/push dynamically reads that account's Token from `github.json`. The Token is not embedded in the URL, Git config, global `gh` state, or Git credential storage.
- GitHub API failures expose only HTTP status, not response bodies.

Exit codes: `0` success, `2` invalid command, `4` authentication failure, otherwise `1` or the underlying Git exit code.
