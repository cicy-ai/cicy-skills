# telegram-web — integrations and safety

- Runtime: Node.js 22+, `agent-electron`; login also needs `agent-chrome`; Web K patching needs `tg-web-mirror-hook`.
- Session metadata: `~/cicy-ai/db/telegram-web.json`, atomically written with mode `0600`. Override for tests with `CICY_TELEGRAM_WEB_SESSION`.
- Backends: Web A feature-detects typify and exposes `window.__tt`, `window.__getGlobal`, `window.__setGlobal`, and `window.__getActions`. Web K validates and reads `window.__mirrors`.
- Target selection rejects no match, ambiguous matches, and non-Telegram pages. Explicit `--backend` must still match intended content.
- Authentication storage is held only in process/CDP payloads during login. It must never appear in session metadata, logs, errors, fixtures, or documentation.
- Mutations require explicit `--apply`; do not bypass this guard. Do not use screenshots as a data API.
- `open-url --profile N` maps to `agent-electron open --idx N` with normal window reuse; activate an existing match and never pass `--no-reuse`.
