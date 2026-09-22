# tg-export-history — how it works

## Transport

Everything goes through `agent-electron`:

- `agent-electron webcontents --json` — discover Telegram Web K targets (`url` starts with `https://web.telegram.org/k/`).
- `agent-electron cdp wc:<id> Runtime.evaluate {expression, awaitPromise:true, returnByValue:true}` — run the page-side scripts below. Each round trip carries up to `--batch` × 100 messages back as JSON.

No socket of its own, nothing patched in the page. The only thing left on the page is `window.__tgExportPeer` (the resolved InputPeer used by the paging calls).

## Page-side API (Telegram Web K, unpatched)

`window.rootScope.managers` is Telegram Web K's manager proxy; `window.rootScope.myId` is empty until the page has finished starting.

| Call | Used for |
|---|---|
| `apiManager.invokeApi('contacts.resolveUsername', {username})` | @username / t.me link → chat or user (+ access_hash) |
| `apiManager.invokeApi('messages.checkChatInvite', {hash})` | invite link → the chat, only when it answers `chatInviteAlready` (member) |
| `appChatsManager.getChat(id)` / `appUsersManager.getUser(id)` | numeric peer id → cached chat / user (must already be known to the page) |
| `apiManager.invokeApi('messages.getHistory', {peer, offset_id, limit:100, min_id})` | the paging itself, newest → oldest; `count` on the first answer is the total |
| `apiManager.invokeApi('messages.getReplies', {peer, msg_id:<topic root>, offset_id, limit:100})` | the same paging restricted to one forum topic (`--topic`) |
| `channels.getMessages` on the linked message | detects `messageActionTopicCreate` so a topic link is exported as that topic |
| `users` / `chats` arrays of each `messages.getHistory` answer | sender / forward names |

## Notes

- Public channels and public groups can be read without joining; private ones need the account to be a member (`CHANNEL_PRIVATE` otherwise).
- Throughput is roughly 100–150 messages/s; a 15k-message channel takes ~2–3 minutes. `--batch` trades fewer round trips for longer single evaluations.
- The export is resumable by hand: rerun with `--min-id <last id>` to fetch only what is newer.
- Media is not downloaded — `media` / `file` only record what kind of attachment a message carries.
- A matrix cell only boots while its panel tab is visible; a page that is still starting is reported as an error rather than waited for.

## Related skills

- `agent-electron` — the transport this skill relies on.
- `tg-archive-groups`, `tg-clean-deleted`, `tg-set-username` — same transport, other account chores.
