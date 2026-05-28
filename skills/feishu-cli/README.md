# feishu-cli

> Source-only Node.js. Read [`bin/feishu-cli`](./bin/feishu-cli).
> Requires `npx` (Node.js) on PATH.

Wrapper for the **official Feishu/Lark CLI** — [`@larksuite/cli`](https://github.com/larksuite/cli) (binary `lark-cli`).
It bootstraps the CLI (**install / config / auth / status**) and adds **`run`** — a
single proxy-aware entry point for every real API call, so you never type the
`env -u HTTP_PROXY … lark-cli` dance.

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

Then run real commands through `feishu-cli run` (200+ commands across im, calendar,
docs, base, sheets, mail, tasks, meetings, …) — everything after `run` is passed
verbatim to `lark-cli`:

```bash
feishu-cli run sheets +create --title "T" --headers '["A","B"]' --data '[["1","2"]]'
feishu-cli run im +messages-send --chat-id oc_xxx --text "Hello"
feishu-cli run calendar +agenda
feishu-cli run api GET /open-apis/calendar/v4/calendars --format json
```

## Notes

- Credentials are stored by `lark-cli` itself — the OS-native keychain when present,
  otherwise a local file (`~/.lark-cli/config.json`) on headless Linux. Nothing in
  `~/cicy-ai/db`; never print that file.
- **Proxy:** `lark-cli` hits `*.feishu.cn`, which resets through a non-CN proxy exit
  (`EOF`). `feishu-cli` strips the proxy for every command it runs (incl. `run`), so
  it's automatic; set `FEISHU_CLI_KEEP_PROXY=1` to opt out. Only raw `lark-cli` calls
  need the manual bypass — see SKILL.md "Proxy".
- `feishu-cli auth` prints an OAuth URL; relay it to the user for browser approval.

MIT. The official CLI is also MIT, by the larksuite team.
