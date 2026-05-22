# agent-chrome — help

## Commands

```
agent-chrome profiles [--all] [--json]
agent-chrome profile <accountIdx> [--json]
agent-chrome add [--gmail <addr>] [--org-path <path>] [--launch] [--json]
agent-chrome proxy <accountIdx> <url|"">
agent-chrome launch <accountIdx> [--url <url>] [--no-activate]
agent-chrome close <accountIdx>
agent-chrome targets [--idx <n>] [--json]
agent-chrome cdp <method> [json_params] [--idx <n>] [--json]
agent-chrome gmails [--json]
agent-chrome github [--json]

agent-chrome --client <client_id> ...
agent-chrome --help / -h / help
agent-chrome tools
```

## Notes

- System Chrome is required on the desktop machine.
- Each profile = entry under `~/Private/chrome.json` keyed by `account_<N>`.
- Default user-data-dir: `~/chrome/account_<N>`. Default CDP port: `11000 + N`.
- Per-profile proxy applies on **next** launch.

## Environment

- `CICY_API_TOKEN`        — bearer token override
- `CICY_API_PORT`         — server port (default 8008)
- `CICY_GLOBAL_JSON`      — global.json path override
- `CICY_AGENT_TIMEOUT_MS` — RPC timeout (default 60000 — Chrome ops can be slow)

## Exit codes

| code | meaning                              |
|------|--------------------------------------|
| 0    | success                              |
| 1    | generic / WebSocket missing          |
| 2    | invalid arguments / multiple clients |
| 3    | missing config / cicy-code unreachable / no desktop client |
| 4    | api / rpc / chrome error / timeout   |
