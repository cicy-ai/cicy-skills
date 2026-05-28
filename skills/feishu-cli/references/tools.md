# feishu-cli — tools

## Subcommand → native lark-cli

| subcmd                 | runs                                  | notes                                              |
|------------------------|---------------------------------------|----------------------------------------------------|
| `install`              | `npx -y @larksuite/cli@latest install`| downloads the platform Go binary; idempotent       |
| `install --force`      | same, even if already installed       | reinstall / upgrade                                |
| `config`               | `lark-cli config init`                | interactive app-credential setup                   |
| `config -- --new`      | `lark-cli config init --new`          | non-blocking variant for agents                    |
| `auth`                 | `lark-cli auth login --recommend`     | prints OAuth URL; relay to user                    |
| `auth -- <flags>`      | `lark-cli auth login <flags>`         | e.g. `--no-wait`, `--domain calendar,task`         |
| `status`               | `lark-cli --version` + `lark-cli auth status` | report-only; safe when not installed       |

## Forwarding rule

Anything after a literal `--` is passed straight through to the native CLI
subcommand group (`config` or `auth`). Without extra args the wrapper uses the
documented defaults (`config init`, `auth login --recommend`).

## Not proxied

The wrapper deliberately does **not** forward `im`, `calendar`, `docs`, `base`,
`sheets`, `api`, etc. Those are real API calls — invoke `lark-cli` directly.

## status --json shape

```json
{
  "ok": true,
  "data": {
    "npm_package": "@larksuite/cli",
    "binary": "lark-cli",
    "installed": true,
    "version": "1.0.42",
    "authenticated": true,
    "auth_status": "..."
  }
}
```

`authenticated` is `null` when it can't be determined (e.g. lark-cli not installed).
