# luckgram — tools

## Where it connects

| Profile | Address | Token |
|---|---|---|
| local | `http://127.0.0.1:28765/mcp` | the access token of Luckgram Desktop on this computer |
| cloud | `https://mcp.luckgram.cc/mcp` | the cloud key (`lgc_…`) |
| cloud, backup address | `https://lg-mcp.cat158.com/mcp` | the same cloud key |

Every request is `POST` with `Authorization: Bearer <token>` and a JSON-RPC body (MCP over HTTP). Nothing else is contacted.

## Configuration

| Path | Mode | Secret fields |
|---|---|---|
| `~/cicy-ai/db/luckgram.json` | 0600 | `profiles.*.token` |

```json
{
  "default": "local",
  "profiles": {
    "local": { "url": "http://127.0.0.1:28765/mcp", "token": "<access token>" },
    "cloud": { "url": "https://mcp.luckgram.cc/mcp", "token": "<cloud key>", "device": "Office PC" }
  }
}
```

Written by `luckgram config`. Do not read it: `luckgram status` shows what is saved with the tokens masked.

## Environment variables

| Variable | Meaning |
|---|---|
| `LUCKGRAM_MCP_URL`, `LUCKGRAM_MCP_TOKEN` | Use this connection instead of a saved profile |
| `LUCKGRAM_PROFILE` | Which saved profile (same as `--profile`) |
| `LUCKGRAM_DEVICE` | Which computer on the cloud (same as `--device`) |
| `CICY_LUCKGRAM_CONFIG` | Another path for the config file |

## MCP tool behind each command

| Command | Tool | Skill in the app |
|---|---|---|
| `devices` | `list_devices` | cloud only |
| `calls` | `list_recent_calls` | cloud only |
| `accounts` | `list_accounts` | always on |
| `active` | `get_active_account` | always on |
| `switch` | `switch_account` | always on |
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
| `groups join-all`, `groups leave-all` | `join_chat` / `leave_chat` once per account | `groups` on each account |
| `profile set` | `update_profile` | `profile` |
| `proxy list` | `list_proxies` | `proxy` |
| `proxy add` | `add_proxy` | `proxy` |
| `proxy use` | `use_proxy` | `proxy` |
| `proxy remove` | `remove_proxy` | `proxy` |
| `bots list` | `botfather_list_bots` | `botfather` |
| `bots create` | `botfather_create_bot` | `botfather` |
| `bots token` | `botfather_get_token`, `botfather_revoke_token` | `botfather` |
| `bots set` | `botfather_set_name`, `_description`, `_about`, `_privacy`, `_join_groups` | `botfather` |
| `bots commands` | `botfather_set_commands` | `botfather` |
| `bots delete` | `botfather_delete_bot` | `botfather` |
| `botfather send / press / read` | `botfather_send`, `botfather_press`, `botfather_read` | `botfather` |

Skills are switched on per account in Luckgram Desktop. The full description of each tool, its arguments and limits: <https://luckgram.cc/skills/>.

## Output

Text by default, one table or one line per command. `--json` prints the tool's `structuredContent` unchanged. Errors go to stderr, prefixed `luckgram:`; the exit code says what kind (see help).
