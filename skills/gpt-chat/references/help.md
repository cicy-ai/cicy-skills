# gpt-chat — help

## Commands

```
gpt-chat <message>             Append one turn; prints the assistant reply
gpt-chat --clear               Clear history (system prompt kept)
gpt-chat --system <text>       Set/overwrite system prompt
gpt-chat --show-system         Print current system prompt (or "(none)")
gpt-chat --json ...            JSON output mode
gpt-chat --help / -h / help
```

## Files

| path                                       | contents                |
|--------------------------------------------|-------------------------|
| `~/Private/data/gpt-chat-history.json`     | array of `{role,content}` turns |
| `~/Private/data/gpt-chat-system.txt`       | optional single-line system prompt |

## Environment

- `GPT_CHAT_HIST`    — history path override
- `GPT_CHAT_SYSTEM`  — system prompt path override
- `CICY_API_TOKEN`   — bearer token override
- `CICY_API_PORT`    — server port (default 8008)
- `CICY_GLOBAL_JSON` — global.json path override

## Exit codes

| code | meaning                              |
|------|--------------------------------------|
| 0    | success                              |
| 1    | generic                              |
| 2    | invalid arguments                    |
| 3    | missing config / cicy-code unreachable |
| 4    | api error / empty response           |
