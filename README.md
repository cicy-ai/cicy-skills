# cicy-skills

`cicy-skills` is the unified runtime for CiCy skills.

It provides:

- one HTTP entrypoint for skill discovery and execution
- one CLI that calls the local HTTP runtime
- one default config under `~/Private`
- one registry view over the existing `~/Private/skills` tree

## Defaults

- config path: `~/Private/cicy-skills/config.json`
- listen address: `127.0.0.1:7811`
- default skill root: `~/Private/skills`

## Binaries

- `cicy-skillsd`: HTTP runtime
- `cicy-skills`: CLI

## Commands

```bash
cicy-skills config-path
cicy-skills init-config
cicy-skills list
cicy-skills serve
```

## HTTP

- `GET /healthz`
- `GET /v1/config`
- `GET /v1/skills`

The first version only standardizes config loading and skill discovery. Skill execution and per-agent generation can be added on top of this runtime without changing the entrypoint.
