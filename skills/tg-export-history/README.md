# tg-export-history

Use when the messages of a Telegram group, channel or chat must be exported to JSON, JSONL or CSV through a logged-in Telegram Web K page via agent-electron, no patch and no media download.

```sh
tg-export-history targets
tg-export-history info   @channel --target wc:<id>
tg-export-history export @channel --target wc:<id> [--format json|jsonl|csv|all] [--out <file|dir>] [--limit N] [--since YYYY-MM-DD]
```

Requires `agent-electron` (cicy-desktop) with a logged-in Telegram Web K page.
See [SKILL.md](./SKILL.md).
