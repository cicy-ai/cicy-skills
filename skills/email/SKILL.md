---
name: email
description: Send transactional email from this host via Resend. Subcommands: config / status / send.
---

# Email (Resend)

> **Wrapper command:** `email`. Subcommands: `config` / `status` / `send`.
> Backend is the [Resend](https://resend.com) transactional email API. The wrapper signs the request itself — the agent never sees the api_key.

## Credentials: hard rules

- **NEVER cat / Read / grep / print** `~/cicy-ai/db/email.json`. The api_key is a user secret.
- When credentials are missing, run `email config`. It auto-creates a placeholder JSON at `~/cicy-ai/db/email.json` (chmod 600) and opens it in `$EDITOR`. **Do not ask the user to paste the api_key into chat.**
- `status` masks the api_key — trust its output.

## Config shape

```json
{
  "api_key":      "<paste-your-resend-api-key-here>",
  "from_address": "<paste-your-verified-from-address-here>",
  "default_to":   ""
}
```

`default_to` is optional; if set, `email send` without `--to` uses it.
The `from_address` must be from a domain you verified in Resend (or
`onboarding@resend.dev` for sandbox testing — only delivers to your signup
email).

## Bootstrap

1. `email status` — confirm whether config is ready.
2. `email config` — opens placeholder in `$EDITOR`. Walk the user through
   resend.com signup; **never ask them to paste the api_key into chat**.
3. `email send --to <addr> --subject "..." --body "..."` — send.

## Usage

```sh
email send --to alice@example.com --subject "Hi" --body "Hello world"
email send --to alice@example.com --subject "Hi" --html "<b>Hello</b>"
email send --subject "Done" --body "Build finished"   # uses default_to
email send --to a@x.com,b@y.com --subject "Heads up" --body "..."
```

Output on success: the Resend message id.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
