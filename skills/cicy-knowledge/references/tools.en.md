# cicy-knowledge — endpoints / env / exit codes

## Backend endpoints (cicy-code, token-authed)

- `GET  /api/knowledge?status=&tag=&q=` — list / recall
- `POST /api/knowledge` — add (body: `title`, `body`, `tags?`, `source_kind?`,
  `source_pane?`, `origin_ref?`) → `{ id, status: "pending" }`
- `GET  /api/knowledge/{id}` — one entry
- `PATCH /api/knowledge/{id}` — governance, body: `{ action: promote|reject|
  supersede, superseded_by?, verified_by? }`

## Status machine

`pending` → `canon` (promote) | `rejected` (reject) | `superseded` (supersede,
with `superseded_by` → the replacing entry's id).

## Config

- token + base: `~/cicy-ai/global.json` (`api_token`), port `CICY_API_PORT`
  (default 8008). Override token with `CICY_API_TOKEN`.

## Exit codes

- `2` — usage error (missing args)
- `3` — auth / cannot reach cicy-code
- `4` — API error (4xx/5xx from the server)
