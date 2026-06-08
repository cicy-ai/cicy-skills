---
name: cicy-team
description: Team-builder for cicy-code: spawn one-shot gateway worker agents from a role library (qa/dev/reviewer/release/security/ops) and compose each worker's CLAUDE.md/AGENTS.md from its charter.
---

# Cicy Team — 团队组建 / 调度

给 **master / architect**(`w-1001`,Opus)用。你不写产品代码;你把项目拆成带验收标准的
任务,从**角色库**现造**一次性 agent** 去做,收口验收,推到上线。

> 完整设计见 cicy-code 仓库工作区的 `AI-COMPANY-ARCHITECTURE.md`。

## 核心命令

```sh
cicy-team roles                                  # 看角色库里有哪些角色
cicy-team spawn-role <role> [--model M] [--title T] [--master w-x] [--task "<text>"] [--no-callback]
```

`spawn-role` 一条命令做完:
1. 读 `roles/<role>/SKILL.md` 的 frontmatter 拿 `agent_type` / `model`。
2. `POST /api/panes/create`(`use_custom_gateway=true`、绑到 master)→ 拿到新 `w-<N>`。
3. 把 base 前言 + 该角色 charter 组合,写进新 worker 的 `<workspace>/CLAUDE.md`(claude)
   或 `AGENTS.md`(codex/opencode)→ 走网关时自动注入,worker 一上来就是这个角色。
4. 给了 `--task` 就 `cicy-agent msg w-<N> "<task>" --callback` 派活。

角色:`dev-senior / dev-junior / qa / reviewer / security / release / ops`(`cicy-team roles` 看详情)。

## 核心循环

```
brief → 写/更新设计文档(模块 + 每个任务的【可机检验收标准】)
loop 每个 ready 任务:
  cicy-team spawn-role <dev角色> --task "<自包含上下文 + 任务 + 验收标准>"
   → dev 自测、报告、被销毁(callback 通知你)
  cicy-team spawn-role qa --task "<验收标准 + 它改了什么>"
   → PASS: cicy-todo done;FAIL: QA 开 issue(新 todo)→ 回 loop 派给全新 dev
  同一任务反复 FAIL → 你亲自重拆 / 改标准
全程:你只读摘要 + 异常;每个 worker 走网关,对话进 http_log 可审计
```

## 写任务的铁律(决定成败)

一次性 agent **没有记忆**,只看你给的这一条消息。每条 `--task` 必须**自包含**:

- **上下文**:背景 / 相关文件路径 / 设计文档锚点(别让它自己乱探)。
- **明确任务**:做什么,边界到哪。
- **可机检验收标准**:
  ```
  - [ ] `<命令/测试>` 退出码 0,输出含 `<marker>`
  - [ ] 文件 `<path>` 含 `<符号>`
  - [ ] 既有测试套件全绿(不回归)
  ```
  标准糊 → QA(便宜模型)要么放水要么乱打回。**写清验收标准是你最高杠杆的产出。**

## 护栏

- **造人前先报编制给人类确认**(角色 + 数量 + 预算),批了再 spawn。
- QA / reviewer 必须用 ≠ dev 的模型(防共享盲区)—— 角色库已按此设默认 model。
- 一次性 agent 用完销毁:`DELETE /api/panes/<id>`(或留着复用,按策略)。

## 状态机(借 cicy-todo)

`todo → (dev)doing → (QA)done|back`。dev 不自标 done;QA PASS 才 done,FAIL 用 `back` 退回 + 开 issue(`cicy-todo w-<dev> add ...`)。
