# wechat-msg — tools

| subcmd  | wire call |
|---------|-----------|
| send    | POST `<base_url>/ilink/bot/sendmessage` — Bearer bot_token, msg {message_type:2, message_state:2, to_user_id, item_list:[{type:1,text_item}]} |
| status  | local read only |

Config: `~/cicy-ai/db/im-wechat-<N>.json` {bot_token, base_url, ilink_user_id, ilink_bot_id} — written by cicy-code (im_wechat.go QR login). Headers mirror im_wechat.go: AuthorizationType=ilink_bot_token, iLink-App-Id=bot, iLink-App-ClientVersion, X-WECHAT-UIN(random), base_info.channel_version=0.2.9.

Known limits: bot pushes only inside the user's active session window (ret=-2 otherwise); text items only.
