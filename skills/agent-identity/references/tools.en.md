# agent-identity tools

| Tool | Example | Description |
|------|---------|-------------|
| `all` | `agent-identity` | Report identity for claude, codex, opencode, kiro |
| `claude` | `agent-identity claude` | device `userID` + OAuth account (uuid / email / org) + subscription |
| `codex` | `agent-identity codex` | `auth_mode` (apikey / chatgpt) + `account_id` if ChatGPT login |
| `opencode` | `agent-identity opencode` | configured provider names (no keys) |
| `kiro` | `agent-identity kiro` | AWS IdC/SSO OAuth `client_id`, `client_id_hash`, region, auth method |
| `--json` | `agent-identity all --json` | JSON output: `{ ok, results: [{ agent, found, sources, fields }] }` |

All secret material (tokens, API keys, `clientSecret`) is redacted/omitted.
