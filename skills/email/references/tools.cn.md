# 电子邮件 — 工具

## 协议（无外部 HTTP API）

- **SMTP**（发送） — 隐式 TLS :465 或 STARTTLS :587，`AUTH LOGIN`，`MAIL`/`RCPT`/`DATA` 命令。
- **IMAP**（接收） — 隐式 TLS :993，`LOGIN`/`SELECT INBOX`/`FETCH` 命令。
- **POP3**（接收） — 隐式 TLS :995，`USER`/`PASS`/`STAT`/`LIST`/`TOP`/`RETR` 命令。

所有连接均通过 Node 内置 `net`/`tls` 模块。零 npm 依赖。

## 配置

| 路径                       | 权限 | 敏感字段                              |
|----------------------------|------|----------------------------------------|
| `~/cicy-ai/db/email.json`  | 0600 | `smtp.pass`，`imap.pass`，`pop3.pass`  |

配置键：
- `smtp.{host,port,secure,user,pass,from}` — 发送 (`send`) 功能必需。
  `secure:true` 表示隐式 TLS (端口 465)；`secure:false` 表示 STARTTLS (端口 587)。
- `imap.{host,port,user,pass}` — 可选，用于列表 (`list`)/读取 (`read`) (隐式 TLS :993)。
- `pop3.{host,port,user,pass}` — 可选，用于列表 (`list`)/读取 (`read`) (隐式 TLS :995)。
- `default_to` — 可选的默认收件人。

## 环境变量

- `CICY_EMAIL_CONFIG` — 覆盖配置文件路径
- `EDITOR`/`VISUAL` — 用于 `email config` 命令

## JSON 输出

`status --json`:
```json
{
  "ok": true,
  "data": {
    "config_path": "/home/<用户>/cicy-ai/db/email.json",
    "exists": true,
    "permissions": "0600",
    "smtp_ready": true,
    "imap_ready": false,
    "pop3_ready": false,
    "default_to": null,
    "send_ready": true,
    "receive_ready": false,
    "smtp_from": "You <you@example.com>"
  }
}
```

`send --json` (成功时):
```json
{ "ok": true, "data": { "to": ["alice@example.com"], "from": "...", "subject": "..." } }
```

`list --json`:
```json
{ "ok": true, "data": { "protocol": "imap", "messages": [ { "index": 42, "from": "...", "subject": "...", "date": "..." } ] } }
```

`read --json`:
```json
{ "ok": true, "data": { "protocol": "imap", "index": 42, "from": "...", "subject": "...", "date": "...", "raw": "<完整的 rfc822 内容>" } }
```

## 退出码

| 代码 | 含义                                   |
|------|-------------------------------------------|
| 0    | 成功                                   |
| 1    | 运行时/协议错误                    |
| 2    | 使用不当 / 缺少必需标志         |
| 3    | 配置缺失或仍为占位符             |
