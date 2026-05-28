# Pulling exported files back to your worker

`claude-design download` only **triggers** the export — the actual file lands
on whichever host `agent-chrome` is connected to. For a remote Mac you need
one extra step to get the bytes back to your worker.

## The WS payload limit

The cicy desktop ↔ worker websocket has a payload cap (~1 MB). Sending a
14 MB standalone HTML in a single `Tool.write_file` or `cdp` reply blows past
the limit and you'll see:

```
504 wait_ack timeout
```

Even a 170 KB editable HTML can sometimes hit this if other agents are sharing
the channel. The fix is to chunk it.

## The proven recipe — chunked base64 over `cicy-agent msg`

Assume:
- Worker side (where you want the file): `/home/cicy/projects/.../landing.html`
- Mac side: file at `/Users/you/Downloads/MyProject.html`, tmux pane `mac-pane`
- File size 169 758 bytes → about 6 chunks at 30 KB each

On the Mac side, run this once per chunk index `i ∈ [0, N)`:

```sh
SRC="/Users/you/Downloads/MyProject.html"
dd if="$SRC" bs=30000 skip=$i count=1 2>/dev/null | base64
```

On the worker side, decode each chunk and append:

```js
import { writeFileSync, appendFileSync } from 'node:fs';
const OUT = '/home/cicy/projects/.../landing.html';
writeFileSync(OUT, Buffer.alloc(0));           // truncate
for (const b64 of CHUNKS_FROM_MAC) {
  appendFileSync(OUT, Buffer.from(b64, 'base64'));
}
```

Verify with a byte-count match:

```sh
wc -c /home/cicy/projects/.../landing.html      # worker
stat -f '%z' /Users/you/Downloads/MyProject.html  # mac
```

## Why dd, not split?

`dd` lets you ask for exactly one chunk at a given offset in a single command,
which fits the request/response cadence of `cicy-agent msg <pane> <text>` /
`cicy-agent capture <pane>` cleanly. `split` writes N files first, which would
need a roundtrip per file just to enumerate them.

## Why not just rsync?

If you have a working SSH path Mac → worker, by all means use it — it's
faster and simpler. The chunked-base64 path is for when you only have
`cicy-agent` (tmux relay) as the bridge.

## See also

- `bash-to-js-utf8-base64` memory — UTF-8 decode gotcha (same family: bytes
  crossing a string-typed channel).
