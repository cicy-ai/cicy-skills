# gpt-chat

> Source-only Node.js, 144 LOC. Read [`bin/gpt-chat`](./bin/gpt-chat).

Multi-turn chat with persistent history (`~/Private/data/gpt-chat-history.json`)
and optional system prompt (`~/Private/data/gpt-chat-system.txt`).

## Install

```bash
cicy-code skill install gpt-chat
```

## Quick usage

```bash
gpt-chat "What's the capital of France?"
gpt-chat "And how many people live there?"     # follow-up uses history
gpt-chat --system "Answer in one short sentence."
gpt-chat --show-system
gpt-chat --clear
```

## Auth

Reads `~/cicy-ai/global.json` `api_token` (mode 0600). Override with
`CICY_API_TOKEN`. cicy-code must be running locally.

## License

MIT
