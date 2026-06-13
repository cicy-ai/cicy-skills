# agent-chrome — help

## Commands

```
agent-chrome list [--all] [--json]               alias of profiles (unified verb)
agent-chrome profiles [--all] [--with <service>] [--json]
agent-chrome profile <id> [--json]               id = chrome-N or N
agent-chrome add [--gmail <addr>] [--org-path <path>] [--launch] [--json]
agent-chrome proxy <id> <url|"">
agent-chrome login set <id> --name <名称> [--url --username --email --mobile --2fa --second-email --note]  rich login record
agent-chrome login rm <id> <name>
agent-chrome logins <id>                          list recorded logins
agent-chrome detect-logins <id>                   infer signed-in sites from cookies
agent-chrome probe-ip <id>                        egress IP+area via the profile's proxy (api.myip.com, stored)
agent-chrome note <accountIdx> <text>            set/clear a free-form note
agent-chrome account <accountIdx> <service> <accountId>   record the login id for a service
agent-chrome password <accountIdx> <service> <pwd>        record the password
agent-chrome 2fa <accountIdx> <service> <base32-secret>   record the TOTP (2FA) secret
agent-chrome otp <accountIdx> <service>          generate the current 2FA code
agent-chrome accounts <accountIdx> [--show]      list accounts (secrets masked unless --show)
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

## Per-profile accounts (id + password + 2FA) + notes

Each profile records, per service, the **account id, password, and TOTP (2FA)
secret** — a `service → { account, password, totp }` map — plus a free-form
profile `note`, stored in its `~/cicy-ai/db/chrome.json` entry:

```
agent-chrome account  3 github octocat            # login id
agent-chrome password 3 github 's3cr3t!'          # password
agent-chrome 2fa      3 github JBSWY3DPEHPK3PXP   # TOTP secret (base32)
agent-chrome otp      3 github                    # → 492039  (17s left)
agent-chrome accounts 3                           # list (password/totp masked as "✓ set")
agent-chrome accounts 3 --show                    # reveal secrets
agent-chrome password 3 github ""                 # empty clears that field
agent-chrome note 3 "main work identity"
agent-chrome profiles --with github               # every profile that has a github account
```

- **Secrets are masked by default** in `accounts` / setter output (shown as
  `✓ set`); pass `--show` to reveal. chrome.json is written `0600`.
- `otp` computes a standard RFC-6238 TOTP (SHA1, 6 digits, 30s) locally from
  the stored secret — handy for scripting a login that needs 2FA.
- `--with <service>` matches a recorded `accounts[<service>]` and any signed-in
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
- Each profile = entry under `~/cicy-ai/db/chrome.json` keyed by `profile_<N>`.
- Default user-data-dir: `~/chrome/profile_<N>`. Default CDP port: `11000 + N`.
- Per-profile proxy applies on **next** launch; persisted as `{url,enabled}`
  in chrome.json (legacy string proxies still read fine — one shared normalizer
  in cicy-desktop `src/profiles/profile-store.js`).
- **`login`/`logins` vs `account`/`accounts`:** `logins` is the *unified*
  cross-backend record (shared verb with `agent-electron`) of which platform
  accounts a profile signed into — `platform` + `account` only, no secrets,
  stored as `logins[]`. `account`/`password`/`2fa`/`accounts` are the richer
  Chrome-only **credentials** map (id + password + TOTP) used for auto-login.
- The `proxy` URL must point to a live listener. The recommended setup pairs each profile with a dedicated cicy-mihomo listener — see [proxy.md](./proxy.md) for the cicy-mihomo integration topology, setup flow, and the six most common failure modes (stale port, broken default route, MATCH,REJECT, listener block silently skipped, reload safe-path restriction, proxy change requires relaunch).

## Environment

- `CICY_API_TOKEN`        — bearer token override
- `CICY_API_PORT`         — server port (default 8008)
- `CICY_GLOBAL_JSON`      — global.json path override
- `CICY_AGENT_TIMEOUT_MS` — RPC timeout (default 60000 — Chrome ops can be slow)
