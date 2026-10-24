# cicy-keystore — tools

| Item | Value |
|---|---|
| Store | `~/cicy-ai/db/keystore.json` (0600), written only by cicy-code |
| UI | cicy-code → Keystore tab (the only place values are entered) |
| API | `GET /api/keystore` (no values) · `POST /api/keystore/resolve` (used by `exec` only) |
| Masking | exact-value replace with `***`, streaming-safe; values < 3 chars not masked |

Related: `cf` (Cloudflare token wrapper), `github` (GitHub accounts) follow the same "agent never sees the secret" rule.
