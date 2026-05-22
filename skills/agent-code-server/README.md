# agent-code-server

> Source-only Node.js, 317 LOC. Read [`bin/agent-code-server`](./bin/agent-code-server).

Opens files in the page-bound code-server `:code-ext` extension via
cicy-code's `/api/chat/push` sync RPC channel.

## Install

```bash
cicy-code skill install agent-code-server
```

## Quick usage

```bash
agent-code-server ping                     # is the :code-ext extension online?
agent-code-server list                     # connected page clients + ext status
agent-code-server open /path/to/file.ts:42:7
agent-code-server active                   # focused editor info (JSON)
agent-code-server tabs                     # all open tabs (JSON)
```

## Auth

Reads `~/cicy-ai/global.json` `api_token` (mode 0600). Override via
`CICY_API_TOKEN` env. cicy-code must be running locally on the configured port.

## License

MIT
