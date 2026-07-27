# wechat-msg — 工具

| 子命令  | 网络调用 |
|---------|-----------|
| 发送    | POST `<base_url>/ilink/bot/sendmessage` — Bearer bot_token, msg {message_type:2, message_state:2, to_user_id, item_list:[{type:1,text_item}]} |
| 状态    | 仅本地读取 |

配置：`~/cicy-ai/db/im-wechat-<N>.json` {bot_token, base_url, ilink_user_id, ilink_bot_id} — 由 cicy-code（im_wechat.go 二维码登录）写入。请求头与 im_wechat.go 保持一致：AuthorizationType=ilink_bot_token, iLink-App-Id=bot, iLink-App-ClientVersion, X-WECHAT-UIN（随机值）, base_info.channel_version=0.2.9。

已知限制：机器人仅在用户的活跃会话窗口内推送消息（否则返回 ret=-2）；仅支持文本项。
