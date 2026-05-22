# cicy-agent — help

## Commands

```
cicy-agent list                               List all panes (table)
cicy-agent ls                                 Short list
cicy-agent tree                               Tree (JSON)
cicy-agent windows                            Window list (JSON)
cicy-agent capture <pane>                     Capture raw pane text
cicy-agent reply <pane> [--full]              Last reply text from pane (parsed)
cicy-agent msg <pane> <text> [--callback]     Send chat message
cicy-agent msg_wait <pane> <text> [timeout]   Send and await turn completion
cicy-agent send-keys <pane> <keys...>         tmux send-keys
cicy-agent restart                            Restart all panes
cicy-agent clear <pane>                       Clear pane

cicy-agent --node <NAME> ...                  Run against a remote node
cicy-agent --json ...                         JSON output mode
cicy-agent --help / -h / help
cicy-agent tools
```

## Environment

- `CICY_API_TOKEN`     — bearer token (overrides global.json)
- `CICY_API_PORT`      — local server port (default 8008)
- `CICY_GLOBAL_JSON`   — global.json path override
- `CICY_AGENT_JSON`    — multi-node config override (default `~/cicy-ai/db/cicy-agent.json`)
- `X_AGENT_SHORT_ID`   — required for `msg --callback` (set inside panes)

## Exit codes

| code | meaning                              |
|------|--------------------------------------|
| 0    | success                              |
| 1    | generic                              |
| 2    | invalid arguments                    |
| 3    | missing config / cicy-code unreachable |
| 4    | api error / pane not found / node not in config |
