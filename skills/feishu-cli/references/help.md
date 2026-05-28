# feishu-cli — help

## Commands

```
feishu-cli install [--force]   Install the official lark-cli via @larksuite/cli
feishu-cli config [-- ...]     Configure app credentials  → lark-cli config init
feishu-cli auth   [-- ...]     OAuth login, prints auth URL → lark-cli auth login --recommend
feishu-cli status [--json]     Show install + auth state
feishu-cli --help / -h / help  Print this help
```

`-- ...` forwards extra flags to the native CLI, e.g.:

```
feishu-cli config -- --new       # → lark-cli config init --new
feishu-cli auth   -- --no-wait   # → lark-cli auth login --no-wait
feishu-cli auth   -- --domain calendar,task
```

## For ANY real Feishu/Lark API call use the native `lark-cli` directly

```
lark-cli im +messages-send --chat-id oc_xxx --text "Hello"
lark-cli calendar calendars list
lark-cli docs ...
lark-cli api GET /open-apis/calendar/v4/calendars --format json
lark-cli api POST /open-apis/im/v1/messages --params '{"receive_id_type":"chat_id"}' \
  --data '{"receive_id":"oc_xxx","msg_type":"text","content":"{\"text\":\"Hi\"}"}'
```

Output formats: `--format json` (default) / `ndjson` / `csv`.

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
- **Proxy:** lark-cli talks to `*.feishu.cn`. Through a non-CN proxy exit these calls
  reset (`EOF`). Bypass the proxy for a direct route:
  `env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy NO_PROXY=feishu.cn,larksuite.com lark-cli ...`
- `feishu-cli auth` prints an authorization URL — relay it to the user to approve
  in a browser; the command exits once approval completes.
