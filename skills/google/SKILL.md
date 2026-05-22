---
name: google
description: Local google CLI wrapper for Gmail, Sheets, Drive and Calendar. OAuth login via oauth-flow.cicy-ai.com (relay never sees client_secret or tokens).
---

# Google Workspace

Local `google` wrapper for Gmail / Sheets / Drive / Calendar. All
credentials live in two files on this host (chmod 600):

- `~/cicy-ai/db/google_oauth_client.json`  — `{client_id, client_secret}` (you create this once)
- `~/cicy-ai/db/google.json`               — `{refresh_token, access_token, expires_at, ...}` (created by `google login`)

## Hard rules — sensitive data

1. **NEVER cat / Read / grep / print** either file above. The wrapper is the only thing that should touch them.
2. **NEVER ask the user to paste client_secret, refresh_token, or any auth code into chat.** They go straight from Google → OAuth client config file → wrapper.
3. The OAuth flow uses `https://oauth-flow.cicy-ai.com` as a code relay. The Worker only briefly holds the single-use authorization code (10 min TTL); it does NOT see client_secret or tokens. Token exchange happens locally on this host.
4. Do not invent client IDs, secrets, or refresh tokens — only what the user produces in their own Google Cloud Console.

## Scope

- **OAuth setup / re-authorization** (`google setup`, `google login`, `google status`) — when the user asks to "connect Google", "authorize", "log in", or any Google API call fails with an auth error
- Gmail inbox listing, reading, sending, watching for verification codes
- Google Sheets read / write / append / create
- Google Drive list / upload / download / quota
- Google Calendar list / events / create

## OAuth Setup — the full flow

Run `google login` and let its stdout drive the next step. It self-detects three states:

### State 1 — No OAuth client yet (first run)

`google login` says: "OAuth client not configured. Run `google setup`". Then `google setup` prints the steps. Walk the user through them one at a time:

1. Create / pick a Google Cloud project, enable Gmail / Drive / Sheets / Calendar APIs
2. Configure OAuth consent screen (External, add test user = your gmail)
3. **Create credentials → OAuth client ID, type "Web application"**
4. Authorized redirect URIs: `https://oauth-flow.cicy-ai.com/callback`
5. Save the downloaded JSON file to `~/cicy-ai/db/google_oauth_client.json`, `chmod 600`
6. Re-run `google login` — it advances to State 2.

### State 2 — Client configured, not yet authorized

`google login` generates a session id and prints a one-shot URL:

`https://oauth-flow.cicy-ai.com/start?session=...&client_id=...&scopes=...`

Tell the user: **open that URL in your browser**. They'll see Google's
consent screen, click Allow, and the page will say "Success — you can close
this tab."

The wrapper polls `oauth-flow.cicy-ai.com/poll` every 2 seconds. When it
sees the code, it exchanges it locally (with the client_secret) for a
refresh_token and writes it to `~/cicy-ai/db/google.json`. Final line is
`✓ authorized as <email>`.

### State 3 — Already authorized

`google login` prints the connected email and exits. To switch accounts,
delete `~/cicy-ai/db/google.json` and re-run `google login`.

## Rules

1. Prefer the local wrapper commands first.
2. For unfamiliar subcommands, run `google help <service>`.
3. Use the real token configured on the host — do not mock Google responses.
4. Report the concrete command result back to the user.
5. Re-run `google login` after each user action and let its stdout drive the next step. Don't skip ahead.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
