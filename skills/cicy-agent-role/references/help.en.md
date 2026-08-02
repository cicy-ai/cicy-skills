# Command reference

## Create

```sh
cicy-agent-role create <slug> --spec <role.json> [--root <dir>] [--force]
```

The JSON spec requires `name`, `name_zh`, `tools`, `greeting`, `greeting_zh`, `role`, `role_zh`, and `system`.

Example:

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

## Validate

```sh
cicy-agent-role validate <slug-or-directory> [--root <dir>]
```

## List

```sh
cicy-agent-role list [--root <dir>]
```
