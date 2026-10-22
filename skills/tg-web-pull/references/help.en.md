# tg-web-pull — help

```
tg-web-pull webviews [--json]                 list Telegram Web K webviews (targets)
tg-web-pull groups <target> [--json]          list the group/chat dialogs in a webview
tg-web-pull pull <target> [options]           pull messages from a group
tg-web-pull --help
```

`<target>` is a webContents id: `wc:42` or just `42`.
Add `--client <id>` to pick a specific cicy-desktop host (defaults to the only one).

## pull options

```
--peer <id>      select the group by peerId (see `tg-web-pull groups`, e.g. -1770576689)
--chat <title>   select the group by partial title (case-insensitive)
--open           best-effort: try to open the group first (often overridden on matrix cells)
--scroll <n>     scroll up n times to load older history (~1.5s each)
--limit <n>      return only the last n messages
--json           machine-readable output
```

Without `--peer`/`--chat`, `pull` reads whichever chat is currently active.

## Output (human)

```
# <chat title> (peer <id>)  <returned>/<total> msgs
<YYYY-MM-DD HH:MM>  <mid>  <sender|→me>
  [media] <text>
```

## Output (--json)

```json
{ "ok": true, "peerId": "-1770576689", "chat": "东南亚大事件", "active": true,
  "total": 21, "returned": 5,
  "messages": [ { "mid": 4295046987, "peerId": "-1770576689", "ts": 1792399163,
                  "iso": "2026-10-19T...", "out": false, "from": null,
                  "media": ["photo","video"], "text": "..." } ] }
```

## Exit codes

```
0  ok
1  runtime error (e.g. requested group not open — message lists open chats)
3  agent-electron missing / no cicy-code token
```
