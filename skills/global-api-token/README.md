# global-api-token

> Show or rotate the api_token in `~/cicy-ai/global.json`.

Source-only Node.js. Read [`bin/global-api-token`](./bin/global-api-token) before
installing — it's 75 lines.

## What it does

- `show` — prints the current `api_token` field (or JSON with `--json`)
- `refresh` — generates a 32-byte random token (base64url), writes the file
  at mode 0600, and prints the new token

The token is shared by every cicy-code skill / CLI that talks to the local
manager API on `127.0.0.1:8008`.

## Install

```bash
cicy-code skill install global-api-token
```

## Usage

```bash
global-api-token show
global-api-token show --json

global-api-token refresh
global-api-token refresh --json
```

## Configuration

Operates on `~/cicy-ai/global.json` (mode 0600). No additional config.

## License

MIT
