# tg — 工具

## 线路协议

```
POST http://127.0.0.1:$CICY_API_PORT/api/tg/send
  Authorization: Bearer <api_token>
  Content-Type: application/json
  { "text": "..." }

POST .../api/tg/photo
  { "photo": "<url>", "caption": "..." }

→ Telegram 机器人 API 响应：{ ok: true, result: ... }
                            或 { ok: false, description: "...", error_code: 400 }
```

当收到 `ok: true` 时，封装器会打印 `✓ 已发送。`；当收到 `ok: false` 时，会打印 `✗ <描述>`。使用 `--json` 参数时，它会返回包裹在 `{ ok: true, data: ... }` 或 `{ ok: false, error: ... }` 中的原始响应。

## 配置

| 路径                    | 权限 | 密钥字段        |
|-------------------------|------|----------------|
| `~/cicy-ai/global.json` | 0600 | `api_token`    |

Telegram 机器人令牌/聊天 ID **不在此处**——它们在 cicy-code 自身的服务器端配置中。
