# google — 帮助

## 顶层命令

```
google setup          首次OAuth客户端设置说明
google login          使用您的Google账户授权此主机
google status         显示授权状态
google help <svc>     按服务查看用法（gmail / sheets / drive / calendar）

google gmail ...      电子邮件管理
google sheets ...     电子表格操作
google drive ...      文件存储
google calendar ...   日历事件

google --json ...     JSON输出模式
google --help / -h / help
```

## gmail

```
google gmail list [-q "<query>"] [--max N]                列出邮件ID
google gmail read <messageId>                             单条邮件（主题/发件人/正文）
google gmail read-all [-q "<query>"] [--max N]            多条邮件，完整正文
google gmail send -t <to> -s <subject> -b <body> [-f <from>]
google gmail watch -q "<query>" [--minutes N]
```

## sheets

```
google sheets list                                          列出电子表格（Drive）
google sheets read <spreadsheetId> "<range>"               读取指定范围
google sheets write <spreadsheetId> "<range>" '[["v"]]'    覆写指定范围
google sheets append <spreadsheetId> "<range>" '[["v"]]'   追加行
google sheets create "<title>"                              创建新电子表格
```

## drive

```
google drive list [-q "<query>"] [--max N]
google drive upload <local_path> [--name N] [--mime M]
google drive download <fileId> <local_path>
google drive quota
```

## calendar

```
google calendar list                                        列出日历
google calendar events [calId] [--max N] [--from ISO] [--to ISO]
google calendar create [calId] -s "<summary>" -t <ISO_start> -e <ISO_end> [-d "<descr>"]
```

## 环境变量

- `GOOGLE_OAUTH_CLIENT` — OAuth客户端配置路径（默认 `~/cicy-ai/db/google_oauth_client.json`）
- `GOOGLE_STATE`        — 令牌状态路径（默认 `~/cicy-ai/db/google.json`）
- `OAUTH_FLOW_BASE`     — 中继基础URL（默认 `https://oauth-flow.cicy-ai.com`）
