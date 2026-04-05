# cicy-skills

`cicy-skills` is the unified runtime for CiCy skills.

It provides:

- one HTTP entrypoint for skill discovery and execution
- one CLI that calls the local HTTP runtime
- one default config under `~/Private`
- one registry view over the existing `~/Private/skills` tree
- one node registry with a default node and per-node token

## Defaults

- config path: `~/Private/cicy-skills/config.json`
- listen address: `127.0.0.1:7811`
- default skill root: `~/Private/skills`
- default node: `local`

## Binaries

- `cicy-skillsd`: HTTP runtime
- `cicy-skills`: CLI

## Commands

```bash
cicy-skills config-path
cicy-skills init-config
cicy-skills list
cicy-skills nodes
cicy-skills http-list --node local
cicy-skills serve
```

## HTTP

- `GET /healthz`
- `GET /v1/config`
- `GET /v1/nodes`
- `GET /v1/skills`

## Auth

All `/v1/*` endpoints require a token when `auth_token` is set in config.

Supported forms:

- `Authorization: Bearer <token>`
- `X-Cicy-Skills-Token: <token>`
- `?token=<token>`

`/healthz` stays open for liveness checks.

## Nodes

The runtime now supports a node registry in config:

```json
{
  "default_node": "local",
  "nodes": [
    {
      "name": "local",
      "base_url": "http://127.0.0.1:7811",
      "token": "cskills_xxx"
    },
    {
      "name": "remote-a",
      "base_url": "http://10.0.0.8:7811",
      "token": "cskills_remote"
    }
  ]
}
```

CLI calls can target the default node or a specific node with `--node`.
