# cicy-agent — 帮助

## 命令

```
cicy-agent ls                                 简短列表
cicy-agent capture <pane>                     捕获原始面板文本
cicy-agent reply <pane|team.agent> [--full]   最后一条结构化回复；支持本地与 Cloud
cicy-agent history <pane|team.agent>           历史回合（默认最新）
            [--index N]                        从 history.db 读取；支持本地与 Cloud
cicy-agent msg <pane> <text>                  发送本地或 Cloud 跟踪消息，立即打印
            [--no-wait] [--timeout S]          msg_id，默认等待结构化 done/failed 回复。
            [--no-callback] [--notify]         --no-wait 在接收后立即返回；--notify 还会
                                              在轮次结束时
                                              推送单行状态唤醒（"🔔 [B] msg <id>
                                              → done"；如果对方已回复则抑制）。
                                              --no-callback = 完全
                                              即发即忘（不跟踪，不推送）。
cicy-agent msgs [team.agent] [--from P]        跨代理消息链；可指定 Cloud 目标
            [--to P]                           通过 RPC 查询目标 Instance
            [--status S] [--open] [--json]     ID，以及发送方派发轮次（from-turn）
                                              和接收方操作（to-turn）的 q⟶answer 摘要，
                                              均从各自代理的历史记录中联接获取。
cicy-agent broadcast [--timeout <ms>] <text>  仅向在线代理群发（离线
                                              代理无法接收——无 --all 选项）。
                                              每次发送都有每面板超时（默认
                                              8000ms），以便卡死的面板不会阻塞运行。
                                              跳过发送者。打印已送达/失败状态。
cicy-agent get_all_agents                     名册：整个数据库（在线 ∪ 离线 = 全部）
                                              名册行包含 {id, title,
                                              agent_type, online, model, provider,
                                              local_gateway, context_usage, cost, idle}。
                                              运行时字段读取代理的
                                              ~/cicy-ai/workers/<id>/.cicy/history/
                                              （reply.json → idle+model, context.json →
                                              context_usage, usage.jsonl → Σcost +
                                              provider）；不可用 → null / "n/a"
                                              idle 是启发式判断："思考中"或请求活动 <45秒前
                                              = 忙碌。
cicy-agent send-keys <pane> <keys...>         tmux send-keys
cicy-agent projects                           仅列出所有 Project，不展开 Agents
cicy-agent projects --current                 列出当前 Project 及其 Agents
cicy-agent projects <id|name>                 按 ID 或完整名称列出一个 Project 及其 Agents
cicy-agent restart                            重启所有面板
cicy-agent clear <pane>                       清除面板
cicy-agent fork <src> [--title T] [--master PANE]     复制代理以便新代理继承其上下文
cicy-agent create <title> [--type cicy] [--model M]   从头创建全新代理（POST /api/panes/create）。
            [--role R] [--role-template RT] [--master PANE]   agent_type 默认为 cicy。非克隆——使用 fork 继承上下文。
            --role 不是人格角色。它设置 agent_config.role：在 UI 列表中显示的
              名册标签，其魔法值 "worker"（默认）/ "master" 还会在主/工作代理拓扑结构
              和工作代理完成跟踪中标记面板。自由格式文本会静默丢弃 "worker" 标记——
              除非您确实需要，否则请保持原样。
            --role-template 选择人格角色（默认：assistant）：模板目录
              ~/cicy-ai/memory/agents/<RT>/，其中的 system.md 成为系统提示词，
              role.md 用于初始化代理的 AGENTS.md（编辑该文件进行自定义）。

cicy-agent whoami                            查看当前 Agent ID、team ID、Instance ID、
                                              固定域名和 HTTPS URL。
cicy-agent --json whoami                     供脚本使用的结构化身份信息。

cicy-agent cloud ls [--all]                  按 Team 分组列出 Cloud Agents。默认仅在线 Team；
                                              --all 包含离线 Team。
cicy-agent cloud agents [--all]              平铺列出 Cloud Agent 完整地址。
cicy-agent msg <team.agent> <消息>            带 Team 前缀的目标自动通过 CiCy Cloud 路由；
                                              不需要目标 Instance Token；立即输出 msg_id + pending，
                                              默认继续等待并输出 msg → done 和关联回复。

cicy-agent --json ...                         JSON 输出模式
cicy-agent --help / -h / help
cicy-agent tools
```

## 环境变量

- `CICY_API_TOKEN`     — 不记名令牌（覆盖 global.json）
- `CICY_API_PORT`      — 本地服务器端口（默认 8008）
- `CICY_GLOBAL_JSON`   — global.json 路径覆盖
- `CICY_CLOUD_DEVICE_JSON` — Cloud 登录文件（默认 `~/cicy-ai/db/cloud-device.json`）
- `X_AGENT_SHORT_ID`   — `msg --callback` 所需（在面板内部设置）
