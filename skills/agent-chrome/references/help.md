# agent-chrome — help

## Commands

```
agent-chrome profiles [--all] [--with <service>] [--json]
agent-chrome profile <accountIdx> [--json]
agent-chrome add [--gmail <addr>] [--org-path <path>] [--launch] [--json]
agent-chrome proxy <accountIdx> <url|"">
agent-chrome note <accountIdx> <text>            set/clear a free-form note
agent-chrome accounts <accountIdx> <github,gmail,apple,cf>   set service tags
agent-chrome ip <accountIdx> [--url <ipApi>]     egress IP + country via CDP
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

## Per-profile accounts + notes

Each profile records which services it holds (`accounts` tags) and a free-form
`note`, stored in its `~/cicy-ai/db/chrome.json` entry:

```
agent-chrome accounts 3 github,gmail,apple,cf   # tag profile 3
agent-chrome note 3 "main work identity — 2FA on phone"
agent-chrome profiles --with github             # every profile that has github
```

`--with <service>` matches both the `accounts` tags and any signed-in
`platform.<service>` (github/gmail detection), case-insensitive.

## Egress IP

`agent-chrome ip <idx>` fetches an IP-info API from *inside* that profile's
Chrome, so the result reflects that profile's proxy egress. The profile must be
launched (have a live tab):

```
agent-chrome ip 3                          # {"ip","country","cc"} via api.myip.com
agent-chrome ip 3 --url https://ipinfo.io/json
```

## Notes

- System Chrome is required on the desktop machine.
- Each profile = entry under `~/cicy-ai/db/chrome.json` keyed by `account_<N>`.
- Default user-data-dir: `~/chrome/account_<N>`. Default CDP port: `11000 + N`.
- Per-profile proxy applies on **next** launch.
- The `proxy` URL must point to a live listener. The recommended setup pairs each profile with a dedicated cicy-mihomo listener — see [proxy.md](./proxy.md) for the cicy-mihomo integration topology, setup flow, and the six most common failure modes (stale port, broken default route, MATCH,REJECT, listener block silently skipped, reload safe-path restriction, proxy change requires relaunch).

## Environment

- `CICY_API_TOKEN`        — bearer token override
- `CICY_API_PORT`         — server port (default 8008)
- `CICY_GLOBAL_JSON`      — global.json path override
- `CICY_AGENT_TIMEOUT_MS` — RPC timeout (default 60000 — Chrome ops can be slow)
