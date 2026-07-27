# 工具

所有命令通过 `~/cicy-ai/global.json` 中的 bearer token 请求本地 cicy-code 审核后端（`/api/audit/*`）。请先查阅再操作——切勿直接用 shell 编辑 `policy.json` 文件。

## show

```sh
cicy-audit-policy show
```
打印完整的策略 JSON（格式化输出）。当您需要在构建 `patch` 前了解当前确切结构时使用此命令。

## summary

```sh
cicy-audit-policy summary
```
单屏概览：`enabled` 状态、`fail_mode`、各 `rules_override` 项、各 `custom_rules`（id + severity + 匹配条件）、`allow_list` 计数、`preventive` 状态以及 `incident_email` 配置。从这里开始解答“当前运行什么配置？”。

## patch

```sh
cicy-audit-policy patch '{"preventive":{"enabled":true}}'
```
将 JSON 对象深度合并到当前策略中并提交。对象按键逐层合并；**数组会被替换**，因此需传递完整的预期列表（例如完整的 `rules_override` 数组，而非仅新增条目）。成功时显示 `ok  hash=<policy_hash>`。

## set

```sh
cicy-audit-policy set fail_mode closed
cicy-audit-policy set preventive.enabled true
```
通过点路径设置单个字段。值会尽可能解析为 JSON（`true`/`false`、数字、带引号字符串、数组、对象）；否则存为纯字符串。内部会构建嵌套补丁并调用 `patch`。

## unset

```sh
cicy-audit-policy unset preventive.enabled
```
通过点路径移除单个字段。若键不存在则报错。

## recent

```sh
cicy-audit-policy recent --rule secret.bearer_token --limit 5
cicy-audit-policy recent --agent w-10001
```
列出近期匹配的审计事件（`/api/audit/events`），最新在前。每行显示时间戳、agent id 及触发的规则 id。用于验证策略变更后某条规则是否实际触发（或停止触发）。

## history

```sh
cicy-audit-policy history
```
`~/cicy-ai/audit` 的 `git log --oneline -n 20`。仅在自主化 tick 自动提交后才会填充；通过此技能进行的手动编辑不会自动提交，因此若用户希望回滚手动更改，请指出这一点。
