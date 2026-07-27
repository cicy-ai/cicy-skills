# email — tools

## Protocols (no external HTTP API)

- **SMTP** (send) — implicit TLS :465 or STARTTLS :587, `AUTH LOGIN`, `MAIL`/`RCPT`/`DATA`.
- **IMAP** (receive) — implicit TLS :993, `LOGIN`/`SELECT INBOX`/`FETCH`.
- **POP3** (receive) — implicit TLS :995, `USER`/`PASS`/`STAT`/`LIST`/`TOP`/`RETR`.

All via Node built-in `net`/`tls`. Zero npm dependencies.

## Configuration

| path                       | mode | secret_fields                          |
|----------------------------|------|----------------------------------------|
| `~/cicy-ai/db/email.json`  | 0600 | `smtp.pass`, `imap.pass`, `pop3.pass`  |

Config keys:
- `smtp.{host,port,secure,user,pass,from}` — required for `send`.
  `secure:true` → implicit TLS (465); `secure:false` → STARTTLS (587).
- `imap.{host,port,user,pass}` — optional, for `list`/`read` (TLS :993).
- `pop3.{host,port,user,pass}` — optional, for `list`/`read` (TLS :995).
- `default_to` — optional default recipient.

## Environment variables

- `CICY_EMAIL_CONFIG` — override config path
- `EDITOR`/`VISUAL` — for `email config`

## JSON output

`status --json`:
```json
{
  "ok": true,
  "data": {
    "config_path": "/home/<user>/cicy-ai/db/email.json",
    "exists": true,
    "permissions": "0600",
    "smtp_ready": true,
    "imap_ready": false,
    "pop3_ready": false,
    "default_to": null,
    "send_ready": true,
    "receive_ready": false,
    "smtp_from": "You <you@example.com>"
  }
}
```

`send --json` (success):
```json
{ "ok": true, "data": { "to": ["alice@example.com"], "from": "...", "subject": "..." } }
```

`list --json`:
```json
{ "ok": true, "data": { "protocol": "imap", "messages": [ { "index": 42, "from": "...", "subject": "...", "date": "..." } ] } }
```

`read --json`:
```json
{ "ok": true, "data": { "protocol": "imap", "index": 42, "from": "...", "subject": "...", "date": "...", "raw": "<full rfc822>" } }
```

## Exit codes

| code | meaning                                   |
|------|-------------------------------------------|
| 0    | success                                   |
| 1    | runtime/protocol error                    |
| 2    | bad usage / missing required flag         |
| 3    | config missing or placeholder             |
