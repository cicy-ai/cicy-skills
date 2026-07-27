# 电子邮件 — 帮助

## 命令

```
email config                             在 $EDITOR 中创建/打开 ~/cicy-ai/db/email.json
email status [--check] [--json]          配置状态；--check 实际连接并登录
                                         smtp/imap/pop3（✓/✗ + 原因，任一下线则退出码1）
email send [options]                     通过 SMTP 发送消息
email list [--n N] [--protocol p] [--json]   列出最近的收件箱消息（IMAP/POP3）
email read <n> [--protocol p] [--json]   按索引读取消息（IMAP/POP3）
email --help / -h / help                 打印此帮助信息
```

## `email send` 选项

| 标志           | 必需 | 描述                                      |
|----------------|----------|--------------------------------------------------|
| `--to <地址>`  | 是¹     | 收件人（多个用逗号分隔）         |
| `--subject <主题>`| 是      | 主题（UTF-8 自动编码为 RFC 2047）         |
| `--body <文本>`| ²        | 纯文本正文                                  |
| `--html <HTML>`| ²        | HTML 正文（与 `--body` 组合为 multipart/alternative）  |
| `--from <地址>`| 否       | 覆盖配置中的 `smtp.from`                      |
| `--json`       | 否       | 输出 JSON 而非人类可读文本                  |

¹ 如果配置中设置了 `default_to`，可省略 `--to`。
² 必须提供 `--body` 或 `--html` 中的至少一个。

## `email list` / `email read` 选项

| 标志                 | 描述                                            |
|----------------------|--------------------------------------------------------|
| `--n <数量>`        | （列表）显示最近多少条消息（默认 10）   |
| `--protocol imap|pop3` | 强制使用接收协议（默认：已配置时使用 imap） |
| `--json`             | 输出 JSON                                              |

`email read <n>` 接受 `email list` 显示的索引值。

## 传输协议

- **SMTP** 发送：`secure:true` → 隐式 TLS (:465)；`secure:false` → STARTTLS (:587)。认证方式 LOGIN。
- **IMAP** 读取：隐式 TLS (:993)，`LOGIN` + `SELECT INBOX` + `FETCH`。
- **POP3** 读取：隐式 TLS (:995)，`USER`/`PASS` + `LIST`/`TOP`/`RETR`。

## 示例

```bash
email send --to alice@example.com --subject "Hi" --body "Hello"
email send --to a@x.com,b@y.com --subject "Heads up" --html "<b>Hi</b>"
email send --subject "Done" --body "Build OK"   # 使用 default_to
email list --n 5
email read 1
```

## 环境变量

- `CICY_EMAIL_CONFIG` — 覆盖配置文件路径
- `EDITOR`/`VISUAL` — 用于 `email config`
