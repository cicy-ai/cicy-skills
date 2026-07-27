# feishu-cli — help

Wrapper around the official Feishu/Lark CLI (`@larksuite/cli`, binary `lark-cli`).
It bootstraps the CLI and forwards real commands through `run`, with the
`*.feishu.cn` proxy bypass handled for you.

## Wrapper commands

```
feishu-cli install [--force]      Install the official lark-cli via @larksuite/cli
feishu-cli config [-- ...]        Configure app credentials  → lark-cli config init
feishu-cli auth   [-- ...]        OAuth login, prints auth URL → lark-cli auth login --recommend
feishu-cli status [--json]        Show install + auth state
feishu-cli run <lark args...>     Run any lark-cli command (proxy bypass auto-handled). Alias: x
feishu-cli --help / -h / help     Print this help
```

`-- ...` forwards extra flags to the fixed subcommand:

```
feishu-cli config -- --new       # → lark-cli config init --new
feishu-cli auth   -- --no-wait   # → lark-cli auth login --no-wait
feishu-cli auth   -- --domain calendar,task
```

## First-time setup

```
feishu-cli status                # installed? authenticated?
feishu-cli install               # 1. install lark-cli
feishu-cli config -- --new       # 2. create/configure the app (prints a verification URL — open it)
feishu-cli auth                  # 3. OAuth login (prints an authorization URL — open it)
feishu-cli status                # 4. confirm authenticated
```

Both `config` and `auth` print a URL to open in a browser; the command blocks until
you finish there. Run them in the background and relay the URL when driving as an agent.

## Real API calls — `feishu-cli run`

Everything after `run` is passed verbatim to `lark-cli`; the proxy bypass is applied.
No `env -u …` prefix needed. Three command layers:

```
# shortcuts (prefixed with +) — high-level, recommended
feishu-cli run calendar +agenda
feishu-cli run im +messages-send --chat-id oc_xxx --text "Hello"

# API commands — domain + resource + verb
feishu-cli run calendar calendars list

# raw API
feishu-cli run api GET /open-apis/calendar/v4/calendars --format json
```

### Discovering commands

```
feishu-cli run <domain> --help            # list a domain's commands/shortcuts
feishu-cli run <domain> <cmd> --help      # exact flags for one command
feishu-cli run doctor                     # health check: config, auth, connectivity
feishu-cli run schema ...                 # inspect API params/types/scopes
```

Domains: `api approval apps attendance auth base calendar config contact docs doctor
drive event im mail markdown minutes okr profile schema sheets slides task update vc
whiteboard wiki`.

## Cookbook (verified recipes)

### Spreadsheet (Sheets)

```
# create with header row + initial data → returns spreadsheet_token + url
feishu-cli run sheets +create --title "名单" \
  --headers '["姓名","部门","邮箱"]' \
  --data '[["张三","研发","a@x.com"],["李四","产品","b@x.com"]]'

# inspect — sheet_id lives at data.sheets.sheets[].sheet_id
feishu-cli run sheets +info --spreadsheet-token <TOKEN>

# append rows — needs --sheet-id (from +info)
feishu-cli run sheets +append --spreadsheet-token <TOKEN> --sheet-id <SHEET_ID> \
  --range A1:C1 --values '[["王五","设计","c@x.com"]]'

# read / export
feishu-cli run sheets +read   --spreadsheet-token <TOKEN> --range '<sheetId>!A1:C10'
feishu-cli run sheets +export --spreadsheet-token <TOKEN>
```

### Document (Docx)

```
# create from Markdown (title comes from the first "# H1") → returns docx url
cat doc.md | feishu-cli run docs +create --api-version v2 --doc-format markdown --content -
feishu-cli run docs +create --api-version v2 --doc-format markdown --content @doc.md

# fetch / update existing
feishu-cli run docs +fetch  --api-version v2 ...
feishu-cli run docs +update --api-version v2 ...
```

⚠️ Docs **v1 is deprecated** — always pass `--api-version v2`. v2 uses `--content`
(+ `--doc-format xml|markdown`), not v1's `--markdown`. There is no `--title` in v2;
the title is the first `#` heading.

### Messages (IM)

```
feishu-cli run im +messages-send --chat-id oc_xxx --text "Hello"
feishu-cli run im +messages-send --user-id ou_xxx --markdown "**hi** `code`"
feishu-cli run im +messages-send --chat-id oc_xxx --image ./pic.png
feishu-cli run im +chat-search --query "项目群"          # find a chat_id by name
feishu-cli run im +chat-messages-list --chat-id oc_xxx
```

### Calendar

```
feishu-cli run calendar +agenda                          # today's agenda
feishu-cli run calendar +create --summary "周会" ...     # see --help for time flags
feishu-cli run calendar +freebusy ...                    # free/busy + RSVP status
```

For base / drive / mail / task / wiki / vc / slides / minutes / okr / approval /
attendance / contact, the same pattern holds — `feishu-cli run <domain> --help` lists
the `+shortcuts`, then `--help` on one for exact flags.

## Common flags (work on most `run` commands)

```
--format json|ndjson|csv     output format (json default)
-q, --jq '<expr>'            filter JSON output with jq
--as user|bot                act as the user or the app bot
--dry-run                    print the request without executing it
```

Use `--` before the lark args if any collide with feishu-cli's own flags:
`feishu-cli run -- status --json`.

## Exit codes

```
0  success
1  generic failure (installer / lark-cli error)
2  usage error (unknown subcommand, or `run` with no args)
3  lark-cli not installed (run `feishu-cli install`)
4  npx not found (install Node.js first)
```

`run` passes lark-cli's own exit code through unchanged.

## Notes

- Credentials are managed by lark-cli itself: the OS-native keychain when available,
  else a local file `~/.lark-cli/config.json` on headless hosts. No cicy-ai db file;
  never print that file.
- **Proxy:** lark-cli talks to `*.feishu.cn`, which resets through a non-CN proxy exit
  (`EOF`). `feishu-cli` strips the proxy for every command it runs (config/auth/status/run)
  so this is automatic; set `FEISHU_CLI_KEEP_PROXY=1` to opt out. Only raw `lark-cli`
  calls need the manual prefix:
  `env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy NO_PROXY=feishu.cn,larksuite.com lark-cli ...`
- `feishu-cli auth` prints an authorization URL — relay it to the user to approve in a
  browser; the command exits once approval completes.
- `feishu-cli run update` upgrades lark-cli and its bundled agent skills.
