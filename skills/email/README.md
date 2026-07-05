# email — SMTP/IMAP/POP3 email wrapper

> Source-only Node.js, zero npm dependencies (built-in `net`/`tls`). Read [`bin/email`](./bin/email).

## What it does

- `email config` — open `~/cicy-ai/db/email.json` in `$EDITOR` (placeholder created at 0600 if missing)
- `email status` — show which of SMTP / IMAP / POP3 are configured (passwords never printed)
- `email send` — send a message over SMTP (implicit TLS :465 or STARTTLS :587)
- `email list` / `email read` — list / read inbox messages over IMAP (:993) or POP3 (:995)

## Install

```bash
cicy-code skill install email
```

## Configure

```bash
email status
email config            # fill in smtp (and optionally imap/pop3) host/port/user/pass
email send --to alice@example.com --subject "Test" --body "Hello"
email list --n 5
email read 1
```

## Setup notes (user-only)

1. Use your mail provider's SMTP settings. For Gmail/Outlook, create an
   **app password** (not the account password) and enable IMAP/POP if you want
   to receive.
2. Common ports: SMTP `465` (`secure:true`) or `587` (`secure:false`/STARTTLS);
   IMAP `993`; POP3 `995`.
3. `email config`, paste host/port/user/pass + a `from` address. **Never paste
   passwords into chat** — edit the 0600 file directly.

## License

MIT
