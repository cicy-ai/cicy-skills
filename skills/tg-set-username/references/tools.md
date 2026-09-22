# tg-set-username — how it works

## Transport

Everything goes through `agent-electron`:

- `agent-electron webcontents --json` — discover Telegram Web K targets (`url` starts with `https://web.telegram.org/k/`).
- `agent-electron cdp wc:<id> Runtime.evaluate {expression, awaitPromise:true, returnByValue:true}` — run the page-side scripts below.

No socket of its own, no file written to the machine, nothing patched in the page.

## Page-side API (Telegram Web K, unpatched)

`window.rootScope.managers` is Telegram Web K's manager proxy and is a plain global; `window.rootScope.myId` is empty until the page has finished starting.

| Call | Used for |
|---|---|
| `apiManager.invokeApi('users.getFullUser', {id: inputUserSelf})` (fallback `appUsersManager.getSelf()`) | which account we are operating on (id / phone / name / current username) — server truth, since the page cache lags right after a change |
| `apiManager.invokeApi('account.checkUsername', {username})` | `true` when the username is free; RPC errors (`USERNAME_INVALID`, `USERNAME_OCCUPIED`, `USERNAME_PURCHASE_AVAILABLE`, `FLOOD_WAIT_n`) are passed through as `err` |
| `apiManager.invokeApi('account.updateUsername', {username})` | set (or, with `''`, remove) the username; returns the updated `User` |
| `appUsersManager.saveApiUser(user, true)` | keep the page's own user cache in sync so the UI shows the new name without a reload |

## Notes

- A page whose Telegram Web K is still booting answers `rootScope.myId = 0`; the skill reports that as a page error (exit 2) instead of guessing. Matrix cells only boot while their panel tab is visible.
- Telegram rate-limits username changes; `FLOOD_WAIT_n` is surfaced with the number of seconds to wait.
- Collectible (Fragment) usernames cannot be set this way — `USERNAME_PURCHASE_AVAILABLE` is reported and nothing is changed.

## Related skills

- `agent-electron` — the transport this skill relies on.
- `tg-archive-groups`, `tg-clean-deleted` — same transport, other account chores.
