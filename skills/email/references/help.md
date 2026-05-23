# email — help

## Commands

```
email config                             Open ~/cicy-ai/db/email.json in $EDITOR
email status [--json]                    Show config state (api_key masked)
email send [options]                     Send via Resend
email --help / -h / help                 Print this help
```

## `email send` options

| flag           | required | description                                      |
|----------------|----------|--------------------------------------------------|
| `--to <addr>`  | yes¹     | recipient (comma-separated for multiple)         |
| `--subject <s>`| yes      | subject                                          |
| `--body <text>`| ²        | plain-text body                                  |
| `--html <html>`| ²        | HTML body (overrides `--body` if both)           |
| `--from <addr>`| no       | override config `from_address`                   |
| `--json`       | no       | emit JSON instead of human text                  |

¹ If config has `default_to` set, `--to` may be omitted.
² Exactly one of `--body` / `--html` is required.

## Examples

```bash
email send --to alice@example.com --subject "Hi" --body "Hello"
email send --to a@x.com,b@y.com --subject "Heads up" --body "..."
email send --to alice@example.com --subject "Hi" --html "<b>Hello</b>"
email send --subject "Done" --body "Build OK"   # uses default_to
```

## Environment

- `CICY_EMAIL_CONFIG` — override config path
- `EDITOR`/`VISUAL` — for `email config`
