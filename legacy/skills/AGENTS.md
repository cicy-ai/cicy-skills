# AGENTS.md

AI Agent 技能手册。统一管理所有 CLI 工具，位于 `~/Private/skills/`。

## 常用命令（已加入 PATH）

直接运行即可，无需路径：

| 命令 | 说明 |
|------|------|
| `tm ls` | 列出所有 tmux panes |
| `tm status [pane]` | 查看 pane 状态 |
| `tm capture <pane>` | 捕获 pane 内容 |
| `tm msg <pane> <text>` | 向 pane 发送消息 |
| `tm send-keys <pane> <keys>` | 发送按键 |
| `check-all` | 检查所有服务状态 |
| `fast-api` | FastAPI 服务管理 |
| `xui` | 面板管理工具 |
| `todo` | TODO 管理 |
| `cping <host>` | Cloudflare 延迟测试 |
| `cf-tunnel` | Cloudflare Tunnel 管理 |
| `mysql-exec <sql>` | 执行 MySQL 查询 |
| `tg <chat_id> <msg>` | 发送 Telegram 消息 |
| `gemini-ask <prompt>` | Gemini 问答 |
| `gemini-vision <prompt>` | Gemini 视觉问答 |
| `gpt <prompt>` | GPT 问答 |
| `eng <prompt>` | English 问答 |
| `gpt-chat` | 交互式 GPT 对话 |

## 完整 Skills 目录

```
~/Private/skills/
├── bin/              所有 CLI 入口
├── infra/            Layer 1: 基础设施
├── dev/              Layer 2: 开发工具
├── ai/               Layer 3: AI 能力
├── cicy/             Layer 4: CiCy 平台
└── services/         Layer 5: 外部服务
```

### Layer 1: 基础设施 (infra/)

| 命令 | 说明 |
|------|------|
| `cf-tunnel` | Cloudflare Tunnel 管理 |
| `cf-tunnel-py` | Cloudflare Tunnel (Python) |
| `cping <host>` | Cloudflare 延迟测试 |
| `mysql-exec <sql>` | 执行 MySQL 查询 |
| `vnc-proxy` | VNC 代理管理 |
| `ft` | 文件传输工具 |
| `llm-proxy` | LLM 代理配置 |

### Layer 2: 开发工具 (dev/)

| 命令 | 说明 |
|------|------|
| `tm` | Tmux 会话管理（核心） |
| `xui` | 面板 UI 管理 |
| `fast-api` | FastAPI 服务控制 |
| `check-all` | 全量健康检查 |
| `check-projects` | 检查项目状态 |
| `todo` | TODO 管理 |
| `chrome-debugger` | Chrome 调试 |
| `tmux-app` | Tmux 应用管理 |
| `ttyd-proxy` | ttyd 代理管理 |
| `vphone-ctl` | 虚拟手机控制 |
| `ax-click` | AX 点击工具 |
| `ax-tree` | AX 树工具 |

### Layer 3: AI 能力 (ai/)

| 命令 | 说明 |
|------|------|
| `gemini-ask <prompt>` | Gemini 问答 |
| `gemini-vision <prompt>` | Gemini 视觉 |
| `gpt <prompt>` | GPT-4 问答 |
| `gpt-chat` | 交互式 GPT |
| `eng <prompt>` | 英文问答 |
| `stt` | 语音转文字 |
| `tts` | 文字转语音 |

### Layer 4: CiCy 平台 (cicy/)

| 命令 | 说明 |
|------|------|
| `aeng-page-exec` | Agent 页面执行 |
| `agent-page-ping` | Agent 页面状态 |
| `ipc-ping` | IPC 通信测试 |
| `ai-desktop` | AI Desktop 管理 |
| `electron-mcp-ui` | Electron MCP UI |
| `cf-workers` | Cloudflare Workers |
| `cf-pages` | Cloudflare Pages |

### Layer 5: 外部服务 (services/)

| 命令 | 说明 |
|------|------|
| `tg <chat_id> <msg>` | 发送 Telegram |
| `tg-bot` | Telegram Bot 管理 |
| `google` | Google 服务 |
| `gmail` | Gmail 操作 |

## 常用操作示例

```bash
# Tmux 操作
tm ls                           # 列出所有 panes
tm status w-10001               # 查看 w-10001 状态
tm capture w-10001              # 捕获内容
tm msg w-10001 "hello"          # 发消息
tm send-keys w-10001 Enter      # 发送按键

# 服务检查
check-all                        # 全量检查
fast-api status                 # FastAPI 状态

# 消息通知
tg 123456 "任务完成"            # 发 Telegram
```

## 添加新 Skill

1. 脚本放到对应层目录
2. `chmod +x dev/my-tool.sh`
3. `cd bin && ln -sf ../dev/my-tool.sh my-tool`

## 工作目录

- 根目录: `/home/w3c_offical/Private/`
- Workers: `/home/w3c_offical/Private/workers/`
- Skills: `/home/w3c_offical/Private/skills/`
- 主控 pane: `w-10001`
