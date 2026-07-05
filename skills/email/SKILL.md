---
name: email
description: Self-hosted email over standard protocols: send via SMTP, receive via IMAP or POP3. Subcommands: config / status / send / list / read.
---

# Email (SMTP / IMAP / POP3)

> **Wrapper command:** `email`. Subcommands: `config` / `status` / `send` / `list` / `read`.
> Pure Node built-ins (`net`/`tls`), **zero npm dependencies**. Sends with SMTP;
> reads with IMAP or POP3. The wrapper holds the credentials — the agent never
> sees the password.

## Credentials: hard rules

- **NEVER cat / Read / grep / print** `~/cicy-ai/db/email.json`. The SMTP/IMAP/POP3
  passwords are user secrets.
- When credentials are missing, run `email config`. It auto-creates a placeholder
  JSON at `~/cicy-ai/db/email.json` (chmod 600) and opens it in `$EDITOR`. **Do not
  ask the user to paste passwords into chat.**
- `status` never prints passwords — trust its `ready`/`missing` output.

## Config shape

```json
{
  "smtp": { "host": "smtp.example.com", "port": 465, "secure": true, "user": "you@example.com", "pass": "<paste-smtp-pass>", "from": "You <you@example.com>" },
  "imap": { "host": "imap.example.com", "port": 993, "user": "you@example.com", "pass": "<paste-imap-pass>" },
  "pop3": { "host": "pop.example.com", "port": 995, "user": "you@example.com", "pass": "<paste-pop3-pass>" },
  "default_to": ""
}
```

- **smtp** (required for `send`): `secure: true` = implicit TLS (port 465);
  `secure: false` = STARTTLS (port 587). `from` is the envelope/header sender.
- **imap** and/or **pop3** (required for `list` / `read`): implicit TLS only
  (993 / 995). If both are present, IMAP is preferred; pick one with
  `--protocol imap|pop3`.
- `default_to` is optional; if set, `email send` without `--to` uses it.

## Bootstrap

1. `email status` — see which of smtp / imap / pop3 have their fields filled.
   Add `--check` to actually connect + verify login (✓/✗ + reason, like a ping).
2. `email config` — opens the placeholder in `$EDITOR`. Fill in your provider's
   SMTP (and optionally IMAP/POP3) host/port/user/pass. For Gmail/Outlook use an
   **app password**, not the account password. **Never ask the user to paste a
   password into chat.**
3. `email send --to <addr> --subject "..." --body "..."` — send.

## Usage

```sh
email send --to alice@example.com --subject "Hi" --body "Hello world"
email send --to a@x.com,b@y.com --subject "Heads up" --html "<b>Hi</b>"
email send --subject "Done" --body "Build finished"      # uses default_to
email list --n 10                                        # recent inbox (imap/pop3)
email read 1                                             # full message by index
email list --protocol pop3 --json
```

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
