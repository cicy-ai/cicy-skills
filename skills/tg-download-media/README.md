# tg-download-media

Use when photos, videos or documents attached to Telegram messages must be saved to disk by message id through a logged-in Telegram Web K page via agent-electron, resumable, no patch.

```sh
tg-download-media targets
tg-download-media download <chat> --ids 1,2,10-20 --out ./media --target wc:<id>
tg-download-media download <chat> --from-jsonl export.jsonl [--codes a,b] [--match regex] --out ./media --album
```

Requires `agent-electron` (cicy-desktop) with a logged-in Telegram Web K page. Pairs with `tg-export-history`.
See [SKILL.md](./SKILL.md).
