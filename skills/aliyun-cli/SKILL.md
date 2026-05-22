---
name: aliyun-cli
description: Install and configure the official Aliyun CLI on this host. Bootstrap-only wrapper: install / config / status. For real API calls use the native aliyun CLI.
---

# Aliyun CLI

> **Two different commands. Pick the right one:**
>
> - `aliyun-cli` — **bootstrap wrapper only**. Three subcommands: `install` / `config` / `status`. **Nothing else.**
> - `aliyun` — **the official Aliyun CLI**. Use this for every real API call: ECS, VPC, RAM, OSS, RDS, …
>
> If a task is "install / set up credentials / check setup state" → use `aliyun-cli`.
> If a task is "do anything against the Aliyun API" → use `aliyun` directly.
> **The wrapper does NOT proxy `aliyun ecs ...` calls.** Do not try `aliyun-cli ecs ...`.

## Three jobs

1. `install` — download the official `aliyun` binary into `~/.local/bin`.
2. `config`  — open the CLI's native config (`~/.aliyun/config.json`) in `$EDITOR`. Auto-creates a placeholder if missing.
3. `status`  — report install state + active profile (AccessKey id masked).

There is intentionally **no intermediate JSON** at `~/cicy-ai/db/aliyun.json` —
`~/.aliyun/config.json` is the CLI's own native config and is the single
source of truth.

## Credentials: hard rules

- **NEVER cat / Read / grep / print** `~/.aliyun/config.json`. The
  AccessKey id and secret are user secrets.
- When credentials are missing, run `aliyun-cli config`. It auto-creates a
  placeholder (chmod 600). **Do not ask the user to paste the AccessKey into chat.**
- After the user saves the file, `aliyun` immediately picks it up — no
  apply step needed.

## Bootstrap

```sh
aliyun-cli status              # is the binary installed? is config ready?
aliyun-cli install             # install the official aliyun binary
aliyun-cli config              # open ~/.aliyun/config.json in $EDITOR
aliyun-cli status              # confirm
aliyun ecs DescribeRegions     # ← from now on use the real CLI directly
```

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
