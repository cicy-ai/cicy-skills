# email — help

## Commands

```
email config                             Create/open ~/cicy-ai/db/email.json in $EDITOR
email status [--json]                    Show config state (passwords never printed)
email send [options]                     Send a message via SMTP
email list [--n N] [--protocol p] [--json]   List recent inbox messages (IMAP/POP3)
email read <n> [--protocol p] [--json]   Read a message by index (IMAP/POP3)
email --help / -h / help                 Print this help
```

## `email send` options

| flag           | required | description                                      |
|----------------|----------|--------------------------------------------------|
| `--to <addr>`  | yes¹     | recipient (comma-separated for multiple)         |
| `--subject <s>`| yes      | subject (UTF-8 auto-encoded as RFC 2047)         |
| `--body <text>`| ²        | plain-text body                                  |
| `--html <html>`| ²        | HTML body (multipart/alternative with `--body`)  |
| `--from <addr>`| no       | override config `smtp.from`                      |
| `--json`       | no       | emit JSON instead of human text                  |

¹ If config has `default_to` set, `--to` may be omitted.
² At least one of `--body` / `--html` is required.

## `email list` / `email read` options

| flag                 | description                                            |
|----------------------|--------------------------------------------------------|
| `--n <count>`        | (list) how many recent messages to show (default 10)   |
| `--protocol imap|pop3` | force a receive protocol (default: imap if configured) |
| `--json`             | emit JSON                                              |

`email read <n>` takes the index shown by `email list`.

## Transport

- **SMTP** send: `secure:true` → implicit TLS (:465); `secure:false` → STARTTLS (:587). AUTH LOGIN.
- **IMAP** read: implicit TLS (:993), `LOGIN` + `SELECT INBOX` + `FETCH`.
- **POP3** read: implicit TLS (:995), `USER`/`PASS` + `LIST`/`TOP`/`RETR`.

## Examples

```bash
email send --to alice@example.com --subject "Hi" --body "Hello"
email send --to a@x.com,b@y.com --subject "Heads up" --html "<b>Hi</b>"
email send --subject "Done" --body "Build OK"   # uses default_to
email list --n 5
email read 1
```

## Environment

- `CICY_EMAIL_CONFIG` — override config path
- `EDITOR`/`VISUAL` — for `email config`
