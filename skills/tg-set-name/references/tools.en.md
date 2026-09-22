# tg-set-name — how it works

## Transport

Everything goes through `agent-electron`:

- `agent-electron webcontents --json` — discover Telegram Web K targets (`url` starts with `https://web.telegram.org/k/`).
- `agent-electron cdp wc:<id> Runtime.evaluate {expression, awaitPromise:true, returnByValue:true}` — run the page-side scripts below.

No socket of its own, no file written to the machine, nothing patched in the page.

## Page-side API (Telegram Web K, unpatched)

| Call | Used for |
|---|---|
| `appUsersManager.getSelf()` | which account we are operating on (id / phone / username / first / last name) |
| `apiManager.invokeApi('account.updateProfile', {first_name, last_name})` | set the display name; returns the updated `User`. `about` (bio) is not sent, so it stays unchanged |
| `appUsersManager.saveApiUser(user, true)` | keep the page's own user cache in sync so the UI shows the new name without a reload |

## Cute name pick

`zh` (default): 120 cute Chinese girl names, 30 each of 2, 3, 4 and 5 characters (`糖糖` `小桃` · `棉花糖` `林小鹿` · `小熊软糖` `草莓牛奶` · `樱桃小丸子` `今天也很甜`), so name lengths come out random — as the first name, last name empty.

`en`: 60 girl first names (`Luna`, `Mia`, `Coco`, `Lily`, `Momo`, …) × 30 cute last names
(`Rose`, `Bunny`, `Peach`, `Mochi`, `Bloom`, …), optional emoji. The pick is an FNV-1a hash
of the seed (default: the account id), so the same account always gets the same name and a
second `set --yes` reports "nothing to do".

## Notes

- A page whose Telegram Web K is still booting answers `rootScope.myId = 0`; the skill reports that as a page error (exit 2). Matrix cells only boot while their panel tab is visible.
- Telegram rate-limits profile edits; `FLOOD_WAIT_n` is surfaced with the number of seconds to wait.

## Related skills

- `agent-electron` — the transport this skill relies on.
- `tg-set-username` — the @username; `tg-archive-groups`, `tg-clean-deleted` — other account chores, same transport.
