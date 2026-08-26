# lanshare — help

## Commands

```
lanshare serve <dir> [options]   Share <dir> over HTTP with a directory index
lanshare note [file] [options]   Shared LAN notebook: one full-page textarea autosaved to [file]
lanshare ip [--json]             Print LAN (private IPv4) addresses
lanshare status [--json]         Show background servers started with --daemon
lanshare stop [serve|note]       Stop background server(s) (default: all)
lanshare --help
```

## serve / note options

| Option | Default | Meaning |
|--------|---------|---------|
| `-p, --port <n>` | serve `8080`, note `8081` | Listen port; `0` picks a free port |
| `-H, --host <addr>` | `0.0.0.0` | Bind address (all interfaces) |
| `-a, --auth <user:pass>` | none | Require HTTP Basic auth |
| `-d, --daemon` | off | Detach; pid + urls saved to `~/cicy-ai/db/lanshare.json` |
| `--no-hidden` | off | serve only: hide dotfiles from the index and refuse to serve them |
| `--json` | off | Print startup info as `{"ok":true,"data":{...}}` |

## serve behavior

- Directory requests return an HTML index (folders first, then files; size and
  UTC mtime). A directory URL without trailing `/` is redirected (301).
- Files are streamed with a MIME type guessed from the extension,
  `Accept-Ranges: bytes` and `206` partial responses for `Range` requests.
- Only `GET` and `HEAD` are allowed (405 otherwise). Requests resolving outside
  the shared root return 403.

## note behavior

- `GET /` serves a single full-page `<textarea>`; default file is
  `~/cicy-ai/db/lanshare-note.txt` (created empty if missing).
- `GET /api/note` returns the text (with `ETag`); `PUT /api/note` replaces it
  (atomic write via temp file + rename, 16 MB limit, `204`).
- The page autosaves 400 ms after typing stops (or Ctrl+S / Cmd+S), and while
  idle re-polls every 2 s so other devices' edits show up. Last write wins.

## Common

- Wrong or missing credentials → `401` with `WWW-Authenticate: Basic`.
- `--daemon` prints the same info as foreground mode, then exits; the server
  keeps running. One `serve` and one `note` daemon are tracked per host;
  starting a second of the same kind is refused while the first is alive.

## Exit codes

`0` ok · `1` runtime error (port in use, daemon failed) · `2` usage error
