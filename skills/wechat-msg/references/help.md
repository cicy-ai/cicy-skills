# wechat-msg — help

```
wechat-msg send <text...>      Send a text message to the bound WeChat user.
    [--to <ilink_user_id>]     Override the recipient (default: state ilink_user_id).
    [--acc N]                  Pick the account when several im-wechat-N.json exist.
wechat-msg status [--acc N]    Show account file, base_url, bot id, bound user.
wechat-msg --help
```

Exit codes: 0 ok · 1 config/protocol error · 2 usage · 3 ilink error ·
4 outside session window (ret=-2 — open WeChat, message the bot, retry).

State: reads `~/cicy-ai/db/im-wechat-<N>.json` (written by cicy-code's WeChat
channel QR login). No token of its own; no writes.
