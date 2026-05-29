---
name: agent-identity
description: Report local AI CLI identities (claude, codex, opencode, kiro) by reading each CLI auth/config files. Prints identifiers only; tokens, API keys and client secrets are always redacted.
---

# agent-identity

Report the local **identity** (client id / device id / account) of the AI CLIs
installed for this agent: **claude**, **codex**, **opencode**, **kiro**.

It reads each CLI's own auth/config files under `$HOME` and prints **identifiers
only**. Secrets are never printed — access/refresh tokens, API keys and OAuth
client secrets are redacted or omitted.

## Usage

```
agent-identity                 # all four CLIs (text)
agent-identity claude          # one CLI
agent-identity kiro --json     # machine-readable
```

## What it reports per CLI

| CLI | Source file(s) | Identifiers shown |
|-----|----------------|-------------------|
| **claude** | `~/.claude.json`, `~/.claude/.credentials.json` | `device_user_id` (anon install id `userID`), `account_uuid`, `email`, `org_uuid`, `org_type`, `subscription`, `token_expires_at`, `logged_in` |
| **codex** | `~/.codex/installation_id`, `~/.codex/auth.json` | `installation_id` (per-install device UUID, present even without login), `auth_mode` (apikey / chatgpt), `account_id` (ChatGPT login only) |
| **opencode** | `~/.local/share/opencode/opencode.db` (sqlite `account`/`account_state`), legacy `auth.json` | `account_id`, `email`, `active_account_id` (only when logged into opencode's cloud account); else provider names. opencode has no standalone device/install id. |
| **kiro** | `~/.aws/sso/cache/kiro-auth-token-cli.json` + `<clientIdHash>.json` | `client_id` (AWS IdC OAuth client id), `client_id_hash`, `region`, `auth_method`, expiry |

When a CLI isn't logged in (no auth file), it's reported as not found with a note.

## Safety

- The skill only **reads** files; it never writes or transmits anything.
- It redacts/omits every secret field (`*token*`, `*key*`, `*secret*`,
  `*password*`, `access`/`refresh`). The kiro `clientSecret` and all OAuth
  tokens are never printed — only the public `clientId`.
- Output is safe to paste into an issue/log.
