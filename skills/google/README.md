# google

> Source-only Node.js, 649 LOC. Read [`bin/google`](./bin/google).

CLI wrapper for Gmail / Sheets / Drive / Calendar. Pure REST against the
Google APIs (no SDK dependency). OAuth code-relay via `oauth-flow.cicy-ai.com`
— the relay never sees `client_secret` or any tokens.

## Install

```bash
cicy-code skill install google
```

## Setup

```bash
google setup           # prints OAuth client setup instructions
# (do the Google Cloud Console steps, save the JSON file)
google login           # opens the browser flow; polls relay for the code
google status          # show authorized email
```

## Quick usage

```bash
google gmail list -q "from:noreply@github.com" --max 5
google gmail read 18c1abc...
google gmail send -t a@b.com -s "hi" -b "hello world"
google gmail watch -q "is:unread" --minutes 10

google sheets list
google sheets read <spreadsheetId> "Sheet1!A1:C10"
google sheets append <spreadsheetId> "Sheet1!A:Z" '[["new","row"]]'
google sheets create "My new sheet"

google drive list -q "name contains 'invoice'" --max 20
google drive upload ./report.pdf
google drive download <fileId> ./out.pdf
google drive quota

google calendar list
google calendar events --max 5
google calendar create -s "Meeting" -t 2026-06-01T10:00:00Z -e 2026-06-01T11:00:00Z
```

## Configuration files

| path                                          | mode | secret_fields                    |
|-----------------------------------------------|------|----------------------------------|
| `~/cicy-ai/db/google_oauth_client.json`       | 0600 | `client_secret`                  |
| `~/cicy-ai/db/google.json`                    | 0600 | `refresh_token`, `access_token` |

NEVER cat / read / print these files. The wrapper is the only thing that
touches them.

## License

MIT
