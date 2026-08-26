---
name: lanshare
description: Share a directory over HTTP on the LAN with a file index, or host a shared full-page notebook; optional HTTP Basic auth and LAN IP discovery.
---

# lanshare

Zero-dependency HTTP file server for sharing a local directory with other
devices on the same network. Serves a browsable directory index (name / size /
mtime), streams files with Range support (video seeking, resumable
downloads), and prints the LAN URLs to open from a phone or another PC.

## When to use

- Hand a folder (downloads, build output, screenshots, logs) to another
  device on the LAN without cloud upload
- Need a password on the share → `-a user:pass` (HTTP Basic)
- Need to know which IP others should use → `lanshare ip`
- A scratch pad everyone on the LAN can read/write from a browser (paste
  links, commands, meeting notes) → `lanshare note [file]`
- Keep servers running after the agent turn ends → `--daemon`, later
  `lanshare status` / `lanshare stop [serve|note]`

## Usage

```sh
lanshare serve                                 # share current directory, port 8080, no auth
lanshare serve ~/Downloads                     # explicit directory
lanshare serve ./dist -p 9000 -a admin:secret  # custom port + Basic auth
lanshare serve /data --daemon --json           # background; prints urls + pid
lanshare status                                # daemon info
lanshare stop                                  # stop all daemons
lanshare note -a team:pass                     # notebook on :8081 → ~/cicy-ai/db/lanshare-note.txt
lanshare note ~/notes/lan.md -p 9001 --daemon  # notebook backed by a chosen file
lanshare ip                                    # LAN IPv4 addresses
```

## Notes

- Read-only: only GET/HEAD are accepted; paths are confined to the shared root.
- Dotfiles are listed and served by default; pass `--no-hidden` to hide them.
- Basic auth is plaintext over HTTP — fine for a trusted LAN, not the internet.
- Notebook: one full-page textarea; edits autosave (400 ms debounce, Ctrl+S)
  via `PUT /api/note`; idle clients re-poll every 2 s so everyone sees the
  latest text. Plain text, last write wins, 16 MB max.
- Daemon state lives in `~/cicy-ai/db/lanshare.json` (one `serve` and one
  `note` daemon per host).

## References

- [help.en.md](./references/help.en.md) / [help.cn.md](./references/help.cn.md)
- [tools.en.md](./references/tools.en.md) / [tools.cn.md](./references/tools.cn.md)
