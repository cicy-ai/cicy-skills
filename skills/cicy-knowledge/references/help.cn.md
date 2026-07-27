# cicy-knowledge — 命令参考

团队第二层知识库（cicy-code `/api/knowledge`）的命令行工具。
成熟度（召回系统信任程度）与存储位置相互独立：

```
draft → pending → canon → (deprecated | rejected/superseded)
未成稿    待审      已确立      已废弃 / 已弃
```

仅 `canon` 状态的知识会被召回系统作为事实提供。`draft`/`deprecated` 状态的内容会从召回池中移除，因此未完成或过时的文档不会被当作当前有效信息读取。

## 命令

```
cicy-knowledge add "<title>"                  添加条目。正文可通过 --body、--body-file
   [--body <md> | --body-file <f> | stdin]    或管道输入。默认存入 _inbox 并标记为待审。
   [--tags "a b"] [--source <kind>]           --source = manual|memory-hook|harvest。
   [--source-pane <pane>] [--origin <ref>]    输出新条目的 id。
   [--draft]                                  --draft → 存入 _drafts/ 并标记为未成稿
                                              （召回系统不提供；知识专员不管理）。

cicy-knowledge list                           列出条目（最新优先）。
   [--status draft|pending|canon|rejected|deprecated]
   [--tag <t>] [-q <kw>] [--json]

cicy-knowledge recall <kw> [--tag <t>]        仅对已确立状态内容进行关键词/标签召回。
                                              对标题+标签+正文进行近似匹配——
                                              非向量/RAG检索。

cicy-knowledge get <id> [--json]              显示单个条目（完整正文）。

cicy-knowledge promote <id> [--domain <d>]    知识专员管理：移动至 canon/<domain>/
                                              目录（默认 "general"）。清除所有状态标记。
cicy-knowledge reject <id>                    管理操作：移至 _archive/（已拒绝）。
cicy-knowledge supersede <oldId> <newId>      管理操作：归档旧条目，并记录新条目 id。

cicy-knowledge draft <id>                     将现有条目就地标记为未成稿（仅修改
                                              前置元数据的 `status:` 标记，不移动文件）。
                                              在保留文件位置期间从已确立召回池中移除。
cicy-knowledge deprecate <id>                 就地标记为已废弃（同样从召回池移除）。
cicy-knowledge restore <id>                   清除标记 → 恢复文件夹原状态。

cicy-knowledge specialist [<pane>]            显示或设置管理该存储库的窗格
                                              （接收 memory-hook 简报）。无参数时显示；
                                              <pane> 参数固定配置。配置文件（global.json）
                                              支持，非数据库角色查询；未设置时默认 w-1001。
```

存储基于文件系统（~/cicy-ai/knowledge）。状态由文件夹决定
（_drafts = 未成稿, _inbox = 待审, <domain>/ = 已确立, _archive/ = 已拒绝）；
前置元数据 `status: draft|deprecated` 标记会覆盖文件夹状态，
使文档可存放于主题目录下但被识别为非已确立内容。`promote`/`reject`/`supersede`
操作会记录执行窗格为 `verified_by`（取自设置的 `X_AGENT_SHORT_ID`）并清除所有状态标记。

## 环境变量

- `CICY_API_TOKEN`   — 令牌认证（覆盖 global.json 设置）
- `CICY_API_PORT`    — 本地 cicy-code 端口（默认 8008）
- `CICY_GLOBAL_JSON` — global.json 路径覆盖（默认 `~/cicy-ai/global.json`）
- `X_AGENT_SHORT_ID` — 执行操作的智能体 id；添加时记录为 source_pane，
  管理操作时记录为 verified_by（在 cicy 窗格内设置）

## 示例

```sh
# 录入并管理
id=$(cicy-knowledge add "部署运维手册" --body-file runbook.md --tags "deploy ops" --json | jq -r .data.id)
cicy-knowledge list --status pending
cicy-knowledge promote "$id"

# 操作前先召回
cicy-knowledge recall deploy
cicy-knowledge recall "" --tag ops

# 替换过时条目
cicy-knowledge supersede <oldId> <newId>
```
