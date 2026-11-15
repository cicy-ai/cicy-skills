# luckgram — 工具

## 连到哪里

| 配置 | 地址 | 令牌 |
|---|---|---|
| local | `http://127.0.0.1:28765/mcp` | 这台电脑上 Luckgram 桌面版的访问令牌 |
| cloud | `https://mcp.luckgram.cc/mcp` | 云端密钥（`lgc_…`） |
| cloud，备用地址 | `https://lg-mcp.cat158.com/mcp` | 同一把云端密钥 |

每个请求都是 `POST`，带 `Authorization: Bearer <令牌>` 和 JSON-RPC 请求体（MCP 的 HTTP 传输）。不访问其他地址。

## 配置文件

| 路径 | 权限 | 敏感字段 |
|---|---|---|
| `~/cicy-ai/db/luckgram.json` | 0600 | `profiles.*.token` |

```json
{
  "default": "local",
  "profiles": {
    "local": { "url": "http://127.0.0.1:28765/mcp", "token": "<访问令牌>" },
    "cloud": { "url": "https://mcp.luckgram.cc/mcp", "token": "<云端密钥>", "device": "办公室电脑" }
  }
}
```

由 `luckgram config` 写入。不要直接读这个文件：`luckgram status` 会显示已保存的内容，令牌是打码的。

## 环境变量

| 变量 | 含义 |
|---|---|
| `LUCKGRAM_MCP_URL`、`LUCKGRAM_MCP_TOKEN` | 用这个连接，不用已保存的配置 |
| `LUCKGRAM_PROFILE` | 用哪个已保存的配置（同 `--profile`） |
| `LUCKGRAM_DEVICE` | 云端的哪台电脑（同 `--device`） |
| `CICY_LUCKGRAM_CONFIG` | 配置文件的其他路径 |

## 每条命令对应的 MCP 工具

| 命令 | 工具 | 应用里的 Skill |
|---|---|---|
| `devices` | `list_devices` | 仅云端 |
| `calls` | `list_recent_calls` | 仅云端 |
| `accounts` | `list_accounts` | 始终开启 |
| `active` | `get_active_account` | 始终开启 |
| `switch` | `switch_account` | 始终开启 |
| `friends list` | `list_friends` | `friends` |
| `friends find` | `find_user` | `friends` |
| `friends add` | `add_friend` | `friends_manage` |
| `friends remove` | `remove_friend` | `friends_manage` |
| `chats list` | `list_chats` | `chats` |
| `chats read` | `mark_chat_read` | `chats_manage` |
| `messages get` | `get_messages` | `messages` |
| `messages send` | `send_message` | `messages_send` |
| `groups join` | `join_chat` | `groups` |
| `groups leave` | `leave_chat` | `groups` |
| `groups join-all`、`groups leave-all` | 每个账号各调用一次 `join_chat` / `leave_chat` | 每个账号的 `groups` |
| `profile set` | `update_profile` | `profile` |
| `proxy list` | `list_proxies` | `proxy` |
| `proxy add` | `add_proxy` | `proxy` |
| `proxy use` | `use_proxy` | `proxy` |
| `proxy remove` | `remove_proxy` | `proxy` |
| `bots list` | `botfather_list_bots` | `botfather` |
| `bots create` | `botfather_create_bot` | `botfather` |
| `bots token` | `botfather_get_token`、`botfather_revoke_token` | `botfather` |
| `bots set` | `botfather_set_name`、`_description`、`_about`、`_privacy`、`_join_groups` | `botfather` |
| `bots commands` | `botfather_set_commands` | `botfather` |
| `bots delete` | `botfather_delete_bot` | `botfather` |
| `botfather send / press / read` | `botfather_send`、`botfather_press`、`botfather_read` | `botfather` |

Skill 在 Luckgram 桌面版里按账号开启。每个工具的完整说明、参数和上限见 <https://luckgram.cc/skills/>。

## 输出

默认输出文字，每条命令一张表或一行。`--json` 原样输出工具返回的 `structuredContent`。错误写到标准错误，以 `luckgram:` 开头；退出码表示错误类型（见帮助）。
