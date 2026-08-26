---
name: codex-auth
description: Back up and restore this host's Codex credential (~/.codex/auth.json) as a base64 file. Export writes to a 0600 file, import validates the decoded JSON and keeps a timestamped backup.
---

# Codex Auth

Move this host's Codex credential between the live file and a base64 text
blob — for backing it up, or carrying it to another machine.

Credential file: `~/.codex/auth.json` (override with `CODEX_AUTH_PATH=<absolute path>`).

## Scope

Use this skill when the task is to:

- back up the Codex credential before reinstalling or re-authenticating,
- copy an existing Codex login onto another host,
- restore a credential from a base64 blob someone handed you,
- check whether a credential is present and well-formed, without reading it.

Do **not** use it to inspect or print someone else's credential. `export`
writes to a file and prints only the path and byte count; the secret reaches
stdout only if you pass `--stdout`, because command output, logs and
screenshots are public surfaces.

## Commands

```
codex-auth export [--out <file>]      base64 → file, mode 0600
codex-auth export --stdout            base64 → stdout (only when you mean it)
codex-auth import --file <file>       restore from a base64 file
codex-auth import --base64 <value>    restore from an inline value
codex-auth import -                   restore from stdin
codex-auth status [--json]            path, size, mode, mtime — never contents
codex-auth path                       print the credential path
```

With no `--out`, `export` writes `~/cicy-ai/assets/codex-auth-<timestamp>.b64`.

## Safety rules

1. **Treat the exported file as the credential itself.** It is plain base64,
   not encryption. It is written 0600; keep it that way, and delete it once the
   transfer is done.
2. **`import` validates before writing.** The input must be valid base64 whose
   decoded bytes parse as a JSON object; a truncated paste is rejected instead
   of clobbering a working credential.
3. **The previous credential is kept.** `import` copies the existing file to
   `<path>.bak-<timestamp>` first.
4. **File mode is preserved**, so an existing 0600 credential stays 0600.
5. **Already-running Codex processes keep their old credential.** Only
   processes started afterwards pick up the restored one.
6. Never paste a credential into a shared channel, an issue, or a chat log.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
