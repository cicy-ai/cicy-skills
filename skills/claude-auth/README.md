# Claude Auth

Back up and restore this host's Claude credential (~/.claude/.credentials.json) as a base64 file. Export writes to a 0600 file, import validates the decoded JSON and keeps a timestamped backup.

```sh
claude-auth export --out ~/cicy-ai/assets/claude-auth.b64
claude-auth import --file ~/cicy-ai/assets/claude-auth.b64
claude-auth status
```

See [SKILL.md](./SKILL.md) for the safety rules.
