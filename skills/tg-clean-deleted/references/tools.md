# tg-clean-deleted — how it works

## Transport

Everything goes through `agent-electron`:

- `agent-electron webcontents --json` — discover Telegram Web K targets (`url` starts with `https://web.telegram.org/k/`).
- `agent-electron cdp wc:<id> Runtime.evaluate {expression, awaitPromise:true, returnByValue:true}` — run the page-side scripts below.

No socket of its own, no file written to the machine, nothing patched in the page.

## Page-side API (Telegram Web K, unpatched)

`window.rootScope.managers` is Telegram Web K's manager proxy and is a plain global:

| Call | Used for |
|---|---|
| `dialogsStorage.getDialogs({query:'', offsetIndex:0, limit:20000, filterId:0})` | all chats from the in-memory cache (a few ms) |
| `appUsersManager.getUser(peerId)` → `pFlags.deleted` | is this peer a deleted account |
| `appUsersManager.getSelf()` | which account we are operating on (phone / username in output) |
| `appMessagesManager.flushHistory({peerId, justClear:false, revoke:false})` | "Delete chat": `messages.deleteHistory` + drop the dialog locally |
| `dialogsStorage.getDialogOnly(peerId)` | verify the dialog is gone after deletion |

Note: `flushHistory` takes an **options object** in current tweb; the old positional form `(peerId, justClear, revoke)` throws `Cannot read properties of undefined (reading 'isUser')`.

## Related skills

- `agent-electron` — the transport this skill relies on.
- `tg-web-mirror-hook` — only needed if you want synchronous `window.__mirrors` snapshots; not required here.
