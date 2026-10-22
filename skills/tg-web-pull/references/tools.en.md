# tg-web-pull — tools & internals

## How it works

`tg-web-pull` shells out to the **agent-electron** skill and scrapes the Telegram Web K
DOM. No mirror hook / `window.__mirrors` required.

| tg-web-pull command     | agent-electron call                                             |
|----------------|-----------------------------------------------------------------|
| `webviews`     | `agent-electron webcontents --json` → filter `web.telegram.org` |
| `groups`       | `agent-electron cdp <t> Runtime.evaluate` (scrape `.chatlist`)  |
| `pull`         | `agent-electron cdp <t> Runtime.evaluate` (scrape `.bubbles`)   |

All evaluated expressions `return JSON.stringify(...)`; `tg-web-pull` unwraps the CDP
result at `result.result.value` and re-parses it.

## DOM contract (Telegram Web K v2.1.x)

- Chat containers: `.chats-container > .chat`; the open one has `.active`.
  Several containers can coexist during/after switches, so messages are always
  scoped to one container and grouped by `peerId`.
- Message bubbles: `.chat .bubbles .bubble[data-mid]`, with
  `data-mid`, `data-peer-id`, `data-timestamp` (unix seconds).
  Text in `.message` (stripped of `.time`, `.reactions`, private-use icon
  glyphs). Sender in `.name`. Outgoing = `.is-out`. Media detected from
  `.media-photo`/`.album-item` (photo), `video`, `.document`, `.audio`.
- Dialog list: `.chatlist a.chatlist-chat` → `data-peer-id`, `href="#<peerId>"`,
  `.peer-title`, unread badge `.dialog-subtitle-badge-unread`/`.unread`.

## Navigation constraint

On matrix-driven cells the Telegram 矩阵 panel owns the open chat and re-asserts
it, so `location.hash=`, native `.click()`, synthetic `MouseEvent`, and trusted
CDP `Input.dispatchMouseEvent` all fail to switch reliably. `--open` therefore
only *attempts* a switch; `pull` never assumes it worked and matches the target
container by `peerId`.

## Environment / compatibility

- Requires the `agent-electron` skill on `PATH` (Linux cicy-code or Windows dsh).
- `--client <id>` forwards to `agent-electron --client`.
- Pure Node ≥18, zero npm deps; no Linux-only binaries → runs in dsh on Windows.
