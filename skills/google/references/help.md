# google — help

## Top-level commands

```
google setup          First-time OAuth client setup instructions
google login          Authorize this host with your Google account
google status         Show authorization status
google help <svc>     Per-service usage (gmail / sheets / drive / calendar)

google gmail ...      Email management
google sheets ...     Spreadsheet operations
google drive ...      File storage
google calendar ...   Calendar events

google --json ...     JSON output mode
google --help / -h / help
```

## gmail

```
google gmail list [-q "<query>"] [--max N]                list message IDs
google gmail read <messageId>                              one message (subject/from/body)
google gmail read-all [-q "<query>"] [--max N]             multiple messages, full body
google gmail send -t <to> -s <subject> -b <body> [-f <from>]
google gmail watch -q "<query>" [--minutes N]
```

## sheets

```
google sheets list                                          list spreadsheets (Drive)
google sheets read <spreadsheetId> "<range>"               read a range
google sheets write <spreadsheetId> "<range>" '[["v"]]'    overwrite a range
google sheets append <spreadsheetId> "<range>" '[["v"]]'   append rows
google sheets create "<title>"                              new spreadsheet
```

## drive

```
google drive list [-q "<query>"] [--max N]
google drive upload <local_path> [--name N] [--mime M]
google drive download <fileId> <local_path>
google drive quota
```

## calendar

```
google calendar list                                        list calendars
google calendar events [calId] [--max N] [--from ISO] [--to ISO]
google calendar create [calId] -s "<summary>" -t <ISO_start> -e <ISO_end> [-d "<descr>"]
```

## Environment

- `GOOGLE_OAUTH_CLIENT` — OAuth client config path (default `~/cicy-ai/db/google_oauth_client.json`)
- `GOOGLE_STATE`        — token state path (default `~/cicy-ai/db/google.json`)
- `OAUTH_FLOW_BASE`     — relay base URL (default `https://oauth-flow.cicy-ai.com`)

## Exit codes

| code | meaning                              |
|------|--------------------------------------|
| 0    | success                              |
| 1    | generic                              |
| 2    | invalid arguments                    |
| 3    | missing config / not authorized      |
| 4    | google api error / token error / oauth-flow timeout |
