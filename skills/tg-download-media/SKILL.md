---
name: tg-download-media
description: Use when photos, videos or documents attached to Telegram messages must be saved to disk by message id through a logged-in Telegram Web K page via agent-electron, resumable, no patch.
---

# TG Download Media

Saves the attachments (photos, videos, files, voice notes, stickers …) of
Telegram messages to disk. You give it a chat and message ids — typed, as a
`t.me/<chat>/<id>` link, or taken from a `tg-export-history` JSONL (optionally
filtered by `code` / text) — and it drives a logged-in Telegram Web K page via
`agent-electron`: the page re-fetches each message (fresh `access_hash` +
`file_reference`), downloads the file with its own `apiFileManager`, and the
bytes come back over CDP in 4 MB base64 slices. Nothing is patched or installed.

A `media_id` alone cannot be downloaded (Telegram needs the message's
`access_hash` + `file_reference`), which is why this skill works by message id.

## Scope

Use this skill when the task involves:

- saving the photo / video / document of specific messages
- bulk-downloading the attachments of an exported chat (`--from-jsonl`), e.g. all
  messages with a given 编号 code
- resuming a previous download run (existing files are skipped)

Do **not** use it for chats the account cannot read (private ones need
membership), for media larger than a few hundred MB (CDP transfer is slow), or
as a scraper that runs unattended in a loop against many chats.

## Rules

1. **Read-only on Telegram** — it never joins, sends or marks anything read.
2. **Pick the target explicitly when several Telegram Web pages are open**
   (`targets`, then `--target wc:<id>`); auto-selection only works with exactly one.
3. **Files are named `<msgid>_<media_id>.<ext>`** (documents keep their file
   name: `<msgid>_<name>`); the same `media_id` is downloaded once per run.
4. **Resumable:** a file that already exists with size > 0 is skipped unless
   `--overwrite`; partial downloads are written as `.part` and renamed at the end.
5. **Go through `agent-electron`**, never open your own RPC/CDP socket
   (cicy-skill-spec §4). `--client <id>` targets a specific cicy-desktop host.
6. Throughput: photos in ~1–3 s each; videos roughly 0.5 MB/s through CDP
   (a 22 MB clip ≈ 50 s). Use `--limit` for a first look, `--thumb` for previews.

## Quick start

```sh
tg-download-media targets
tg-download-media download https://t.me/Shakethemap/36589 --out ./media --target wc:121
tg-download-media download @Shakethemap --ids 36589,36590,19 --out ./media
tg-download-media download @Shakethemap --from-jsonl Shakethemap-numbered-messages.jsonl --codes aa125,aa127 --out ./media --album
tg-download-media download @Shakethemap --from-jsonl export.jsonl --match "#台湾" --limit 50 --thumb --out ./preview --json
```

## References

- [help.en.md](./references/help.en.md) / [help.cn.md](./references/help.cn.md) — commands, options, file naming, exit codes
- [tools.en.md](./references/tools.en.md) / [tools.cn.md](./references/tools.cn.md) — how it talks to the page
