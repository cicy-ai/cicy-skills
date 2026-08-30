# vnc — files, ports, troubleshooting

## Files

| Path | What |
|------|------|
| `~/cicy-ai/db/vnc.json` | State: per-display port, geometry, WM, pid, log, whether this skill started the X server. Mode 0600. |
| `~/.vnc/passwd` | Password, obfuscated by `x11vnc -storepasswd`. Mode 0600. |
| `~/.vnc/logs/x11vnc<N>.log` | x11vnc log for display `:N` |
| `~/.vnc/logs/Xvfb<N>.log` | Xvfb log, when this skill started it |
| `~/.vnc/logs/fluxbox<N>.log` | Window manager log |
| `/tmp/.X11-unix/X<N>` | X server socket — how `status` discovers displays |

Override the state path with `VNC_STATE`, the default display with
`VNC_DISPLAY`.

## Ports

| Display | Default RFB port |
|---------|------------------|
| `:0` | 5900 |
| `:1` | 5901 |
| `:2` | 5902 |

x11vnc also opens the matching IPv6 socket. Note it listens on **5900 over
IPv6** as a side effect of its port probing even when `-rfbport 5901` is given —
harmless, but it shows up in `ss -ltn`.

## Binaries used

| Binary | Package | Used for |
|--------|---------|----------|
| `x11vnc` | x11vnc | The VNC server itself |
| `Xvfb` | xvfb | Creating a display that does not exist |
| `fluxbox` | fluxbox | Window decorations, move/resize |
| `xdpyinfo`, `xprop` | x11-utils | Liveness, geometry, WM detection |
| `import` | imagemagick | Screenshots (`ffmpeg` is the fallback) |
| `setsid` | util-linux | Detaching Xvfb / the WM from this process |

## Troubleshooting

**x11vnc exits a second after starting, log says `X11 MIT Shared Memory Attach
failed` / `BadAccess`.** The X server belongs to another user (typically root
started it at boot). This skill always passes `-noshm`, which avoids it; if you
are running x11vnc by hand, add `-noshm`.

**`another window manager already running`.** Something already owns the screen
(XFCE, for example). Harmless — `vnc start` detects an existing WM and skips
fluxbox. Pass `--wm none` to never try.

**The viewer connects but the screen is black.** The display is up but nothing
is drawing on it. Start an app with `DISPLAY=:1 <app> &`, or check that your
app really got `DISPLAY` in its environment.

**`vnc status` shows `X up` but `VNC -`.** The display exists but no server is
attached; run `vnc start :N`.

**Connection refused from another machine.** Either the server was started with
`--listen localhost`, or a firewall is in the way. Prefer keeping localhost-only
and forwarding with `ssh -L 5901:127.0.0.1:5901 user@host`.

**Password not taking effect.** x11vnc reads `~/.vnc/passwd` at startup only —
`vnc restart :N` after `vnc password`.

## Security

`--listen all` plus a password is a full desktop on the network for anyone who
guesses 8 characters of DES-truncated secret. On any host reachable from the
internet, use `--listen localhost` and an SSH tunnel. `--nopw` is unauthenticated
access to a live desktop, session and clipboard included — localhost only.

## Related skills

- `agent-chrome` — drive Chrome on a desktop host (needs a display; this skill provides one)
- `agent-desktop` / `agent-electron` — control a cicy-desktop Electron client
- `proxy_ssh` — SOCKS5 tunnels, when you want the port forwarded rather than exposed
