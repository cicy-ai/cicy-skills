# agent-chrome — help

## Commands

```
agent-chrome profiles [--all] [--with <service>] [--json]
agent-chrome profile <accountIdx> [--json]
agent-chrome add [--gmail <addr>] [--org-path <path>] [--launch] [--json]
agent-chrome proxy <accountIdx> <url|"">
agent-chrome note <accountIdx> <text>            set/clear a free-form note
agent-chrome account <accountIdx> <service> <accountId>   record the account for a service
agent-chrome accounts <accountIdx>               list a profile's service→account map
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

Each profile records the **actual account** it holds per service (a
`service → accountId` map) plus a free-form `note`, stored in its
`~/cicy-ai/db/chrome.json` entry:

```
agent-chrome account 3 github octocat           # profile 3's github account
agent-chrome account 3 gmail  me@gmail.com
agent-chrome account 3 apple  me@icloud.com
agent-chrome account 3 cf     ops@acme.com
agent-chrome account 3 github ""                # empty removes that service
agent-chrome accounts 3                         # list profile 3's accounts
agent-chrome note 3 "main work identity — 2FA on phone"
agent-chrome profiles --with github             # every profile that has a github account
```

`--with <service>` matches a recorded `accounts[<service>]` value and any
signed-in `platform.<service>` (github/gmail detection), case-insensitive.

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
