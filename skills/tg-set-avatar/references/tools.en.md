# tg-set-avatar — how it works

## Transport

Everything goes through `agent-electron`:

- `agent-electron webcontents --json` — discover Telegram Web K targets (`url` starts with `https://web.telegram.org/k/`).
- `agent-electron cdp wc:<id> Runtime.evaluate {expression, awaitPromise:true, returnByValue:true}` — run the page-side scripts below.

The source image (downloaded style SVG or your `--image`) is sent to the page as base64 in 24 KB
chunks, because agent-electron takes the CDP params as a single command-line argument and one
argument is size-limited (128 KiB on Linux, less on Windows). No socket of its own, no file written
to the machine, nothing patched in the page.

## Page-side API (Telegram Web K, unpatched)

| Call | Used for |
|---|---|
| `apiManager.invokeApi('users.getFullUser', {id:{_:'inputUserSelf'}})` (fallback `appUsersManager.getSelf()`) | which account we are operating on and its current `photo.photo_id`, read from the server |
| `<canvas>` + `toBlob('image/jpeg', 0.92)` | render the avatar at 640×640: SVG drawn at full size, raster images center-cropped, `emoji` drawn directly |
| `apiFileManager.upload({file, fileName})` | upload the JPEG to Telegram (`upload.saveFilePart`), returns an `InputFile` |
| `appProfileManager.uploadProfilePhoto(inputFile)` | `photos.uploadProfilePhoto` + the page's own cache / `avatar_update` event, so the new photo shows without a reload. If the helper fails locally (not an RPC error) and the photo has not changed, `photos.uploadProfilePhoto` is called directly — never twice |

After the upload the photo id is read back from the server; `set` only reports success when it changed.

## Styles

`girl` and `girl-cartoon` are [DiceBear](https://www.dicebear.com) avatars (`avataaars` by Pablo
Stanley, `adventurer` by Lisa Wischofsky — both free for personal and commercial use), fetched as
SVG from `api.dicebear.com/9.x` with options that keep them cute and girlish: long hair, youthful
hair colors, smiles, no beard, pastel backgrounds. `emoji` needs no network.

## Notes

- A page whose Telegram Web K is still booting answers `rootScope.myId = 0`; the skill reports that as a page error (exit 2). Matrix cells only boot while their panel tab is visible.
- Telegram rate-limits photo uploads; `FLOOD_WAIT_n` is surfaced with the number of seconds to wait.
- Old photos are not deleted; they remain in the account's photo history like in the official apps.

## Related skills

- `agent-electron` — the transport this skill relies on.
- `tg-set-name` — display name; `tg-set-username` — @username; same transport.
