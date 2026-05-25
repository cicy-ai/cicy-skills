# agent-editor

> Source-only Node.js, 317 LOC. Read [`bin/agent-editor`](./bin/agent-editor).

Opens files in the page-bound native editor `:code-ext` extension via
cicy-code's `/api/chat/push` sync RPC channel.

> **Renamed in v2.0.0**: was `agent-code-server` (skill name) — cicy-code no
> longer ships code-server; the native files editor took its place. The CLI
> still supports the old name as an alias (`bin_aliases`) for shell scripts
> already wired to it.

## Install

```bash
cicy-code skill install agent-editor
```

## Quick usage

```bash
agent-editor ping                     # is the :code-ext extension online?
agent-editor list                     # connected page clients + ext status
agent-editor open /path/to/file.ts:42:7
agent-editor active                   # focused editor info (JSON)
agent-editor tabs                     # all open tabs (JSON)
```

## Auth

Reads `~/cicy-ai/global.json` `api_token` (mode 0600). Override via
`CICY_API_TOKEN` env. cicy-code must be running locally on the configured port.

## License

MIT
