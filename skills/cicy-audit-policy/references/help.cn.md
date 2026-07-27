# cicy-audit-policy

cicy 审计策略后端的轻量级客户端。通过 `$PORT`（默认 8008）与 cicy-code 通信，使用 `~/cicy-ai/global.json#api_token` 进行身份验证。该后端与用户界面审计仪表盘使用相同的后端。

```
# 策略
cicy-audit-policy show                              # 完整的策略 JSON
cicy-audit-policy summary                           # 适合单屏查看的用户视图
cicy-audit-policy patch '<json>'                    # 将 JSON 深度合并到策略中
cicy-audit-policy set <key.path> <value>            # 设置单个字段
cicy-audit-policy unset <key.path>                  # 移除单个字段
cicy-audit-policy rule-test <regex|js> <pattern> <text>   # 空运行匹配器
cicy-audit-policy effective <agent>                 # 单个代理的合并策略

# 日志 / 分析
cicy-audit-policy events [--severity S] [--agent A] [--direction outbound|inbound] [--rule R] [--limit N] [--json]
cicy-audit-policy event <id>                        # 单个事件的完整详情
cicy-audit-policy stats                             # 按规则/代理/严重性统计命中次数
cicy-audit-policy snapshot <ref>                    # 原始取证快照（证据）
cicy-audit-policy agents                            # 有事件的代理
cicy-audit-policy recent [--rule R] [--agent A] [--limit N]   # 紧凑列表
cicy-audit-policy history                           # ~/cicy-ai/audit 的 git 日志

# 误报 / 允许列表
cicy-audit-policy allowlist                         # 显示抑制项
cicy-audit-policy allowlist-add sha256:<hash> "<reason>"
cicy-audit-policy allowlist-remove <content_hash|path|agent> <value>
```

## 注意事项

- `patch` 会逐键合并对象；数组会被**替换**而非追加——请传递完整的预期列表。
- `set <value>` 在可能时会解析为 JSON（`true`、`42`、`"log"`、`["a","b"]`），否则视为纯字符串。
- 每次写入都会返回一个 `policy_hash`；后端会验证模式、重新计算哈希，并通过 fsnotify 重新加载运行中的管道（约 200ms）。
- `events` 读取 `/api/audit/events`；可以传递过滤标志，或原始查询字符串（例如 `events "severity=high,critical&direction=outbound"`）。`--json` 会转储完整的事件对象，而不是每行一个。
- `event <id>` / `snapshot <ref>` 返回原始的、**未脱敏**的取证详情——这是证据，与对话处于相同的信任域；请勿泄露。
- `stats` 按规则/代理/严重性/操作汇总命中次数——可用于查找干扰规则或重复违规者。
- 允许列表仅抑制**发现结果**（警报），而非底层事件。`allowlist-add` 接受内容 sha256（如果省略，系统会自动添加 `sha256:` 前缀）。
- `history` 仅在自主性 tick 自动提交后才显示输出；通过此技能进行的手动编辑**不会**自动提交。

## 退出码

- `0` 成功
- `1` 错误（无效 JSON、后端不可达、HTTP 错误、缺少键）
