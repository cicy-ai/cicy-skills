# tg-archive-groups — how it works

## Transport

Everything goes through `agent-electron`:

- `agent-electron webcontents --json` — discover Telegram Web K targets (`url` starts with `https://web.telegram.org/k/`).
- `agent-electron cdp wc:<id> Runtime.evaluate {expression, awaitPromise:true, returnByValue:true}` — run the page-side scripts.

No socket of its own, nothing written on the machine, nothing patched in the page.

## Page-side API (Telegram Web K, unpatched)

`window.rootScope.managers` is Telegram Web K's manager proxy and a plain global:

| Call | Used for |
|---|---|
| `dialogsStorage.getDialogs({query:'', offsetIndex:0, limit:20000, filterId})` with `filterId` 0 and 1 | main list + Archive folder (`folder_id` 0 / 1); reading both keeps "already archived" and `unarchive` exact |
| `appChatsManager.getChat(-peerId)` | classify: `_==='chat'` or `channel` + `pFlags.megagroup` = group; other `channel` = broadcast channel; `left / kicked / deactivated` are skipped |
| `appUsersManager.getSelf()` | which account we are operating on |
| `appMessagesManager.editPeerFolders(peerIds[], folderId)` | `folders.editPeerFolders` — 1 = Archive, 0 = main list; batched |
| `dialogsStorage.getDialogOnly(peerId)` → `folder_id` | verify each peer landed in the target folder |
| `apiManager.invokeApi('account.getGlobalPrivacySettings')` / `setGlobalPrivacySettings` | turn on `keep_archived_unmuted` + `keep_archived_folders` before archiving — otherwise Telegram un-archives unmuted chats on the next incoming message (seen live: 431 archived, 3 back within a minute) |

Known refusal: `folders.editPeerFolders` on the official "Telegram" service chat (user 777000) returns an empty `updates` and the dialog stays in folder 0 — Telegram does not let clients archive it, so the skill skips it.

Archiving is a folder move only: membership, history, mute state are untouched, and Telegram keeps the chat archived even when new messages arrive unless the peer is pinned/unmuted per Telegram's own rules.

## Related skills

- `agent-electron` — the transport this skill relies on.
- `tg-clean-deleted` — same approach for deleting "Deleted Account" chats.
