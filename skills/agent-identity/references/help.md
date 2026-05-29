agent-identity — report the local client/device id + account of AI CLIs.

Usage:
  agent-identity [all|claude|codex|opencode|kiro] [--json]

Arguments:
  all        (default) report all four CLIs
  claude     claude-code device userID + OAuth account
  codex      codex auth mode (apikey/chatgpt) + account id
  opencode   configured provider names
  kiro       AWS IdC/SSO OAuth clientId + region + auth method

Flags:
  --json     machine-readable JSON ({ ok, results: [...] })
  --help     this help

Secrets (tokens, API keys, client secrets) are always redacted/omitted.
The skill only reads files under $HOME; it never writes or sends anything.
