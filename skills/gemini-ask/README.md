# gemini-ask

> Source-only Node.js, 121 LOC. Read [`bin/gemini-ask`](./bin/gemini-ask).
> Requires Node **22+** for native WebSocket.

Pushes a `desktop_event { gemini_ask }` to a connected cicy-desktop client
and awaits `gemini_ask_result`. The desktop side drives a Gemini web window.

## Install

```bash
cicy-code skill install gemini-ask
```

## Quick usage

```bash
gemini-ask "Explain quantum tunneling in one paragraph"
gemini-ask "..." 6                    # explicit win_id
gemini-ask --json "ping"
```

## Auth

Reads `~/cicy-ai/global.json` `api_token`. Override with `CICY_API_TOKEN`.
cicy-code must be running locally. cicy-desktop must be connected.

## License

MIT
