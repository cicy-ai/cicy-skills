# vnc — command reference

```
vnc <command> [display] [options]
```

The display can be given positionally (`vnc start :1`, `vnc start 1`) or as
`--display :1`. It defaults to `$VNC_DISPLAY`, then `:1`.

## Commands

### `vnc install [--force]`

Installs what is missing from: `x11vnc`, `xvfb`, `fluxbox`, `x11-utils`
(`xdpyinfo`, `xprop`), `imagemagick` (`import`). Uses `apt-get` and needs root
or passwordless `sudo`. Already-complete hosts exit 0 without touching apt;
`--force` reinstalls every package.

### `vnc start [:N] [options]`

1. Reuses the X server on `:N`, or starts `Xvfb :N -screen 0 <geometry>x<depth>`.
2. Starts a window manager if none has claimed the screen.
3. Stores a password (generated unless `--password` / `--nopw`).
4. Starts `x11vnc -display :N -rfbport <port> -forever -shared -noshm -noxdamage`.

Fails if x11vnc is already on that display — `--force` replaces it, `vnc
restart` is usually what you want.

| Option | Default | Meaning |
|--------|---------|---------|
| `--port <n>` | `5900 + N` | RFB port |
| `--geometry <WxH>` | `1440x900` | Screen size **when creating** an Xvfb |
| `--depth <n>` | `24` | Colour depth for a new Xvfb |
| `--listen all\|localhost` | `all` | Bind everywhere or `127.0.0.1` only |
| `--wm fluxbox\|none` | `fluxbox` | WM to start when none is running |
| `--password <pw>` | — | Use this password |
| `--random-password` | — | New password even if one is stored |
| `--nopw` | — | No authentication at all |
| `--force` | — | Replace an x11vnc already on the display |

The generated password is printed **once** — it is stored obfuscated and cannot
be recovered.

### `vnc stop [:N] | --all [--kill-x]`

Sends `SIGTERM` to the x11vnc serving that display, and forgets it in the state
file. `--kill-x` also stops the X server, but **only if this skill started it** —
a pre-existing or system X server is left alone. `--all` stops every VNC server
found, whether or not this skill started it.

### `vnc restart [:N]`

Stops then starts, reusing the recorded port and `--listen` unless you override
them.

### `vnc status [:N] [--json]`

One row per display found in the state file or in `/tmp/.X11-unix`:

```
DISPLAY  X   GEOMETRY    WM        VNC  PORT   LISTEN     PID
:1       up  1440x900    fluxbox   up   5901   all        43801
```

`--json` returns `{ ok, displays: [{ display, x_server, geometry, wm, vnc, pid,
port, listen, auth, log }] }`.

### `vnc password [--set <pw>] [--show]`

Writes `~/.vnc/passwd` via `x11vnc -storepasswd` (mode 0600). Without `--set` a
random 8-character password is generated and printed. `--show` reports only
whether the file exists — the stored blob is obfuscated, not readable.

VNC's DES auth uses **only the first 8 characters** of a password; longer ones
are silently truncated, and the skill warns when you set one.

A password change needs `vnc restart :N` to take effect.

### `vnc screenshot [:N] [--out <path>]`

Grabs the root window with ImageMagick `import`, falling back to `ffmpeg
-f x11grab`. Defaults to `./vnc-<N>-<timestamp>.png`. Errors if the file comes
out empty.

### `vnc logs [:N] [-n <count>]`

Tails `~/.vnc/logs/x11vnc<N>.log` (default 40 lines).

## Global options

| Option | Meaning |
|--------|---------|
| `--json` | Machine-readable output on every command |
| `--help`, `-h`, `help` | This help |

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Runtime failure (server did not start, no display, install failed) |
| 2 | Unknown command |
