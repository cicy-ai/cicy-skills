# claude-auth — files & related commands

## Files it touches

| Path | Role |
|------|------|
| `~/.claude/.credentials.json` | the live Claude credential — read by `export`, written by `import` |
| `~/.claude/.credentials.json.bak-<timestamp>` | automatic backup made by `import` |
| `~/cicy-ai/assets/claude-auth-<timestamp>.b64` | default `export` destination, mode 0600 |

`CLAUDE_AUTH_PATH` overrides the credential path.

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | success |
| 1 | bad usage, invalid base64, or decoded value is not a JSON object |
| 2 | credential (or input file) not found |

## Handling the exported blob

Base64 is encoding, not encryption. The `.b64` file is exactly as sensitive as
the credential. Move it over a channel you trust, restore it, then delete it.
Never attach it to an issue, a chat log or a screenshot.

## Related

- `cicy-code` settings → the same restore is available in the UI for pasted
  base64, without touching a file.
- The other half of this pair: `codex-auth`.
