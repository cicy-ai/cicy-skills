# agent-identity

Get the local **client id / device id / account** of the AI CLIs installed for
an agent — **claude**, **codex**, **opencode**, **kiro** — by reading each
CLI's own auth/config files. Identifiers only; tokens, API keys and client
secrets are always redacted.

```bash
agent-identity            # all four
agent-identity kiro       # just kiro's AWS IdC clientId
agent-identity all --json # machine-readable
```

See [SKILL.md](SKILL.md) for the full field list and source files.
