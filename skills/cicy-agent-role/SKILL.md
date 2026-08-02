---
name: cicy-agent-role
description: Create and validate standard CiCy Agent role templates with meta.yaml, role.md, role.zh.md, and system.md. Use when building or checking reusable roles for the Create Agent dialog.
---

# CiCy Agent Role

Create standard role templates for the CiCy **Create Agent** dialog. Do not use the separate `~/cicy-ai/agents/<slug>/AGENT.md` custom-agent format for this task.

## Workflow

1. Gather the role name, responsibilities, boundaries, tools, default greeting, and supported languages. Make reasonable defaults when the user already supplied enough context.
2. Write a temporary JSON specification outside the target role directory with these fields:
   - `name`, `name_zh`
   - `tools`: non-empty array; normally `["core"]`
   - `greeting`, `greeting_zh`
   - `role`, `role_zh`
   - `system`
3. Create the template:

```sh
cicy-agent-role create <slug> --spec <spec.json>
```

4. Validate it:

```sh
cicy-agent-role validate <slug>
```

5. Confirm the exact directory and four generated files. Do not create an Agent instance unless the user also requests one.

## Content rules

- Put identity, duties, boundaries, and response behavior in `role.md` and `role.zh.md`.
- Keep English and Chinese role files semantically equivalent.
- Put the shared operating base in `system.md`; do not duplicate the entire role charter there.
- Use `profile: assistant` and at least one valid tool/profile identifier in `meta.yaml`.
- Never overwrite an existing template unless the user explicitly requests an update; then use `--force` after inspecting the existing files.
- Never write secrets, API keys, customer data, or machine-specific credentials into a public role template.

## References

- Read [references/help.en.md](references/help.en.md) or [references/help.cn.md](references/help.cn.md) for CLI examples.
- Read [references/tools.en.md](references/tools.en.md) or [references/tools.cn.md](references/tools.cn.md) for paths and file semantics.
