# email — Resend email wrapper

> Source-only Node.js, 215 LOC. Read [`bin/email`](./bin/email).

## What it does

- `email config` — open `~/cicy-ai/db/email.json` in `$EDITOR` (placeholder created at 0600 if missing)
- `email status` — show config state with masked api_key
- `email send` — POST to Resend `/emails` with the api_key injected

## Install

```bash
cicy-code skill install email
```

## Configure

```bash
email status
email config
email send --to alice@example.com --subject "Test" --body "Hello"
```

## Setup steps (user-only)

1. Sign up at [resend.com](https://resend.com).
2. Create API key at [resend.com/api-keys](https://resend.com/api-keys).
3. (For non-sandbox) verify a domain at resend.com/domains.
4. `email config`, paste api_key + from_address.

## License

MIT
