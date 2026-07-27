# tg — 帮助

## 命令

```
tg send <message>            发送纯文本消息
tg photo <url> [caption]     通过URL发送图片，可选标题
tg --json ...                JSON 输出模式
tg --help / -h / help
```

## 环境变量

- `CICY_API_TOKEN`   — 令牌覆盖
- `CICY_API_PORT`    — 服务端口（默认8008）
- `CICY_GLOBAL_JSON` — global.json 路径覆盖

## 服务端配置

机器人令牌和聊天ID存储在cicy-code自身的配置中（而非`global.json`）。若发送失败并显示认证/聊天错误，请修复cicy-code。
