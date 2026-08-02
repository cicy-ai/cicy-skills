# 命令参考

## 创建

```sh
cicy-agent-role create <slug> --spec <role.json> [--root <目录>] [--force]
```

JSON 必须包含：`name`、`name_zh`、`tools`、`greeting`、`greeting_zh`、`role`、`role_zh`、`system`。

```json
{
  "name": "Sales Assistant",
  "name_zh": "销售助手",
  "tools": ["core"],
  "greeting": "Hi, tell me which customer needs follow-up.",
  "greeting_zh": "你好，请告诉我需要跟进的客户。",
  "role": "# Role\n\nYou are a sales assistant responsible for qualified customer follow-up. Do not invent prices or commitments.",
  "role_zh": "# 角色\n\n你是销售助手，负责合格客户的跟进。不得编造价格或承诺。",
  "system": "You are a conversational work agent operating inside CiCy. Follow the selected role, report outcomes faithfully, and protect credentials."
}
```

## 校验

```sh
cicy-agent-role validate <slug或目录> [--root <目录>]
```

## 列出模板

```sh
cicy-agent-role list [--root <目录>]
```

## 公共角色市场

```sh
cicy-agent-role market [关键词]
cicy-agent-role search <关键词>
cicy-agent-role info <slug>
cicy-agent-role install <slug>
cicy-agent-role diff <slug>
cicy-agent-role update <slug>
```

默认市场是公共 GitHub 仓库 `cicy-ai/cicy-agent-roles`。测试或私有兼容市场可通过 `CICY_AGENT_ROLE_REGISTRY` 更换。

如果本地和上游同时修改同一文件，更新不会覆盖本地内容；它会写入 `<文件>.upstream`、记录冲突并以退出码 4 结束。
