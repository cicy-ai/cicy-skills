# cicy-skills

`cicy-skills` manages the local CiCy command set and approved agent skill generation.

## Layout

- config only: `~/Private/cicy-skills/config.json`
- repo-owned commands: `~/projects/cicy-skills/bin`
- global entrypoints: `~/.local/bin`
- Codex skills: `~/.codex/skills`

`~/Private/cicy-skills` should only contain the config file. It does not store generated skills or command binaries.

## Current Rule

Agent skill generation is allowlist-based.

- currently approved: `cf-tunnel`, `google`
- current supported target agent: `codex`
- generated target directory for Codex: `~/.codex/skills`

Everything else is archived in-repo under [`legacy/skills`](./legacy/skills) but is not part of the approved generation list until you explicitly confirm it.

## Install

```bash
make install-local-cli
```

This builds the binaries into `dist/`, materializes the command entrypoints in `~/projects/cicy-skills/bin`, and links them into `~/.local/bin`.

## Local Command Management

```bash
cicy-skills install google-node
cicy-skills update google-node
cicy-skills remove google-node

cicy-skills install all
cicy-skills update all
cicy-skills remove all
```

`install` and `update` refresh the current repo state. If you changed the Go binaries, use `make install-local-cli` so `dist/` is rebuilt before relinking.

## Commands

```bash
cicy-skills help
cicy-skills config-path
cicy-skills init-config
cicy-skills list
cicy-skills install all
cicy-skills install google-node
cicy-skills remove google-node
cicy-skills update google-node
cicy-skills agent list codex
cicy-skills agent help codex cf-tunnel
cicy-skills agent help codex google
cicy-skills agent install codex cf-tunnel
cicy-skills agent install codex google
cicy-skills agent update codex cf-tunnel
cicy-skills agent update codex google
cicy-skills agent remove codex cf-tunnel
cicy-skills agent remove codex google
cicy-skills agent sync codex
cicy-skills agent generate codex
```

## Codex Generation

```bash
cicy-skills agent list codex
cicy-skills agent help codex cf-tunnel
cicy-skills agent help codex google
cicy-skills agent install codex cf-tunnel
cicy-skills agent install codex google
cicy-skills agent update codex cf-tunnel
cicy-skills agent update codex google
cicy-skills agent remove codex cf-tunnel
cicy-skills agent remove codex google
cicy-skills agent sync codex
```

That currently generates:

- [cf-tunnel/SKILL.md](/home/w3c_offical/.codex/skills/cf-tunnel/SKILL.md)
- [help.md](/home/w3c_offical/.codex/skills/cf-tunnel/references/help.md)
- [commands.md](/home/w3c_offical/.codex/skills/cf-tunnel/references/commands.md)
- [google/SKILL.md](/home/w3c_offical/.codex/skills/google/SKILL.md)
- [help.md](/home/w3c_offical/.codex/skills/google/references/help.md)
- [commands.md](/home/w3c_offical/.codex/skills/google/references/commands.md)

## Google

The embedded Google provider lives in [`providers/google-node`](./providers/google-node) and exposes:

- `google help`
- `google gmail`
- `google sheets`
- `google drive`
- `google calendar`

These wrappers read credentials from `~/global.json`.

## Cf Tunnel

The local `cf-tunnel` wrapper is exposed through the migrated hosttools bundle and supports:

- `cf-tunnel list`
- `cf-tunnel add <port> [port2 ...]`
- `cf-tunnel del <port> [port2 ...]`
- `CF_ENV=dev cf-tunnel ...`

This wrapper reads real Cloudflare config from `~/global.json`.

## Archived Skills

The historical skill docs and scripts are kept under [`legacy/skills`](./legacy/skills) for reference and future approval, but they are not automatically generated into agent skill directories.

The agent install/remove/update interface already supports multiple names, but the allowlist is still explicit. Only approved and implemented skills will install.
