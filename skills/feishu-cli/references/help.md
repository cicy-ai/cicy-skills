# feishu-cli — help

## Commands

```
feishu-cli install [--force]      Install the official lark-cli via @larksuite/cli
feishu-cli config [-- ...]        Configure app credentials  → lark-cli config init
feishu-cli auth   [-- ...]        OAuth login, prints auth URL → lark-cli auth login --recommend
feishu-cli status [--json]        Show install + auth state
feishu-cli run <lark args...>     Run any lark-cli command (proxy bypass auto-handled). Alias: x
feishu-cli --help / -h / help     Print this help
```

`-- ...` forwards extra flags to the native CLI, e.g.:

```
feishu-cli config -- --new       # → lark-cli config init --new
feishu-cli auth   -- --no-wait   # → lark-cli auth login --no-wait
feishu-cli auth   -- --domain calendar,task
```

## Real API calls — `feishu-cli run`

Everything after `run` goes straight to `lark-cli`, with the feishu.cn proxy bypass
applied for you. No `env -u …` prefix needed:

```
feishu-cli run sheets +create --title "T" --headers '["A","B"]' --data '[["1","2"]]'
feishu-cli run im +messages-send --chat-id oc_xxx --text "Hello"
feishu-cli run calendar +agenda
feishu-cli run api GET /open-apis/calendar/v4/calendars --format json
```

Use `--` before the lark args if any collide with feishu-cli's own flags:
`feishu-cli run -- status --json`. Output formats: `--format json` (default) / `ndjson` / `csv`.

(You can still call `lark-cli` directly, but then add the proxy bypass yourself — see Notes.)

## Exit codes

```
0  success
1  generic failure (installer/CLI error)
2  usage error (unknown subcommand)
3  lark-cli not installed (run `feishu-cli install`)
4  npx not found (install Node.js first)
```

## Notes

- Credentials are managed by lark-cli itself: the OS-native keychain when available,
  else a local file `~/.lark-cli/config.json` on headless hosts. No cicy-ai db file;
  never print that file.
- **Proxy:** lark-cli talks to `*.feishu.cn`, which resets through a non-CN proxy exit
  (`EOF`). `feishu-cli` strips the proxy for every command it runs (config/auth/status/run)
  so this is handled automatically; set `FEISHU_CLI_KEEP_PROXY=1` to opt out. Only raw
  `lark-cli` calls need the manual prefix:
  `env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy NO_PROXY=feishu.cn,larksuite.com lark-cli ...`
- `feishu-cli auth` prints an authorization URL — relay it to the user to approve
  in a browser; the command exits once approval completes.
