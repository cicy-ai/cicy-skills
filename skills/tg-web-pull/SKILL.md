---
name: tg-web-pull
description: Pull messages from a group open in a Telegram Web K webview on cicy-desktop. Lists webviews and group dialogs, then scrapes the active (or peer-matched) chat via agent-electron.
---

# Tg

Pull messages out of a **Telegram Web K** webview running on a connected
cicy-desktop host. The skill delegates all desktop control to the
`agent-electron` skill (CDP `Runtime.evaluate`) and scrapes the rendered DOM —
it does **not** need `window.__mirrors` / the mirror hook.

## Scope

Use this skill when:

- you need the recent messages of a specific group/channel that is open in a
  Telegram Web K webview (`web.telegram.org/k/`),
- you want to enumerate the group dialogs visible in a webview,
- you want to discover which Telegram webviews exist on the host.

Do **not** use it to send messages, log in, or manage proxies — use
`telegram-matrix` / `tg-login` / `agent-electron` for those.

## Quick start

```sh
tg-web-pull webviews                      # list Telegram Web K webviews → targets like wc:42
tg-web-pull groups wc:42                  # list group dialogs (peerId · unread · title)
tg-web-pull pull wc:42 --limit 20         # messages from whatever chat is currently active
tg-web-pull pull wc:42 --peer -1770576689 # messages from a specific group by peerId
tg-web-pull pull wc:42 --peer -1770576689 --scroll 3 --json   # load older history, JSON out
```

## Important: navigation is best-effort

On matrix-driven cells the open chat is controlled by the Telegram 矩阵 panel.
Programmatic switching (`--open`, hash, click, CDP input) is frequently
**overridden** — the panel re-asserts its own chat. Therefore:

- `pull` reads the **currently open** chat, or any loaded container whose
  `peerId` matches `--peer`. If the requested group isn't open, it fails with a
  clear message listing what *is* open; retry when the panel cycles to it, or
  open the group yourself in the panel first.
- `--open` is a best-effort hint only. Treat a successful switch as a bonus.

In dsh on a matrix machine: `/tg-web-pull` loads this file; the same commands work from
its shell (requires the `agent-electron` skill present).

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
