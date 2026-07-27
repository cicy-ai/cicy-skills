# agent-identity 工具

| 工具 | 示例 | 描述 |
|------|------|------|
| `all` | `agent-identity` | 报告 claude、codex、opencode、kiro 的身份信息 |
| `claude` | `agent-identity claude` | 设备 `userID` + OAuth 账户（uuid / 邮箱 / 组织）+ 订阅状态 |
| `codex` | `agent-identity codex` | `auth_mode`（apikey / chatgpt）+ 如为 ChatGPT 登录则含 `account_id` |
| `opencode` | `agent-identity opencode` | 已配置的提供商名称（不包含密钥） |
| `kiro` | `agent-identity kiro` | AWS IdC/SSO OAuth `client_id`、`client_id_hash`、区域、认证方式 |
| `--json` | `agent-identity all --json` | JSON 输出：`{ ok, results: [{ agent, found, sources, fields }] }` |

所有敏感材料（令牌、API 密钥、`clientSecret`）均已脱敏/省略。
