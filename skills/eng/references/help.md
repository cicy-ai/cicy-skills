# eng — help

## Usage

```
eng <text>             Correct text passed as args
echo <text> | eng      Correct text from stdin
eng --json <text>      Wrap output in { ok, data: { result, input } }
eng --help / -h / help
```

## Environment

- `CICY_API_TOKEN`   — bearer token override
- `CICY_API_PORT`    — server port (default 8008)
- `CICY_GLOBAL_JSON` — global.json path override
