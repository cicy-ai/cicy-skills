# feishu-cli

> Source-only Node.js. Read [`bin/feishu-cli`](./bin/feishu-cli).
> Requires `npx` (Node.js) on PATH.

Bootstrap wrapper for the **official Feishu/Lark CLI** — [`@larksuite/cli`](https://github.com/larksuite/cli) (binary `lark-cli`).
It does **install / config / auth / status** only; for real API work you use the
native `lark-cli` directly.

## Install

```bash
cicy-code skill install feishu-cli
```

## Use

```bash
feishu-cli status     # is lark-cli installed? authenticated?
feishu-cli install    # install the official lark-cli (npx @larksuite/cli@latest install)
feishu-cli config     # set app credentials  (lark-cli config init)
feishu-cli auth       # OAuth login — prints an authorization URL to relay to the user
```

Then everything else is the native CLI (200+ commands across im, calendar, docs,
base, sheets, mail, tasks, meetings, …):

```bash
lark-cli im +messages-send --chat-id oc_xxx --text "Hello"
lark-cli api GET /open-apis/calendar/v4/calendars --format json
```

## Notes

- Credentials are stored by `lark-cli` itself — the OS-native keychain when present,
  otherwise a local file (`~/.lark-cli/config.json`) on headless Linux. Nothing in
  `~/cicy-ai/db`; never print that file.
- **Proxy:** `lark-cli` hits `*.feishu.cn`, which resets through a non-CN proxy exit
  (`EOF`). Bypass the proxy for a direct route — see SKILL.md "Proxy".
- `feishu-cli auth` prints an OAuth URL; relay it to the user for browser approval.
- This wrapper does **not** proxy real API calls — call `lark-cli` directly.

MIT. The official CLI is also MIT, by the larksuite team.
