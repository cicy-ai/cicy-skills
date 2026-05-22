---
name: globalApiToken
description: Show or refresh the api_token in ~/cicy-ai/global.json on this host.
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
globalApiToken refresh           # rotate to a new random token
globalApiToken refresh --json
```

## Rules

1. The skill operates on the **real** `~/cicy-ai/global.json` — never invent
   token values.
2. Refresh **only** when the user explicitly asks. Tokens in flight may be
   invalidated by a refresh.
3. The file is written at mode 0600 — never relax permissions.
4. If `~/cicy-ai/global.json` does not exist, `show` exits with code 3 and
   `refresh` creates it.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
