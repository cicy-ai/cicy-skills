# agent-creator — 端点 / 环境变量 / 退出码

## 后端API（本地 cicy-code）

| 方法 | 路径 | 用途 |
|--------|------|---------|
| GET | `/api/custom-agents` | 返回 `{ agents: [...], toolGroups: [...], dir }` |
| POST | `/api/custom-agents` | 请求体 `{ name, tools[], model, body }` → 创建/覆盖 |
| DELETE | `/api/custom-agents/<slug>` | 删除一个 |

每个智能体存储在主机的 `~/cicy-ai/agents/<slug>/AGENT.md` 文件中：

```
---
name: 销售助手
tools: [coordinate, shell]
model: claude-opus-4-8
---
你是销售助手,主动热情,擅长挖掘需求。
```

该文件会被 cicy-code **热读取**——编辑或新建的智能体在下一次请求时即生效，无需重启。

## 配置 / 认证

- `config.path`：`~/cicy-ai/global.json`（权限 `0600`），密钥字段 `api_token`。
- 优先级：环境变量 `CICY_API_TOKEN` 优先；否则使用 `~/cicy-ai/global.json` 中的 `api_token`。

## 环境变量

| 变量 | 默认值 | 含义 |
|-----|---------|---------|
| `CICY_API_TOKEN` | — | 令牌（覆盖 global.json） |
| `CICY_API_PORT` | `8008` | cicy-code API 端口 |
| `CICY_GLOBAL_JSON` | `~/cicy-ai/global.json` | 覆盖配置文件路径 |

## 退出码

| 代码 | 含义 |
|------|---------|
| 0 | 成功 |
| 1 | 请求/服务器错误（非 2xx） |
| 2 | 使用错误 / 未知命令 / 缺少参数 / 未找到 |
| 3 | 无法连接 cicy-code，或认证失败 / 缺少令牌 |

## 相关资源

- `cicy-skill-spec` — 技能打包规范
- `cicy-agent` — 操作实时面板（启动/监控运行中的智能体）
