---
name: cicy-agent-role
description: Create, validate, search, install, and safely update CiCy Agent role templates. Use when building reusable roles for the Create Agent dialog or managing roles from the public Agent Role Market.
---

# CiCy Agent Role

Create standard role templates for the CiCy **Create Agent** dialog. Do not use the separate `~/cicy-ai/agents/<slug>/AGENT.md` custom-agent format for this task.

Manage public roles from `cicy-ai/cicy-agent-roles` without overwriting user customizations.

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

## Role Market

Search and inspect public roles:

```sh
cicy-agent-role market
cicy-agent-role search <query>
cicy-agent-role info <slug>
```

Install or update:

```sh
cicy-agent-role install <slug>
cicy-agent-role diff <slug>
cicy-agent-role update <slug>
```

Market installs write `.cicy-role.json` plus immutable base snapshots under `.cicy-role/base/`. During update:

- Replace files that still match the previously installed hash.
- Keep local files when only the user changed them.
- When both local and upstream changed, preserve the local file and write `<file>.upstream`; exit with code 4 so the conflict cannot be missed.
- Never use `install --force` over an existing role unless the user explicitly asks to discard local changes.

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
