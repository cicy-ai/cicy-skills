# eng

> Source-only Node.js, 79 LOC. Read [`bin/eng`](./bin/eng).

One-shot English correction. POSTs input to cicy-code's `/api/ai/correct`
endpoint and prints the corrected version.

## Install

```bash
cicy-code skill install eng
```

## Quick usage

```bash
eng "i can has cheezburger"               # → I can have a cheeseburger.
echo "this is grammer" | eng              # piped input
eng --json "she dont know"
```

## Auth

Reads `~/cicy-ai/global.json` `api_token` (mode 0600). Override with
`CICY_API_TOKEN`. cicy-code must be running locally.

## License

MIT
