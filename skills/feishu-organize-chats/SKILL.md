---
name: feishu-organize-chats
description: Audit, rename, and safely clean Feishu groups whose names start with a user-supplied prefix, preserving user chats and active cicy-code Agent bindings.
---

# Feishu Organize Chats

Use the CLI to organize Feishu groups visible to the Feishu Apps configured in
the local cicy-code database.

## Quick start

```sh
feishu-organize-chats plan --prefix <username>
```

## Workflow

1. Run `plan --prefix <exact-prefix>` first.
2. Report candidates grouped as `bound`, `orphan`, `user_chat`, and `error`.
3. Use `sync --prefix <prefix> --apply` to rename active group bindings to
   `Agent Title · w-xxxxx`.
4. Run cleanup only after the user approves the exact prefix and candidate
   list:

   ```sh
   feishu-organize-chats cleanup --prefix <prefix> --apply --confirm-prefix <prefix>
   ```

5. Re-run `plan` and report the remaining groups.

## Safety rules

- Keep every command dry-run unless `--apply` is present.
- Never delete a chat with a local binding.
- Never delete a chat whose description lacks
  `由 cicy-code 为 Agent 自动创建`.
- Never treat Bot direct chats or ordinary user groups as cleanup candidates.
- Require `--confirm-prefix` to exactly equal `--prefix` for cleanup.
- Do not print App secrets or tenant tokens.
- Report missing Feishu scopes; do not broaden the operation to another App.

## References

- [help.md](./references/help.md) for command syntax.
- [tools.md](./references/tools.md) for classification and permissions.
