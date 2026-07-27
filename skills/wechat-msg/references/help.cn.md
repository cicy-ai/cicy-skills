# wechat-msg — 帮助

```
wechat-msg send <text...>      向绑定的微信用户发送文本消息。
    [--image <path>]           发送图片（png/jpg/webp/gif/bmp）。若与文本结合使用可同时发送两者；单独使用 --image 则仅发送图片。
    [--to <ilink_user_id>]     覆盖接收者（默认：state ilink_user_id）。
    [--acc N]                  当存在多个 im-wechat-N.json 时选择指定账号。
wechat-msg status [--acc N]    显示账号文件、base_url、机器人ID、绑定用户信息。
wechat-msg --help
```

图片通过 `ilink/bot/getuploadurl` 接口加密上传至微信 CDN（AES-128-ECB 加密），随后作为 `image_item` 载体搭载在 `sendmessage` 指令中传输。

退出代码：0 成功 · 1 配置/协议错误 · 2 用法错误 · 3 ilink 错误 ·
4 会话窗口外操作（ret=-2 —— 请打开微信，向机器人发送消息后重试）。

状态：读取 `~/cicy-ai/db/im-wechat-<N>.json`（由 cicy-code 的微信频道二维码登录流程写入）。自身无令牌；无写入操作。
