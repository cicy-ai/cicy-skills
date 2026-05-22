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

## Exit codes

| code | meaning                              |
|------|--------------------------------------|
| 0    | success                              |
| 1    | generic error                        |
| 2    | empty input                          |
| 3    | missing token / cicy-code unreachable |
| 4    | api error                            |
