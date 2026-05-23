# gemini-ask — help

## Usage

```
gemini-ask <prompt> [win_id]   Ask Gemini; default win_id=4
gemini-ask --json <prompt>     JSON output mode
gemini-ask --help / -h / help
```

## Environment

- `CICY_API_TOKEN`        — bearer token override
- `CICY_API_PORT`         — server port (default 8008)
- `CICY_PANE_ID`          — agent pane (`w-NNNN`); defaults from cwd
- `CICY_GLOBAL_JSON`      — global.json path override
- `CICY_AGENT_TIMEOUT_MS` — default 60000
