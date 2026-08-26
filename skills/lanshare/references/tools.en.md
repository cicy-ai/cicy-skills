# lanshare — tools

| Tool | Example | Description |
|------|---------|-------------|
| `lanshare serve` | `lanshare serve -a user:pass` | Share a directory (default: current) with a browsable index; optional Basic auth; `--daemon` to background |
| `lanshare note` | `lanshare note ~/notes/lan.md -p 8081 -a team:pass` | Shared LAN notebook: full-page textarea autosaved to a file; optional Basic auth; `--daemon` |
| `lanshare ip` | `lanshare ip --json` | Print LAN IPv4 addresses (private ranges first) |
| `lanshare status` | `lanshare status --json` | Show running daemons (root/file, port, urls, pid) |
| `lanshare stop` | `lanshare stop note` | Stop daemons: all, or just `serve` / `note` |

## Files

- `~/cicy-ai/db/lanshare.json` — daemon state per mode (`serve`, `note`). `CICY_HOME` overrides `~` (state lives in `$CICY_HOME/cicy-ai/db`).
- `~/cicy-ai/db/lanshare-note.txt` — default notebook file.

## Related

- `pubip` — public (WAN) IP; `lanshare ip` is the LAN counterpart.
