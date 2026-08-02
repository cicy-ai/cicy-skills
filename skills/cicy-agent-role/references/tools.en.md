# Paths and files

Default template root:

```text
~/cicy-ai/memory/agents
```

Each role contains exactly these required files:

- `meta.yaml`: profile, tools, display names, and greetings.
- `role.md`: English persona, duties, boundaries, and behavior.
- `role.zh.md`: Chinese equivalent of `role.md`.
- `system.md`: shared operating base for the role.

Override the root with `--root` or `CICY_AGENT_ROLE_ROOT`. `create` refuses to overwrite by default; use `--force` only after inspecting the existing role.

Market-managed roles also contain `.cicy-role.json` and `.cicy-role/base/<version>/` for provenance, hashes, and safe update conflict detection. These internal files are not part of the four-file role contract consumed by CiCy.
