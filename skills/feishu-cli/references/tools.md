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
| `run <args...>` / `x`  | `lark-cli <args...>`                   | generic passthrough; exit code + stdio transparent |

## Proxy handling

Every lark-cli invocation (`config`, `auth`, `status`, `run`) runs with the proxy
env vars stripped and `feishu.cn,larksuite.com,feishu.com,larkoffice.com` added to
`NO_PROXY`, so calls use the host's direct egress (China-brand endpoints reset
through an overseas proxy exit). `install` keeps the ambient env (npm/CDN work
through a proxy). Override with `FEISHU_CLI_KEEP_PROXY=1`.

## Forwarding rules

- `config` / `auth`: anything after a literal `--` appends to the fixed subcommand
  (`config init`, `auth login`). With no extra args, defaults apply (`auth login
  --recommend`).
- `run`: the entire remainder (minus an optional leading `--`) is passed verbatim to
  `lark-cli`. This is the path for real API calls — `run sheets …`, `run im …`,
  `run calendar …`, `run api …`, etc.

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
