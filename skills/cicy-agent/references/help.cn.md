# cicy-agent — 帮助

## 命令

```
cicy-agent list                               列出所有面板（表格形式）
cicy-agent ls                                 简短列表
cicy-agent tree                               树形结构（JSON格式）
cicy-agent windows                            窗口列表（JSON格式）
cicy-agent capture <pane>                     捕获原始面板文本
cicy-agent reply <pane> [--full]              面板的最后回复文本（已解析）
cicy-agent msg <pane> <text>                  发送聊天消息。默认：在消息存储中跟踪
            [--no-callback] [--notify]         （状态 → done/failed）但不产生
                                              完成聊天行，并打印 msg_id=<id>
                                              以便后续查找。--notify 还会在轮次结束时
                                              推送单行状态唤醒（"🔔 [B] msg <id>
                                              → done"；如果对方已回复则抑制）。
                                              --no-callback = 完全
                                              即发即忘（不跟踪，不推送）。
cicy-agent msgs [--from P] [--to P]           跨代理消息链接：谁→谁，状态，
            [--status S] [--open] [--json]     ID，以及发送方派发轮次（from-turn）
                                              和接收方操作（to-turn）的 q⟶answer 摘要，
                                              均从各自代理的历史记录中联接获取。
cicy-agent broadcast [--timeout <ms>] <text>  仅向在线代理群发（离线
                                              代理无法接收——无 --all 选项）。
                                              每次发送都有每面板超时（默认
                                              8000ms），以便卡死的面板不会阻塞运行。
                                              跳过发送者。打印已送达/失败状态。
cicy-agent get_online_agents                  名册：拥有活跃 tmux 会话的代理
cicy-agent get_offline_agents                 名册：数据库中存在但无活跃会话的代理
cicy-agent get_all_agents                     名册：整个数据库（在线 ∪ 离线 = 全部）
                                              名册行包含 {id, title,
                                              agent_type, online, model, provider,
                                              local_gateway, context_usage, cost, idle}。
                                              运行时字段读取代理的
                                              ~/cicy-ai/workers/<id>/.cicy/history/
                                              （reply.json → idle+model, context.json →
                                              context_usage, usage.jsonl → Σcost +
                                              provider）；不可用 → null / "n/a"
                                              （使用 --team 时始终为 n/a——文件是远程的）。
                                              idle 是启发式判断："思考中"或请求活动 <45秒前
                                              = 忙碌。
cicy-agent send-keys <pane> <keys...>         tmux send-keys
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

cicy-agent team add <name> <api> <token>      注册另一个团队的 cicy-code（立即探测）
            [--proxy http://127.0.0.1:9001]    --proxy：通过出口代理访问此团队（基于 curl；
                                              当团队的域名在直连路径上被 SNI 过滤时使用，
                                              例如 *.trycloudflare.com 快速隧道）
cicy-agent team ls                            列出已注册的团队（令牌已掩码）
cicy-agent team rm <name>                     取消注册一个团队
cicy-agent team ping [name]                   通过 /api/health 检测活性与版本——在线 ✓/✗，
                                              版本，代理数量。省略名称时检测所有团队；
                                              如果任何团队宕机则退出码为 1。

cicy-agent --team <NAME> ...                  针对已注册团队运行任意命令
                                              （他们的 cicy-code API + 令牌）。旧别名：--node。
                                              注意：msg --notify 无法跨团队推送——
                                              使用 `cicy-agent msgs --team <NAME>` 检查状态。
cicy-agent --json ...                         JSON 输出模式
cicy-agent --help / -h / help
cicy-agent tools
```

## 环境变量

- `CICY_API_TOKEN`     — 不记名令牌（覆盖 global.json）
- `CICY_API_PORT`      — 本地服务器端口（默认 8008）
- `CICY_GLOBAL_JSON`   — global.json 路径覆盖
- `CICY_AGENT_JSON`    — 团队注册表覆盖（默认 `~/cicy-ai/db/cicy-agent.json`）
- `X_AGENT_SHORT_ID`   — `msg --callback` 所需（在面板内部设置）
