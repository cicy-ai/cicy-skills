---
name: wechat-msg
description: Send a text message to the bound WeChat user through the ilink bot channel, reusing cicy-code's persisted login (~/cicy-ai/db/im-wechat-N.json). Subcommands: send / status.
---

# WeChat Msg

Send a text message to your WeChat through the **ilink bot channel** — the same
protocol cicy-code's built-in WeChat transport speaks. It reuses the login
state cicy-code already persisted (`~/cicy-ai/db/im-wechat-<N>.json`), so there
is no extra auth: if the WeChat channel works in cicy-code, this works.

## Scope

Use this skill when:

- the user asks to send a message / notification to their WeChat (微信);
- a long-running task should ping the user's WeChat on completion.

## Quick start

```sh
wechat-msg send "构建完成 ✅"            # send to the bound user
wechat-msg send "hi" --to <ilink_user_id> # explicit recipient
wechat-msg status                         # show account / bound user
```

## Rules

1. **ilink bots cannot push outside the user's active session window**
   (ret=-2). If sending fails with that, the user must open WeChat and send
   the bot ANY message first, then retry — this is a WeChat platform limit,
   not a bug.
2. Recipient defaults to the state file's `ilink_user_id` (the bound user).
   Multiple accounts → pick with `--acc N`.
3. Text only for now (ilink item type 1).

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
