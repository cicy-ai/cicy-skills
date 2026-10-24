# cicy-keystore — help

```
cicy-keystore list [--json]
cicy-keystore show <KEY> [--json]
cicy-keystore exec --env <KEY>[:<VAR>] [--env ...] -- <command> [args...]
cicy-keystore --help
```

| Command | What it does |
|---|---|
| `list` | Every key, whether a value is set, and its note. Never the value. |
| `show <KEY>` | One key's note, status and last update time. |
| `exec` | Runs `<command>` with each KEY's value in env var VAR (default VAR = KEY). Occurrences of the values in stdout/stderr become `***`. Exit code is the child's. |

Values are set only in the cicy-code UI (Keystore tab); `set` / `get` are refused.

Key names: `[A-Za-z_][A-Za-z0-9_]*`, max 64 characters (they are env var names).

Exit codes: 0 ok · 1 error · 2 key not found / not set · 3 cicy-code unreachable or auth failed.

Environment: `CICY_API_BASE` / `CICY_API_PORT` / `CICY_API_TOKEN` override the
cicy-code address and token (default: `127.0.0.1:8008`, token from `~/cicy-ai/global.json`).
