# google — 工具集

## 功能概述

直接通过 REST 调用 Google API。无需依赖 `googleapis` npm 包——采用纯 `fetch` 配合手动刷新访问令牌的方式。OAuth 认证流程通过 `oauth-flow.cicy-ai.com` Worker 实现，该 Worker 转发授权码（有效期 10 分钟），但**绝不会接触** `client_secret` 或任何令牌。

## OAuth 流程

```
1. cmdLogin 生成随机会话ID并打印：
     https://oauth-flow.cicy-ai.com/start?session=<id>&client_id=<id>&scopes=<...>

2. 用户打开链接 → 重定向至 Google → 授权同意 → Google → 转发至 /callback。
   中继服务将授权码存储在 KV 中并绑定会话ID（有效期 10 分钟）。

3. cmdLogin 每 2 秒轮询一次 https://oauth-flow.cicy-ai.com/poll?session=<id>，
   最长持续 10 分钟。

4. 接收授权码后，封装程序向以下地址发起 POST 请求：
     https://oauth2.googleapis.com/token
   请求体为 { client_id, client_secret, code, redirect_uri,
              grant_type: 'authorization_code' }
   用于交换 { refresh_token, access_token, expires_in }。

5. 封装程序将这些令牌与授权邮箱（通过 /v1/userinfo 获取）一同写入
   ~/cicy-ai/db/google.json（权限 0600）。
```

## 令牌刷新机制

每次 API 请求前会调用 `getAccessToken()`。若 `expires_at - 60s` 仍在未来，则直接使用缓存的 `access_token`。否则向 `oauth2.googleapis.com/token` 发送 POST 请求，参数为 `{ client_id, client_secret, refresh_token, grant_type: 'refresh_token' }`，随后更新 `expires_at` 并持久化存储。

## 使用的 API 端点

| 服务     | 端点                                                                 |
|----------|----------------------------------------------------------------------|
| Gmail    | `gmail.googleapis.com/gmail/v1/users/me/{messages,messages/<id>,messages/send}` |
| Sheets   | `sheets.googleapis.com/v4/spreadsheets[/<id>/values/<range>:{update,append}]`  |
| Drive    | `www.googleapis.com/drive/v3/files`、`/upload/drive/v3/files`、`/about`       |
| Calendar | `www.googleapis.com/calendar/v3/{users/me/calendarList,calendars/<id>/events}` |

## 配置文件

| 路径                                       | 权限   | 敏感字段                      |
|--------------------------------------------|------|------------------------------|
| `~/cicy-ai/db/google_oauth_client.json`    | 0600 | `client_secret`              |
| `~/cicy-ai/db/google.json`                 | 0600 | `refresh_token`、`access_token` |

OAuth 客户端配置文件支持以下格式：
- 扁平格式：`{ "client_id": "...", "client_secret": "..." }`
- Google 官方下载格式：`{ "web": { "client_id": "...", ... } }` 或 `{ "installed": {...} }`

## 严格规范

- 禁止使用 cat / read / print 查看任意配置文件
- 禁止要求用户将 client_secret / refresh_token / 授权码粘贴到对话中
- 必须逐步引导用户完成 `google setup`，不得跳过任何步骤
