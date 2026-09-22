# tg-download-media — how it works

## Transport

Everything goes through `agent-electron`:

- `agent-electron webcontents --json` — discover Telegram Web K targets (`url` starts with `https://web.telegram.org/k/`).
- `agent-electron cdp wc:<id> Runtime.evaluate {expression, awaitPromise:true, returnByValue:true}` — run the page-side steps below; file bytes travel back as base64 in 4 MB slices.

Nothing is patched in the page. The page keeps a small state object `window.__tgDl` (resolved peer, fetched media objects, in-flight Blobs — each Blob is released after its last slice).

## Page-side API (Telegram Web K, unpatched)

| Step | Call | Notes |
|---|---|---|
| resolve | `contacts.resolveUsername` / `messages.checkChatInvite` / `appChatsManager.getChat` | → `InputPeer` (+ `InputChannel` for channels) |
| fetch | `channels.getMessages({channel, id:[inputMessageID]})` or `messages.getMessages({id})` | batches of 50; gives fresh `access_hash` + `file_reference` |
| normalize | `appDocsManager.saveDoc(document)` / `appPhotosManager.savePhoto(photo)` | documents **must** be normalized this way or `apiFileManager` throws (`reading 'id'`) |
| download | `apiFileManager.downloadMedia({media, thumb?})` | returns a `Blob`; the page handles chunking, DC migration and expired `file_reference` itself |
| transfer | `Blob.slice(start, end)` + `FileReader.readAsDataURL` | base64 slices over CDP, written to `<file>.part`, renamed when complete |

## Notes

- Why message ids and not `media_id`: `upload.getFile` needs `InputPhotoFileLocation` / `InputDocumentFileLocation` = `id` + `access_hash` + `file_reference`, and the last two only exist on a freshly fetched message.
- Throughput is bounded by CDP: ~0.5 MB/s for large files, photos in a few seconds each. Keep `--limit` small when exploring.
- Photos: the largest size is chosen (`--thumb` picks the smallest); for documents the full file.
- A matrix cell only boots while its panel tab is visible; a page that is still starting is reported as an error rather than waited for.

## Related skills

- `tg-export-history` — produces the JSONL this skill can read (`--from-jsonl`), including `media_id` / `grouped_id`.
- `agent-electron` — the transport this skill relies on.
