# Codex Auth

Back up and restore this host's Codex credential (~/.codex/auth.json) as a base64 file. Export writes to a 0600 file, import validates the decoded JSON and keeps a timestamped backup.

```sh
codex-auth export --out ~/cicy-ai/assets/codex-auth.b64
codex-auth import --file ~/cicy-ai/assets/codex-auth.b64
codex-auth status
```

See [SKILL.md](./SKILL.md) for the safety rules.
