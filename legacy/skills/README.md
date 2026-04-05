# Skills

统一管理所有 CLI 工具。真实文件在 `~/Private/skills/`，通过 symlink 分发给不同 agent。

## 目录结构

```
~/Private/skills/
├── bin/              ← 所有 CLI 入口 (symlink → 各层)
├── infra/            ← Layer 1: 基础设施 (cf-tunnel, cping, mysql, vnc, frp)
├── dev/              ← Layer 2: 开发工具 (xui, fast-api, tmux, todo, cdp)
├── ai/               ← Layer 3: AI 能力 (gemini-ask, gemini-vision)
├── cicy/             ← Layer 4: CiCy 平台 (agent-page-ping, ipc-ping)
├── services/         ← Layer 5: 外部服务 (tg, google, gmail)
├── link-skills.sh    ← 一键 symlink 到任意 agent
└── README.md
```

## 使用

### PATH 方式（推荐）

`.bashrc` 加一行：
```bash
export PATH="$HOME/Private/skills/bin:$PATH"
```

### Symlink 到 agent

```bash
# 全局（所有 agent 共享）
bash ~/Private/skills/link-skills.sh

# 给特定 worker
bash ~/Private/skills/link-skills.sh ~/Private/workers/w-10001/.local/bin

# 给 kiro
bash ~/Private/skills/link-skills.sh ~/.kiro/bin

# 给 claude
bash ~/Private/skills/link-skills.sh ~/.claude/bin
```

## 添加新 skill

1. 脚本放到对应层目录（如 `dev/my-tool.sh`）
2. `chmod +x dev/my-tool.sh`
3. `cd bin && ln -sf ../dev/my-tool.sh my-tool`
4. 所有已 link 的 agent 自动可用

## 部署到新机器

```bash
# 同步 ~/Private 后
bash ~/Private/skills/link-skills.sh
```
