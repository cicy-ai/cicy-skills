# 角色库(role library)

cicy-code"AI 公司"里**网关 worker 的岗位说明书**。每个角色一份 `SKILL.md` = 一份
charter(人格 + 职责 + 边界 + 升级规则)。Opus(master `w-10001`)按项目 brief 从这个库
挑角色,现造**一次性 agent** 来干活,做完销毁。

> 设计背景见 w-10001 workspace 的 `AI-COMPANY-ARCHITECTURE.md`。

## 花名册

| 角色 | role | agent_type | model | 干什么 |
|------|------|-----------|-------|--------|
| 高级工程师 | `dev-senior` | codex | gpt-5.5 | 核心 / 难 / 涉取舍的代码 |
| 普通工程师 | `dev-junior` | codex | deepseek-v4-pro | 明确、机械、常规实现 |
| QA / 验收官 | `qa` | claude | deepseek-v4-pro | 对照验收标准独立核验,出 PASS/FAIL + 证据 |
| 代码评审 | `reviewer` | claude | deepseek-v4-pro | 找 production bug,明显的修、存疑的标 |
| 安全官 | `security` | claude | deepseek-v4-pro | OWASP + STRIDE 审计 |
| 发布工程 | `release` | opencode | deepseek-v4-pro | 同步→构建/测试→PR/部署→验证 |
| 运维 / 打杂 | `ops` | opencode | deepseek-v4-pro | 环境、脚本、迁移、provisioning |

> 架构师 = master `w-10001`(Opus 4.7,常驻、官方 auth),不在本库——本库只装**可现造的网关 worker**。
> 上表 model 是默认档,可按任务难度上调(如难活的 reviewer/security 临时换 gpt-5.5)。

## frontmatter 契约(团队组建 skill 读这个)

```yaml
---
name: role-<id>                 # role-qa / role-dev-senior ...
description: <一句话>            # Claude Code skill 描述
role: <id>                      # qa / dev-senior / ...
agent_type: claude|codex|opencode   # 用哪个 CLI 起 agent
model: <gateway 模型名>          # 走本地网关时的模型档
independent_from: dev            # 可选:必须用 ≠ 该角色的模型(防共享盲区,QA/reviewer 用)
ephemeral: true                  # 一次性 agent:做完即销毁
---
```

## charter 统一结构

身份 → 一次性 agent 声明 → 输入 → 工作流 → 核心纪律 → 产出格式 → 升级规则 → 边界 → 完成。
命令一律用真命令:`cicy-todo add/start/done/back/show`、`cicy-agent msg <pane> "..." --callback`。

## 如何落到 worker(关键:角色靠 CLAUDE.md / AGENTS.md 生效)

角色库的 `SKILL.md` 是**源**;让一个 worker 真正*变成*某角色,是把 charter 写进它自己
workspace 的注入文件:

- **文件选择**:claude 型 → `<workspace>/CLAUDE.md`;codex / opencode 型 → `<workspace>/AGENTS.md`。(走本地网关时两者都会被注入进 system prompt;放对应 CLI 原生读的那个最稳。)
- **内容 = base 前言 + 角色 charter**:取 [`_base.md`](./_base.md) 填好占位符(AGENT_ID / WORKSPACE / MASTER / ROLE),再接上 `skills/roles/<role>/SKILL.md` **去掉 frontmatter 的正文**。
- **谁来写**:团队组建 skill 在 `create` 出 worker 后、派活前,把这个文件写进新 worker 的 workspace。一次性 agent 销毁后该文件可留可清。
- **前提**:worker `use_custom_gateway=1` 注入才生效(见主仓库 CLAUDE.md「Gateway CLAUDE.md / AGENTS.md injection」)。

## 协作约定

- **状态机**(借 cicy-todo 现有状态模拟):`todo → (dev) doing → (QA) done|back`。dev **不自己标 done**,QA PASS 才 done、FAIL 用 `back` 退回。
- **issue = QA/安全 创建的 todo**:`cicy-todo w-<dev> add "FAIL/SEC: 复现 / 期望 / 实际"`。
- **升级**:遇歧义 / 架构决策 / 反复失败 → `cicy-agent msg w-10001 --callback` 给 master。
- **QA/reviewer 独立**:刻意用 ≠ dev 的模型。
