---
name: globalApiToken
description: Show or refresh the api_token in ~/cicy-ai/global.json on this host. Refresh delivers the new token by email (SMTP) since it is never stored off-host.
---

# Global API Token

Read or rotate the `api_token` field of `~/cicy-ai/global.json` — the token
used by every cicy-code skill that talks to the local API.

## Scope

Use this skill when:

- the user asks "what is my api token?" / "show the global token"
- the user asks to rotate / refresh the api token
- a script needs the token in scriptable JSON form

Do **not** use this skill for:

- per-skill credentials (those live in `~/cicy-ai/db/<skill>.json`)
- generating tokens for external services (Cloudflare, etc.)

## Quick start

```sh
globalApiToken show              # print current token (plain text)
globalApiToken show --json       # JSON output
globalApiToken refresh           # rotate AND email the new token (requires email skill)
globalApiToken refresh --to me@example.com
globalApiToken refresh --no-email   # rotate without emailing (may lock you out)
```

## Refresh delivers the new token by email

The token is **never stored off this host** — it lives only in this VM's
`global.json`. So after a refresh, a user connecting from elsewhere (e.g. the
cloud UI) has no way to learn the new token. To avoid locking them out,
`refresh` **delivers the new token via the [`email`](../email) skill (SMTP)**:

1. It checks `email status`. If the `email` skill isn't installed or has no
   working SMTP config, refresh **refuses** (exit 3) and the current token is
   kept — so rotation can never strand the user. Configure first:
   `cicy-code skill install email && email config`.
2. Recipient = `--to <addr>`, else the email skill's `default_to`.
3. It generates the new token, **emails it first**, and only writes it to
   `global.json` after the send succeeds. If the email fails, nothing is rotated
   and the current token still works.
4. `--no-email` (alias `--local`) bypasses delivery and rotates anyway — only for
   advanced users who accept the lock-out risk.

## Rules

1. The skill operates on the **real** `~/cicy-ai/global.json` — never invent
   token values.
2. Refresh **only** when the user explicitly asks. Tokens in flight may be
   invalidated by a refresh.
3. The file is written at mode 0600 — never relax permissions.
4. If `~/cicy-ai/global.json` does not exist, `show` exits with code 3 and
   `refresh` creates it.
5. Refresh requires the `email` skill configured (unless `--no-email`) — this is
   intentional, so a rotated token is always delivered to the user.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
